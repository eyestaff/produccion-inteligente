# DOMAIN DESIGN: PREVISIÓN (FORECAST)

## 1. Objetivo del dominio

El dominio de Forecast tiene como objetivo predecir de forma inteligente las ventas y consumos futuros de los productos y materias primas basándose en su histórico de uso, ajustando los resultados según la tendencia de crecimiento (o decrecimiento) y descontando el inventario actual. Su meta principal es proporcionar recomendaciones precisas sobre qué cantidad **producir** o **comprar** para evitar quiebres de stock sin incurrir en mermas por sobreproducción.

## 2. Entidades

- **Forecast:** La cabecera de la previsión aprobada para una tienda y una fecha objetivo determinada. Representa una "foto" oficial del plan.
- **ForecastItem:** Los detalles de cada producto dentro del forecast. Guarda el histórico usado para el cálculo, la sugerencia generada por el algoritmo y la cantidad finalmente ajustada (y aprobada) por el usuario.

## 3. Relaciones

- 1 Store -> N Forecasts.
- 1 Forecast -> N ForecastItems (Detalles por producto).
- 1 ForecastItem -> 1 Product.

## 4. Reglas de negocio e Invariantes

- **Algoritmo de Sugerencia (Smart Group Protocol V1):**
  - **Base Histórica:** Consumo medio de los últimos 30 días.
  - **Tendencia:** Crecimiento porcentual comparando el consumo medio de los últimos 7 días con los últimos 30 días.
  - **Sugerencia Teórica:** `(Base Histórica * (1 + Tendencia)) + Margen de Seguridad (5%)`.
  - **Requerimiento Real:** `Sugerencia Teórica - Inventario Disponible - Pedidos Pendientes + Mermas Recientes a Compensar`.
- **Inmutabilidad Post-Aprobación:** Un Forecast aprobado no se recalcula, se ejecuta convirtiendo sus sugerencias mayores a 0 en `ProductionOrders` u `Órdenes de Compra`.
- **Protección contra Falsos Positivos:** Los consumos generados por "ajustes manuales" o "mermas" no cuentan para el histórico de _ventas_ normal, aunque las mermas recientes de 48h sí suman a la reposición de emergencia.

## 5. Ciclo de vida

- `draft`: (En memoria) El motor genera recomendaciones on-the-fly a partir del Snapshot actual del inventario y ledger.
- `approved`: El analista revisa las sugerencias, ajusta cantidades si lo desea, y confirma el forecast guardándolo en la base de datos.
- _(Acción Consecuente)_: Inmediatamente tras aprobarse, las cantidades que implican manufactura generan automáticamente `ProductionOrders` en estado `planned`.

## 6. Respuestas a las 4 Preguntas Obligatorias del Proyecto

### 1. ¿Cómo escalará este dominio dentro de cinco años?

El mayor cuello de botella radicará en el escaneo masivo del `inventory_transactions` (Ledger) para calcular la media móvil de 7 y 30 días on-the-fly para cientos de productos en cada consulta al Dashboard.
**Mitigación:** En versiones posteriores (V2+), se implementará un proceso Worker/Cron que agregará las transacciones diarias de inventario en una tabla de `daily_consumptions_rollup` durante la noche, permitiendo que el motor de Forecast lea valores consolidados mucho más rápidos.

### 2. ¿Qué información necesitará consumir la IA?

La IA se nutrirá de la tabla `forecast_items` cruzándola posteriormente con la columna `actual_consumption`. El campo `deviation_percentage` indicará cuán errada estuvo la fórmula de V1 frente al consumo real, permitiendo entrenar un modelo de Machine Learning que remplace la fórmula estática (Media Móvil) por redes neuronales predictivas considerando factores estacionales.

### 3. ¿Qué KPIs producirá este dominio?

- **Precisión del Forecast (Forecast Accuracy):** Diferencia porcentual entre `suggested_quantity` y `actual_consumption` de ese día.
- **Tasa de Aceptación (Adoption Rate):** Frecuencia con la que el usuario deja la cantidad sugerida intacta vs cuánto la modifica (`adjusted_quantity` vs `suggested_quantity`).
- **Nivel de Riesgo Operativo:** Cantidad de alertas de "Stockout" o "Overstock" identificadas diariamente.

### 4. ¿Qué eventos publicará este dominio al resto del sistema?

- `DemandForecastGenerated`: Se emite cuando se genera el Dashboard para sugerir operaciones.
- `ForecastApproved`: Se emite al guardarse, notificando a **Producción** (para generar órdenes) y a **Compras** (para requerimientos de abastecimiento de materia prima).

## 7. Estrategia de Pruebas

- Pruebas de integración sobre la API REST (`api-forecast.test.ts`).
- Validación estricta de que el cálculo del Motor (`forecast.engine.ts`) responde correctamente a escenarios de:
  - Sobre stock (no recomienda nada).
  - Quiebre de stock (recomienda producir lo necesario).
  - Conversión a Órdenes de Producción (verificar que al hacer POST a `/approve` se crean `production_orders` correctamente).
