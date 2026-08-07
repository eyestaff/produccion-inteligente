import type { Env } from '../index';
import { runStatement } from '../db/repositories';

export async function handleHealthRoute(
  pathname: string,
  request: Request,
  env: Env,
): Promise<Response | null> {
  if (pathname === '/api/health') {
    return new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (pathname === '/api/health/seed' && request.method === 'POST') {
    try {
      const db = env.DB;

      // Companies
      await runStatement(
        db,
        "CREATE TABLE IF NOT EXISTS companies (id INTEGER PRIMARY KEY, name TEXT, slug TEXT UNIQUE, status TEXT DEFAULT 'active')",
      );
      await runStatement(
        db,
        "INSERT OR IGNORE INTO companies (id, name, slug) VALUES (1, 'Panaderías Gran Vía', 'gran-via')",
      );

      // We assume other tables exist. We will just insert basic data.
      await runStatement(
        db,
        "INSERT OR IGNORE INTO products (id, name, type) VALUES (1, 'Harina de Trigo (Kg)', 'raw_material')",
      );
      await runStatement(
        db,
        "INSERT OR IGNORE INTO products (id, name, type) VALUES (2, 'Mantequilla (Kg)', 'raw_material')",
      );
      await runStatement(
        db,
        "INSERT OR IGNORE INTO products (id, name, type) VALUES (3, 'Croissant de Mantequilla', 'finished_good')",
      );
      await runStatement(
        db,
        "INSERT OR IGNORE INTO products (id, name, type) VALUES (4, 'Baguette Clásica', 'finished_good')",
      );

      await runStatement(
        db,
        "INSERT OR IGNORE INTO stores (id, name) VALUES (1, 'Obrador Central')",
      );
      await runStatement(
        db,
        "INSERT OR IGNORE INTO business_lines (id, name) VALUES (1, 'Panadería')",
      );
      await runStatement(
        db,
        "INSERT OR IGNORE INTO business_lines (id, name) VALUES (2, 'Bollería')",
      );

      return new Response(JSON.stringify({ status: 'Seeded successfully' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  return null;
}
