import { NextResponse } from 'next/server';
import { proxyBackendJson } from '../../../../lib/backendApi';

export async function POST(req: Request) {
  try {
    const { planCode, tenantId, email, fullName } = await req.json();
    const result = await proxyBackendJson('/api/billing/checkout-preference', {
      method: 'POST',
      body: JSON.stringify({
        planCode,
        tenantId,
        payerEmail: email,
        payerName: fullName
      })
    });

    const headers = {
      'x-sdmx-billing-source': 'backend-dotnet-via-next-proxy',
      'x-sdmx-backend-mode': result.resolution.mode,
      'x-sdmx-backend-source': result.resolution.source,
      'x-sdmx-backend-configured': String(result.resolution.configured)
    };

    if (!result.ok) {
      return NextResponse.json(result.body ?? { error: 'No se pudo iniciar checkout' }, { status: result.status, headers });
    }

    return NextResponse.json({
      init_point: result.body?.data?.checkoutUrl,
      checkoutUrl: result.body?.data?.checkoutUrl,
      preferenceId: result.body?.data?.preferenceId
    }, { headers });
  } catch (error: any) {
    console.error("Error en Subscribe:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
