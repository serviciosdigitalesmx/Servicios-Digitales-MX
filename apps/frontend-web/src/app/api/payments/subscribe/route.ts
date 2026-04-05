import { supabaseServiceRole } from '../../../../lib/supabaseService';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { planCode, tenantId, email } = await req.json();
    
    const planData: Record<string, { amount: number, title: string }> = {
      'profesional-650': { amount: 650, title: 'Plan Profesional - Sr-Fix' },
      'elite-1200': { amount: 1200, title: 'Plan Elite - Sr-Fix' }
    };

    const selectedPlan = planData[planCode as keyof typeof planData];
    if (!selectedPlan) throw new Error('Plan no válido');

    console.log(`Creando suscripción para Tenant ${tenantId} con plan ${planCode}`);

    // 1. Crear Preapproval en Mercado Pago
    const response = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reason: selectedPlan.title,
        external_reference: tenantId,
        payer_email: email,
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: selectedPlan.amount,
          currency_id: 'MXN'
        },
        back_url: `${process.env.NEXT_PUBLIC_APP_URL}/hub?payment=success`,
        status: 'pending'
      })
    });

    const mpData = await response.json();

    if (!mpData.id) {
       console.error("Error MP:", mpData);
       throw new Error(mpData.message || 'Error al crear suscripción en MP');
    }

    // 2. GUARDAR ID DE SUSCRIPCIÓN INMEDIATO (Trazabilidad)
    const { error: dbError } = await supabaseServiceRole
      .from('subscriptions')
      .update({ 
        mp_preapproval_id: mpData.id,
        plan_code: planCode 
      })
      .eq('tenant_id', tenantId);

    if (dbError) throw dbError;

    return NextResponse.json({ init_point: mpData.init_point });
  } catch (error: any) {
    console.error("Error en Subscribe:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
