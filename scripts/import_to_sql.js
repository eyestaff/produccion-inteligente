const fs = require('fs');
const path = require('path');

// Uso: node scripts/import_to_sql.js <ruta_al_json> <company_id> <store_id>
// Ejemplo: node scripts/import_to_sql.js data.json 1 1

const args = process.argv.slice(2);
if (args.length < 3) {
  console.error("Uso: node import_to_sql.js <archivo.json> <company_id> <store_id>");
  process.exit(1);
}

const jsonPath = path.resolve(args[0]);
const companyId = parseInt(args[1], 10);
const storeId = parseInt(args[2], 10);

if (!fs.existsSync(jsonPath)) {
  console.error(`No se encontró el archivo: ${jsonPath}`);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
let sqlStatements = [];

// 1. Productos
if (data.products && Array.isArray(data.products)) {
  data.products.forEach(p => {
    // Asumimos que los productos en el JSON tienen al menos: id, name, code, business_line_id
    // Si traen ID, lo inyectamos directamente para respetar relaciones, sino se autoincrementa.
    const blId = p.business_line_id || 1; 
    sqlStatements.push(
      `INSERT INTO products (id, company_id, business_line_id, store_id, name, code) VALUES (${p.id}, ${companyId}, ${blId}, ${storeId}, '${p.name.replace(/'/g, "''")}', '${p.code}') ON CONFLICT(id) DO UPDATE SET name=excluded.name;`
    );
  });
}

// 2. Recetas
if (data.recipes && Array.isArray(data.recipes)) {
  data.recipes.forEach(r => {
    const yieldQty = r.yield_quantity || 1;
    sqlStatements.push(
      `INSERT INTO recipes (id, company_id, product_id, name, status, yield_quantity) VALUES (${r.id}, ${companyId}, ${r.product_id}, '${r.name.replace(/'/g, "''")}', 'active', ${yieldQty}) ON CONFLICT(id) DO UPDATE SET name=excluded.name;`
    );
    
    // Items de receta
    if (r.items && Array.isArray(r.items)) {
      r.items.forEach(item => {
        sqlStatements.push(
          `INSERT INTO recipe_items (company_id, recipe_id, product_id, quantity, unit) VALUES (${companyId}, ${r.id}, ${item.product_id}, ${item.quantity}, '${item.unit}');`
        );
      });
    }
  });
}

// 3. Inventario Inicial
if (data.inventory && Array.isArray(data.inventory)) {
  data.inventory.forEach(i => {
    const min = i.min_stock || 10;
    const max = i.max_stock || 100;
    sqlStatements.push(
      `INSERT INTO inventory (company_id, store_id, product_id, quantity, available_quantity, reserved_quantity, min_stock, max_stock) VALUES (${companyId}, ${storeId}, ${i.product_id}, ${i.quantity}, ${i.quantity}, 0, ${min}, ${max}) ON CONFLICT(company_id, store_id, product_id) DO UPDATE SET quantity=excluded.quantity, available_quantity=excluded.available_quantity;`
    );
    // Registrar la transacción de carga inicial
    sqlStatements.push(
      `INSERT INTO inventory_transactions (company_id, store_id, product_id, quantity_change, type, reason, created_by, source_module, created_at) VALUES (${companyId}, ${storeId}, ${i.product_id}, ${i.quantity}, 'in', 'adjustment', 1, 'Data_Import', '${new Date().toISOString()}');`
    );
  });
}

const outputPath = path.join(path.dirname(jsonPath), 'import_data.sql');
fs.writeFileSync(outputPath, sqlStatements.join('\n'));

console.log(`✅ Archivo SQL generado con éxito en: ${outputPath}`);
console.log(`Para importar a Cloudflare D1 en producción, ejecuta:`);
console.log(`npx wrangler d1 execute produccion_inteligente_db --env production --file=${outputPath}`);
