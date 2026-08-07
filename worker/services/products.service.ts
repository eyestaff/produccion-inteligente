import type { Database } from '../db/repositories';
import type { RequestContext } from '../models/context';
import {
  createProduct,
  listProducts,
  updateProduct,
  createCategory,
  listCategories,
} from '../db/repositories';

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
      categoryId?: number | null;
      type?: string;
      baseUnit?: string;
      cost?: number;
      price?: number;
      status?: string;
    },
  ) {
    if (!input.name || !input.code) {
      throw new Error('INVALID_INPUT');
    }
    return createProduct(this.db, ctx, input);
  }

  async update(
    ctx: RequestContext,
    id: number,
    input: {
      code?: string;
      name?: string;
      businessLineId?: number | null;
      categoryId?: number | null;
      type?: string;
      baseUnit?: string;
      cost?: number;
      price?: number;
      status?: string;
    },
  ) {
    return updateProduct(this.db, ctx, id, input);
  }

  async listCategories(ctx: RequestContext) {
    const rawCategories: any = await listCategories(this.db, ctx);
    return Array.isArray(rawCategories) ? rawCategories : rawCategories?.results || [];
  }

  async createCategory(
    ctx: RequestContext,
    input: {
      parentId?: number | null;
      name: string;
      description?: string | null;
      status?: string;
    },
  ) {
    if (!input.name) {
      throw new Error('INVALID_INPUT');
    }
    return createCategory(this.db, ctx, input);
  }
}
