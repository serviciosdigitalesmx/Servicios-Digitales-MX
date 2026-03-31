import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MP_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;

export async function POST(req: Request) {
  try {
    const { tenantId, planCode, amount } = await req.json();

    // 1. Validar que el tenant existe
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id, contact_email, name')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Tenant no existe' }, { status: 404 });
    }

    // 2. Crear Preferencia en Mercado Pago vía REST API (sin librería externa)
    const preferenceData = {
      items: [
        {
          title: `Suscripción Sr-Fix: Plan ${planCode}`,
          unit_price: Number(amount),
          quantity: 1,
          currency_id: 'MXN'
        }
      ],
      payer: {
        email: tenant.contact_email
      },
      external_reference: tenantId, // Guardamos el tenant_id aquí para el webhook
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/hub?payment=success`,
        failure: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/hub?payment=failed`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/hub?payment=pending`
      },
      auto_return: 'approved'
    };

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preferenceData)
    });

    if (!mpResponse.ok) {
      const errData = await mpResponse.json();
      throw new Error(`Mercado Pago Error: ${errData.message || 'Unknown'}`);
    }

    const preference = await mpResponse.json();

    // 3. Registrar el intento en nuestra BD
    await supabaseAdmin.from('subscription_payments').insert({
      tenant_id: tenantId,
      amount: amount,
      provider: 'mercadopago',
      provider_payment_id: preference.id, // ID de la preferencia para seguimiento
      provider_payment_status: 'pending',
      payer_email: tenant.contact_email
    });

    return NextResponse.json({ 
      success: true, 
      paymentUrl: preference.init_point // URL para redirigir al checkout
    });
  } catch (err: any) {
    console.error("❌ Error al crear pago:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
