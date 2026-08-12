# DOMAIN DESIGN: MERMAS (WASTE)

## 1. Objetivo del dominio

El dominio de Mermas (Waste Logging) permite registrar y justificar el deterioro, pérdida o caducidad de productos y materias primas. Su propósito principal es sanear el inventario real (ajustándolo a la baja) sin afectar falsamente las estadísticas de ventas o consumos teóricos de producción, garantizando así una medición exacta de los costos ocultos del negocio.

## 2. Entidades

- **WasteRecord / InventoryTransaction:** En la versión MVP, las mermas no poseen una tabla propia de cabeceras de documentos complejos (como una orden). Se registran directamente de forma atómica en el Ledger global (`inventory_transactions`) bajo el tipo `out` y con `source_module = 'WasteManagement'`.

## 3. Motivos de Merma (Waste Reasons)

El dominio clasifica las mermas mediante un subconjunto cerrado de razones para su posterior analítica:

- `caducity`: Vencimiento de materia prima o producto.
- `overproduction`: Producto terminado no vendido que pierde su vida útil en exhibición.
- `error`: Error humano durante la manipulación o preparación.
- `breakage`: Rotura física (ej. botellas de cristal).
- `quality`: Producto rechazado por no cumplir el estándar.
- `theft`: Robo o desaparición inexplicable.
- `other`: Otras causas menores justificadas en las notas.

## 4. Reglas de negocio e Invariantes

- **Descuento Atómico Directo:** El registro de una merma deduce inmediatamente la cantidad indicada de `inventory.available_quantity` y `inventory.quantity`.
- **Inmutabilidad:** Como cualquier transacción de inventario (Ledger), un registro de merma no puede ser modificado ni borrado una vez insertado. Si hubo un error, debe realizarse una transacción de ajuste compensatorio (tipo `in` o `reversion`).
- **Trazabilidad:** Toda merma debe registrar obligatoriamente el usuario que la declara y la fecha y hora exacta. Las notas opcionales se guardan en el campo `reference_type` de la transacción.

## 5. Ciclo de vida

Dado que su arquitectura está orientada a eventos directos en el Ledger:

1. El operario o gerente identifica la merma físicamente.
2. Ingresa al Dashboard y selecciona el producto y el motivo.
3. El sistema impacta el inventario de forma síncrona.
4. El sistema agrega la cantidad mermada a los KPIs en tiempo real.

## 6. Respuestas a las 4 Preguntas Obligatorias del Proyecto

### 1. ¿Cómo escalará este dominio dentro de cinco años?

Al igual que Producción, las mermas impactan fuertemente la tabla de transacciones de inventario. Escalará manteniendo la estructura de `append-only` log en la base de datos D1. Sin embargo, en el futuro (V2+), empresas más grandes requerirán un proceso de "Aprobación de Mermas" (donde un empleado reporta la merma y un gerente la aprueba antes de descontar del stock). Esto obligará a crear una tabla `waste_requests` separada del Ledger.

### 2. ¿Qué información necesitará consumir la IA?

- Patrones de caducidad (`caducity` y `overproduction`) correlacionados con la estacionalidad y los días de la semana, para enseñar al algoritmo de `Forecast` a producir o comprar menos en escenarios propensos a mermas.
- Tendencia temporal: ¿Ciertas mermas por `error` humano ocurren más en ciertos turnos o días específicos?

### 3. ¿Qué KPIs producirá este dominio?

- **Costo de Merma (Waste Cost):** Valor económico de los productos mermados.
- **Top Mermas:** El producto con mayor índice de desecho en los últimos 30 días.
- **Distribución por Causa:** Porcentaje de merma atribuido a sobreproducción vs caducidad (mide eficiencia vs frescura).

### 4. ¿Qué eventos publicará este dominio al resto del sistema?

- `WasteRegistered`: Alerta inmediata a los demás módulos del sistema.
  - El motor de `Forecast` interceptará (o consultará) las mermas de las últimas 48h para sumar su reposición urgente a las sugerencias de producción/compra, de manera que la rotura accidental de una materia prima clave el viernes gatille su recompra inmediata.

## 7. Estrategia de Pruebas

La validez del dominio ya se encuentra garantizada mediante el archivo `api-waste.test.ts`.
Se valida especialmente:

- Que el inventario físico disponible se deduce acorde a la cantidad mermada.
- Que el Dashboard de analítica de mermas devuelve correctamente agregaciones diarias y semanales mediante consultas SUM() sobre el Ledger.
