import { fetchApi } from './api';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RecipeItem {
  id: number;
  recipeId: number;
  productId: number;
  productName: string;
  quantity: number;
  unit: string;
}

export interface Recipe {
  id: number;
  productId: number;
  name: string;
  yieldQuantity: number;
  version: number;
  status: string; // 'draft' | 'active' | 'inactive'
}

export interface RecipeDetail extends Recipe {
  items: RecipeItem[];
}

export interface CreateRecipeInput {
  productId: number;
  name: string;
  yieldQuantity?: number;
  status?: string;
}

export interface UpdateRecipeInput {
  name?: string;
  yieldQuantity?: number;
  status?: string;
}

export interface CreateRecipeItemInput {
  productId: number;
  quantity: number;
  unit: string;
}

// ─── API ─────────────────────────────────────────────────────────────────────

export const RecipesAPI = {
  /** List all recipes for the authenticated company */
  list(): Promise<Recipe[]> {
    return fetchApi('/recipes');
  },

  /** List recipes filtered by finished product */
  listByProduct(productId: number): Promise<Recipe[]> {
    return fetchApi(`/recipes?productId=${productId}`);
  },

  /** Get a single recipe with its items (ingredients) */
  get(id: number): Promise<RecipeDetail> {
    return fetchApi(`/recipes/${id}`);
  },

  /** Create a new recipe */
  create(input: CreateRecipeInput): Promise<Recipe> {
    return fetchApi('/recipes', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  /** Update recipe metadata (name, yield, status) */
  update(id: number, input: UpdateRecipeInput): Promise<RecipeDetail> {
    return fetchApi(`/recipes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  },

  /** Delete a recipe and all its items */
  delete(id: number): Promise<{ success: boolean }> {
    return fetchApi(`/recipes/${id}`, { method: 'DELETE' });
  },

  /** Add an ingredient to a recipe */
  addItem(recipeId: number, input: CreateRecipeItemInput): Promise<RecipeItem> {
    return fetchApi(`/recipes/${recipeId}/items`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  /** Remove an ingredient from a recipe */
  removeItem(recipeId: number, itemId: number): Promise<{ success: boolean }> {
    return fetchApi(`/recipes/${recipeId}/items/${itemId}`, { method: 'DELETE' });
  },
};
