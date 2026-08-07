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

  async listRecords(query?: string, page = 1, limit = 10): Promise<PaginatedRecords> {
    return getRecords(this.db, query, page, limit);
  }

  async getRecord(id: number): Promise<RecordResult | null> {
    return getRecordById(this.db, id);
  }

  async createRecord(name: string, value: string): Promise<void> {
    await addRecord(this.db, name, value);
  }

  async updateRecord(id: number, name: string, value: string): Promise<void> {
    await updateRecord(this.db, id, name, value);
  }

  async removeRecord(id: number): Promise<void> {
    await deleteRecord(this.db, id);
  }
}
