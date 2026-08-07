import type { RequestContext } from '../models/context';
import type { Env } from '../index';
import type { RecordResult, PaginatedRecords } from '../models/records';

export async function getRecords(
  db: Env['DB'],
  ctx: RequestContext,
  query?: string,
  page = 1,
  limit = 10,
): Promise<PaginatedRecords> {
  const companyId = ctx.companyId;
  const offset = (page - 1) * limit;

  let recordsQuery =
    'SELECT id, name, value, created_at as createdAt FROM records WHERE company_id = ?';
  let countQuery = 'SELECT COUNT(*) as total FROM records WHERE company_id = ?';
  const queryParams: any[] = [companyId];

  if (query) {
    recordsQuery += ' AND name LIKE ?';
    countQuery += ' AND name LIKE ?';
    queryParams.push(`%${query}%`);
  }

  recordsQuery += ' ORDER BY id DESC LIMIT ? OFFSET ?';
  const countParams = [...queryParams];
  queryParams.push(limit, offset);

  const [recordsResult, countResult] = await Promise.all([
    db
      .prepare(recordsQuery)
      .bind(...queryParams)
      .all<RecordResult>(),
    db
      .prepare(countQuery)
      .bind(...countParams)
      .first<{ total: number }>(),
  ]);

  return {
    records: recordsResult.results,
    total: countResult?.total ?? 0,
  };
}

export async function getRecordById(
  db: Env['DB'],
  ctx: RequestContext,
  id: number,
): Promise<RecordResult | null> {
  const companyId = ctx.companyId;
  const result = await db
    .prepare(
      'SELECT id, name, value, created_at as createdAt FROM records WHERE id = ? AND company_id = ?',
    )
    .bind(id, companyId)
    .first<RecordResult>();
  return result ?? null;
}

export async function addRecord(
  db: Env['DB'],
  ctx: RequestContext,
  name: string,
  value: string,
): Promise<void> {
  const companyId = ctx.companyId;
  await db
    .prepare('INSERT INTO records (company_id, name, value) VALUES (?, ?, ?)')
    .bind(companyId, name, value)
    .run();
}

export async function updateRecord(
  db: Env['DB'],
  ctx: RequestContext,
  id: number,
  name: string,
  value: string,
): Promise<void> {
  const companyId = ctx.companyId;
  await db
    .prepare('UPDATE records SET name = ?, value = ? WHERE id = ? AND company_id = ?')
    .bind(name, value, id, companyId)
    .run();
}

export async function deleteRecord(db: Env['DB'], ctx: RequestContext, id: number): Promise<void> {
  const companyId = ctx.companyId;
  await db.prepare('DELETE FROM records WHERE id = ? AND company_id = ?').bind(id, companyId).run();
}
