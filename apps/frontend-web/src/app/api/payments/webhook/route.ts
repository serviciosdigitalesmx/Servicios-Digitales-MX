import { NextResponse } from 'next/server';
import { getBackendApiResolution, getErrorMessage, getProxyHeaders } from '../../../../lib/backendApi';

export async function POST(req: Request) {
  try {
    const resolution = getBackendApiResolution();
    if (!resolution.baseUrl) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'BACKEND_API_URL_NOT_CONFIGURED',
            message: 'El frontend no tiene configurada la URL del backend para este entorno.'
          }
        },
        { status: 503, headers: getProxyHeaders(resolution) }
      );
    }

    const rawBody = await req.text();
    const response = await fetch(`${resolution.baseUrl}/api/webhooks/mercadopago${new URL(req.url).search}`, {
      method: 'POST',
      headers: {
        'Content-Type': req.headers.get('content-type') || 'application/json'
      },
      body: rawBody
    });

    const rawText = await response.text();
    const parsedBody = rawText ? safeParse(rawText) : null;

    return NextResponse.json(parsedBody ?? { received: true }, {
      status: response.status,
      headers: getProxyHeaders(resolution)
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error, 'Error al procesar webhook') }, { status: 500 });
  }
}

function safeParse(rawText: string) {
  try {
    return JSON.parse(rawText) as Record<string, unknown>;
  } catch {
    return { raw: rawText };
  }
}
