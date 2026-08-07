import type { Database } from '../db';
import type { RequestContext } from '../models/context';
import {
  createStore,
  listStores,
  getStoreById,
  updateStore,
  deleteStore,
} from '../db/repositories';

export class StoresService {
  constructor(private db: Database) {}

  async list(ctx: RequestContext) {
    return listStores(this.db, ctx);
  }

  async getById(ctx: RequestContext, id: number) {
    const store = await getStoreById(this.db, ctx, id);
    if (!store) {
      throw new Error('NOT_FOUND');
    }
    return store;
  }

  async create(ctx: RequestContext, input: { name: string; code: string; status?: string }) {
    if (!input.name || !input.code) {
      throw new Error('INVALID_INPUT');
    }
    return createStore(this.db, ctx, input);
  }

  async update(
    ctx: RequestContext,
    id: number,
    input: Partial<{ name: string; code: string; status: string }>,
  ) {
    await this.getById(ctx, id); // check exists
    return updateStore(this.db, ctx, id, input);
  }

  async delete(ctx: RequestContext, id: number) {
    await this.getById(ctx, id); // check exists
    return deleteStore(this.db, ctx, id);
  }
}
