export async function handleDashboardRoute(
  pathname: string,
  request: Request,
): Promise<Response | null> {
  if (pathname !== '/api/dashboard' || request.method !== 'GET') {
    return null;
  }

  const payload = {
    productionToday: 0,
    wastePercent: 0,
    inventory: 0,
    forecast: 0,
    weeklyProduction: [120, 135, 128, 142, 150, 161, 147],
    stores: [
      { name: 'Tienda 1', status: 'ok' },
      { name: 'Tienda 2', status: 'ok' },
    ],
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
