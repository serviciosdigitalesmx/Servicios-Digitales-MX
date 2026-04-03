import { NextResponse } from 'next/server';
import { getErrorMessage, getProxyHeaders, proxyBackendJson } from '../../../../lib/backendApi';

export async function GET() {
  try {
    const result = await proxyBackendJson('/api/billing/plans', {
      method: 'GET'
    });

    return NextResponse.json(result.body ?? { success: false }, {
      status: result.status,
      headers: getProxyHeaders(result.resolution)
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error, 'Error al obtener planes') }, { status: 500 });
  }
}
