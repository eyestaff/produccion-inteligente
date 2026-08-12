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
  saveProductionOrderBOM,
  getProductionOrderBOM,
  buildUpdateProductionOrderStatusStatement,
} from '../db/production.repositories';
import { runBatch } from '../db/repositories';

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

    // Al editar, debemos re-calcular el BOM
    // Recuperamos los items originales de la orden
    const ingredientsOut: {
      productId: number;
      productName: string;
      quantity: number;
      unit: string;
    }[] = [];
    const updatedOrder = await getProductionOrder(this.db, this.ctx, orderId);

    // La orden ahora tiene targetQuantity distinto, calculamos el ratio si podemos
    // Para simplificar, si editamos targetQuantity y hay multiples items, es complejo re-escalar
    // Como el MVP asume targetQuantity edit = escalado de todos los items o item unico:
    for (const item of updatedOrder!.items) {
      // Simplificado: asumimos item.quantity no cambia en la BDD para MVP, pero si cambiase tendríamos que actualizar items.
      // Aqui re-explotamos el BOM usando la receta actual por si acaso.
      const ratio = updatedOrder!.targetQuantity / order.targetQuantity;
      const newQty = item.quantity * ratio;
      await this.explodeBOM(item.productId, newQty, ingredientsOut, 0, 'Producto Terminado', 'u');
    }
    await saveProductionOrderBOM(this.db, this.ctx, orderId, ingredientsOut);

    return this.get(orderId);
  }

  async startOrder(orderId: number) {
    const order = await getProductionOrder(this.db, this.ctx, orderId);
    if (!order) throw new Error('NOT_FOUND');
    if (order.status !== 'planned') throw new Error('ORDER_NOT_PLANNED');

    // Reserva de Inventario usando el BOM congelado
    const bom = await getProductionOrderBOM(this.db, this.ctx, orderId);
    for (const ing of bom) {
      await this.inventoryService.reserveForProduction(
        order.storeId,
        ing.productId,
        ing.plannedQuantity,
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
      alerts: [], // Mocks for now
    };
  }

  private async explodeBOM(
    productId: number,
    quantity: number,
    ingredientsOut: { productId: number; productName: string; quantity: number; unit: string }[],
    depth = 0,
    productName = 'Desconocido',
    unit = 'u',
  ) {
    if (depth > 5) throw new Error('MAX_BOM_DEPTH_EXCEEDED');

    const recipes = await this.recipesService.list(productId);
    const activeRecipeMeta = recipes.find((r: any) => r.status === 'active');

    // Si no tiene receta activa, es una materia prima o un nodo hoja.
    if (!activeRecipeMeta) {
      const existingOut = ingredientsOut.find((x) => x.productId === productId);
      if (existingOut) {
        existingOut.quantity += quantity;
      } else {
        ingredientsOut.push({
          productId,
          productName,
          quantity,
          unit,
        });
      }
      return;
    }

    const activeRecipe = await this.recipesService.get(activeRecipeMeta.id);
    const factor = quantity / activeRecipe.yieldQuantity;

    for (const ing of activeRecipe.items) {
      const requiredQty = factor * ing.quantity; // REAL precision
      await this.explodeBOM(
        ing.productId,
        requiredQty,
        ingredientsOut,
        depth + 1,
        ing.productName || 'Ingrediente',
        ing.unit || 'u',
      );
    }
  }

  async planOrder(
    storeId: number,
    businessLineId: number,
    items: { productId: number; quantity: number }[],
  ) {
    if (!items || items.length === 0) throw new Error('EMPTY_ORDER');

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

    const ingredientsOut: {
      productId: number;
      productName: string;
      quantity: number;
      unit: string;
    }[] = [];
    for (const item of items) {
      await this.explodeBOM(
        item.productId,
        item.quantity,
        ingredientsOut,
        0,
        'Producto Terminado',
        'u',
      );
    }

    await saveProductionOrderBOM(this.db, this.ctx, order.id, ingredientsOut);

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

    const bom = await getProductionOrderBOM(this.db, this.ctx, orderId);
    const ingredientsOut = bom.map((b) => ({
      productId: b.productId,
      productName: b.productName || 'Ingrediente',
      quantity: b.plannedQuantity,
      unit: b.unit,
    }));

    return { orderId: order.id, ingredients: ingredientsOut };
  }

  async completeOrder(orderId: number, actualQuantity?: number, wasteQuantity?: number) {
    const order = await getProductionOrder(this.db, this.ctx, orderId);
    if (!order) throw new Error('NOT_FOUND');
    if (order.status === 'completed' || order.status === 'cancelled') {
      throw new Error('ORDER_ALREADY_CLOSED');
    }

    const finalQuantity = actualQuantity !== undefined ? actualQuantity : order.targetQuantity;
    const finalWaste = wasteQuantity || 0;

    const productionFactor =
      order.targetQuantity > 0 ? (finalQuantity + finalWaste) / order.targetQuantity : 1;

    const bom = await getProductionOrderBOM(this.db, this.ctx, orderId);
    const ingredientsOut: { productId: number; quantity: number }[] = bom.map((b) => ({
      productId: b.productId,
      quantity: b.plannedQuantity * productionFactor,
    }));

    const productsIn: { productId: number; quantity: number }[] = order.items.map((item: any) => ({
      productId: item.productId,
      quantity:
        order.targetQuantity > 0 ? item.quantity * (finalQuantity / order.targetQuantity) : 0,
    }));

    // Orquestación: Inventario y Estado (Atomic Backflush Puro - TECH-001)
    const statements: any[] = [];

    // 1. Insumos OUT & Productos IN
    statements.push(
      ...this.inventoryService.buildProductionBackflushStatements(
        orderId,
        order.storeId,
        ingredientsOut,
        productsIn,
      ),
    );

    // 2. Registrar mermas de producto final si hubo
    if (finalWaste > 0 && productsIn.length > 0) {
      statements.push(
        ...this.inventoryService.buildTransactionStatements({
          storeId: order.storeId,
          productId: productsIn[0].productId,
          type: 'out',
          quantityChange: -finalWaste,
          reason: 'breakage',
        }),
      );
    }

    // 3. Finalización (Actualizar estado de la orden)
    statements.push(
      buildUpdateProductionOrderStatusStatement(
        this.db,
        this.ctx,
        orderId,
        'completed',
        finalQuantity,
      ),
    );

    // EJECUCIÓN ATÓMICA GARANTIZADA
    await runBatch(this.db, statements);

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
      const bom = await getProductionOrderBOM(this.db, this.ctx, orderId);
      for (const ing of bom) {
        await this.inventoryService.releaseFromProduction(
          order.storeId,
          ing.productId,
          ing.plannedQuantity,
          orderId,
        );
      }
    }

    await updateProductionOrderStatus(this.db, this.ctx, orderId, 'cancelled');

    console.log(`[EVENT] ProductionOrderCancelled: ${orderId}`);

    return this.get(orderId);
  }
}
