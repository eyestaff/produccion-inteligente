# ARCHITECTURE REVIEW v1

**Proyecto: Producción Inteligente**
**Fecha de Revisión:** Agosto 2026 (Post-Sprint 7)

---

## 12. Executive Summary

El proyecto "Producción Inteligente" se encuentra en un estado de **madurez intermedia-alta** en cuanto a fundamentos arquitectónicos. Tras siete Sprints, el núcleo transaccional y de autenticación se ha consolidado exitosamente eliminando deuda técnica crítica (el modo _legacy_ `RequestContext | number`). La adopción de patrones formales (Ledger Inmutable, Multi-tenant por diseño, RequestContext estricto, Capas de Servicio y Repositorio puras) garantiza que el sistema no sufrirá colapsos estructurales al escalar.

El **riesgo principal** actual radica en el rendimiento futuro de SQLite (D1) ante una ingesta masiva de `inventory_transactions` y la ausencia de una estrategia implementada de particionado de datos históricos. Asimismo, el dominio de "Compras" no ha sido modelado aún, lo cual impide cerrar el círculo logístico FEFO/FIFO real a pesar de estar soportado arquitectónicamente.

**Próximos pasos recomendados:**
Aprobar y ejecutar el motor de "Órdenes de Producción" (Sprint 8), ya que representa el puente funcional que valida las Reservas y Consumos en Inventario e impacta directamente el Gross Margin de Recetas.

---

## 1. Estado general de la arquitectura

- **Fortalezas:**
  - **Aislamiento Multi-tenant:** Implementado con rigor militar; es casi imposible filtrar datos de otras empresas por error humano en la capa de servicios.
  - **Single Source of Truth:** La Constitución de Ingeniería impone el uso de un patrón _Snapshot-Ledger_, garantizando que ningún balance es una caja negra.
  - **Developer Experience (DX):** El flujo Router -> Service -> Repository es predecible, repetible y altamente _testable_.
- **Debilidades:**
  - **Acoplamiento de base de datos:** El framework Cloudflare D1 ata la aplicación fuertemente a SQLite. Aunque es excelente para lectura global, las escrituras masivas en un único archivo de base de datos pueden convertirse en un cuello de botella logístico.
- **Riesgos:**
  - **Crecimiento desmedido de tablas Ledger:** `inventory_transactions` crecerá a un ritmo de cientos de miles de registros al mes para un cliente mediano, ralentizando consultas de auditoría sin estrategias de archiving.

---

## 2. Revisión por dominio

| Dominio                    | Madurez    | Deuda Técnica                         | Riesgos                                                                             | Preparación Producción |
| :------------------------- | :--------- | :------------------------------------ | :---------------------------------------------------------------------------------- | :--------------------- |
| **Empresas**               | Alta       | Baja                                  | Múltiples tenants sobrepasando límites de DB size D1                                | Sí                     |
| **Usuarios/Autenticación** | Alta       | Nula (Opaco migrado a RequestContext) | Fugas de sesión por no rotar tokens inactivos                                       | Sí                     |
| **Catálogo**               | Alta       | Baja                                  | Manejo estricto de jerarquías grandes                                               | Sí                     |
| **Recetas**                | Media-Alta | Baja (Rendimiento Lote implementado)  | Sub-recetas recursivas (escandallos anidados) no modeladas explícitamente           | Sí (MVP)               |
| **Inventario**             | Alta       | Nula                                  | Race conditions bajo altísima concurrencia (mitigado con operaciones SQL relativas) | Sí                     |

---

## 3. Revisión de la arquitectura

- **Routes / Services / Repositories:** Estricta y sana separación de preocupaciones (SoC).
- **Middleware & RequestContext:** Sólido. Se ha eliminado por completo el paso de identificadores opacos (legacy). La inyección de dependencias `(db, ctx)` en constructores de `Services` funciona como contrato blindado.
- **Multi-tenant:** Implementado. (Inconsistencia menor a auditar en un futuro: revisar si algún `UNIQUE INDEX` olvidó incluir `company_id`).
- **Ledger:** Recientemente adoptado para Inventario. Funciona correctamente.
- **Domain Events:** Identificados conceptualmente, pero **no implementados arquitectónicamente**. (Falta un Event Bus transaccional o sistema de colas).

---

## 4. Escalabilidad

Comportamiento esperado con:

- **500 empresas / 5.000 tiendas / 1 millón de productos:**
  - **Lecturas:** Excelentes. Cloudflare Edge Computing distribuirá las peticiones GET cerca de los usuarios, apoyado por D1.
  - **Escrituras:** Aceptables. SQLite/D1 puede manejar miles de transacciones concurrentes por segundo, pero `5.000` tiendas sincronizando inventarios masivos cíclicos a fin de mes podría generar un cuello de botella de I/O de escritura.
- **100 millones de movimientos de inventario:**
  - **Cuello de botella (Alerta Roja):** SQLite (D1) tiene un límite de 10GB por base de datos (y límites en filas escaneadas por query). 100M de movimientos exigirá fragmentación obligatoria de bases de datos por Empresa (Database per Tenant).

---

## 5. Seguridad

- **Autenticación/Autorización:** JWT Opaco + Contexto validado; seguro frente a ataques de suplantación en el cliente. (Se puede mejorar validando caducidad de tokens si la rotación se requiere).
- **Aislamiento multiempresa:** Estricto en el código (vía `RequestContext`).
- **Auditoría & Trazabilidad:** Nivel _Enterprise_. `created_by`, `reason` y referencialidad cruzada blindada por `ADR-009`.

---

## 6. Rendimiento

- **D1 (Base de Datos):** Extraordinario para latencias de lectura globales. Puede penalizar escrituras batch extremadamente largas (debido a limitaciones de 1MB por query de inserción en Cloudflare D1).
- **R2:** (Asumiendo que se manejan Assets); perfectamente asíncrono y desacoplado.
- **Consultas & Índices:** Se aplican `UNIQUE INDEX` de forma correcta. Se recomienda incluir índices sobre fechas (`created_at`) en transacciones para no penalizar Dashboards.
- **Concurrencia:** Asegurada por `UPDATE quantity = quantity - X`.

---

## 7. Calidad del código

- **Cohesión:** Alta. Un Servicio maneja estrictamente un único caso de negocio.
- **Acoplamiento:** Bajo, excepto la inyección explícita del driver de base de datos D1 (acoplamiento tecnológico al proveedor).
- **Complejidad y Mantenibilidad:** Excelente debido al principio de Boy Scout Rule aplicado y eliminación del modo Legacy. El código es trivial de testear.

---

## 8. Calidad del dominio

- **Inventory, Recipes y Catalog:** Diseños extremadamente robustos (_DOMAIN_DESIGN_INVENTORY.md_).
- **Dominios pendientes de Rediseño (Atención):**
  - _Production Orders (Órdenes de Producción)._ Todavía no tiene un _Domain Design_. Es imperativo modelar el ciclo de vida de la orden (Borrador -> Planificada -> En Curso -> Finalizada -> Merma).

---

## 9. Product Backlog (Priorización Estratégica)

**Orden Óptimo Recomendado:**

1. **US-302 (Production Orders):** Justificación: El núcleo del negocio no es solo almacenar inventario, sino transformarlo. Dará sentido a las Recetas y validará el consumo de Inventario.
2. **US-303 (Waste Logging / Mermas Complejas):** Justificación: Se debe implementar la recolección de desperdicio antes del cierre de costes.
3. **Módulo de Compras (Purchasing):** Justificación: Cierra el círculo. Permite que el inventario no se asuma por generación espontánea, introduciendo FEFO real y proveedores.
4. **US-301 (Forecast / Predictivo):** Justificación: No se puede predecir lo que no se ha operado. Requiere data histórica de producción, mermas y compras para que el modelo IA tenga validez.

---

## 10. Roadmap (Hasta v1.0)

- **Sprint 8: Motor de Producción.** (Producción de Órdenes, Explosión de Materiales, Reservas reales en Ledger).
- **Sprint 9: Módulo de Compras y Costes.** (Recepción de Mercancías, Costes FEFO, Trazabilidad de Proveedores).
- **Sprint 10: Event Bus y Analítica (Dashboards).** (Implementación real de Domain Events vía Cloudflare Queues/WebSockets para Dashboards en tiempo real).
- **Sprint 11: Módulo Predictivo y Forecast.** (Generación de planes de demanda y sugerencias de compra).
- **Sprint 12: Readiness v1.0.** (Optimización, QA Testing masivo, Documentación de APIs y Hardening de D1 - Database per Tenant prep).

---

## 11. Recomendaciones

1. **Evitar Sobringeniería en Lotes (Batches) Inicialmente:** No programar algoritmos complejos de routing FEFO automático hasta no estabilizar el registro manual de recepciones.
2. **Arquitectura Multi-D1 (Multi-tenant Database):** Aunque el código es Multi-tenant, si el objetivo son 100M de filas de Ledger, se debe considerar configurar Cloudflare para spawnear 1 Base de Datos (D1) por Empresa (o Clúster de Empresas) en lugar de 1 gigantesca particionada por `company_id`. No requiere apenas cambios en código, solo en el `Env` del router.
3. **No implementar un Bus Kafka/RabbitMQ:** Para los "Domain Events", usar `Cloudflare Queues` u observar directamente la DB, para mantener el stack ultra-simple (Simplicity Principle).
