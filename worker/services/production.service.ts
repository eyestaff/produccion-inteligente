import type { Env } from '../index';
import type { RequestContext } from '../models/context';
import { RecipesService } from './recipes.service';
import { InventoryService } from './inventory.service';
import {
  createProductionOrder,
  addProductionOrderItem,
  getProductionOrder,
  updateProductionOrderStatus,
  listProductionOrders,
  updateProductionOrder,
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

  async listOrders() {
    return listProductionOrders(this.db, this.ctx);
  }

  async editOrder(orderId: number, data: { targetQuantity: number }) {
    const order = await getProductionOrder(this.db, this.ctx, orderId);
    if (!order) throw new Error('NOT_FOUND');
    if (order.status !== 'planned') throw new Error('ORDER_ALREADY_STARTED');

    await updateProductionOrder(this.db, this.ctx, orderId, data);
    return this.get(orderId);
  }

  async startOrder(orderId: number) {
    const order = await getProductionOrder(this.db, this.ctx, orderId);
    if (!order) throw new Error('NOT_FOUND');
    if (order.status !== 'planned') throw new Error('ORDER_NOT_PLANNED');

    // Reserva de Inventario
    const prepSheet = await this.getPrepSheet(orderId);
    for (const ing of prepSheet.ingredients) {
      await this.inventoryService.reserveForProduction(
        order.storeId,
        ing.productId,
        ing.quantity,
        orderId,
      );
    }

    await updateProductionOrderStatus(this.db, this.ctx, orderId, 'in_progress');
    return this.get(orderId);
  }

  async getDashboardKPIs() {
    const orders: any[] = (await this.listOrders()) || [];
    const planned = orders.filter((o) => o.status === 'planned').length;
    const inProgress = orders.filter((o) => o.status === 'in_progress').length;
    const completed = orders.filter((o) => o.status === 'completed').length;

    return {
      planned,
      inProgress,
      completed,
      alerts: [], // Mocks for now, can be populated by scanning inventory
    };
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

  async getPrepSheet(orderId: number) {
    const order = await getProductionOrder(this.db, this.ctx, orderId);
    if (!order) throw new Error('NOT_FOUND');

    const ingredientsOut: {
      productId: number;
      productName: string;
      quantity: number;
      unit: string;
    }[] = [];

    for (const item of order.items) {
      const recipes = await this.recipesService.list(item.productId);
      const activeRecipeMeta = recipes.find((r: any) => r.status === 'active');
      if (!activeRecipeMeta) throw new Error(`NO_ACTIVE_RECIPE_FOR_PRODUCT_${item.productId}`);

      const activeRecipe = await this.recipesService.get(activeRecipeMeta.id);
      const factor = item.quantity / activeRecipe.yieldQuantity;

      for (const ing of activeRecipe.items) {
        const requiredQty = Math.ceil(factor * ing.quantity);
        const existingOut = ingredientsOut.find((x) => x.productId === ing.productId);
        if (existingOut) {
          existingOut.quantity += requiredQty;
        } else {
          ingredientsOut.push({
            productId: ing.productId,
            productName: ing.productName || 'Ingrediente',
            quantity: requiredQty,
            unit: ing.unit || 'uds',
          });
        }
      }
    }

    return { orderId: order.id, ingredients: ingredientsOut };
  }

  async completeOrder(orderId: number, actualQuantity?: number, wasteQuantity?: number) {
    const order = await getProductionOrder(this.db, this.ctx, orderId);
    if (!order) throw new Error('NOT_FOUND');
    if (order.status === 'completed' || order.status === 'cancelled') {
      throw new Error('ORDER_ALREADY_CLOSED');
    }

    const ingredientsOut: { productId: number; quantity: number }[] = [];
    const productsIn: { productId: number; quantity: number }[] = [];

    // Si no pasan actualQuantity, asumimos la meta
    const finalQuantity = actualQuantity !== undefined ? actualQuantity : order.targetQuantity;
    const finalWaste = wasteQuantity || 0;

    // Orquestación: Recetas + Explosión basada en lo REALMENTE planificado vs usado
    // Nota: Por simplicidad del MVP, el consumo de materia prima se asume según la receta original,
    // o se puede hacer proporcional al finalQuantity + finalWaste.
    // Usaremos el total planificado originalmente para los ingredientes (o lo que dictamina la receta).
    // Si el usuario reporta mermas, eso se debió haber gastado en ingredientes igual.
    const productionFactor = (finalQuantity + finalWaste) / order.targetQuantity;

    for (const item of order.items) {
      const recipes = await this.recipesService.list(item.productId);
      const activeRecipeMeta = recipes.find((r: any) => r.status === 'active');
      if (!activeRecipeMeta) throw new Error(`NO_ACTIVE_RECIPE_FOR_PRODUCT_${item.productId}`);

      const activeRecipe = await this.recipesService.get(activeRecipeMeta.id);

      // Usar la cantidad ajustada por factor de producción real
      const adjustedItemQuantity = item.quantity * productionFactor;
      const factor = adjustedItemQuantity / activeRecipe.yieldQuantity;

      for (const ing of activeRecipe.items) {
        const requiredQty = Math.ceil(factor * ing.quantity); // Integer arithmetic

        const existingOut = ingredientsOut.find((x) => x.productId === ing.productId);
        if (existingOut) {
          existingOut.quantity += requiredQty;
        } else {
          ingredientsOut.push({ productId: ing.productId, quantity: requiredQty });
        }
      }

      // El producto final solo suma lo finalQuantity
      productsIn.push({
        productId: item.productId,
        quantity: Math.ceil(item.quantity * (finalQuantity / order.targetQuantity)),
      });
    }

    // Orquestación: Inventario (Atomic Backflush)
    await this.inventoryService.executeProductionBackflush(
      orderId,
      order.storeId,
      ingredientsOut,
      productsIn,
    );

    // Registrar mermas de producto final si hubo
    if (finalWaste > 0 && productsIn.length > 0) {
      // Tomamos el producto principal (simplificación para MVP)
      await this.inventoryService.createTransaction({
        storeId: order.storeId,
        productId: productsIn[0].productId,
        type: 'out',
        quantityChange: -finalWaste,
        reason: 'breakage',
      });
    }

    // Finalización
    await updateProductionOrderStatus(this.db, this.ctx, orderId, 'completed', finalQuantity);

    // Domain Event mock
    console.log(
      `[EVENT] ProductionOrderCompleted: ${orderId} | Actual: ${finalQuantity} | Waste: ${finalWaste}`,
    );

    return this.get(orderId);
  }

  async cancelOrder(orderId: number) {
    const order = await getProductionOrder(this.db, this.ctx, orderId);
    if (!order) throw new Error('NOT_FOUND');
    if (order.status === 'completed' || order.status === 'cancelled') {
      throw new Error('ORDER_ALREADY_CLOSED');
    }

    // Si estaba en progreso, hay que liberar la reserva
    if (order.status === 'in_progress') {
      const prepSheet = await this.getPrepSheet(orderId);
      for (const ing of prepSheet.ingredients) {
        await this.inventoryService.releaseFromProduction(
          order.storeId,
          ing.productId,
          ing.quantity,
          orderId,
        );
      }
    }

    await updateProductionOrderStatus(this.db, this.ctx, orderId, 'cancelled');

    // Domain Event mock
    console.log(`[EVENT] ProductionOrderCancelled: ${orderId}`);

    return this.get(orderId);
  }
}
