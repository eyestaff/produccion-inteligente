# Architecture Decision Records (ADRs)

Este documento recoge todas las decisiones arquitectónicas permanentes del proyecto Producción Inteligente.

## ADR-001 Plataforma Cloudflare

**Contexto**: El proyecto requiere alta disponibilidad, latencia mínima global y costes escalables para una plataforma SaaS.
**Decisión**: Utilizar el ecosistema de Cloudflare (Workers, D1, R2).
**Justificación**: Permite alojar backend, base de datos y archivos estáticos en el edge, reduciendo infraestructura a gestionar (serverless).
**Consecuencias**: Acoplamiento al runtime de Cloudflare (V8 isolates), lo que limita ciertas librerías nativas de Node.js (ej. `bcrypt`).
**Alternativas consideradas**: AWS (EC2/RDS), Vercel + Supabase, Node.js tradicional.

## ADR-002 Arquitectura Routes → Services → Repositories

**Contexto**: Necesidad de mantener una estructura limpia, escalable y mantenible para el backend.
**Decisión**: Separación estricta de responsabilidades en tres capas: Rutas (HTTP), Servicios (Negocio) y Repositorios (Acceso a datos).
**Justificación**: Facilita el testing, previene el código espagueti y asegura que la interfaz web (React) y la API evolucionen independientemente.
**Consecuencias**: Mayor número de archivos y verbosidad inicial.
**Alternativas consideradas**: Controladores monolíticos, Active Record puro (lógica en el modelo).

## ADR-003 Tokens Opacos frente a JWT

**Contexto**: Necesidad de implementar un sistema de autenticación seguro compatible con Cloudflare Workers.
**Decisión**: Utilizar tokens opacos almacenados en D1 combinados con Hashing PBKDF2 (WebCrypto) para las contraseñas, en lugar de JWT stateless.
**Justificación**: Cloudflare Workers soporta WebCrypto nativo. Los tokens opacos en base de datos permiten la revocación inmediata de sesiones (logout forzado), algo complejo en JWT sin listas de revocación.
**Consecuencias**: Cada petición autenticada requiere una lectura adicional en D1 (tabla `sessions`).
**Alternativas consideradas**: JWT (descartado por dificultad de revocación y tamaño de payload), `bcrypt` (descartado por ser WASM/incompatible nativamente con Workers).

## ADR-004 Política Multi-tenant

**Contexto**: Evolución del producto hacia un SaaS para múltiples empresas (panaderías) independientes.
**Decisión**: Aislar lógicamente todos los datos a través de un `company_id` obligatorio en cada tabla de negocio.
**Justificación**: Garantiza la seguridad y evita el "data leakage" cruzado. Permite compartir la misma infraestructura D1 para abaratar costes en las fases iniciales.
**Consecuencias**: Todo repositorio, ruta y test debe ser consciente del contexto de empresa.
**Alternativas consideradas**: Una base de datos D1 por empresa (costoso y difícil de orquestar inicialmente), Schemas por tenant (D1/SQLite no lo soporta de forma nativa como PostgreSQL).

## ADR-005 RequestContext como contrato de ejecución

**Contexto**: Evitar la propagación manual y desordenada de variables de autenticación (`userId`, `companyId`, `role`) a lo largo del flujo del programa.
**Decisión**: Agrupar los datos vitales de ejecución en un único objeto estructurado (`RequestContext`). Toda ruta autenticada extraerá este contexto y lo inyectará hacia abajo.
**Justificación**: Centraliza la validación, mejora la seguridad (el cliente no puede falsear su `companyId`), y facilita extensiones futuras (locale, tracing, permisos granulares).
**Consecuencias**: Las interfaces de servicios y repositorios deben depender de este objeto en lugar de argumentos sueltos.
**Alternativas consideradas**: Inyección global (Global State/Thread Local Storage - no recomendado en Workers), propagar campos sueltos.

## ADR-006 Estrategia de migración progresiva (Boy Scout Rule)

**Contexto**: Adaptar el código base antiguo a nuevas decisiones arquitectónicas (como `RequestContext` o `Multi-tenant`) sin paralizar el desarrollo de producto.
**Decisión**: Migración bajo demanda. No se realizarán grandes refactores ("Big Bang"), sino que cada vez que un desarrollador edite un archivo, lo adaptará al estándar actual ("Boy Scout Rule").
**Justificación**: Asegura un avance constante en funcionalidades de negocio mientras se reduce la deuda técnica incrementalmente.
**Consecuencias**: Durante un periodo de transición coexistirán patrones antiguos y nuevos.
**Alternativas consideradas**: Parar el desarrollo durante un sprint completo para refactorizar toda la aplicación.

## ADR-007 Inclusión de Rendimiento por Lote en Recetas (Yield Quantity)

**Contexto**: El diseño inicial de la tabla `recipes` asume implícitamente que la receta produce 1 unidad. En entornos industriales y panaderos, los escandallos se definen habitualmente por amasada o lote (ej. 1 receta de masa = 10 kg).
**Decisión**: Modificar el esquema de base de datos para incluir obligatoriamente el campo `yield_quantity` en la entidad `recipes`.
**Justificación**: Permite cálculos exactos de explosión de materiales sin forzar al usuario a calcular fracciones artificiales (ej. poner "0.012 kg de sal" para 1 pan, frente a "1.2 kg de sal" para una masa de 100 panes).
**Consecuencias**: Los cálculos de deducción de inventario (`waste` / `orders`) deberán incluir siempre la fórmula `(target_quantity / yield_quantity) * item_quantity`.
**Alternativas consideradas**: Forzar recetas unitarias (descartado por mala experiencia de usuario y pérdida de precisión en decimales).

## ADR-008 Inventario como Ledger

**Contexto**: El inventario requiere precisión absoluta y trazabilidad financiera/operativa.
**Decisión**: El inventario será tratado como un Ledger. La tabla `inventory_transactions` será la única fuente oficial de verdad. La tabla `inventory` será únicamente una proyección optimizada (snapshot) para acelerar las consultas.
**Justificación**: Garantiza la inmutabilidad y auditoría. Evita el fenómeno "caja negra" donde un stock cambia sin explicación.
**Consecuencias**: NUNCA existirá una operación que modifique `inventory` sin generar simultáneamente un movimiento en `inventory_transactions`.

## ADR-009 Trazabilidad Completa en Transacciones

**Contexto**: Las auditorías de inventario necesitan respuestas precisas sobre cada discrepancia.
**Decisión**: Toda transacción de inventario deberá responder siempre a: quién, cuándo, desde qué módulo, por qué motivo, sobre qué documento, sobre qué producto, sobre qué lote, sobre qué tienda y sobre qué empresa.
**Justificación**: Elimina la opacidad y permite a la gerencia auditar robos, mermas o errores sistemáticos.
**Consecuencias**: Las entidades transaccionales requerirán campos obligatorios de metadatos (created_by, reason, source_module, etc.). Ninguna operación podrá perder esta trazabilidad.

## ADR-010 Diseño preparado para múltiples almacenes (Locations)

**Contexto**: Actualmente cada tienda actúa como un almacén único, pero la empresa puede escalar a tener almacenes secos, cámaras de frío o almacenes centrales diferenciados por tienda.
**Decisión**: El diseño del dominio (incluyendo IDs y relaciones) deberá soportar en el futuro varios almacenes por tienda, almacenes de producción y almacenes virtuales, aunque inicialmente se cree una relación 1:1 Tienda-Almacén.
**Justificación**: Evita refactorizaciones catastróficas de bases de datos cuando el negocio expanda su estructura física.
**Consecuencias**: La arquitectura debe permitir abstraer el `storeId` hacia un `locationId` en las tablas de inventario en futuras iteraciones.
