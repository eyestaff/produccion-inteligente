<div align="center">
  <img src="./logo-horizontal.png" alt="Producción Inteligente" width="500">
</div>

# Producción Inteligente - Manual de Usuario y Sistema
**Versión:** 1.0
**Fecha:** Agosto 2026

---

## 1. Definiciones y Conceptos Clave

- **Multi-tenant (SaaS):** Arquitectura de software donde una única instancia de la aplicación sirve a múltiples clientes (empresas). Cada empresa tiene sus datos completamente aislados de forma segura mediante su `company_id`.
- **Forecast (Previsión de Demanda):** Estimación de la cantidad de productos que se venderán o consumirán en el futuro, basada en datos históricos recientes (últimos 30 días) y potenciada por algoritmos predictivos e Inteligencia Artificial (Llama-3).
- **S&OP (Sales and Operations Planning):** Proceso integrado de gestión empresarial que alinea la demanda comercial con la capacidad operativa y de inventario.
- **Backflushing Atómico:** Técnica contable y logística que descuenta automáticamente el inventario de materias primas *sólo cuando* se reporta la producción del artículo terminado. Atómico significa que la deducción ocurre "todo o nada" para evitar bases de datos corruptas.
- **Yield Quantity (Rendimiento por Lote):** La cantidad de unidades o peso que produce una receta estándar. Ejemplo: Una receta de Masa puede producir 10 kg con ciertas proporciones.
- **Smart Protocol v1:** Protocolo propietario integrado en la Inteligencia Artificial del sistema que evalúa riesgos lógicos (mermas muy altas, inventario nulo) para hacer ajustes de producción diarios.

---

## 2. Objetivos del Sistema

1. **Centralización:** Agrupar en una única plataforma la gestión de catálogos, recetas y producción para múltiples líneas de negocio y sucursales.
2. **Eficiencia Operativa:** Reducir drásticamente el tiempo de planificación diaria, pasando de hojas de Excel a previsiones dinámicas automatizadas.
3. **Control de Pérdidas:** Mejorar el seguimiento y trazabilidad del inventario y las mermas (waste) con una arquitectura basada en Ledger.
4. **Inteligencia:** Incorporar modelos de IA de Cloudflare Workers AI para refinar y explicar las previsiones deterministas y mitigar el error humano.

---

## 3. Alcance (V1.0)

La Versión 1.0 (MVP Multiempresa) abarca los siguientes módulos:
- **Gestión de Organización:** Creación de Tiendas (Stores) y Líneas de Negocio (Business Lines).
- **Ingeniería de Menú:** Catálogo de Productos y Recetas (Escandallos por lote).
- **Control de Inventario:** Gestión de existencias, topes mínimos/máximos y un registro transaccional de todos los movimientos.
- **Motor de Producción:** Previsiones (Forecast) apoyadas por IA, generación de Órdenes de Producción automatizadas y registro de Mermas (Waste).
- **Arquitectura Cloud-Edge:** Desplegado en Cloudflare (Workers, D1, R2) para máxima velocidad y alta disponibilidad global.

---

## 4. Manual de Uso Detallado

### 4.1. Catálogo e Ingeniería de Menú (EP-1 y EP-2)
Esta es la base de todo el sistema. Si el catálogo es incorrecto, los cálculos fallarán.
- **Creación de Productos:** Define si es una Materia Prima (ej. Harina) o un Producto Final (ej. Pan).
- **Gestión de Recetas (Recipes):** 
  - Al crear una receta, se vincula un *Producto Final*.
  - Se debe definir el **Rendimiento (Yield Quantity)**. Si tu receta gasta ingredientes para hacer 100 panes, el rendimiento es 100.
  - Añade los ingredientes y la proporción exacta necesaria para ese lote.

### 4.2. Control de Inventario (EP-2)
- **Registros:** Toda entrada o salida se registra en la pestaña de inventario de cada tienda.
- **Ledger Inmutable:** Como usuario, visualizas el "stock actual", pero internamente el sistema documenta una transacción detallando *quién, cuándo y por qué* se movió.
- **Límites de Alerta:** Configura el *Min Stock* y *Max Stock* para que el sistema sepa cuándo advertir una rotura de inventario en el Dashboard.

### 4.3. Dashboards y Operación Diaria (EP-4)
- **Panel de Inventario:** Visualiza semáforos (Rojo/Amarillo/Verde) según la salud de las existencias vs topes configurados.
- **Panel de Mermas (Waste):** Aquí se registran las roturas o sobrantes del día. Registrar mermas es vital porque la IA las lee para ajustar la demanda del día siguiente.
- **Panel de Producción:** Permite visualizar rápidamente el estado de las órdenes ("En progreso", "Completada") creadas automáticamente por el Forecast.

### 4.4. Forecast Predictivo con IA (EP-5)
- **Proceso S&OP:** Entra a la pestaña de Forecast seleccionando tu tienda.
- El sistema calculará tu consumo promedio de los últimos 30 días.
- **IA en Acción:** El *Smart Protocol v1* interceptará los datos. Si detecta, por ejemplo, que estás produciendo 100 panes diarios pero mermando 40, ajustará automáticamente la cantidad sugerida y pondrá un ícono **🤖 IA** explicando el motivo.
- **Aprobación:** Si el encargado aprueba el plan propuesto, el sistema generará de inmediato las **Órdenes de Producción** en la base de datos (descontando el inventario según el backflushing de las recetas).

---

## 5. Próximos Pasos (Datasets Iniciales)

Para poder comercializar el sistema a otros clientes (o poner en marcha tus propios negocios reales), el flujo de onboarding (carga inicial) es:

1. **Creación del Tenant (Empresa):** Se crea el `company_id` del nuevo cliente en la base de datos.
2. **Estructura Organizacional:** Importar JSON/CSV con las `Stores` y `Business Lines`.
3. **Migración del Catálogo (Ingeniería de Menú):** Importar la base maestra de `Products` y `Recipes`. Se requiere limpieza previa en Excel para asegurar que las unidades de medida coincidan.
4. **Toma Física Inicial:** Subir el `Inventory` real del Día Cero a través del script de importación automática (`scripts/import_to_sql.js`).
5. **Formación S&OP:** Entrenar a los gerentes de las tiendas para que entiendan cómo interactuar con las órdenes del Dashboard cada mañana.

---

*Fin del Documento V1.0*
