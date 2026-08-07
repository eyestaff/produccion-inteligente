import { createMockContext } from './fakes/context';
import { describe, expect, it, beforeEach } from 'vitest';

import { getRecords, addRecord } from '../worker/repositories/records.repository';

describe('Records Repository - Multi-tenant Isolation', () => {
  let fakeDb: any;
  let recordsData: any[] = [];

  beforeEach(() => {
    recordsData = [];
    fakeDb = {
      prepare: (sql: string) => {
        const normalized = sql.trim();
        return {
          bind: (...args: any[]) => {
            return {
              all: async () => {
                if (
                  normalized.includes(
                    'SELECT id, name, value, created_at as createdAt FROM records WHERE company_id = ?',
                  )
                ) {
                  const companyId = args[0];
                  // If query param is present
                  if (args.length > 3) {
                    const results = recordsData.filter(
                      (r) =>
                        r.company_id === companyId && r.name.includes(args[1].replace('%', '')),
                    );
                    return { results };
                  }
                  const results = recordsData.filter((r) => r.company_id === companyId);
                  return { results };
                }
                return { results: [] };
              },
              first: async () => {
                if (
                  normalized.includes('SELECT COUNT(*) as total FROM records WHERE company_id = ?')
                ) {
                  const companyId = args[0];
                  const total = recordsData.filter((r) => r.company_id === companyId).length;
                  return { total };
                }
                return null;
              },
              run: async () => {
                if (normalized.includes('INSERT INTO records')) {
                  recordsData.push({
                    id: recordsData.length + 1,
                    company_id: args[0],
                    name: args[1],
                    value: args[2],
                  });
                }
                return { success: true };
              },
            };
          },
        };
      },
    };
  });

  it('should isolate records between two companies', async () => {
    const COMPANY_A = 1;
    const COMPANY_B = 2;

    await addRecord(fakeDb as any, createMockContext(COMPANY_A), 'Record A1', 'Value A1');
    await addRecord(fakeDb as any, createMockContext(COMPANY_A), 'Record A2', 'Value A2');

    await addRecord(fakeDb as any, createMockContext(COMPANY_B), 'Record B1', 'Value B1');

    const resultA = await getRecords(fakeDb as any, createMockContext(COMPANY_A));
    expect(resultA.total).toBe(2);
    expect(resultA.records.map((r) => r.name)).toContain('Record A1');
    expect(resultA.records.map((r) => r.name)).not.toContain('Record B1');

    const resultB = await getRecords(fakeDb as any, createMockContext(COMPANY_B));
    expect(resultB.total).toBe(1);
    expect(resultB.records[0].name).toBe('Record B1');
  });
});
