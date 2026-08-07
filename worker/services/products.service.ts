import type { Database } from '../db';
import type { RequestContext } from '../models/context';
import { createProduct, listProducts } from '../db/repositories';

export class ProductsService {
  constructor(private db: Database) {}

  async list(ctx: RequestContext) {
    return listProducts(this.db, ctx);
  }

  async create(
    ctx: RequestContext,
    input: {
      code: string;
      name: string;
      businessLineId?: number | null;
      storeId?: number | null;
      status?: string;
    },
  ) {
    if (!input.name || !input.code) {
      throw new Error('INVALID_INPUT');
    }
    return createProduct(this.db, ctx, input);
  }
}
