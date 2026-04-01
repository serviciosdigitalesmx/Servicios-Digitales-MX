import { supabaseServiceRole } from '@/lib/supabaseService';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, data } = body;

    // 1. Solo procesamos eventos de suscripción (preapproval)
    if (type === 'preapproval') {
      const preapprovalId = data.id;
      console.log(`Procesando Webhook para Preapproval: ${preapprovalId}`);

      // 2. Consultar fuente real a Mercado Pago
      const mpRes = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
        headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` }
      });
      
      const mpData = await mpRes.json();
      if (!mpData.id) throw new Error('ID de suscripción no encontrado en MP');

      const tenantId = mpData.external_reference;
      
      // 3. Mapeo de estados profesional
      const statusMap: Record<string, string> = {
        'authorized': 'active',
        'paused': 'past_due',
        'cancelled': 'cancelled',
        'pending': 'trialing'
      };

      const newStatus = statusMap[mpData.status] || 'suspended';
      const expiryDate = mpData.next_payment_date || mpData.date_created;

      console.log(`Actualizando Tenant ${tenantId} a estado ${newStatus}, vence: ${expiryDate}`);

      // 4. Actualizar base de datos
      const { error: updateError } = await supabaseServiceRole
        .from('subscriptions')
        .update({ 
          status: newStatus,
          current_period_end: expiryDate,
          mp_payer_id: mpData.payer_id?.toString()
        })
        .eq('tenant_id', tenantId);

      if (updateError) throw updateError;
      
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
