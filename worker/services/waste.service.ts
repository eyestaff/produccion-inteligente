import type { Database } from '../db/repositories';
import type { RequestContext } from '../models/context';
import { runStatement } from '../db/repositories';
import { InventoryService } from './inventory.service';

export type WasteReason =
  'caducity' | 'overproduction' | 'error' | 'breakage' | 'quality' | 'other';

export const ALL_WASTE_REASONS = [
  'caducity',
  'overproduction',
  'error',
  'breakage',
  'quality',
  'other',
];

export class WasteService {
  private db: Database;
  private ctx: RequestContext;
  private inventoryService: InventoryService;

  constructor(db: Database, ctx: RequestContext) {
    this.db = db;
    this.ctx = ctx;
    this.inventoryService = new InventoryService(db, ctx);
  }

  async registerWaste(input: {
    storeId: number;
    productId: number;
    quantity: number;
    reason: WasteReason;
    notes?: string;
  }) {
    if (input.quantity <= 0) throw new Error('QUANTITY_MUST_BE_POSITIVE');

    // Validate reason
    const finalReason = ALL_WASTE_REASONS.includes(input.reason) ? input.reason : 'other';

    // We use InventoryService to ensure atomic transaction and correct balance updates
    const result = await this.inventoryService.createTransaction({
      storeId: input.storeId,
      productId: input.productId,
      type: 'out',
      quantityChange: -input.quantity, // Must be negative to deduct stock
      reason: finalReason,
      sourceModule: 'WasteManagement',
      referenceType: input.notes ? 'Notes' : undefined,
    });

    if (input.notes) {
      // Find the last inserted transaction for this user/product/store to append the notes
      await runStatement(
        this.db,
        `UPDATE inventory_transactions SET reference_type = ? 
         WHERE company_id = ? AND store_id = ? AND product_id = ? AND source_module = 'WasteManagement'
         ORDER BY id DESC LIMIT 1`,
        [input.notes.substring(0, 200), this.ctx.companyId, input.storeId, input.productId],
      );
    }

    return { success: true, updatedStock: result.availableQuantity };
  }

  async listWaste(
    storeId: number,
    filters?: { productId?: number; reason?: string; startDate?: string; endDate?: string },
  ) {
    let query = `
      SELECT it.id, it.store_id as storeId, it.product_id as productId, p.name as productName,
             ABS(it.quantity_change) as quantity, it.reason, it.created_at as createdAt,
             it.created_by as createdBy, u.email as userEmail, it.reference_type as notes
      FROM inventory_transactions it
      JOIN products p ON it.product_id = p.id
      LEFT JOIN users u ON it.created_by = u.id
      WHERE it.company_id = ? AND it.store_id = ? AND it.type = 'out' 
        AND it.reason IN ('caducity', 'overproduction', 'error', 'breakage', 'quality', 'other', 'theft')
    `;
    const params: any[] = [this.ctx.companyId, storeId];

    if (filters?.productId) {
      query += ` AND it.product_id = ?`;
      params.push(filters.productId);
    }
    if (filters?.reason) {
      query += ` AND it.reason = ?`;
      params.push(filters.reason);
    }
    if (filters?.startDate) {
      query += ` AND DATE(it.created_at) >= DATE(?)`;
      params.push(filters.startDate);
    }
    if (filters?.endDate) {
      query += ` AND DATE(it.created_at) <= DATE(?)`;
      params.push(filters.endDate);
    }

    query += ` ORDER BY it.created_at DESC LIMIT 100`;

    return runStatement(this.db, query, params, 'all');
  }

  async getWasteMetrics(storeId: number) {
    const cid = this.ctx.companyId;
    const reasonsStr =
      "('caducity', 'overproduction', 'error', 'breakage', 'quality', 'other', 'theft')";

    // 1. Merma Diaria
    const daily = (await runStatement(
      this.db,
      `SELECT COALESCE(SUM(ABS(quantity_change)),0) as total 
       FROM inventory_transactions 
       WHERE company_id = ? AND store_id = ? AND type = 'out' AND reason IN ${reasonsStr}
       AND DATE(created_at) = DATE('now')`,
      [cid, storeId],
      'get',
    )) as any;

    // 2. Merma Semanal
    const weekly = (await runStatement(
      this.db,
      `SELECT COALESCE(SUM(ABS(quantity_change)),0) as total 
       FROM inventory_transactions 
       WHERE company_id = ? AND store_id = ? AND type = 'out' AND reason IN ${reasonsStr}
       AND created_at >= DATE('now', '-7 days')`,
      [cid, storeId],
      'get',
    )) as any;

    // 3. Producto con más merma (últimos 30 días)
    const topProduct = (await runStatement(
      this.db,
      `SELECT p.name, COALESCE(SUM(ABS(it.quantity_change)),0) as total 
       FROM inventory_transactions it
       JOIN products p ON it.product_id = p.id
       WHERE it.company_id = ? AND it.store_id = ? AND it.type = 'out' AND it.reason IN ${reasonsStr}
       AND it.created_at >= DATE('now', '-30 days')
       GROUP BY it.product_id
       ORDER BY total DESC LIMIT 1`,
      [cid, storeId],
      'get',
    )) as any;

    // 4. Tendencia últimos 7 días
    const trendRaw = (await runStatement(
      this.db,
      `SELECT DATE(created_at) as day, COALESCE(SUM(ABS(quantity_change)),0) as total
       FROM inventory_transactions 
       WHERE company_id = ? AND store_id = ? AND type = 'out' AND reason IN ${reasonsStr}
       AND created_at >= DATE('now', '-6 days')
       GROUP BY DATE(created_at) ORDER BY day ASC`,
      [cid, storeId],
      'all',
    )) as any[];

    const trend = trendRaw.length > 0 ? trendRaw.map((r: any) => r.total) : [0, 0, 0, 0, 0, 0, 0];

    // Estimated Cost: Just sum of items * a fictional average cost for MVP (e.g. 2.5) or return the total quantity if we don't have costs.
    const estimatedCost = (weekly?.total || 0) * 2.5;

    return {
      dailyWaste: daily?.total || 0,
      weeklyWaste: weekly?.total || 0,
      topProduct: topProduct?.name || 'Ninguno',
      topProductWaste: topProduct?.total || 0,
      estimatedCost,
      trend,
    };
  }
}
