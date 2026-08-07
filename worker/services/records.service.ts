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
    companyId: number,
    query?: string,
    page = 1,
    limit = 10,
  ): Promise<PaginatedRecords> {
    return getRecords(this.db, companyId, query, page, limit);
  }

  async getRecord(companyId: number, id: number): Promise<RecordResult | null> {
    return getRecordById(this.db, companyId, id);
  }

  async createRecord(companyId: number, name: string, value: string): Promise<void> {
    await addRecord(this.db, companyId, name, value);
  }

  async modifyRecord(companyId: number, id: number, name: string, value: string): Promise<void> {
    await updateRecord(this.db, companyId, id, name, value);
  }

  async removeRecord(companyId: number, id: number): Promise<void> {
    await deleteRecord(this.db, companyId, id);
  }
}
