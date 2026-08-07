import type { Env } from '../index';
import { RecordsService } from '../services/records.service';

export async function handleRecordsRoute(
  pathname: string,
  request: Request,
  env: Env,
): Promise<Response | null> {
  if (pathname === '/api/records') {
    const service = new RecordsService(env.DB);
    const url = new URL(request.url);

    if (request.method === 'GET') {
      const query = url.searchParams.get('q') ?? undefined;
      const page = Number(url.searchParams.get('page') ?? '1');
      const limit = Number(url.searchParams.get('limit') ?? '10');
      const { records, total } = await service.listRecords(query, page, limit);
      return new Response(JSON.stringify({ records, total }, null, 2), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (request.method === 'POST') {
      const body = (await request.json()) as { name?: unknown; value?: unknown };
      const name = body.name;
      const value = body.value;

      if (typeof name !== 'string' || typeof value !== 'string' || !name || !value) {
        return new Response(JSON.stringify({ error: 'Missing name or value' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      await service.createRecord(name, value);
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(null, { status: 405 });
  }

  if (pathname.startsWith('/api/records/')) {
    const service = new RecordsService(env.DB);
    const idStr = pathname.slice('/api/records/'.length);
    const numericId = Number(idStr);

    if (!idStr || Number.isNaN(numericId)) {
      return new Response(JSON.stringify({ error: 'Invalid record id' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (request.method === 'GET') {
      const record = await service.getRecord(numericId);
      if (!record) {
        return new Response(JSON.stringify({ error: 'Record not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(record, null, 2), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (request.method === 'DELETE') {
      await service.removeRecord(numericId);
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (request.method === 'PUT') {
      const body = (await request.json()) as { name?: unknown; value?: unknown };
      const name = body.name;
      const value = body.value;
      if (typeof name !== 'string' || typeof value !== 'string' || !name || !value) {
        return new Response(JSON.stringify({ error: 'Missing name or value' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      await service.updateRecord(numericId, name, value);
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(null, { status: 405 });
  }

  return null;
}
