import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cliente de administración (bypassea RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MP_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || (await req.json()).type;
    const dataId = (await req.json())?.data?.id || searchParams.get('data.id');

    console.log("🔔 Webhook received:", { type, dataId });

    // Solo nos interesan los pagos confirmados
    if (type === 'payment' && dataId) {
      // 1. Verificar el pago con la API de Mercado Pago para mayor seguridad
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
        headers: {
          'Authorization': `Bearer ${MP_ACCESS_TOKEN}`
        }
      });

      if (!response.ok) throw new Error('Error al verificar pago en Mercado Pago');
      
      const paymentData = await response.json();
      const status = paymentData.status; // 'approved', 'pending', etc.
      const externalReference = paymentData.external_reference; // Aquí guardamos el tenant_id o subscription_id

      console.log(`💳 Mercado Pago: Payment ${dataId} is ${status}`);

      if (status === 'approved') {
        // 2. Buscar al tenant o suscripción asociada
        // Usamos external_reference como tenant_id o buscamos en la tabla de pagos
        const { data: payRecord } = await supabaseAdmin
          .from('subscription_payments')
          .select('tenant_id, subscription_id')
          .eq('provider_payment_id', dataId.toString())
          .maybeSingle();

        const tenantId = externalReference || payRecord?.tenant_id;

        if (tenantId) {
          // 3. Activar la suscripción y extender por 30 días
          const nextExpiration = new Date();
          nextExpiration.setDate(nextExpiration.getDate() + 30);

          await supabaseAdmin
            .from('subscriptions')
            .update({ 
              status: 'active', 
              current_period_end: nextExpiration.toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('tenant_id', tenantId);

          // 4. Marcar el pago como aprobado localmente
          await supabaseAdmin
            .from('subscription_payments')
            .upsert({ 
              tenant_id: tenantId,
              provider_payment_id: dataId.toString(),
              amount: paymentData.transaction_amount,
              status: 'approved',
              paid_at: new Date().toISOString()
            }, { onConflict: 'provider_payment_id' });

          console.log(`✅ Tenant ${tenantId} activated via Webhook`);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("❌ Webhook error:", err.message);
    // Vercel/MP necesitan un 200 aunque falle la lógica interna para no reintentar infinitamente
    // si es un error de código, pero aquí devolvemos 200 para confirmar recepción.
    return NextResponse.json({ error: err.message }, { status: 200 });
  }
}
