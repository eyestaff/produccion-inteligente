import type { Env } from '../index';
import { AssetsService } from '../services/assets.service';

export async function handleAssetsRoute(
  pathname: string,
  request: Request,
  env: Env,
): Promise<Response | null> {
  if (pathname === '/api/assets') {
    const service = new AssetsService(env.ASSETS);
    const url = new URL(request.url);

    if (request.method === 'GET') {
      const query = url.searchParams.get('q') ?? undefined;
      const page = Number(url.searchParams.get('page') ?? '1');
      const limit = Number(url.searchParams.get('limit') ?? '10');
      const assets = await service.listAssets(query, page, limit);
      return new Response(JSON.stringify(assets, null, 2), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (request.method === 'POST') {
      const body = (await request.json()) as { key?: unknown; content?: unknown };
      const key = body.key;
      const content = body.content;
      if (typeof key !== 'string' || typeof content !== 'string' || !key || !content) {
        return new Response(JSON.stringify({ error: 'Missing key or content' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const bytes = Uint8Array.from(atob(content), (c) => c.charCodeAt(0));
      await service.uploadAsset(key, bytes);
      return new Response(JSON.stringify({ success: true, key }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(null, { status: 405 });
  }

  if (pathname.startsWith('/api/assets/')) {
    const service = new AssetsService(env.ASSETS);
    const key = pathname.slice('/api/assets/'.length);

    if (request.method === 'DELETE') {
      await service.removeAsset(key);
      return new Response(JSON.stringify({ success: true, key }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (request.method === 'GET') {
      const assetResponse = await service.getAsset(key);
      return (
        assetResponse ??
        new Response(JSON.stringify({ error: 'Asset not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        })
      );
    }

    return new Response(null, { status: 405 });
  }

  return null;
}
