import type { RequestContext } from '../models/context';
import type { Env } from '../index';
import {
  getRecords,
  addRecord,
  getRecordById,
  updateRecord,
  deleteRecord,
} from '../repositories/records.repository';
import type { PaginatedRecords, RecordResult } from '../models/records';

export class RecordsService {
  constructor(private db: Env['DB']) {}

  async listRecords(
    ctx: RequestContext,
    query?: string,
    page = 1,
    limit = 10,
  ): Promise<PaginatedRecords> {
    return getRecords(this.db, ctx, query, page, limit);
  }

  async getRecord(ctx: RequestContext, id: number): Promise<RecordResult | null> {
    return getRecordById(this.db, ctx, id);
  }

  async createRecord(ctx: RequestContext, name: string, value: string): Promise<void> {
    await addRecord(this.db, ctx, name, value);
  }

  async modifyRecord(ctx: RequestContext, id: number, name: string, value: string): Promise<void> {
    await updateRecord(this.db, ctx, id, name, value);
  }

  async removeRecord(ctx: RequestContext, id: number): Promise<void> {
    await deleteRecord(this.db, ctx, id);
  }
}
