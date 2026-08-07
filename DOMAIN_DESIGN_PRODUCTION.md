# DOMAIN DESIGN: PRODUCCIÓN (PRODUCTION)

## 1. Objetivo del dominio

El Motor de Producción es el corazón transformador del sistema. Su objetivo es convertir materias primas (insumos) en productos terminados o semielaborados, orquestando el consumo de inventario mediante la explosión de recetas y registrando la entrada de nuevo stock valorizado.

## 2. Entidades

- **ProductionOrder:** La cabecera de la orden. Define _dónde_ (Store), para _qué línea de negocio_ (Business Line) y _cuándo_ se fabrica.
- **ProductionOrderItem:** Los productos específicos y las cantidades exactas que se van a producir dentro de esa orden.
- **Recipes & RecipeItems (Externo):** Define la lista de materiales teóricos necesarios para producir 1 lote (yield_quantity) del producto.
- **Inventory & InventoryTransactions (Externo):** Donde se reservan y consumen los ingredientes, y donde ingresa el producto final.

## 3. Relaciones

- 1 Store -> N ProductionOrders.
- 1 BusinessLine -> N ProductionOrders.
- 1 ProductionOrder -> N ProductionOrderItems (Productos a fabricar).
- 1 ProductionOrderItem -> 1 Recipe (Dinámicamente resuelta).
- 1 ProductionOrder -> N InventoryTransactions (Múltiples consumos y entradas al cerrarse).

## 4. Reglas de negocio e Invariantes

- **Validación de Receta:** No se puede añadir un `ProductionOrderItem` si el producto no tiene una receta activa (Estado 'active').
- **Explosión Proporcional (ADR-007):** El consumo de ingredientes se calcula estrictamente como: `(target_quantity / recipe.yield_quantity) * recipe_item.quantity`.
- **Inmutabilidad Post-Cierre:** Una orden en estado `completed` o `cancelled` NO puede ser modificada.
- **Reservas (Backflushing):** Al pasar a `planned` o `in_progress` (opcionalmente) se podrían reservar los materiales. Sin embargo, para este diseño **Simple y Robusto**, la reserva y el consumo se ejecutarán atómicamente (backflushing) en el momento de `completed` para evitar locks de inventario complejos en el MVP, a menos que el negocio exija reservas anticipadas estrictas. _Decisión: Ejecutar consumos atómicamente al completar la orden._

## 5. Ciclo de vida

- `planned`: La orden está creada. Se define qué se va a producir. Aún no toca inventario.
- `in_progress`: (Opcional) La producción ha comenzado.
- `completed`: La producción finalizó. **Gatillo:** Se ejecuta el _backflushing_:
  1. Extraer (Ledger `OUT` tipo `production_consume`) las materias primas del Inventario.
  2. Ingresar (Ledger `IN` tipo `production_yield`) el producto terminado al Inventario.
- `cancelled`: La orden se anula sin efecto contable.

## 6. Respuestas a las 4 Preguntas Obligatorias del Proyecto

### 1. ¿Cómo escalará este dominio dentro de cinco años?

El volumen de `ProductionOrders` será manejable (1 orden diaria por línea de negocio por tienda = ~5000/día). Lo que explotará será la cantidad de `InventoryTransactions` generadas por el _backflushing_ de cada orden (cientos de ingredientes por orden).
**Mitigación:** La resolución del _backflushing_ se encapsulará en transacciones D1 (Batch) de forma atómica. En un futuro, el cálculo de explosión de materiales podrá derivarse a WebWorkers o colas (Cloudflare Queues) para no bloquear la petición HTTP del usuario mientras se insertan miles de movimientos de inventario.

### 2. ¿Qué información necesitará consumir la IA?

- Histórico de `ProductionOrderItems` para entender los patrones de producción por día de la semana y clima.
- Desviaciones (Mermas reportadas contra la producción teórica).

### 3. ¿Qué KPIs producirá este dominio?

- **Cumplimiento del Plan (Plan vs Actual):** Cantidad planificada vs Cantidad realmente producida y reportada.
- **Eficiencia de Materiales (Yield Variance):** Materia prima teórica vs consumida (si se añaden consumos manuales extra).
- **Tiempo de Ciclo:** Tiempo entre `started_at` y `completed_at`.

### 4. ¿Qué eventos publicará este dominio al resto del sistema?

- `ProductionOrderPlanned`: Permitirá a Compras saber que habrá un consumo inminente.
- `ProductionOrderCompleted`: Disparará notificaciones de stock listo para venta/despacho.
- `ProductionOrderCancelled`.

## 7. Política de Ejecución de Producción

### 1. Validaciones pre-ejecución

Antes de ejecutar el _backflushing_ de una Orden de Producción, el motor verificará estrictamente:

- Que el producto a fabricar **exista y esté activo**.
- Que exista una **receta** para dicho producto y su estado sea **activo**.
- Que la **unidad de medida** de los ingredientes cuadre con la unidad base indivisible del inventario.
- Que haya **disponibilidad teórica** de ingredientes en el almacén especificado.

### 2. Comportamiento ante escasez de inventario

**Análisis de alternativas:**

- _Impedir completamente la producción:_ Frenaría la planta física si un gerente olvida registrar un remito de compra a tiempo.
- _Permitir continuar solo a usuarios autorizados:_ Genera un cuello de botella logístico en madrugadas/fines de semana.
- _Permitir continuar registrando incidencia (Stock Negativo):_ Permite que la realidad física fluya.

**Comportamiento Oficial (V1):** Se **permitirá el stock negativo**. El sistema ejecutará el _backflushing_ llevando el inventario a negativo, asumiendo que la materia prima existe físicamente pero no se documentó su entrada. Esta acción generará una alerta administrativa de inconsistencia logística, pero no bloqueará a los operarios.

### 3. Atomicidad

La operación de cierre de orden es **100% indivisible**. Se encapsulará en una transacción Batch (o mecanismo equivalente transaccional de D1). Si ocurre un fallo, no habrá estados intermedios.
El bloque atómico asegurará simultáneamente:

1. El consumo de todos los ingredientes (Snapshot -X).
2. La entrada del producto terminado (Snapshot +Y).
3. La escritura en el Ledger (`inventory_transactions`) para ambas cosas.
4. El cambio de estado de la Orden a `completed`.

### 4. Idempotencia

Para evitar que una Orden de Producción aplique el _backflushing_ dos veces por reintentos de red o clics repetidos, el servicio verificará al inicio de la transacción el estado de la Orden. Si `status === 'completed'` o `status === 'cancelled'`, la petición rebotará con un error `ORDER_ALREADY_CLOSED` sin realizar mutaciones.

### 5. Recuperación ante errores

Al utilizar transacciones atómicas de base de datos, cualquier error de validación, timeout o interrupción durante la escritura abortará la operación entera. El sistema retornará un error 500/400 limpio y la orden permanecerá en su estado original (`planned` o `in_progress`), permitiendo reintentar la ejecución una vez solventado el fallo (ej: conectividad o corrección de receta).

### 6. Auditoría

Cada movimiento de inventario derivado de la producción inyectará:

- `type`: 'out' (para insumos) o 'in' (para productos terminados).
- `reason`: 'production'.
- `source_module`: 'ProductionEngine'.
- `reference_type`: 'ProductionOrder'.
- `reference_id`: El ID de la Orden de Producción.
- `created_by`: El usuario exacto que pulsó "Completar", extraído del `RequestContext`.

### 7. KPIs generados

- **Volume Produced:** Volumen físico producido por línea de negocio.
- **Material Efficiency (Teórica):** (Esto escalará cuando se habilite reporte manual de mermas vs consumo teórico).
- **Stockout by Production:** Frecuencia con la que la producción empuja ingredientes a stock negativo.

### 8. Impacto en la IA

El Módulo Predictivo y Forecast utilizará estos datos cerrados para:

- Aprender el `Lead Time` interno (cuánto se tarda en fabricar desde que se planifica).
- Correlacionar el volumen producido real frente al clima o día de la semana.
- Ajustar automáticamente las sugerencias futuras de `target_quantity` basándose en la velocidad de despacho de órdenes completadas.
