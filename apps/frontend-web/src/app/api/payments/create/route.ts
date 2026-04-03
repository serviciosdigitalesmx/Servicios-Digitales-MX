import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'PAYMENTS_CREATE_ROUTE_RETIRED',
        message: 'La ruta /api/payments/create fue retirada. Usa /api/payments/subscribe.'
      }
    },
    {
      status: 410,
      headers: {
        'x-sdmx-billing-source': 'retired-compat-route',
        'x-sdmx-route-status': 'retired',
        'x-sdmx-replacement-route': '/api/payments/subscribe'
      }
    }
  );
}
