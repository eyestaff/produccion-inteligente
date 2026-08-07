import type { Database } from '../db/repositories';
import type { RequestContext } from '../models/context';
import { createBusinessLine, listBusinessLines } from '../db/repositories';

// The repositories.ts currently doesn't have getBusinessLineById, updateBusinessLine, deleteBusinessLine.
// We will add basic list and create for now.
export class BusinessLinesService {
  constructor(private db: Database) {}

  async list(ctx: RequestContext) {
    return listBusinessLines(this.db, ctx);
  }

  async create(ctx: RequestContext, input: { name: string; code: string; status?: string }) {
    if (!input.name || !input.code) {
      throw new Error('INVALID_INPUT');
    }
    return createBusinessLine(this.db, ctx, input);
  }
}
