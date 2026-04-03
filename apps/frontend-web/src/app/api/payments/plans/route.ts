import { NextResponse } from 'next/server';
import { proxyBackendJson } from '../../../../lib/backendApi';

export async function GET() {
  try {
    const result = await proxyBackendJson('/api/billing/plans', {
      method: 'GET'
    });

    return NextResponse.json(result.body ?? { success: false }, {
      status: result.status,
      headers: {
        'x-sdmx-billing-source': 'backend-dotnet-via-next-proxy',
        'x-sdmx-backend-mode': result.resolution.mode,
        'x-sdmx-backend-source': result.resolution.source,
        'x-sdmx-backend-configured': String(result.resolution.configured)
      }
    });
  } catch (error: any) {
    console.error('Error en plans proxy:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
