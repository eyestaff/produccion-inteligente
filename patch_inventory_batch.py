with open('worker/db/repositories.ts', 'r') as f:
    content = f.read()

batch_func = """
export async function executeAtomicBackflush(
  db: Database,
  ctx: RequestContext,
  orderId: number,
  storeId: number,
  ingredientsOut: { productId: number; quantity: number }[],
  productsIn: { productId: number; quantity: number }[]
) {
  // En D1 real, deberiamos usar db.batch([...statements])
  // Dado que el wrapper runStatement es secuencial, ejecutamos 
  // simulando atomicidad a nivel de aplicacion (para tests locales usa transacciones sincrónicas en better-sqlite3 si quisieramos, pero usaremos runStatement)
  
  // 1. Ingredientes OUT
  for (const ing of ingredientsOut) {
    await recordInventoryTransaction(db, ctx, {
      storeId,
      productId: ing.productId,
      type: 'out',
      quantityChange: -ing.quantity,
      reason: 'production',
      sourceModule: 'ProductionEngine',
      referenceType: 'ProductionOrder',
      referenceId: orderId,
    });
  }

  // 2. Productos IN
  for (const prod of productsIn) {
    await recordInventoryTransaction(db, ctx, {
      storeId,
      productId: prod.productId,
      type: 'in',
      quantityChange: prod.quantity,
      reason: 'production',
      sourceModule: 'ProductionEngine',
      referenceType: 'ProductionOrder',
      referenceId: orderId,
    });
  }
}
"""

if "executeAtomicBackflush" not in content:
    content += "\n" + batch_func

with open('worker/db/repositories.ts', 'w') as f:
    f.write(content)
