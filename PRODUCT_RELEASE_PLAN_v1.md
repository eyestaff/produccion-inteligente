# PRODUCT RELEASE PLAN: Producción Inteligente V1.0

Este documento define la estrategia comercial de producto. Nuestro objetivo es vender la solución a una cadena de 10 panaderías con la promesa de: **Cero pérdida de inventario, márgenes de receta controlados al céntimo y operativas libres de hojas de cálculo.**

---

## 1. ¿Qué incluye exactamente la versión 1.0 (MVP Comercial)?

- **Sistema de Catálogo y Escandallos (Recetario):** Gestión centralizada de materias primas, productos terminados y fórmulas de producción con control de _Yield_ (rendimiento).
- **Control de Inventario Inmutable (Ledger):** Trazabilidad Multi-tenant (Almacén Central vs Tiendas) con auditoría exacta (quién, cuándo y por qué se movió la harina).
- **Motor de Producción (Backflushing):** Conversión atómica de insumos en productos terminados al presionar un solo botón, sin interbloqueos operativos.

## 2. ¿Qué funcionalidades son imprescindibles para salir a vender?

- **Interfaz Gráfica (Frontend Web):** Un panel de control intuitivo. No podemos vender APIs a un gerente de panadería.
- **Gestor de Órdenes de Producción (UI):** Pantalla donde el operario vea qué tiene que hacer hoy y clique "Completar Orden".
- **Gestión Visual de Inventario:** Pantallas para consultar Stock Físico y para que el Encargado ingrese Ajustes manuales (roturas, caducidades, mermas de mostrador).
- **Gestión Visual de Escandallos:** Interfaz para crear y modificar recetas (Ej: Cambiar los gramos de levadura de toda la cadena con un clic).
- **Roles y Permisos:** Login para que el panadero no pueda alterar la receta, solo consumir.

## 3. ¿Qué funcionalidades pueden esperar a la versión 1.1?

- **Módulo de Compras (Purchasing nativo):** El seguimiento de órdenes de compra a proveedores, gestión de albaranes y facturas. (En la V1 los ingresos de proveedores se harán vía "Ajuste de Inventario Positivo").
- **Coste Financiero Dinámico (Landed Cost):** Seguimiento del precio variable de la harina según el último proveedor (La V1 puede usar un coste estándar).
- **Trazabilidad de Lotes de Caducidad:** Seguimiento del lote sanitario exacto de la harina consumida.

## 4. ¿Qué funcionalidades deben pasar a la versión 2.0?

- **Inteligencia Predictiva (Forecast):** Sugerencia automática de cuánto pan hornear basándose en la venta de ayer, el clima y los mermas pasadas.
- **Integración Nativa con TPV (POS):** Conectar automáticamente el sistema de cobro en caja (Square, NCR) para descontar el stock de pan del Ledger en tiempo real al venderlo.
- **Migración a D1 Batch:** Escalado de la arquitectura de base de datos para soportar miles de transacciones concurrentes (ADR-011).

---

## 5. ¿Qué pantallas tendrá el usuario?

El Frontend estará compuesto por 6 pantallas ultra-optimizadas:

1. **Login & Dashboard Operativo:** KPIs clave (Valor del inventario en €, Top 5 mermas del día, Órdenes completadas hoy).
2. **Catálogo de Insumos & Productos:** Maestro centralizado de la empresa.
3. **Escandallos (Recetas):** Constructor drag-and-drop o lista interactiva de fórmulas.
4. **Almacenes (Inventario):** Grilla en tiempo real del stock por tienda y botón de "Nuevo Movimiento/Ajuste".
5. **Panel de Producción:** Órdenes pendientes, en progreso y completadas. Herramienta de trabajo del obrador.
6. **Mermas (Waste Log):** Pantalla de un solo clic para reportar pan quemado o harina derramada.

---

## 6. Flujo Operativo Diario y 7. Módulos Utilizados

### Gerente / Director de Operaciones

- **Flujo:** Abre el Dashboard, revisa el valor de los inventarios, verifica que las mermas no hayan superado el KPI del 2%, y revisa si el coste teórico de recetas cuadra con el consumo real.
- **Módulos:** Dashboard, Reportes de Inventario, Catálogo (Costos).

### Jefe de Producción (Obrador)

- **Flujo:** Llega de madrugada. Abre el **Panel de Producción**. Ve la lista (planificada el día anterior) de hornear 300 croissants. Hornea. Al finalizar, hace clic en "Completar Orden".
- **Módulos:** Panel de Producción, Catálogo (Consultas de Receta).

### Encargado de Compras (Central)

- **Flujo:** Revisa la **pantalla de Inventario** filtrando por "Stock bajo el umbral mínimo". Llama al proveedor de harina. Cuando el camión llega, ingresa el remito haciendo un Movimiento Positivo en Inventario.
- **Módulos:** Almacenes (Inventario).

### Encargado de Tienda

- **Flujo:** Al cerrar la persiana, hace el conteo de pan sobrante. Abre la pantalla de **Mermas**, registra los productos a descartar por cierre de día, actualizando el stock final.
- **Módulos:** Mermas, Inventario (Ajustes).

---

## 8. ¿Qué valor (ROI) obtiene cada perfil?

- **Gerente:** GANA DINERO. Controla los márgenes evitando desviaciones de escandallo (operarios que echan "a ojo" los ingredientes).
- **Jefe Producción:** REDUCE TIEMPO. No debe rellenar Excel para restar del almacén lo que fabricó, el sistema lo hace atómicamente por él.
- **Compras:** REDUCE ERRORES Y LIQUIDEZ MUERTA. Sabe exactamente qué pedir y cuándo, evitando sobre-stockeo de materias primas perecederas que inmovilizan capital.
- **Encargado Tienda:** REDUCE ESTRÉS. Su gestión de fin de día se vuelve digital, rápida e incuestionable de cara a gerencia.

---

## 9. ¿Qué falta ahora mismo para poder vender el producto?

Tecnológicamente, el Backend es premium. Comercial y visualmente, **no tenemos nada**.
Falta la **Capa Front-End UI** y la **Gestión Visual de Mermas (Waste Logging)**. El cliente compra con los ojos: necesita ver pantallas limpias, oscuras, veloces (SPA) y responsivas (para usar el iPad en el obrador cubierto de harina).

## 10. Roadmap mínimo para llegar a la Versión Comercial (V1)

El objetivo es tener un software "demo-ready" para comercializar.

1. **Sprint 9: Interfaz Core y Autenticación.** Setup del proyecto Vite/React, sistema de Login, Shell de navegación lateral.
2. **Sprint 10: Interfaz del Catálogo y Recetas.** Pantallas para dar de alta insumos y definir escandallos de forma limpia.
3. **Sprint 11: Interfaz de Inventario y Mermas (Waste Log).** Pantallas táctiles-friendly para consulta de stock y reporte de panadería (mermas/roturas).
4. **Sprint 12: Interfaz del Motor de Producción.** El tablero del obrero. Listado de órdenes diarias con botón gigante de "Completar" (desencadena el backflushing que hemos construido).
5. **Sprint 13: Prueba de Estrés Comercial (Beta Release).** Despliegue en tabletas iPad, revisión de latencias, corrección UI/UX (Botones más grandes, prevención de clics dobles), y venta a la primera franquicia piloto.
