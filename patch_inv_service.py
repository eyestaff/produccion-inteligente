with open('worker/services/inventory.service.ts', 'r') as f:
    content = f.read()

import_statement = "  executeAtomicBackflush,"
if import_statement not in content:
    content = content.replace("  getInventorySnapshot,", "  getInventorySnapshot,\n  executeAtomicBackflush,")

batch_func = """
  async executeProductionBackflush(orderId: number, storeId: number, ingredientsOut: { productId: number; quantity: number }[], productsIn: { productId: number; quantity: number }[]) {
    // Generates Domain Event mockup here later
    await executeAtomicBackflush(this.db, this.ctx, orderId, storeId, ingredientsOut, productsIn);
    return true;
  }
"""

if "executeProductionBackflush" not in content:
    content = content.replace("  async reserveForProduction", batch_func + "\n  async reserveForProduction")

with open('worker/services/inventory.service.ts', 'w') as f:
    f.write(content)
