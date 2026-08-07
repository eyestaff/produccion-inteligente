with open('worker/services/production.service.ts', 'r') as f:
    content = f.read()

repo_imports = """
import {
  createProductionOrder,
  addProductionOrderItem,
  getProductionOrder,
  updateProductionOrderStatus,
  listProductionOrders,
  updateProductionOrder
} from '../db/production.repositories';
"""
content = content.replace("import {\n  createProductionOrder,\n  addProductionOrderItem,\n  getProductionOrder,\n  updateProductionOrderStatus,\n} from '../db/production.repositories';", repo_imports.strip())

svc_methods = """
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
    
    await updateProductionOrderStatus(this.db, this.ctx, orderId, 'in_progress');
    return this.get(orderId);
  }

  async getDashboardKPIs() {
    const orders: any[] = await this.listOrders() || [];
    const planned = orders.filter((o) => o.status === 'planned').length;
    const inProgress = orders.filter((o) => o.status === 'in_progress').length;
    const completed = orders.filter((o) => o.status === 'completed').length;
    
    return {
      planned,
      inProgress,
      completed,
      alerts: [] // Mocks for now, can be populated by scanning inventory
    };
  }
"""

if "listOrders()" not in content:
    content = content.replace("async planOrder", svc_methods + "\n  async planOrder")

with open('worker/services/production.service.ts', 'w') as f:
    f.write(content)

with open('worker/routes/production.routes.ts', 'r') as f:
    routes_content = f.read()

new_routes = """
  // GET /api/production/dashboard
  if (pathname === '/api/production/dashboard' && method === 'GET') {
    try {
      const kpis = await service.getDashboardKPIs();
      return new Response(JSON.stringify(kpis), { headers: { 'Content-Type': 'application/json' } });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  // GET /api/production/orders
  if (pathname === '/api/production/orders' && method === 'GET') {
    try {
      const orders = await service.listOrders();
      return new Response(JSON.stringify(orders), { headers: { 'Content-Type': 'application/json' } });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  // PUT /api/production/orders/:id
  const putMatch = pathname.match(/^\/api\/production\/orders\/(\d+)$/);
  if (putMatch && method === 'PUT') {
    try {
      const body = await request.json<any>();
      const order = await service.editOrder(parseInt(putMatch[1], 10), body);
      return new Response(JSON.stringify(order), { headers: { 'Content-Type': 'application/json' } });
    } catch (e: any) {
      if (e.message === 'NOT_FOUND') return new Response(null, { status: 404 });
      if (e.message === 'ORDER_ALREADY_STARTED') return new Response(JSON.stringify({ error: e.message }), { status: 400 });
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  // POST /api/production/orders/:id/start
  const startMatch = pathname.match(/^\/api\/production\/orders\/(\d+)\/start$/);
  if (startMatch && method === 'POST') {
    try {
      const order = await service.startOrder(parseInt(startMatch[1], 10));
      return new Response(JSON.stringify(order), { headers: { 'Content-Type': 'application/json' } });
    } catch (e: any) {
      if (e.message === 'NOT_FOUND') return new Response(null, { status: 404 });
      return new Response(JSON.stringify({ error: e.message }), { status: 400 });
    }
  }
"""

if "/api/production/dashboard" not in routes_content:
    routes_content = routes_content.replace("// GET /api/production/orders/:id", new_routes + "\n  // GET /api/production/orders/:id")

with open('worker/routes/production.routes.ts', 'w') as f:
    f.write(routes_content)
