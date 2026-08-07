import type { Env } from '../index';
import type { RequestContext } from '../models/context';
import {
  createRecipe,
  getRecipeById,
  listRecipes,
  updateRecipe,
  deleteRecipe,
  createRecipeItem,
  listRecipeItems,
  deleteRecipeItem,
} from '../db/repositories';

export class RecipesService {
  constructor(
    private db: Env['DB'],
    private ctx: RequestContext,
  ) {}

  async list(productId?: number) {
    return listRecipes(this.db, this.ctx, productId);
  }

  async get(id: number) {
    const recipe = await getRecipeById(this.db, this.ctx, id);
    if (!recipe) {
      throw new Error('NOT_FOUND');
    }
    const items = await listRecipeItems(this.db, this.ctx, id);
    return { ...recipe, items };
  }

  async create(data: {
    productId: number;
    name: string;
    yieldQuantity?: number;
    version?: number;
    status?: string;
  }) {
    if (!data.productId || !data.name) {
      throw new Error('INVALID_DATA');
    }
    return createRecipe(this.db, this.ctx, data);
  }

  async update(
    id: number,
    data: { name?: string; yieldQuantity?: number; version?: number; status?: string },
  ) {
    const recipe = await getRecipeById(this.db, this.ctx, id);
    if (!recipe) {
      throw new Error('NOT_FOUND');
    }
    await updateRecipe(this.db, this.ctx, id, data);
    return this.get(id);
  }

  async delete(id: number) {
    const recipe = await getRecipeById(this.db, this.ctx, id);
    if (!recipe) {
      throw new Error('NOT_FOUND');
    }
    await deleteRecipe(this.db, this.ctx, id);
    return { success: true };
  }

  async addItem(recipeId: number, data: { productId: number; quantity: number; unit?: string }) {
    const recipe = await getRecipeById(this.db, this.ctx, recipeId);
    if (!recipe) {
      throw new Error('NOT_FOUND');
    }
    if (!data.productId || !data.quantity) {
      throw new Error('INVALID_DATA');
    }
    return createRecipeItem(this.db, this.ctx, { recipeId, ...data });
  }

  async removeItem(recipeId: number, itemId: number) {
    await deleteRecipeItem(this.db, this.ctx, recipeId, itemId);
    return { success: true };
  }
}
