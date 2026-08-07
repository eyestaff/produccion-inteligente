# Product Backlog - Producción Inteligente

Este documento representa el backlog funcional completo del producto, alineado con `AI_CONTEXT.md` y `PROJECT_ROADMAP.md`.

## Épicas

- **EP-1:** Core de Catálogo (Stores, Business Lines, Products) - _Completado_
- **EP-2:** Core de Recetas e Inventario (Recipes, Inventory)
- **EP-3:** Motor de Producción (Forecast, Production Orders, Waste)
- **EP-4:** Dashboards y Analítica Frontend
- **EP-5:** Inteligencia Artificial (Predicción y Optimización)

## Features y User Stories

### EP-2: Core de Recetas e Inventario

| ID     | Feature       | User Story                                                                  | Prioridad | Dependencias | Estado           | Sprint   |
| ------ | ------------- | --------------------------------------------------------------------------- | --------- | ------------ | ---------------- | -------- |
| US-201 | Recipes API   | Como gerente, quiero gestionar las recetas de mis productos (ingredientes). | Alta      | EP-1         | En Planificación | Sprint 6 |
| US-202 | Inventory API | Como encargado, quiero registrar el inventario disponible de cada producto. | Alta      | US-201       | Pendiente        | Sprint 7 |

### EP-3: Motor de Producción

| ID     | Feature           | User Story                                                    | Prioridad | Dependencias | Estado    | Sprint   |
| ------ | ----------------- | ------------------------------------------------------------- | --------- | ------------ | --------- | -------- |
| US-301 | Forecast API      | Como analista, quiero prever las ventas basadas en histórico. | Media     | EP-2         | Pendiente | Sprint 8 |
| US-302 | Production Orders | Como panadero, quiero generar órdenes de producción diarias.  | Alta      | US-301       | Pendiente | Sprint 9 |
| US-303 | Waste Logging     | Como empleado, quiero registrar mermas para ajustar cálculos. | Alta      | EP-1         | Pendiente | Sprint 9 |

### EP-4: Dashboards y Analítica Frontend

| ID     | Feature        | User Story                                                                | Prioridad | Dependencias | Estado    | Sprint    |
| ------ | -------------- | ------------------------------------------------------------------------- | --------- | ------------ | --------- | --------- |
| US-401 | UI de Catálogo | Como usuario, quiero una interfaz web moderna para gestionar el catálogo. | Alta      | EP-1         | Pendiente | Sprint 10 |
| US-402 | UI de Recetas  | Como usuario, quiero ver la composición de mis productos.                 | Alta      | EP-2         | Pendiente | Sprint 10 |

### EP-5: Inteligencia Artificial

| ID     | Feature       | User Story                                                        | Prioridad | Dependencias | Estado    | Sprint    |
| ------ | ------------- | ----------------------------------------------------------------- | --------- | ------------ | --------- | --------- |
| US-501 | Predicción IA | Como sistema, quiero ajustar el forecast dinámicamente usando IA. | Baja      | EP-3         | Pendiente | Sprint 12 |
