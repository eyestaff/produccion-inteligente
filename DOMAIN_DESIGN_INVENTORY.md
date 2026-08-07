# DOMAIN DESIGN: INVENTARIO (INVENTORY)

## 1. Objetivo del dominio

Garantizar la visibilidad, exactitud y trazabilidad absoluta de los niveles de stock físico de materias primas y productos terminados en cada tienda. Su objetivo primordial es evitar quiebres de stock, facilitar el cálculo de reabastecimiento (Forecast/Compras), permitir el descuento por producción (Backflushing) y asegurar auditorías confiables.

**ADR-008: Inventario como Ledger.** El inventario será tratado financieramente como un Ledger. La tabla `inventory_transactions` será la única fuente oficial de verdad. La tabla `inventory` actuará únicamente como una proyección optimizada (snapshot) para acelerar consultas.

## 2. Entidades

- **Inventory (Inventario Actual):** Proyección rápida (snapshot) del nivel de stock por producto en una ubicación.
- **InventoryTransactions (Movimientos):** Entidad inmutable (Ledger) que registra todo flujo de entrada, salida o ajuste.
- **InventoryLots (Lotes):** Registra partidas específicas (fecha de caducidad, coste).
- **Products & Stores (Externo):** Artículos físicos y ubicaciones lógicas.

## 3. Relaciones y Evolución (ADR-010)

- **ADR-010:** El modelo está diseñado para soportar múltiples almacenes. Aunque inicialmente haya un almacén por tienda (`store_id`), la arquitectura contemplará el concepto de `location_id` abstracto, permitiendo en un futuro almacenes centrales, virtuales o frigoríficos sin refactorizaciones masivas.
- 1 Ubicación -> N Registros de Inventario.
- 1 Registro de Inventario -> N Transacciones (Obligatorio para cualquier mutación).

## 4. Unidades de Medida, Coste y Lotes (FEFO)

- **Base Unit:** Todos los movimientos operan en la unidad indivisible (g, ml, u) usando Integers para anular errores flotantes.
- **Lotes y Consumo:** Adopta la estrategia **FEFO** (First Expired, First Out) por seguridad alimentaria.
- **Coste:** Se utiliza Coste Lote FIFO (Landed Cost) para asegurar márgenes brutos reales que reflejen la inflación actual.

## 5. Mermas y Reservas

- **Mermas:** Tipificadas obligatoriamente (`production`, `caducity`, `breakage`, `adjustment`, `theft`, `return`).
- **Reservas:** `reserved_quantity` incrementa al lanzar una Orden de Producción. Disminuye (ejecutando backflushing) al completarla, o desaparece revirtiéndose si se cancela. Nunca puede ser negativo.

## 6. Stock Negativo y Reversión

- **Stock Negativo:** Se permite temporalmente para no frenar la operativa (ej. producir antes de registrar el remito del camión de harina), pero levanta alertas.
- **Reversión:** Las transacciones NUNCA se borran. Para revertir un error (ej. merma equivocada), se inyecta una transacción compensatoria (misma cantidad, signo opuesto, tipo `reversion`).

## 7. Trazabilidad Completa (ADR-009)

Toda transacción responderá ineludiblemente a:

- ¿Quién? (`created_by`)
- ¿Cuándo? (`created_at`)
- ¿Desde qué módulo? (`source_module`)
- ¿Por qué motivo? (`reason`)
- ¿Sobre qué documento? (`reference_type`, `reference_id`)
- ¿Sobre qué producto, lote y empresa/tienda? (`product_id`, `lot_id`, `location_id`, `company_id`)

## 8. Respuestas a las 4 Preguntas Obligatorias del Proyecto

### 1. ¿Cómo escalará este dominio dentro de cinco años?

Ante escenarios de 300 tiendas, múltiples centros logísticos y millones de movimientos:

- **Evolución Física:** Se activará el diseño de múltiples `locations` (Almacén Seco vs Frío) bajo un mismo Tenant.
- **Volumetría de Datos:** `inventory_transactions` sufrirá particionamiento en base de datos por `company_id` y fecha mensual (Time-series partitioning). Se consolidarán saldos de apertura mensuales para evitar que el Ledger recalcule 5 años de historia.
- **Race Conditions:** Aseguradas mediante SQL atómico relativo (ej. `quantity = quantity + X`) en D1, permitiendo alta concurrencia de TPVs descontando stock simultáneamente.

### 2. ¿Qué información necesitará consumir la IA?

La Inteligencia Artificial (Módulo de Producción Inteligente y Forecast) consumirá la tabla `inventory_transactions` y el historial de `mermas` tipificadas (especialmente `caducity`). Con estos datos, la IA:

- Aprenderá patrones de sobre-stockeo.
- Detectará tendencias de roturas recurrentes (`stockouts`).
- Sugerirá transferencias predictivas entre tiendas para evitar caducidad de lotes.

### 3. ¿Qué KPIs producirá este dominio?

- **Rotación de Inventario** (Inventory Turnover).
- **Cobertura de Stock** (Days of Supply).
- **Porcentaje de Merma vs Producción** (Shrinkage Rate).
- **Precisión del Inventario Teórico vs Físico** (Cyclic Count Accuracy).
- **Tasa de Stockouts** (Roturas que causaron ventas perdidas).

### 4. ¿Qué eventos publicará este dominio al resto del sistema?

_(Arquitectura Event-Driven pasiva documentada)_

- `InventoryAdjusted`
- `InventoryReserved` / `InventoryReservationReleased`
- `InventoryConsumed`
- `InventoryReceived` (Gatillará validaciones de Compras)
- `InventoryExpired` / `LowStockDetected` (Gatillará alertas de Reabastecimiento)

## 9. Alternativas consideradas

- _Calcular inventario al vuelo:_ Descartado por ineficiencia de cómputo en vistas agregadas de almacén. Adoptado patrón CQRS/Snapshot (Ledger transaccional + Proyección rápida).

## 10. Decisiones pendientes

- **Creación de `InventoryLots` en Fase MVP:** ¿Debemos poblar las columnas del Lote en `inventory_transactions` de inmediato o dejamos la UI FEFO para cuando se despliegue el módulo estricto de Compras (Sprint X)?
