import type { Env } from '../index';
import { RecordsService } from '../services/records.service';
import type { AuthContext } from '../models/auth';

export async function handleRecordsRoute(
  pathname: string,
  request: Request,
  env: Env,
  authContext?: AuthContext,
): Promise<Response | null> {
  if (!authContext) return null;
  const companyId = authContext;

  if (pathname === '/api/records') {
    const service = new RecordsService(env.DB);
    const url = new URL(request.url);

    if (request.method === 'GET') {
      const query = url.searchParams.get('q') ?? undefined;
      const page = Number(url.searchParams.get('page') ?? '1');
      const limit = Number(url.searchParams.get('limit') ?? '10');
      const data = await service.listRecords(companyId, query, page, limit);
      return new Response(JSON.stringify(data, null, 2), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (request.method === 'POST') {
      const body = (await request.json()) as { name?: unknown; value?: unknown };
      const name = body.name;
      const value = body.value;

      if (typeof name !== 'string' || typeof value !== 'string') {
        return new Response('Invalid body', { status: 400 });
      }

      await service.createRecord(companyId, name, value);
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(null, { status: 405 });
  }

  if (pathname.startsWith('/api/records/')) {
    const service = new RecordsService(env.DB);
    const idParam = pathname.slice('/api/records/'.length);
    const id = Number(idParam);

    if (isNaN(id)) {
      return new Response('Invalid id', { status: 400 });
    }

    if (request.method === 'GET') {
      const record = await service.getRecord(companyId, id);
      if (!record) {
        return new Response('Not found', { status: 404 });
      }

      return new Response(JSON.stringify(record, null, 2), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (request.method === 'DELETE') {
      await service.removeRecord(companyId, id);
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (request.method === 'PUT') {
      const body = (await request.json()) as { name?: unknown; value?: unknown };
      const name = body.name;
      const value = body.value;

      if (typeof name !== 'string' || typeof value !== 'string') {
        return new Response('Invalid body', { status: 400 });
      }

      await service.modifyRecord(companyId, id, name, value);
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(null, { status: 405 });
  }

  return null;
}
