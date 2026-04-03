import { NextResponse } from 'next/server';
import { getBackendApiResolution } from '../../../../lib/backendApi';

export async function POST(req: Request) {
  try {
    const resolution = getBackendApiResolution();
    const rawBody = await req.text();
    const response = await fetch(`${resolution.baseUrl}/api/webhooks/mercadopago${new URL(req.url).search}`, {
      method: 'POST',
      headers: {
        'Content-Type': req.headers.get('content-type') || 'application/json'
      },
      body: rawBody
    });

    const rawText = await response.text();
    let parsedBody: any = null;
    if (rawText) {
      try {
        parsedBody = JSON.parse(rawText);
      } catch {
        parsedBody = { raw: rawText };
      }
    }

    return NextResponse.json(parsedBody ?? { received: true }, {
      status: response.status,
      headers: {
        'x-sdmx-billing-source': 'backend-dotnet-via-next-proxy',
        'x-sdmx-backend-mode': resolution.mode,
        'x-sdmx-backend-source': resolution.source,
        'x-sdmx-backend-configured': String(resolution.configured)
      }
    });
  } catch (error: any) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
