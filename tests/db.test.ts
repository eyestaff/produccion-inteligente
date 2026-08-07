import { describe, expect, it } from 'vitest';
import { initializeDb } from '../worker/db';
import {
  getRecords,
  addRecord,
  getRecordById,
  updateRecord,
  deleteRecord,
} from '../worker/repositories/records.repository';

const fakeDb = {
  exec: async () => ({ success: true }),
  prepare: (sql: string) => {
    const normalized = sql.trim();
    return {
      bind(..._args: any[]) {
        return this;
      },
      all: async (..._args: any[]) => {
        if (normalized.startsWith('SELECT COUNT(*)')) {
          return { results: [] };
        }
        if (normalized.startsWith('SELECT id, name, value, created_at')) {
          return { results: [{ id: 1, name: 'sensor-1', value: '75', created_at: '2026-08-04' }] };
        }
        return { results: [] };
      },
      run: async (..._args: any[]) => ({ success: true }),
      first: async (..._args: any[]) => {
        if (normalized.startsWith('SELECT COUNT(*)')) {
          return { total: 1 };
        }
        if (normalized.startsWith('SELECT id, name, value, created_at FROM records WHERE id = ?')) {
          return { id: 1, name: 'sensor-1', value: '75', created_at: '2026-08-04' };
        }
        return null;
      },
    };
  },
};

describe('db helpers', () => {
  it('initializes the database', async () => {
    await expect(initializeDb(fakeDb as any)).resolves.toBeUndefined();
  });

  it('returns paginated records', async () => {
    const result = await getRecords(fakeDb as any, 'sensor', 1, 10);
    expect(result.total).toBe(1);
    expect(result.records).toHaveLength(1);
    expect(result.records[0].name).toBe('sensor-1');
  });

  it('returns a record by id', async () => {
    const record = await getRecordById(fakeDb as any, 1);
    expect(record).toEqual({ id: 1, name: 'sensor-1', value: '75', created_at: '2026-08-04' });
  });

  it('adds, updates, and deletes a record', async () => {
    await expect(addRecord(fakeDb as any, 'sensor-2', '80')).resolves.toBeUndefined();
    await expect(updateRecord(fakeDb as any, 1, 'sensor-1', '85')).resolves.toBeUndefined();
    await expect(deleteRecord(fakeDb as any, 1)).resolves.toBeUndefined();
  });
});
