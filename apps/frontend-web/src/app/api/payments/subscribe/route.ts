import { NextResponse } from 'next/server';
import { getErrorMessage, getProxyHeaders, proxyBackendJson } from '../../../../lib/backendApi';

type CheckoutResponseBody = {
  data?: {
    checkoutUrl?: string;
    preferenceId?: string;
  };
};

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

    const headers = getProxyHeaders(result.resolution);

    if (!result.ok) {
      return NextResponse.json(result.body ?? { error: 'No se pudo iniciar checkout' }, { status: result.status, headers });
    }

    const body = result.body as CheckoutResponseBody | null;

    return NextResponse.json({
      init_point: body?.data?.checkoutUrl,
      checkoutUrl: body?.data?.checkoutUrl,
      preferenceId: body?.data?.preferenceId
    }, { headers });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error, 'Error al iniciar checkout') }, { status: 500 });
  }
}
