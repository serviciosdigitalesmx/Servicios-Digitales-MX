import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { tenantId, planCode, amount } = await req.json();

    // 1. Validate tenant exists
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id, contact_email')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Tenant non-existent' }, { status: 404 });
    }

    // 2. Logic to create a "Preference" or "PaymentIntent" (e.g., MercadoPago)
    // For now, we simulate the provider response
    const mockPaymentUrl = `https://www.mercadopago.com.mx/checkout/v1/redirect?pref_id=mock_${Date.now()}`;

    // 3. (Optional) Log the intent in our DB
    await supabaseAdmin.from('subscription_payments').insert({
      tenant_id: tenantId,
      amount: amount,
      provider: 'mercadopago',
      provider_payment_id: `pending_${Date.now()}`,
      provider_payment_status: 'pending',
      payer_email: tenant.contact_email
    });

    return NextResponse.json({ 
      success: true, 
      paymentUrl: mockPaymentUrl 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
