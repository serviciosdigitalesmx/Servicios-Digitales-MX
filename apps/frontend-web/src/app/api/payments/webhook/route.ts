import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("🔔 Webhook received:", body);

    // 1. Identify the payment and tenant from the provider's payload
    // Example for MercadoPago: body.data.id
    const providerPaymentId = body?.data?.id || body?.id;
    const paymentStatus = body?.action === 'payment.created' ? 'approved' : 'pending';

    if (paymentStatus === 'approved') {
       // 2. Fetch the local payment record to get the tenant_id
       const { data: paymentRecord } = await supabaseAdmin
         .from('subscription_payments')
         .select('tenant_id, subscription_id')
         .eq('provider_payment_id', providerPaymentId) // This is a simplification
         .single();

       // 3. Update subscription status and validity
       // Set current_period_end to +30 days from now
       const nextExpiration = new Date();
       nextExpiration.setDate(nextExpiration.getDate() + 30);

       await supabaseAdmin
         .from('subscriptions')
         .update({ 
           status: 'active', 
           current_period_end: nextExpiration.toISOString(),
           updated_at: new Date().toISOString()
         })
         .eq('tenant_id', paymentRecord?.tenant_id);

       // 4. Update the payment record status
       await supabaseAdmin
         .from('subscription_payments')
         .update({ provider_payment_status: 'approved', paid_at: new Date().toISOString() })
         .eq('provider_payment_id', providerPaymentId);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("❌ Webhook error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
