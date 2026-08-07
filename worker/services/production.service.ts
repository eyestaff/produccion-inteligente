import type { Env } from '../index';
import type { RequestContext } from '../models/context';
import { RecipesService } from './recipes.service';
import { InventoryService } from './inventory.service';
import {
  createProductionOrder,
  addProductionOrderItem,
  getProductionOrder,
  updateProductionOrderStatus,
} from '../db/production.repositories';

export class ProductionService {
  private recipesService: RecipesService;
  private inventoryService: InventoryService;

  constructor(
    private db: Env['DB'],
    private ctx: RequestContext,
  ) {
    this.recipesService = new RecipesService(db, ctx);
    this.inventoryService = new InventoryService(db, ctx);
  }

  async planOrder(
    storeId: number,
    businessLineId: number,
    items: { productId: number; quantity: number }[],
  ) {
    if (!items || items.length === 0) throw new Error('EMPTY_ORDER');

    // Validar que todos los items tienen receta activa
    for (const item of items) {
      const recipes = await this.recipesService.list(item.productId);
      const activeRecipe = recipes.find((r: any) => r.status === 'active');
      if (!activeRecipe) {
        throw new Error(`NO_ACTIVE_RECIPE_FOR_PRODUCT_${item.productId}`);
      }
    }

    const totalQty = items.reduce((acc, item) => acc + item.quantity, 0);
    const order = await createProductionOrder(this.db, this.ctx, {
      storeId,
      businessLineId,
      targetQuantity: totalQty,
    });

    for (const item of items) {
      await addProductionOrderItem(this.db, this.ctx, order.id, item.productId, item.quantity);
    }

    // Domain Event mock
    console.log(`[EVENT] ProductionOrderPlanned: ${order.id}`);

    return this.get(order.id);
  }

  async get(orderId: number) {
    const order = await getProductionOrder(this.db, this.ctx, orderId);
    if (!order) throw new Error('NOT_FOUND');
    return order;
  }

  async completeOrder(orderId: number) {
    const order = await getProductionOrder(this.db, this.ctx, orderId);
    if (!order) throw new Error('NOT_FOUND');
    if (order.status === 'completed' || order.status === 'cancelled') {
      throw new Error('ORDER_ALREADY_CLOSED');
    }

    const ingredientsOut: { productId: number; quantity: number }[] = [];
    const productsIn: { productId: number; quantity: number }[] = [];

    // Orquestación: Recetas + Explosión
    for (const item of order.items) {
      const recipes = await this.recipesService.list(item.productId);
      const activeRecipeMeta = recipes.find((r: any) => r.status === 'active');
      if (!activeRecipeMeta) throw new Error(`NO_ACTIVE_RECIPE_FOR_PRODUCT_${item.productId}`);

      const activeRecipe = await this.recipesService.get(activeRecipeMeta.id);

      // Explosion de materiales: (target_quantity / yield_quantity) * item.quantity
      const factor = item.quantity / activeRecipe.yieldQuantity;

      for (const ing of activeRecipe.items) {
        const requiredQty = Math.ceil(factor * ing.quantity); // Integer arithmetic

        const existingOut = ingredientsOut.find((x) => x.productId === ing.productId);
        if (existingOut) {
          existingOut.quantity += requiredQty;
        } else {
          ingredientsOut.push({ productId: ing.productId, quantity: requiredQty });
        }
      }

      productsIn.push({ productId: item.productId, quantity: item.quantity });
    }

    // Orquestación: Inventario (Atomic Backflush)
    await this.inventoryService.executeProductionBackflush(
      orderId,
      order.storeId,
      ingredientsOut,
      productsIn,
    );

    // Finalización
    await updateProductionOrderStatus(this.db, this.ctx, orderId, 'completed');

    // Domain Event mock
    console.log(`[EVENT] ProductionOrderCompleted: ${orderId}`);

    return this.get(orderId);
  }

  async cancelOrder(orderId: number) {
    const order = await getProductionOrder(this.db, this.ctx, orderId);
    if (!order) throw new Error('NOT_FOUND');
    if (order.status === 'completed' || order.status === 'cancelled') {
      throw new Error('ORDER_ALREADY_CLOSED');
    }

    await updateProductionOrderStatus(this.db, this.ctx, orderId, 'cancelled');

    // Domain Event mock
    console.log(`[EVENT] ProductionOrderCancelled: ${orderId}`);

    return this.get(orderId);
  }
}
