import re

with open('worker/db/repositories.ts', 'r') as f:
    content = f.read()

# Replace createRecipe definition
old_create_recipe = """export async function createRecipe(
  db: Database,
  ctx: RequestContext,
  input: { productId?: number | null; name: string; version?: number; status?: string },
) {
  const companyId = ctx.companyId;
  const result = await runStatement(
    db,
    'INSERT INTO recipes (company_id, product_id, name, version, status) VALUES (?, ?, ?, ?, ?)',
    [companyId, input.productId ?? null, input.name, input.version ?? 1, input.status ?? 'draft'],
  );
  const id =
    typeof result === 'object' && result && 'lastInsertRowid' in result
      ? (result as { lastInsertRowid?: unknown }).lastInsertRowid
      : undefined;
  const inserted = await runStatement(
    db,
    'SELECT id, product_id AS productId, name, version, status FROM recipes WHERE id = ? AND company_id = ?',
    [id ?? 1, companyId],
    'get',
  );
  return inserted;
}"""

new_create_recipe = """export async function createRecipe(
  db: Database,
  ctx: RequestContext,
  input: { productId: number; name: string; yieldQuantity?: number; version?: number; status?: string },
) {
  const companyId = ctx.companyId;
  const result = await runStatement(
    db,
    'INSERT INTO recipes (company_id, product_id, name, yield_quantity, version, status) VALUES (?, ?, ?, ?, ?, ?)',
    [companyId, input.productId, input.name, input.yieldQuantity ?? 1, input.version ?? 1, input.status ?? 'draft'],
  );
  const id =
    typeof result === 'object' && result && 'lastInsertRowid' in result
      ? (result as { lastInsertRowid?: unknown }).lastInsertRowid
      : undefined;
  const inserted = await runStatement(
    db,
    'SELECT id, product_id AS productId, name, yield_quantity AS yieldQuantity, version, status FROM recipes WHERE id = ? AND company_id = ?',
    [id ?? 1, companyId],
    'get',
  );
  return inserted;
}

export async function getRecipeById(db: Database, ctx: RequestContext, id: number) {
  return runStatement(
    db,
    'SELECT id, product_id AS productId, name, yield_quantity AS yieldQuantity, version, status FROM recipes WHERE id = ? AND company_id = ?',
    [id, ctx.companyId],
    'get',
  );
}

export async function listRecipes(db: Database, ctx: RequestContext, productId?: number) {
  if (productId) {
    return runStatement(
      db,
      'SELECT id, product_id AS productId, name, yield_quantity AS yieldQuantity, version, status FROM recipes WHERE company_id = ? AND product_id = ? ORDER BY id ASC',
      [ctx.companyId, productId],
      'all',
    );
  }
  return runStatement(
    db,
    'SELECT id, product_id AS productId, name, yield_quantity AS yieldQuantity, version, status FROM recipes WHERE company_id = ? ORDER BY id ASC',
    [ctx.companyId],
    'all',
  );
}

export async function updateRecipe(
  db: Database,
  ctx: RequestContext,
  id: number,
  input: { name?: string; yieldQuantity?: number; version?: number; status?: string },
) {
  const updates: string[] = [];
  const params: any[] = [];
  if (input.name !== undefined) {
    updates.push('name = ?');
    params.push(input.name);
  }
  if (input.yieldQuantity !== undefined) {
    updates.push('yield_quantity = ?');
    params.push(input.yieldQuantity);
  }
  if (input.version !== undefined) {
    updates.push('version = ?');
    params.push(input.version);
  }
  if (input.status !== undefined) {
    updates.push('status = ?');
    params.push(input.status);
  }
  if (updates.length === 0) return true;
  
  params.push(id, ctx.companyId);
  await runStatement(
    db,
    `UPDATE recipes SET ${updates.join(', ')} WHERE id = ? AND company_id = ?`,
    params,
  );
  return true;
}

export async function deleteRecipe(db: Database, ctx: RequestContext, id: number) {
  await runStatement(
    db,
    'DELETE FROM recipe_items WHERE recipe_id = ? AND company_id = ?',
    [id, ctx.companyId]
  );
  await runStatement(
    db,
    'DELETE FROM recipes WHERE id = ? AND company_id = ?',
    [id, ctx.companyId]
  );
  return true;
}
"""

content = content.replace(old_create_recipe, new_create_recipe)

# Replace createRecipeItem definition
old_create_recipe_item = """export async function createRecipeItem(
  db: Database,
  ctx: RequestContext,
  input: { recipeId?: number | null; productId?: number | null; quantity?: number; unit?: string },
) {
  const companyId = ctx.companyId;
  const result = await runStatement(
    db,
    'INSERT INTO recipe_items (company_id, recipe_id, product_id, quantity, unit) VALUES (?, ?, ?, ?, ?)',
    [
      companyId,
      input.recipeId ?? null,
      input.productId ?? null,
      input.quantity ?? 1,
      input.unit ?? 'u',
    ],
  );
  const id =
    typeof result === 'object' && result && 'lastInsertRowid' in result
      ? (result as { lastInsertRowid?: unknown }).lastInsertRowid
      : undefined;
  const inserted = await runStatement(
    db,
    'SELECT id, recipe_id AS recipeId, product_id AS productId, quantity, unit FROM recipe_items WHERE id = ? AND company_id = ?',
    [id ?? 1, companyId],
    'get',
  );
  return inserted;
}"""

new_create_recipe_item = """export async function createRecipeItem(
  db: Database,
  ctx: RequestContext,
  input: { recipeId: number; productId: number; quantity: number; unit?: string },
) {
  const companyId = ctx.companyId;
  const result = await runStatement(
    db,
    'INSERT INTO recipe_items (company_id, recipe_id, product_id, quantity, unit) VALUES (?, ?, ?, ?, ?)',
    [companyId, input.recipeId, input.productId, input.quantity, input.unit ?? 'u'],
  );
  const id =
    typeof result === 'object' && result && 'lastInsertRowid' in result
      ? (result as { lastInsertRowid?: unknown }).lastInsertRowid
      : undefined;
  const inserted = await runStatement(
    db,
    'SELECT id, recipe_id AS recipeId, product_id AS productId, quantity, unit FROM recipe_items WHERE id = ? AND company_id = ?',
    [id ?? 1, companyId],
    'get',
  );
  return inserted;
}

export async function listRecipeItems(db: Database, ctx: RequestContext, recipeId: number) {
  return runStatement(
    db,
    'SELECT id, recipe_id AS recipeId, product_id AS productId, quantity, unit FROM recipe_items WHERE recipe_id = ? AND company_id = ? ORDER BY id ASC',
    [recipeId, ctx.companyId],
    'all',
  );
}

export async function deleteRecipeItem(db: Database, ctx: RequestContext, recipeId: number, itemId: number) {
  await runStatement(
    db,
    'DELETE FROM recipe_items WHERE id = ? AND recipe_id = ? AND company_id = ?',
    [itemId, recipeId, ctx.companyId],
  );
  return true;
}
"""

content = content.replace(old_create_recipe_item, new_create_recipe_item)

with open('worker/db/repositories.ts', 'w') as f:
    f.write(content)
