# AI_CONTEXT.md

> Documento oficial de arquitectura, ingeniería y continuidad del proyecto Producción Inteligente.

---

# Índice

1. Executive Summary
2. Arquitectura General
3. Stack Tecnológico
4. Estructura del Repositorio
5. Principios de Ingeniería
6. Convenciones de Código
7. Modelo del Dominio
8. Base de Datos
9. Frontend
10. Backend (Cloudflare Workers)
11. Seguridad
12. Testing
13. Deployment
14. Roadmap del Proyecto
15. Definición de Sprints
16. Reglas para IA
17. Definición de Done
18. Visión a Largo Plazo

---

> Documento oficial de arquitectura e ingeniería del proyecto Producción Inteligente.
>
> Este documento constituye la fuente principal de conocimiento técnico del proyecto y debe mantenerse actualizado durante toda la vida del producto.
>
> Cualquier desarrollador o sistema de Inteligencia Artificial que participe en el proyecto deberá leer este documento antes de realizar modificaciones en el código.

---

# 1. Executive Summary

## Nombre del proyecto

Producción Inteligente

## Tipo de producto

Software como Servicio (SaaS)

## Estado

En desarrollo.

Actualmente el proyecto se encuentra en la fase de construcción de la plataforma base sobre Cloudflare.

---

# Visión

Producción Inteligente será un SaaS especializado en planificación y optimización de la producción para cadenas de panaderías.

El objetivo es sustituir completamente los procesos manuales realizados mediante hojas de cálculo por un sistema inteligente capaz de calcular automáticamente la producción diaria de cada tienda utilizando información histórica, inventario disponible, previsiones de venta y reglas de negocio.

No se pretende construir un ERP genérico.

Se pretende construir el mejor software posible para la planificación de producción en panaderías.

Toda decisión técnica deberá respetar esta visión.

---

# Problema que resuelve

Actualmente muchas cadenas de panaderías trabajan mediante:

- Excel
- WhatsApp
- llamadas telefónicas
- experiencia personal

Esto produce:

- exceso de producción
- falta de producto
- elevada merma
- errores humanos
- poca trazabilidad
- baja capacidad de planificación

Producción Inteligente eliminará estos problemas mediante automatización.

---

# Objetivos del producto

El sistema debe permitir:

- planificar producción diaria
- calcular necesidades futuras
- controlar inventarios
- controlar mermas
- gestionar productos
- gestionar recetas
- controlar tiendas
- calcular indicadores
- ayudar en la toma de decisiones

Todo el sistema debe estar orientado a reducir costes y aumentar rentabilidad.

---

# Objetivos de ingeniería

El proyecto debe ser:

- escalable
- mantenible
- modular
- testeable
- sencillo de evolucionar
- preparado para múltiples empresas

No se aceptarán soluciones rápidas que comprometan la arquitectura futura.

La prioridad siempre será la mantenibilidad.

---

# Filosofía del proyecto

Antes de escribir código debe entenderse el problema.

La arquitectura tiene prioridad sobre la velocidad de desarrollo.

La calidad tiene prioridad sobre la cantidad.

Cada módulo debe tener una responsabilidad clara.

El código debe ser fácil de entender dentro de varios años.

---

# Principios fundamentales

Toda decisión debe cumplir los siguientes principios.

## Simplicidad

Las soluciones simples tienen prioridad.

No introducir complejidad innecesaria.

---

## Modularidad

Cada módulo debe tener una única responsabilidad.

Evitar archivos gigantes.

Evitar dependencias circulares.

---

## Escalabilidad

Todo componente debe diseñarse pensando en miles de usuarios y múltiples empresas.

Nunca desarrollar pensando únicamente en la situación actual.

---

## Calidad

El proyecto siempre debe permanecer compilando.

Nunca continuar desarrollando sobre un proyecto con errores.

Siempre validar:

- lint
- typecheck
- tests
- build

antes de finalizar cualquier tarea.

---

## Código preparado para producción

No escribir código de demostración.

No escribir código temporal.

No escribir "TODO" que afecten al funcionamiento principal.

Todo código nuevo debe estar preparado para utilizarse en producción.

---

# Qué NO es este proyecto

Este proyecto NO es:

- un CRUD de ejemplo
- una prueba técnica
- un tutorial
- un ejercicio académico
- un MVP desechable

Toda decisión debe tomarse pensando en un producto que evolucionará durante años.

---

# Principios para cualquier IA

Toda IA que participe en este proyecto debe asumir el papel de Staff Software Engineer.

Antes de modificar código deberá:

1. Analizar el proyecto.
2. Comprender la arquitectura existente.
3. Revisar dependencias.
4. Identificar el impacto del cambio.

Nunca deberá:

- reinventar la arquitectura
- cambiar tecnologías sin justificarlo
- introducir dependencias innecesarias
- modificar código funcionando sin motivo
- duplicar lógica de negocio
- crear soluciones temporales

Si existe una duda arquitectónica deberá explicarse antes de modificar el código.

---

# Objetivo final

Construir el mejor SaaS de planificación de producción para panaderías.

El éxito del proyecto no se medirá por la cantidad de líneas de código sino por la calidad del producto construido.

Todas las decisiones deberán acercar el proyecto a ese objetivo.

# 2. Arquitectura General

## Objetivo

Este documento define la arquitectura oficial del proyecto.

Toda modificación deberá respetar esta arquitectura.

Las decisiones técnicas futuras deberán alinearse con los principios definidos aquí.

---

# Arquitectura de alto nivel

Producción Inteligente está dividido en cinco grandes bloques.

```
                Usuario
                   │
                   ▼
            React + Vite (SPA)
                   │
             HTTP / JSON API
                   │
                   ▼
        Cloudflare Workers API
                   │
     ┌─────────────┴─────────────┐
     ▼                           ▼
Cloudflare D1               Cloudflare R2
(Base de datos)             (Archivos)
```

Cada bloque tiene una única responsabilidad.

Nunca deberán mezclarse responsabilidades.

---

# Frontend

Ubicación

```
frontend/
```

Responsabilidades

- interfaz de usuario
- navegación
- formularios
- gráficos
- dashboards
- validaciones visuales
- consumo de APIs

El frontend nunca debe contener reglas de negocio.

Las reglas de negocio viven exclusivamente en el Worker.

---

# Backend

Ubicación

```
worker/
```

Responsabilidades

- exponer APIs
- validar peticiones
- ejecutar reglas de negocio
- acceder a D1
- acceder a R2
- autenticación
- autorización
- auditoría
- logging

Todo cálculo debe realizarse aquí.

---

# Base de datos

Tecnología

Cloudflare D1

Responsabilidad

Persistencia de toda la información del sistema.

Nunca acceder a D1 desde React.

Toda consulta debe pasar por el Worker.

---

# Almacenamiento de archivos

Tecnología

Cloudflare R2

Responsabilidad

Guardar archivos del sistema.

Ejemplos

- imágenes

- documentos

- exportaciones

- archivos Excel

- PDFs

Nunca almacenar archivos grandes dentro de D1.

---

# Flujo completo de una petición

El flujo oficial será siempre:

Usuario

↓

React

↓

API del Worker

↓

Servicios

↓

Repositorios

↓

D1 o R2

↓

Respuesta JSON

↓

React

Nunca saltar pasos.

---

# Separación por capas

La arquitectura seguirá el siguiente patrón.

```
React

↓

Routes

↓

Services

↓

Repositories

↓

Database
```

Cada capa tiene una única responsabilidad.

---

# React

Responsabilidad

Presentación.

No debe conocer SQL.

No debe conocer D1.

No debe conocer R2.

No debe contener reglas de negocio.

---

# Routes

Responsabilidad

Recibir peticiones HTTP.

Validar parámetros.

Llamar a servicios.

Construir respuestas HTTP.

Nada más.

---

# Services

Responsabilidad

Implementar toda la lógica de negocio.

Ejemplos

- cálculo de producción

- forecast

- inventario

- validaciones

- permisos

Los Services nunca deben conocer HTTP.

---

# Repositories

Responsabilidad

Acceso a datos.

Toda consulta SQL vive aquí.

Nunca escribir SQL dentro de las rutas.

Nunca escribir SQL dentro de React.

---

# Database

Responsabilidad

Persistencia.

Únicamente almacena información.

Nunca contiene lógica de negocio.

---

# Principio de dependencia

La dirección de dependencias siempre será:

```
Frontend

↓

Routes

↓

Services

↓

Repositories

↓

Database
```

Nunca al revés.

---

# Arquitectura del repositorio

La estructura oficial será:

```
frontend/

worker/

tests/

docs/

scripts/

shared/
```

Cada carpeta tiene una responsabilidad concreta.

---

# frontend/

Contiene únicamente:

- React

- componentes

- páginas

- estilos

- hooks

- utilidades de UI

Nunca almacenar SQL.

Nunca almacenar lógica de negocio.

---

# worker/

Contiene:

- API

- rutas

- servicios

- repositorios

- modelos

- autenticación

- acceso a D1

- acceso a R2

Todo el backend vive aquí.

---

# tests/

Contendrá

- unit tests

- integration tests

- regression tests

Toda nueva funcionalidad deberá incorporar pruebas cuando sea razonable.

---

# docs/

Documentación técnica.

Diagramas.

Arquitectura.

ADR.

Especificaciones.

---

# scripts/

Scripts auxiliares para desarrollo.

Nunca incluir lógica del producto.

---

# shared/

Código compartido entre frontend y backend.

Ejemplos

- tipos

- constantes

- utilidades puras

No debe depender de React.

No debe depender de Cloudflare.

---

# Reglas de arquitectura

Siempre:

✔ una responsabilidad por módulo

✔ código reutilizable

✔ funciones pequeñas

✔ nombres descriptivos

✔ separación clara entre capas

✔ bajo acoplamiento

✔ alta cohesión

---

# Antipatrones prohibidos

Nunca hacer lo siguiente.

❌ SQL dentro de React

❌ SQL dentro de las rutas

❌ lógica de negocio en componentes

❌ archivos de miles de líneas

❌ duplicar lógica

❌ dependencias circulares

❌ acceder a D1 desde el frontend

❌ acceder directamente a R2 desde React

❌ mezclar presentación con negocio

---

# Objetivo arquitectónico

La arquitectura debe permitir que cualquier módulo pueda evolucionar de forma independiente.

Una modificación en React no debería obligar a modificar la base de datos.

Una modificación en D1 no debería afectar a los componentes visuales.

La separación de responsabilidades es uno de los pilares fundamentales del proyecto.

# 3. Stack Tecnológico y Decisiones de Arquitectura (ADR)

## Objetivo

Este capítulo documenta las decisiones técnicas del proyecto.

No solo define las tecnologías utilizadas, sino también el motivo por el cual fueron seleccionadas.

Cualquier cambio futuro deberá justificar claramente por qué mejora la solución existente.

---

# Filosofía tecnológica

El proyecto prioriza:

- simplicidad
- rendimiento
- escalabilidad
- coste operativo
- mantenibilidad
- independencia de proveedores siempre que sea posible

Nunca se incorporará una tecnología únicamente por estar de moda.

Cada dependencia debe resolver un problema real.

---

# Stack oficial

| Área                 | Tecnología         |
| -------------------- | ------------------ |
| Lenguaje             | TypeScript         |
| Frontend             | React              |
| Bundler              | Vite               |
| Backend              | Cloudflare Workers |
| Base de datos        | Cloudflare D1      |
| Storage              | Cloudflare R2      |
| ORM                  | Drizzle ORM        |
| Testing              | Vitest             |
| Control de versiones | Git                |
| Repositorio          | GitHub             |
| Despliegue           | Cloudflare         |

Este stack constituye la arquitectura oficial del proyecto.

---

# TypeScript

## Motivo

Todo el proyecto utiliza TypeScript.

No se utilizará JavaScript para nuevas funcionalidades.

Razones:

- tipado fuerte
- mejor mantenimiento
- autocompletado
- refactorización segura
- menor número de errores

Siempre se preferirá un tipo específico antes que `any`.

---

# React

React será la única librería de interfaz.

Responsabilidades:

- páginas
- componentes
- formularios
- navegación
- dashboards
- visualización

React nunca contendrá lógica de negocio.

---

# Vite

Se utiliza Vite por:

- rapidez
- configuración sencilla
- excelente integración con TypeScript
- tiempos mínimos de compilación

No sustituir por otro bundler salvo decisión arquitectónica documentada.

---

# Cloudflare Workers

Todo el backend se ejecuta sobre Workers.

Ventajas:

- baja latencia
- escalado automático
- despliegues rápidos
- infraestructura serverless
- menor coste operativo

No existen servidores tradicionales.

No existen máquinas virtuales.

Todo el backend debe diseñarse pensando en ejecución stateless.

---

# Cloudflare D1

D1 será la base de datos principal.

Responsabilidades:

- persistencia
- consultas
- relaciones
- integridad de datos

Nunca almacenar archivos en D1.

---

# Cloudflare R2

R2 almacenará:

- imágenes
- documentos
- exportaciones
- PDFs
- archivos Excel
- copias de seguridad cuando proceda

Nunca almacenar binarios grandes dentro de D1.

---

# Drizzle ORM

Drizzle será la capa de acceso a datos.

Objetivos:

- tipado
- migraciones
- mantenimiento
- seguridad
- evitar SQL propenso a errores

Las migraciones deberán mantenerse bajo control de versiones.

---

# Vitest

Todo test nuevo utilizará Vitest.

Tipos de pruebas:

- unitarias
- integración
- regresión

Cada bug importante corregido debería ir acompañado de un test que evite su reaparición.

---

# Git

Se trabajará mediante commits pequeños.

Ejemplos:

```
feat: add authentication middleware

fix: inventory calculation

refactor: split dashboard routes

test: add repository tests

docs: update AI context
```

Evitar commits masivos.

---

# GitHub

GitHub será la fuente oficial del código.

Nunca desarrollar varias versiones independientes del proyecto.

Todo cambio debe terminar integrado en el repositorio principal.

---

# Cloudflare

Cloudflare será la plataforma oficial de despliegue.

Se utilizarán:

- Workers
- D1
- R2

Siempre que sea posible se aprovecharán los servicios nativos antes de incorporar infraestructura externa.

---

# Gestión de dependencias

Antes de instalar una nueva dependencia responder:

1. ¿Existe ya una solución dentro del proyecto?

2. ¿Puede implementarse fácilmente sin añadir librerías?

3. ¿Aumenta significativamente el mantenimiento?

4. ¿Está bien mantenida?

5. ¿Tiene una comunidad sólida?

Si alguna respuesta genera dudas, no instalarla hasta documentar la decisión.

---

# Dependencias prohibidas

Evitar librerías que:

- dupliquen funcionalidad existente
- no tengan mantenimiento activo
- aumenten mucho el tamaño del bundle
- oculten lógica importante
- obliguen a reescribir la arquitectura

---

# Arquitectura estable

La arquitectura del proyecto debe evolucionar.

No debe reinventarse.

Los cambios deben ser incrementales.

Evitar reescrituras completas.

---

# Arquitectura dirigida por dominio

El proyecto crecerá alrededor del dominio del negocio.

No alrededor de la base de datos.

No alrededor de React.

No alrededor del Worker.

El dominio es el centro del sistema.

---

# Decisiones Arquitectónicas (ADR)

Toda decisión importante deberá responder:

## Problema

¿Qué necesidad existe?

## Alternativas

¿Qué opciones se evaluaron?

## Decisión

¿Qué solución se adopta?

## Justificación

¿Por qué esa solución es mejor?

## Consecuencias

¿Qué ventajas y limitaciones introduce?

Este formato deberá utilizarse para cualquier cambio estructural importante.

---

# Principio de estabilidad

Las tecnologías principales del proyecto no deben cambiar durante el desarrollo salvo razones técnicas de peso.

Cambiar de framework, base de datos o infraestructura implica un coste elevado y debe considerarse una excepción.

La estabilidad tecnológica es un objetivo del proyecto.

---

# Objetivo del stack

El stack ha sido elegido para construir un SaaS moderno, rápido, escalable y mantenible.

Cada tecnología tiene una responsabilidad específica.

El éxito del proyecto dependerá más de una buena arquitectura que de incorporar nuevas herramientas.

# 4. Modelo del Dominio

## Objetivo

El proyecto debe construirse alrededor del dominio del negocio.

No alrededor de la base de datos.

No alrededor de React.

No alrededor del Worker.

El dominio define todo el sistema.

---

# Dominio principal

Producción Inteligente es una plataforma para gestionar la producción diaria de una cadena de panaderías.

El sistema debe permitir calcular automáticamente qué debe producir cada tienda cada día.

Todas las funcionalidades futuras deben ayudar a responder esta pregunta:

**¿Qué debe producir cada tienda hoy?**

---

# Entidades principales

El dominio estará formado por las siguientes entidades.

```
Empresa

↓

Tiendas

↓

Líneas de negocio

↓

Productos

↓

Recetas

↓

Inventario

↓

Forecast

↓

Producción

↓

Merma

↓

KPIs
```

---

# Empresa (Company)

Representa un cliente del SaaS.

Cada empresa posee:

- usuarios
- tiendas
- productos
- recetas
- forecast
- inventarios
- producción

Todo estará aislado por empresa.

Nunca mezclar datos entre empresas.

---

# Usuario

Representa una persona que utiliza el sistema.

Ejemplos:

- administrador
- director de operaciones
- responsable de producción
- gerente de tienda
- supervisor

Cada usuario tendrá:

- autenticación
- permisos
- roles
- auditoría

---

# Tienda

Representa un punto de venta.

Cada tienda tendrá:

- nombre
- código
- estado
- horario
- capacidad
- inventario
- forecast
- producción
- ventas
- merma

Cada tienda funciona de forma independiente.

---

# Línea de negocio

Agrupa productos similares.

Ejemplos:

- Bollería

- Pan

- Salado

- Diario

- Platos calientes

Permite organizar toda la producción.

---

# Producto

Representa un producto vendible.

Ejemplos

- Croissant

- Barra

- Empanada

- Pizza

Cada producto tendrá:

- código

- nombre

- línea

- coste

- precio

- estado

- vida útil

- receta

- unidad

---

# Vida útil

Todo producto tendrá una duración definida.

Ejemplo

Pan

1 día

Diario

2 días

Platos calientes

2 días

La vida útil afecta:

- inventario

- forecast

- merma

- producción

---

# Receta

Define cómo fabricar un producto.

Cada receta tendrá:

- ingredientes

- cantidades

- rendimiento

- versión

- coste

Una receta podrá evolucionar mediante versiones.

Nunca eliminar el historial.

---

# Ingrediente

Representa una materia prima.

Ejemplos

- harina

- azúcar

- mantequilla

- queso

- chocolate

Los ingredientes permitirán calcular:

- costes

- consumo

- compras

---

# Inventario

Representa el stock disponible.

Existirán distintos tipos.

Inventario de tienda.

Inventario de producción.

Inventario en tránsito.

El inventario nunca será un dato manual permanente.

Debe calcularse mediante movimientos.

---

# Movimiento

Todo cambio de inventario generará un movimiento.

Ejemplos

Entrada

Salida

Transferencia

Producción

Venta

Merma

Caducidad

Ajuste

Nunca modificar inventario directamente.

Siempre registrar movimientos.

---

# Forecast

Representa la previsión de ventas.

El forecast podrá calcularse mediante:

- histórico

- estacionalidad

- festivos

- clima

- IA

Será la base del motor de producción.

---

# Producción

Representa la cantidad que debe fabricarse.

No será introducida manualmente.

El sistema deberá calcularla automáticamente.

---

# Motor de Producción

Será el núcleo del SaaS.

La fórmula conceptual será:

```
Producción

=

Forecast

+

Stock mínimo

-

Inventario disponible

-

Producto reutilizable

+

Merma prevista
```

La implementación podrá evolucionar, pero este principio permanecerá.

---

# Merma

Representa producto perdido.

Tipos

Operativa

Caducidad

Rotura

Error humano

No toda merma tiene la misma causa.

Debe poder analizarse.

---

# Ventas

Las ventas alimentarán el forecast.

Toda venta influirá en los cálculos futuros.

---

# KPIs

El sistema deberá calcular automáticamente indicadores.

Ejemplos

Producción.

Ventas.

Merma.

Rentabilidad.

Inventario.

Rotación.

Cumplimiento del forecast.

Margen.

Coste.

Todos los KPIs deberán derivarse de los datos del sistema.

Nunca introducir KPIs manualmente.

---

# Multiempresa

El SaaS será multiempresa.

Cada empresa tendrá:

- usuarios

- productos

- recetas

- tiendas

- forecast

- inventario

- producción

Todo completamente aislado.

---

# Trazabilidad

Todo dato importante deberá poder responder:

¿Quién?

¿Cuándo?

¿Qué cambió?

¿Valor anterior?

¿Valor nuevo?

La trazabilidad es un requisito del sistema.

---

# Evolución del dominio

Las nuevas funcionalidades deberán incorporarse al dominio existente.

Nunca crear entidades duplicadas.

Nunca introducir conceptos equivalentes con nombres distintos.

El dominio debe permanecer coherente durante toda la vida del proyecto.

---

# Principio fundamental

Todo el software gira alrededor de una única misión:

**Calcular la producción correcta para cada tienda minimizando la merma y maximizando la rentabilidad.**

Cualquier nueva funcionalidad deberá contribuir directa o indirectamente a ese objetivo.

# 5. Arquitectura de Base de Datos

## Objetivo

La base de datos es el núcleo del sistema.

Debe diseñarse para soportar varios años de evolución sin necesidad de rediseños importantes.

Toda modificación del esquema deberá respetar las reglas definidas en este capítulo.

---

# Principios

La base de datos debe ser:

- consistente
- escalable
- sencilla
- normalizada
- fácil de mantener
- preparada para múltiples empresas

Nunca diseñar pensando únicamente en la funcionalidad actual.

---

# Tecnología

Motor oficial

Cloudflare D1

ORM oficial

Drizzle ORM

No utilizar otro ORM sin una decisión arquitectónica documentada.

---

# Organización

Las tablas se dividirán por dominios.

Ejemplo

```
Companies

Users

Stores

Business Lines

Products

Recipes

Ingredients

Inventory

Forecast

Production

Sales

Waste

Audit

Configuration
```

Cada dominio será independiente.

---

# Convenciones de nombres

Todas las tablas:

snake_case

Ejemplo

```
business_lines

production_orders

inventory_movements
```

---

# Columnas

Todas las columnas

snake_case

Ejemplo

```
business_line_id

created_at

updated_at

deleted_at
```

Nunca utilizar camelCase dentro de la base de datos.

---

# Claves primarias

Todas las tablas tendrán

```
id INTEGER PRIMARY KEY
```

autoincremental.

---

# Claves foráneas

Todas las relaciones utilizarán claves foráneas.

Ejemplo

```
store_id

company_id

recipe_id

product_id
```

Nunca guardar relaciones mediante texto.

---

# Auditoría

Toda tabla importante tendrá:

```
created_at

updated_at
```

Y cuando sea necesario:

```
created_by

updated_by
```

---

# Eliminación lógica

Siempre que sea posible utilizar:

```
deleted_at
```

En lugar de eliminar información.

La información histórica tiene valor.

---

# Multiempresa

Todas las tablas funcionales incluirán:

```
company_id
```

Esto garantiza el aislamiento completo entre clientes.

Nunca mezclar información de empresas distintas.

---

# Integridad

Nunca confiar únicamente en React para validar datos.

La base de datos también debe proteger la integridad.

Ejemplos

- NOT NULL

- UNIQUE

- CHECK

- FOREIGN KEY

---

# Índices

Crear índices únicamente cuando exista una necesidad real.

Ejemplos

```
company_id

store_id

product_id

business_line_id

created_at
```

Evitar índices innecesarios.

---

# Relaciones

Ejemplo simplificado

```
Company

↓

Stores

↓

Products

↓

Recipes

↓

Forecast

↓

Production

↓

Inventory

↓

Sales
```

Toda relación debe ser explícita.

---

# Versionado

Las modificaciones del esquema se realizarán únicamente mediante migraciones.

Nunca modificar tablas manualmente en producción.

---

# Migraciones

Las migraciones deberán ser:

- pequeñas

- independientes

- reversibles cuando sea posible

Cada migración tendrá un único objetivo.

---

# Datos maestros

Se consideran datos maestros:

- empresas

- líneas de negocio

- productos

- recetas

- ingredientes

Su modificación debe estar controlada.

---

# Datos transaccionales

Se consideran transacciones:

- ventas

- producción

- inventario

- movimientos

- forecast

- merma

Estas tablas crecerán continuamente.

Deben optimizarse para lectura y escritura.

---

# Históricos

Nunca eliminar históricos salvo obligación legal.

Los históricos permiten:

- análisis

- KPIs

- forecast

- auditoría

---

# Consistencia

Cada operación importante deberá comportarse como una unidad lógica.

Si una operación falla, el sistema no debe quedar en un estado inconsistente.

---

# Modelo futuro

El modelo deberá permitir incorporar nuevas entidades sin romper las existentes.

Ejemplos

- compras

- proveedores

- órdenes de fabricación

- mantenimiento

- planificación

- logística

---

# Convenciones de Drizzle

Todo esquema deberá definirse mediante Drizzle.

No mezclar múltiples estilos de definición.

Mantener un único criterio en todo el proyecto.

---

# Calidad del modelo

Antes de crear una nueva tabla responder:

1. ¿Existe ya una entidad equivalente?

2. ¿Puede reutilizarse una relación existente?

3. ¿Está correctamente normalizada?

4. ¿La tabla pertenece realmente a este dominio?

5. ¿Será comprensible dentro de cinco años?

Si alguna respuesta genera dudas, revisar el diseño antes de implementarlo.

---

# Objetivo

La base de datos debe convertirse en una representación fiel del negocio.

No debe reflejar pantallas.

No debe reflejar componentes React.

No debe reflejar APIs.

Debe representar únicamente el dominio del problema.

Ese principio guiará toda la evolución del modelo de datos.

# 6. Arquitectura Backend (Cloudflare Workers)

## Objetivo

El backend constituye el núcleo operativo del sistema.

Toda la lógica de negocio deberá ejecutarse exclusivamente en el Worker.

El frontend nunca implementará reglas de negocio.

---

# Principios

El backend deberá ser:

- modular
- mantenible
- escalable
- desacoplado
- testeable
- orientado al dominio

---

# Estructura oficial

La estructura del backend será:

```
worker/

    index.ts

    router.ts

    routes/

    services/

    repositories/

    db/

    models/

    lib/

    api/

    storage.ts

    pwa.ts
```

Cada carpeta tiene una responsabilidad única.

---

# index.ts

Responsabilidad

Únicamente iniciar el Worker.

Debe contener:

- configuración
- bindings
- llamada al router

No debe contener lógica de negocio.

No debe contener SQL.

No debe contener validaciones.

---

# router.ts

Responsabilidad

Recibir todas las peticiones HTTP.

Delegar cada petición a la ruta correspondiente.

Ejemplo conceptual

```
GET /api/products

↓

Product Routes

↓

Product Service

↓

Product Repository

↓

Database
```

El router nunca calcula información.

---

# routes/

Cada archivo representa un módulo funcional.

Ejemplos

```
dashboard.ts

products.ts

inventory.ts

production.ts

forecast.ts

companies.ts

users.ts
```

Cada ruta:

- valida la petición
- interpreta parámetros
- llama al servicio
- devuelve Response

Nada más.

---

# services/

Los servicios contienen TODA la lógica del negocio.

Ejemplos

```
ForecastService

InventoryService

ProductionService

RecipeService
```

Aquí viven:

- cálculos
- reglas
- validaciones
- decisiones

Los servicios nunca deben conocer HTTP.

---

# repositories/

Los repositorios acceden a D1.

Responsabilidades

- SELECT

- INSERT

- UPDATE

- DELETE

- transacciones

Nunca implementar reglas de negocio aquí.

---

# db/

Responsabilidad

Definir:

- esquema

- migraciones

- conexión

- utilidades

Todo acceso a la base de datos parte desde aquí.

---

# models/

Contendrá únicamente:

- tipos

- interfaces

- entidades

No contendrá lógica.

---

# lib/

Código reutilizable.

Ejemplos

- fechas

- números

- validadores

- utilidades

Nunca depender de React.

Nunca depender de D1.

---

# api/

Reservado para futuras integraciones.

Ejemplos

ERP

POS

eCommerce

APIs externas

---

# Flujo oficial

Toda petición seguirá siempre este recorrido.

```
Cliente

↓

Router

↓

Route

↓

Service

↓

Repository

↓

Database

↓

Repository

↓

Service

↓

Route

↓

Cliente
```

Nunca romper este flujo.

---

# Validaciones

Las validaciones deberán realizarse en capas.

Frontend

↓

Route

↓

Service

↓

Database

Nunca confiar únicamente en React.

---

# Gestión de errores

Nunca lanzar errores sin contexto.

Toda excepción deberá producir una respuesta consistente.

Ejemplo

```
{
    "success": false,
    "error": "Inventory not found"
}
```

Evitar mensajes ambiguos.

---

# HTTP

Utilizar códigos HTTP correctamente.

200

Operación correcta.

201

Recurso creado.

204

Sin contenido.

400

Petición inválida.

401

No autenticado.

403

Sin permisos.

404

No encontrado.

409

Conflicto.

422

Datos válidos pero imposibles de procesar.

500

Error interno.

---

# Response

Todas las respuestas JSON deberán seguir un formato uniforme.

Éxito

```
{
    "success": true,
    "data": {}
}
```

Error

```
{
    "success": false,
    "error": "..."
}
```

---

# Logging

Todo error importante deberá registrarse.

No registrar información sensible.

Ejemplos

✔ id usuario

✔ endpoint

✔ fecha

✔ duración

Nunca registrar:

✘ contraseñas

✘ tokens

✘ secretos

---

# Seguridad

Nunca confiar en datos enviados por el cliente.

Todo dato deberá validarse nuevamente en el Worker.

---

# Reutilización

Si dos rutas utilizan la misma lógica:

Moverla al Service.

Nunca duplicar código.

---

# Dependencias

La dirección de dependencias será siempre.

```
Routes

↓

Services

↓

Repositories

↓

Database
```

Nunca al revés.

---

# Nuevos módulos

Todo nuevo módulo seguirá la misma estructura.

Ejemplo

```
Products

↓

product.routes.ts

↓

product.service.ts

↓

product.repository.ts
```

La estructura debe mantenerse uniforme durante todo el proyecto.

---

# Testing

Toda lógica importante deberá probarse en Services.

Las Routes deberán contener la menor lógica posible.

---

# Rendimiento

Optimizar primero:

- consultas

- índices

- algoritmos

No optimizar prematuramente.

Medir antes de modificar.

---

# Escalabilidad

El backend debe soportar:

- múltiples empresas

- miles de usuarios

- cientos de tiendas

- millones de registros

Toda decisión debe tomarse pensando en ese escenario.

---

# Definición de Backend

El backend es el responsable absoluto del negocio.

React muestra información.

El Worker decide cómo funciona el sistema.

Nunca invertir esa responsabilidad.

# 7. Arquitectura Frontend

## Objetivo

El frontend es la interfaz entre el usuario y el sistema.

Su responsabilidad es presentar información de forma clara, rápida y consistente.

El frontend nunca debe contener lógica de negocio.

Toda decisión funcional pertenece al backend.

---

# Principios

El frontend deberá ser:

- simple
- modular
- reutilizable
- rápido
- mantenible
- consistente

---

# Tecnologías

Frontend oficial

- React
- TypeScript
- Vite

No sustituir estas tecnologías sin una decisión arquitectónica documentada.

---

# Responsabilidades

El frontend es responsable de:

- navegación
- interfaz de usuario
- formularios
- validaciones visuales
- tablas
- dashboards
- gráficos
- experiencia de usuario

Nunca calcular reglas del negocio.

---

# Estructura

La estructura oficial será:

```

frontend/

    src/

        components/

        pages/

        layouts/

        hooks/

        services/

        types/

        utils/

        styles/

        ui/

```

Cada carpeta tendrá una responsabilidad concreta.

---

# pages/

Cada página representa una funcionalidad.

Ejemplos

Dashboard

Stores

Products

Inventory

Forecast

Production

Configuration

Una página no debe superar una complejidad excesiva.

Si crece demasiado deberá dividirse.

---

# components/

Los componentes serán reutilizables.

Ejemplos

Table

Card

Button

Modal

Dialog

Input

Select

Chart

No contener lógica del dominio.

---

# layouts/

Responsabilidad

Estructura visual.

Ejemplos

AppShell

Sidebar

TopBar

Footer

Navigation

---

# hooks/

Responsabilidad

Reutilizar comportamiento.

Ejemplos

usePagination

useFetch

useFilters

useDebounce

Los hooks no deben acceder directamente a D1.

---

# services/

Responsabilidad

Consumir APIs.

Ejemplo

```

GET /api/products

↓

ProductService

↓

React

```

Nunca escribir fetchs repartidos por todos los componentes.

Centralizar siempre el acceso a la API.

---

# types/

Todos los tipos compartidos del frontend.

Ejemplos

Product

Store

Forecast

Inventory

Production

---

# utils/

Funciones puras.

Ejemplos

formato de fechas

números

monedas

texto

Nunca almacenar estado aquí.

---

# styles/

Toda la apariencia visual.

Evitar estilos duplicados.

Mantener consistencia.

---

# Componentes

Todo componente debe cumplir:

Una única responsabilidad.

Propiedades claras.

Sin efectos secundarios inesperados.

---

# Estado

El estado debe mantenerse lo más cerca posible del componente que lo necesita.

Evitar estados globales innecesarios.

---

# Comunicación

Padre

↓

Props

↓

Hijo

Evitar comunicación compleja entre componentes.

---

# Navegación

Cada módulo tendrá su propia página.

Ejemplo

```

Dashboard

↓

Stores

↓

Products

↓

Recipes

↓

Inventory

↓

Forecast

↓

Production

↓

Reports

↓

Configuration

```

La navegación debe ser sencilla.

---

# Formularios

Los formularios deberán:

validar

mostrar errores

deshabilitar acciones inválidas

mostrar carga

mostrar éxito

Nunca permitir guardar datos inconsistentes.

---

# Tablas

Las tablas soportarán cuando sea necesario:

- búsqueda
- filtros
- ordenación
- paginación
- exportación

---

# Dashboard

El Dashboard será la pantalla principal.

Mostrará únicamente información relevante.

No intentar mostrar todo.

Priorizar indicadores accionables.

---

# Diseño

Priorizar:

claridad

consistencia

legibilidad

rapidez

Evitar interfaces sobrecargadas.

---

# Responsive

Todo el frontend deberá funcionar correctamente en:

escritorio

tablet

móvil

La experiencia móvil será importante para responsables de tienda.

---

# Accesibilidad

Utilizar HTML semántico.

Etiquetas correctas.

Contraste adecuado.

Navegación mediante teclado cuando sea posible.

---

# Rendimiento

Evitar:

renderizados innecesarios

componentes gigantes

peticiones repetidas

cálculos costosos

Optimizar únicamente cuando sea necesario.

---

# Consumo de APIs

Todo acceso al backend deberá pasar por los Services.

Nunca realizar llamadas HTTP repartidas por múltiples componentes.

---

# Errores

Toda llamada deberá gestionar:

estado de carga

error

éxito

sin datos

Nunca dejar la interfaz bloqueada.

---

# Convenciones

Componentes

PascalCase

Ejemplo

```

ProductionTable.tsx

InventoryCard.tsx

```

Hooks

camelCase

Ejemplo

```

useInventory.ts

useForecast.ts

```

---

# Filosofía

React representa información.

El Worker toma decisiones.

El frontend nunca sustituirá la lógica del backend.

---

# Objetivo

Construir una interfaz clara, rápida y preparada para crecer durante muchos años sin necesidad de reescribirla.

Cada nuevo componente deberá acercar el proyecto a ese objetivo.

# 8. Roadmap Oficial del Proyecto

## Objetivo

Este capítulo define la hoja de ruta oficial del proyecto.

Todo desarrollo deberá seguir este orden salvo que exista una dependencia técnica que obligue a modificarlo.

Nunca implementar funcionalidades avanzadas si los cimientos aún no están preparados.

La estabilidad de la arquitectura tiene prioridad sobre la velocidad de desarrollo.

---

# Estado actual

## Sprint 0

Estado

COMPLETADO

Objetivos

- Inicialización del proyecto
- Cloudflare
- GitHub
- Workers
- D1
- R2
- CI/CD
- Configuración inicial

---

## Sprint 1

Estado

COMPLETADO

Objetivos

- CRUD inicial
- Dashboard básico
- Assets
- Testing
- Deploy
- Build estable

---

## Sprint 2

Estado

EN PROGRESO

Objetivo

Transformar el Worker monolítico en una arquitectura modular.

Resultados esperados

```
worker/

index.ts

router.ts

routes/

services/

repositories/

db/

models/
```

Este sprint termina cuando:

- index.ts solo inicializa el Worker.
- Las rutas están separadas por módulos.
- La lógica está desacoplada.
- El proyecto continúa compilando correctamente.

---

# Sprint 3

Autenticación

Objetivo

Construir un sistema completo de autenticación.

Incluye

- Login
- Logout
- Refresh Token
- Cambio de contraseña
- Recuperación de contraseña
- Middleware
- Roles
- Permisos
- Auditoría

Resultado esperado

Usuarios autenticados con permisos diferenciados.

---

# Sprint 4

Empresas

Objetivo

Convertir el sistema en multiempresa.

Implementar

- Companies
- Company Settings
- Company Users
- Configuración independiente
- Aislamiento completo de datos

Resultado

Cada empresa utiliza el SaaS sin acceder a los datos de otras.

---

# Sprint 5

Usuarios

Implementar

- Gestión de usuarios
- Roles
- Equipos
- Permisos
- Invitaciones
- Activación
- Desactivación

Resultado

Administración completa de usuarios.

---

# Sprint 6

Tiendas

Implementar

- Stores
- Horarios
- Capacidad
- Calendarios
- Configuración
- Estado operativo

Resultado

Cada tienda funciona como una unidad independiente.

---

# Sprint 7

Catálogo

Implementar

- Líneas de negocio
- Categorías
- Productos
- Unidades
- Vida útil
- Costes

Resultado

Catálogo completo del negocio.

---

# Sprint 8

Recetas

Implementar

- Ingredientes
- Recetas
- Versiones
- Rendimientos
- Costes
- Consumos

Resultado

Motor de recetas totalmente operativo.

---

# Sprint 9

Inventario

Implementar

- Inventario
- Movimientos
- Ajustes
- Caducidades
- Transferencias
- Mermas

Resultado

Inventario completamente trazable.

---

# Sprint 10

Forecast

Implementar

- Histórico
- Estacionalidad
- Festivos
- Clima
- IA
- Pronóstico

Resultado

Forecast automático por tienda y producto.

---

# Sprint 11

Motor de Producción Inteligente

Objetivo

Construir el corazón del SaaS.

El sistema deberá calcular automáticamente la producción.

Factores

- Forecast
- Inventario
- Vida útil
- Merma
- Stock mínimo
- Reutilización

Resultado

La producción deja de calcularse manualmente.

---

# Sprint 12

Ventas

Implementar

- Ventas
- Importación
- Sincronización
- KPIs
- Márgenes

Resultado

Las ventas alimentan automáticamente el forecast.

---

# Sprint 13

Dashboards

Implementar

Dashboard Ejecutivo

Dashboard Producción

Dashboard Inventario

Dashboard Forecast

Dashboard Tiendas

Dashboard Rentabilidad

Todos deberán mostrar información accionable.

---

# Sprint 14

Enterprise

Implementar

- API pública
- Integraciones
- Logs
- Auditoría
- Notificaciones
- Exportaciones
- Backups
- Monitoring
- Configuración avanzada

Resultado

Versión Enterprise lista para producción.

---

# Sprint 15

Inteligencia Artificial

Objetivo

Convertir Producción Inteligente en un sistema predictivo.

Implementar

- Predicción automática
- Recomendaciones
- Optimización de merma
- Optimización de producción
- Simulación de escenarios
- Alertas inteligentes

Resultado

El sistema deja de ser únicamente un ERP y se convierte en un asistente inteligente para la toma de decisiones.

---

# Reglas del Roadmap

Nunca desarrollar un sprint posterior dejando uno anterior incompleto.

Cada sprint deberá finalizar con:

- lint sin errores
- typecheck correcto
- tests superados
- build correcto

---

# Definición de Sprint terminado

Un sprint se considera finalizado únicamente cuando:

- Toda la funcionalidad prevista está implementada.
- El código mantiene la arquitectura definida.
- Las pruebas continúan pasando.
- La documentación está actualizada.
- Se han realizado commits pequeños y descriptivos.
- No existen regresiones conocidas.

---

# Prioridad del proyecto

Siempre desarrollar en este orden:

1. Arquitectura
2. Dominio
3. Persistencia
4. Lógica de negocio
5. APIs
6. Frontend
7. Optimización
8. Inteligencia Artificial

Nunca invertir este orden.

---

# Visión final

Al finalizar el Roadmap, Producción Inteligente deberá convertirse en una plataforma SaaS de referencia para la planificación de producción en panaderías, preparada para operar con múltiples empresas, miles de usuarios y cientos de tiendas, con una arquitectura mantenible, escalable y preparada para evolucionar durante muchos años.

# 9. Reglas para Inteligencias Artificiales

## Objetivo

Este documento define las normas que deberá seguir cualquier Inteligencia Artificial que participe en el desarrollo del proyecto.

El objetivo es garantizar continuidad, consistencia y calidad independientemente de la herramienta utilizada.

---

# Rol

Toda IA deberá asumir el rol de:

**Staff Software Engineer**

No deberá actuar como un generador de ejemplos.

No deberá actuar como un profesor.

No deberá actuar como un chatbot.

Su función consiste en desarrollar software profesional.

---

# Primera tarea

Antes de escribir una sola línea de código deberá:

- leer README.md
- leer PROJECT_ROADMAP.md
- leer AI_CONTEXT.md
- analizar completamente la estructura del proyecto

No modificar código hasta comprender la arquitectura existente.

---

# Principio fundamental

Comprender.

Después modificar.

Nunca al revés.

---

# Continuidad

El proyecto debe evolucionar.

Nunca reiniciarse.

Toda modificación deberá ser incremental.

---

# Arquitectura

Nunca modificar la arquitectura sin justificarlo.

Si existe una propuesta mejor deberá explicarse:

- problema
- alternativas
- ventajas
- inconvenientes
- impacto

Solo después podrá implementarse.

---

# Stack

El stack oficial es:

React

TypeScript

Vite

Cloudflare Workers

Cloudflare D1

Cloudflare R2

Drizzle ORM

Vitest

GitHub

Cloudflare

No cambiar tecnologías sin aprobación explícita.

---

# Calidad

Antes de finalizar cualquier tarea deberán ejecutarse correctamente:

```
npm run lint

npm run typecheck

npm test

npm run build
```

Si alguno falla:

detener el desarrollo

corregir

volver a validar

Nunca continuar sobre un proyecto roto.

---

# Responsabilidades

Frontend

Presentación.

Backend

Negocio.

Database

Persistencia.

Nunca mezclar responsabilidades.

---

# Refactor

Se permite refactorizar únicamente cuando:

- mejora la arquitectura
- reduce duplicación
- mejora mantenibilidad
- no rompe funcionalidad

Nunca refactorizar por preferencias personales.

---

# Código

Todo código nuevo debe ser:

- sencillo
- legible
- pequeño
- reutilizable
- documentado cuando sea necesario

---

# Archivos

Preferir muchos archivos pequeños.

Evitar archivos gigantes.

---

# Funciones

Una función debe tener:

Una responsabilidad.

Entradas claras.

Salida clara.

---

# Servicios

Toda lógica del negocio pertenece a Services.

Nunca escribir reglas de negocio en React.

Nunca escribir reglas de negocio en Routes.

---

# Repositories

Toda consulta SQL pertenece a Repositories.

Nunca escribir SQL en:

React

Routes

Services

---

# Testing

Toda funcionalidad importante debería incorporar pruebas.

Nunca eliminar tests para que el proyecto compile.

Corregir el problema real.

---

# Git

Realizar commits pequeños.

Ejemplos

```
feat: add inventory movements

fix: forecast calculation

refactor: split product service

docs: update AI context
```

Evitar commits enormes.

---

# Documentación

Cuando una decisión arquitectónica cambie:

Actualizar:

AI_CONTEXT.md

README.md

PROJECT_ROADMAP.md

si corresponde.

La documentación forma parte del software.

---

# Rendimiento

Optimizar únicamente cuando exista evidencia.

No realizar optimizaciones prematuras.

---

# Seguridad

Nunca confiar en datos del cliente.

Validar siempre en el backend.

Nunca registrar:

- contraseñas
- tokens
- secretos
- credenciales

---

# Dependencias

Antes de instalar una librería responder:

¿Resuelve un problema real?

¿Puede evitarse?

¿Tiene mantenimiento activo?

¿Complica la arquitectura?

Si la respuesta genera dudas, no instalarla.

---

# Continuidad entre IAs

Una IA nunca debe asumir que es la única que trabajará en el proyecto.

Debe dejar el código preparado para que otra IA pueda continuar inmediatamente.

---

# Decisiones

Cuando existan varias alternativas razonables:

Explicar brevemente:

- opción A
- opción B
- recomendación
- motivo

Después implementar únicamente la opción aprobada.

---

# Prohibiciones

Nunca:

❌ reiniciar el proyecto

❌ cambiar el stack

❌ eliminar módulos completos sin justificación

❌ romper la arquitectura

❌ introducir código temporal

❌ duplicar lógica

❌ escribir código sin entender el dominio

❌ modificar cientos de archivos innecesariamente

❌ hacer commits gigantes

---

# Principio de negocio

Toda funcionalidad nueva debe responder a una de estas preguntas:

¿Reduce la merma?

¿Mejora la planificación?

¿Mejora la trazabilidad?

¿Reduce costes?

¿Mejora la productividad?

Si la respuesta es "no", revisar si realmente pertenece al proyecto.

---

# Comunicación

Cuando una IA necesite detenerse deberá indicar claramente:

Estado actual.

Trabajo realizado.

Trabajo pendiente.

Riesgos.

Próximo paso recomendado.

Así otra IA podrá continuar inmediatamente.

---

# Definición de éxito

Una IA habrá realizado un buen trabajo cuando:

- la arquitectura siga siendo clara
- el código compile
- las pruebas pasen
- el proyecto sea más mantenible que antes
- otro desarrollador pueda continuar sin dificultad

Ese es el criterio principal de calidad.

---

# Regla de Oro

Antes de escribir código, comprender el problema.

Antes de modificar arquitectura, comprender el sistema.

Antes de optimizar, medir.

Antes de terminar, validar.

El objetivo no es escribir más código.

El objetivo es construir el mejor software posible para la planificación inteligente de producción.

# 10. Especificación Funcional del Negocio

## Objetivo

Este capítulo describe el funcionamiento del negocio.

No define la implementación técnica.

Define cómo debe comportarse el sistema desde el punto de vista funcional.

Toda decisión de desarrollo deberá respetar estas reglas.

---

# Misión del sistema

Producción Inteligente debe ayudar a cada tienda a producir exactamente la cantidad necesaria para satisfacer la demanda prevista minimizando:

- merma
- roturas de stock
- exceso de inventario
- costes operativos

La planificación será el núcleo del sistema.

---

# Flujo principal del negocio

El flujo diario será:

```
Ventas históricas
        │
        ▼
Forecast
        │
        ▼
Inventario disponible
        │
        ▼
Motor de Producción
        │
        ▼
Orden de Producción
        │
        ▼
Fabricación
        │
        ▼
Inventario actualizado
        │
        ▼
Ventas
        │
        ▼
Merma
        │
        ▼
KPIs
```

Cada etapa alimenta a la siguiente.

---

# Empresa

Cada empresa representa un cliente independiente del SaaS.

Cada empresa tendrá:

- configuración
- usuarios
- tiendas
- productos
- recetas
- inventario
- forecast
- producción
- dashboards

Toda la información estará aislada.

---

# Usuarios

Cada usuario pertenece a una empresa.

Podrá desempeñar distintos roles.

Ejemplos:

- Administrador
- Director General
- Director de Operaciones
- Responsable de Producción
- Gerente de Tienda
- Supervisor
- Consulta

Los permisos dependerán del rol.

---

# Tiendas

Cada tienda representa una unidad operativa.

Cada tienda tendrá:

- nombre
- código
- estado
- horario
- capacidad
- calendario
- inventario
- forecast
- producción

Las tiendas funcionan de manera independiente, pero forman parte de una misma empresa.

---

# Líneas de negocio

Permiten organizar los productos.

Ejemplos:

- Pan
- Bollería
- Salado
- Diario
- Platos Calientes

Cada producto pertenece únicamente a una línea de negocio.

---

# Productos

Todo producto tendrá como mínimo:

- código
- nombre
- línea de negocio
- unidad
- vida útil
- estado
- coste
- precio
- receta asociada

Nunca existirán productos duplicados.

---

# Vida útil

La vida útil determina cuánto tiempo puede permanecer un producto disponible para la venta.

Ejemplo:

Pan → 1 día

Bollería → 1 día

Diario → 2 días

Platos Calientes → 2 días

La vida útil afecta directamente al cálculo de producción y a la merma.

---

# Recetas

Cada producto podrá tener una receta.

Una receta estará formada por:

- ingredientes
- cantidades
- rendimiento
- coste
- versión

Las recetas nunca se eliminarán.

Siempre deberán conservar su historial.

---

# Ingredientes

Representan materias primas.

Cada ingrediente podrá utilizarse en múltiples recetas.

Ejemplos:

- Harina
- Azúcar
- Chocolate
- Mantequilla
- Queso

En el futuro permitirán calcular necesidades de compra.

---

# Inventario

El inventario representa el stock disponible.

Existirán distintos tipos:

- Inventario de tienda
- Inventario de producción
- Inventario en tránsito

El inventario nunca será un valor aislado.

Siempre será el resultado de los movimientos registrados.

---

# Movimientos de inventario

Todo cambio de inventario deberá generar un movimiento.

Tipos:

- Entrada
- Producción
- Transferencia
- Venta
- Ajuste
- Caducidad
- Merma

Esto garantiza la trazabilidad completa.

---

# Forecast

El forecast representa la previsión de demanda.

Inicialmente podrá alimentarse mediante:

- histórico de ventas
- ajustes manuales

Posteriormente incorporará:

- estacionalidad
- festivos
- clima
- inteligencia artificial

El forecast nunca sustituye la decisión humana, sino que la apoya.

---

# Producción

La producción representa la cantidad recomendada para fabricar.

El sistema calculará automáticamente la producción propuesta.

El usuario podrá:

- aceptar
- modificar
- justificar cambios

Toda modificación manual deberá quedar registrada.

---

# Orden de Producción

Cada orden contendrá:

- tienda
- fecha
- productos
- cantidades
- estado
- usuario responsable
- fecha de creación

Estados posibles:

- Borrador
- Pendiente
- Confirmada
- En producción
- Finalizada
- Cancelada

---

# Ventas

Las ventas representan el consumo real.

Son la principal fuente de información para mejorar el forecast.

Nunca deberán eliminarse.

---

# Merma

La merma representa producto no vendido o no aprovechable.

Tipos:

- Operativa
- Caducidad
- Rotura
- Error
- Calidad

La merma deberá poder analizarse por:

- tienda
- producto
- línea de negocio
- fecha
- causa

---

# KPIs

El sistema calculará automáticamente indicadores.

Ejemplos:

- Producción diaria
- Producción semanal
- Producción mensual
- Venta
- Merma
- Rentabilidad
- Coste
- Rotación
- Cobertura
- Cumplimiento del forecast

Los KPIs nunca se introducirán manualmente.

---

# Dashboard Ejecutivo

El Dashboard Ejecutivo responderá preguntas como:

- ¿Cómo está produciendo la empresa?
- ¿Dónde existe mayor merma?
- ¿Qué tiendas tienen problemas?
- ¿Qué productos generan mayor rentabilidad?
- ¿Cómo evoluciona el forecast?

Debe mostrar únicamente información accionable.

---

# Objetivo del negocio

Toda funcionalidad futura deberá contribuir a uno o varios de estos objetivos:

- Reducir la merma.
- Mejorar el forecast.
- Optimizar la producción.
- Disminuir costes.
- Mejorar la rentabilidad.
- Aumentar la trazabilidad.
- Facilitar la toma de decisiones.

Si una funcionalidad no contribuye a estos objetivos, deberá justificarse antes de implementarse.

---

# Visión a largo plazo

Producción Inteligente no será únicamente un sistema de gestión.

Su objetivo final es convertirse en un asistente inteligente capaz de recomendar, explicar y optimizar automáticamente la producción diaria de cada tienda utilizando datos históricos, reglas de negocio e inteligencia artificial.

Toda evolución futura del sistema deberá acercarlo progresivamente a esa visión.

# 11. Estándares de Ingeniería y Desarrollo

## Objetivo

Este capítulo define los estándares oficiales de desarrollo del proyecto.

Todo código nuevo deberá cumplir estas normas.

La consistencia del código es más importante que las preferencias personales del desarrollador o de la Inteligencia Artificial.

---

# Filosofía

Siempre priorizar:

- claridad
- simplicidad
- mantenibilidad
- reutilización
- legibilidad

Nunca escribir código únicamente para que funcione.

Debe ser fácil de entender dentro de cinco años.

---

# Regla de Oro

Antes de escribir código responder:

¿Existe ya una solución?

¿Puede reutilizarse?

¿Estoy duplicando lógica?

¿Estoy rompiendo la arquitectura?

Solo después comenzar a desarrollar.

---

# Organización del código

Cada archivo debe tener una única responsabilidad.

Evitar archivos excesivamente grandes.

Como referencia:

- Componentes React: menos de 300 líneas.
- Services: menos de 400 líneas.
- Routes: menos de 200 líneas.
- Repositories: únicamente acceso a datos.

Si un archivo crece demasiado deberá dividirse.

---

# Organización de funciones

Cada función deberá:

- realizar una sola tarea
- tener un nombre descriptivo
- recibir únicamente los parámetros necesarios
- devolver un único resultado claro

Evitar funciones con múltiples responsabilidades.

---

# Nombres

Variables

```
forecast
inventory
productionOrder
```

Funciones

```
calculateForecast()

createStore()

updateInventory()

generateProductionPlan()
```

Componentes React

```
DashboardCard

ProductionTable

InventoryChart
```

Evitar abreviaturas innecesarias.

---

# Comentarios

Solo escribir comentarios cuando aporten contexto.

No comentar código evidente.

Incorrecto

```ts
// Incrementa uno
count++;
```

Correcto

```ts
// La producción nunca puede ser negativa según las reglas del negocio.
```

---

# Duplicación

Nunca copiar código.

Si una lógica aparece dos veces:

Extraerla.

La duplicación incrementa el coste de mantenimiento.

---

# Complejidad

Evitar:

- condicionales anidados
- funciones enormes
- múltiples niveles de responsabilidad

Preferir pequeñas funciones reutilizables.

---

# Manejo de errores

Todo error deberá:

- detectarse
- registrarse
- comunicarse correctamente

Nunca ocultar errores silenciosamente.

---

# Validaciones

Validar siempre:

- entrada
- negocio
- persistencia

No depender únicamente del frontend.

---

# Testing

Todo desarrollo importante deberá incorporar pruebas.

Prioridad:

1. Services
2. Repositories
3. Routes
4. Frontend

La lógica crítica siempre debe estar cubierta.

---

# Refactorización

Refactorizar únicamente cuando:

- mejora el diseño
- reduce complejidad
- elimina duplicación
- facilita evolución

Nunca refactorizar únicamente por gustos personales.

---

# Performance

Optimizar únicamente cuando existan datos objetivos.

Orden de prioridad:

1. Algoritmos.
2. Consultas.
3. Índices.
4. Caché.

No optimizar prematuramente.

---

# Seguridad

Nunca confiar en datos del cliente.

Siempre validar en el Worker.

Nunca almacenar:

- contraseñas en texto plano
- secretos
- tokens
- claves privadas

---

# Logging

Registrar únicamente información útil.

Ejemplos:

- usuario
- operación
- duración
- resultado

Nunca registrar datos sensibles.

---

# Gestión de dependencias

Antes de instalar una dependencia responder:

- ¿Resuelve un problema real?
- ¿Está mantenida?
- ¿Es ligera?
- ¿Puede evitarse?

Si la respuesta es dudosa, no instalarla.

---

# Flujo de trabajo

Todo cambio seguirá este orden:

1. Analizar.
2. Diseñar.
3. Implementar.
4. Probar.
5. Validar.
6. Documentar.
7. Commit.

Nunca invertir este orden.

---

# Commits

Los commits deben ser:

- pequeños
- claros
- frecuentes

Ejemplos

```
feat: add product repository

fix: inventory calculation

refactor: split dashboard service

test: add forecast unit tests

docs: update AI context
```

Evitar commits con múltiples objetivos.

---

# Pull Requests

Toda Pull Request deberá responder:

- ¿Qué problema resuelve?
- ¿Qué cambia?
- ¿Qué riesgos introduce?
- ¿Cómo se ha validado?

---

# Definition of Ready

Antes de comenzar una tarea debe existir:

- objetivo claro
- alcance definido
- dependencias identificadas
- arquitectura conocida

Nunca desarrollar tareas ambiguas.

---

# Definition of Done

Una tarea únicamente estará terminada cuando:

- funciona correctamente
- mantiene la arquitectura
- pasa lint
- pasa typecheck
- pasa tests
- pasa build
- está documentada si procede
- no introduce regresiones

---

# Calidad del proyecto

La calidad del proyecto se medirá por:

- facilidad de mantenimiento
- claridad del código
- estabilidad
- escalabilidad
- facilidad para incorporar nuevos desarrolladores o nuevas IA

No por el número de líneas de código.

---

# Principio Final

Todo cambio debe dejar el proyecto en mejor estado que antes.

Si una modificación hace el sistema más complejo sin aportar un beneficio claro, debe reconsiderarse antes de integrarse.

# 12. Arquitectura Funcional del SaaS

## Objetivo

Este capítulo define la arquitectura funcional del producto.

Mientras los capítulos anteriores describen la arquitectura técnica, este capítulo describe cómo estará organizado el sistema desde la perspectiva del usuario.

El objetivo es construir un SaaS intuitivo, escalable y fácil de utilizar.

---

# Filosofía

El usuario nunca debe navegar pensando en tablas de base de datos.

Debe navegar pensando en su trabajo diario.

La interfaz debe reflejar el negocio.

No la implementación.

---

# Módulos principales

La plataforma estará organizada en los siguientes módulos.

```
Dashboard

Empresas

Usuarios

Tiendas

Líneas de negocio

Productos

Recetas

Inventario

Forecast

Producción

Ventas

Merma

KPIs

Reportes

Configuración
```

Cada módulo será independiente.

---

# Dashboard

Será la pantalla principal.

Debe responder inmediatamente:

- ¿Cómo está funcionando la empresa?

- ¿Qué problemas existen?

- ¿Qué necesita atención hoy?

No debe convertirse en una pantalla llena de información.

Debe mostrar únicamente indicadores accionables.

---

# Empresas

Visible únicamente para administradores.

Permitirá:

- crear empresas

- editar empresas

- activar

- desactivar

- configurar parámetros generales

---

# Usuarios

Permitirá gestionar:

- usuarios

- roles

- permisos

- equipos

- acceso

Cada usuario tendrá un perfil claramente definido.

---

# Tiendas

Cada tienda dispondrá de:

- información general

- configuración

- inventario

- forecast

- producción

- ventas

- merma

La tienda será una unidad completamente independiente.

---

# Productos

Permitirá administrar:

- catálogo

- categorías

- líneas

- vida útil

- costes

- precios

- estado

No permitirá eliminar productos utilizados históricamente.

---

# Recetas

Cada receta incluirá:

- ingredientes

- cantidades

- rendimiento

- coste

- historial de versiones

Las modificaciones deberán conservar el historial.

---

# Inventario

Mostrará:

- stock actual

- movimientos

- caducidades

- ajustes

- transferencias

- cobertura

Toda modificación quedará registrada.

---

# Forecast

Permitirá visualizar:

- previsión diaria

- semanal

- mensual

- comparación con histórico

- ajustes manuales

- confianza del modelo

El forecast será uno de los módulos más importantes del sistema.

---

# Producción

Representará la propuesta automática generada por el sistema.

El usuario podrá:

- revisar

- modificar

- aprobar

- confirmar

Toda modificación deberá registrarse.

---

# Ventas

Permitirá consultar:

- ventas diarias

- ventas por tienda

- ventas por producto

- tendencias

Las ventas alimentarán automáticamente el forecast.

---

# Merma

Mostrará:

- cantidad

- coste

- causa

- tienda

- producto

- evolución

La merma será uno de los indicadores principales del negocio.

---

# KPIs

Existirán distintos niveles.

## Dirección

- rentabilidad

- ventas

- merma

- forecast

- margen

## Producción

- producción diaria

- cumplimiento

- eficiencia

- desperdicio

## Tiendas

- inventario

- ventas

- rotación

- cobertura

Cada perfil verá únicamente la información relevante.

---

# Reportes

El sistema permitirá generar informes.

Ejemplos:

- PDF

- Excel

- CSV

Todos los reportes deberán poder filtrarse.

---

# Configuración

Permitirá administrar:

- parámetros generales

- unidades

- calendarios

- festivos

- impuestos

- preferencias

No contendrá información operativa.

---

# Navegación

La navegación principal será:

```
Dashboard

↓

Operación

↓

Análisis

↓

Administración
```

La estructura debe mantenerse sencilla.

---

# Flujo diario del usuario

Un responsable de producción normalmente seguirá este recorrido:

```
Dashboard

↓

Forecast

↓

Producción

↓

Confirmación

↓

Inventario

↓

KPIs
```

El sistema debe facilitar este flujo.

---

# Flujo del gerente

```
Dashboard

↓

Ventas

↓

Merma

↓

Rentabilidad

↓

Reportes
```

---

# Flujo del administrador

```
Empresas

↓

Usuarios

↓

Configuración

↓

Auditoría
```

---

# Diseño de pantallas

Cada pantalla deberá responder únicamente a un objetivo principal.

Evitar pantallas con múltiples responsabilidades.

---

# Principios UX

Siempre priorizar:

- claridad

- velocidad

- consistencia

- simplicidad

- accesibilidad

Nunca diseñar pensando únicamente en estética.

La productividad del usuario es el objetivo principal.

---

# Escalabilidad funcional

Todo nuevo módulo deberá integrarse en esta arquitectura.

Nunca crear funcionalidades aisladas.

Todo deberá formar parte del flujo natural del negocio.

---

# Objetivo final

El usuario debe poder gestionar toda la producción de su empresa desde una única plataforma.

La navegación deberá resultar natural incluso para usuarios con poca experiencia tecnológica.

Cada pantalla deberá ayudar al usuario a tomar mejores decisiones.

# 14. Seguridad, Auditoría y Trazabilidad

## Objetivo

La seguridad constituye uno de los pilares fundamentales del proyecto.

Toda acción importante realizada dentro del sistema deberá poder identificarse, auditarse y reconstruirse posteriormente.

El sistema deberá proteger tanto la información de las empresas como la integridad de los datos.

---

# Principios

La seguridad debe cumplir cuatro objetivos:

- Confidencialidad
- Integridad
- Disponibilidad
- Trazabilidad

Todas las funcionalidades deberán respetar estos principios.

---

# Autenticación

Todo acceso al sistema requerirá autenticación.

Ningún recurso privado podrá ser consultado sin un usuario autenticado.

La autenticación será responsabilidad exclusiva del backend.

---

# Autorización

La autenticación identifica quién es el usuario.

La autorización determina qué puede hacer.

Nunca asumir que un usuario autenticado tiene acceso a toda la información.

---

# Roles

El sistema soportará distintos niveles de acceso.

Ejemplo:

Administrador Global

Administrador Empresa

Director

Supervisor

Responsable de Producción

Gerente de Tienda

Consulta

Cada rol dispondrá únicamente de los permisos necesarios.

---

# Principio de mínimo privilegio

Todo usuario tendrá únicamente los permisos imprescindibles para desempeñar su trabajo.

Nunca conceder permisos por comodidad.

---

# Aislamiento de empresas

Una empresa nunca podrá acceder a información perteneciente a otra empresa.

Este principio es obligatorio.

Todas las consultas deberán filtrar por:

```
company_id
```

No depender únicamente del frontend para este aislamiento.

---

# Auditoría

Toda operación importante deberá quedar registrada.

Ejemplos:

- creación
- modificación
- eliminación lógica
- inicio de sesión
- cierre de sesión
- aprobación de producción
- modificación manual del forecast

---

# Registro de auditoría

Cada evento deberá registrar como mínimo:

- usuario
- empresa
- fecha
- operación
- entidad afectada
- identificador
- valor anterior
- valor nuevo

---

# Historial

Siempre que sea posible deberá mantenerse el historial.

Nunca perder información relevante.

El histórico permitirá:

- reconstruir operaciones
- investigar incidencias
- explicar decisiones
- generar informes

---

# Eliminación

Evitar eliminar información físicamente.

Preferir eliminación lógica mediante:

```
deleted_at
```

Siempre que la legislación lo permita.

---

# Contraseñas

Nunca almacenar contraseñas en texto plano.

Siempre utilizar algoritmos seguros de hash.

El backend será el único responsable de gestionar credenciales.

---

# Tokens

Los tokens nunca deberán:

- registrarse en logs
- almacenarse sin cifrado cuando corresponda
- enviarse innecesariamente

Toda gestión de sesiones deberá ser segura.

---

# Secretos

Nunca incluir en el repositorio:

- claves privadas
- secretos
- tokens
- credenciales
- certificados

Toda configuración sensible deberá gestionarse mediante variables de entorno.

---

# Validación

Todo dato recibido desde el cliente deberá validarse nuevamente en el backend.

Nunca confiar en:

- formularios
- JavaScript
- React

El backend es la autoridad.

---

# Logs

Los logs deberán registrar únicamente información útil.

Ejemplos:

✔ usuario

✔ operación

✔ duración

✔ endpoint

✔ resultado

Nunca registrar:

✘ contraseñas

✘ secretos

✘ tokens

✘ datos bancarios

---

# Protección frente a errores

Los mensajes de error enviados al usuario nunca deberán revelar detalles internos del sistema.

Incorrecto:

```
SQL Error near line 24
```

Correcto:

```
No ha sido posible completar la operación.
```

Los detalles técnicos deberán quedar únicamente en los logs.

---

# Integridad

Toda operación crítica deberá garantizar que los datos permanezcan consistentes.

Nunca dejar información parcialmente actualizada.

---

# Disponibilidad

El sistema deberá diseñarse para minimizar interrupciones.

Las operaciones importantes deberán poder recuperarse cuando sea posible.

---

# Copias de seguridad

La plataforma deberá contemplar mecanismos de respaldo.

Las copias deberán poder restaurarse de forma controlada.

---

# Cumplimiento

El sistema deberá facilitar el cumplimiento de la normativa aplicable en materia de protección de datos.

La implementación concreta dependerá del entorno de despliegue y de la legislación vigente.

---

# Seguridad por diseño

La seguridad no será una funcionalidad añadida al final del proyecto.

Formará parte del diseño desde el primer día.

Toda nueva funcionalidad deberá analizarse también desde el punto de vista de la seguridad.

---

# Objetivo

El usuario debe poder confiar plenamente en que:

- sus datos están protegidos
- sus operaciones quedan registradas
- la información mantiene su integridad
- cada acción puede ser auditada

La seguridad es un requisito funcional del sistema y no una característica opcional.

# 13. Motor de Producción Inteligente

## Objetivo

El Motor de Producción Inteligente constituye el núcleo del sistema.

Toda la plataforma existe para responder automáticamente a una única pregunta:

**¿Qué cantidad debe producir cada tienda de cada producto para satisfacer la demanda prevista minimizando la merma y maximizando la rentabilidad?**

Todo el desarrollo futuro deberá acercar el sistema a este objetivo.

---

# Filosofía

La producción nunca debe calcularse manualmente.

El usuario debe revisar la propuesta.

No crearla desde cero.

El sistema debe convertirse en un asistente inteligente.

---

# Variables utilizadas

El motor utilizará información procedente de múltiples módulos.

Entre ellas:

- Forecast
- Inventario actual
- Inventario reutilizable
- Vida útil
- Producción pendiente
- Stock mínimo
- Stock de seguridad
- Capacidad de producción
- Calendario
- Festivos
- Históricos
- Tendencias
- Eventos especiales
- Merma histórica

Cada una podrá evolucionar de forma independiente.

---

# Fórmula conceptual

La producción propuesta seguirá conceptualmente la siguiente expresión:

```
Producción

=

Forecast

+

Stock de seguridad

+

Reposición

-

Inventario disponible

-

Inventario reutilizable

-

Producción pendiente

+

Merma prevista
```

Esta fórmula podrá ampliarse en futuras versiones.

---

# Forecast

El Forecast representa la demanda esperada.

Inicialmente podrá obtenerse mediante:

- histórico
- ajustes manuales

Posteriormente incorporará:

- IA
- clima
- estacionalidad
- promociones
- festivos
- eventos

---

# Inventario disponible

Antes de producir deberá conocerse el inventario real.

Nunca producir sin consultar el inventario.

---

# Vida útil

La vida útil modifica completamente el cálculo.

Ejemplo

Pan

1 día

No reutilizable.

Diario

2 días

Puede reutilizar inventario.

Platos calientes

2 días

Puede reutilizar parte del inventario.

La vida útil será uno de los parámetros más importantes del sistema.

---

# Inventario reutilizable

El sistema deberá identificar automáticamente el producto que todavía puede venderse.

Ese inventario disminuirá la producción recomendada.

---

# Stock mínimo

Cada tienda podrá definir un stock mínimo.

El motor intentará respetarlo.

---

# Stock de seguridad

Representa un margen para absorber desviaciones.

No debe confundirse con el inventario mínimo.

---

# Merma prevista

El sistema calculará la merma esperada.

Inicialmente:

valor configurable.

Posteriormente:

modelo predictivo.

---

# Capacidad

Cada tienda tendrá una capacidad máxima.

El sistema nunca propondrá una producción imposible.

Cuando exista exceso:

deberá avisar.

Nunca ocultarlo.

---

# Restricciones

El motor deberá respetar:

- capacidad

- calendario

- cierres

- festivos

- indisponibilidad

- productos desactivados

---

# Simulación

El usuario podrá modificar parámetros.

El sistema recalculará inmediatamente.

No deberá guardar información durante una simulación.

---

# Explicabilidad

Toda recomendación deberá poder explicarse.

Ejemplo.

```
Croissant

Forecast

120

Inventario

18

Stock mínimo

20

Merma prevista

5

Producción recomendada

127
```

La IA nunca debe generar cantidades inexplicables.

---

# Intervención manual

El usuario podrá modificar la producción.

Toda modificación deberá registrar:

- usuario

- fecha

- motivo

- valor anterior

- valor nuevo

---

# Aprendizaje

En versiones futuras el sistema deberá aprender automáticamente.

Ejemplos

- desviaciones

- ventas reales

- mermas

- estacionalidad

- comportamiento de tiendas

---

# Optimización

El objetivo del motor no es producir más.

Es producir mejor.

Los criterios de optimización serán:

1. minimizar merma

2. evitar roturas

3. reducir costes

4. mantener disponibilidad

5. maximizar rentabilidad

---

# IA

La Inteligencia Artificial nunca sustituirá completamente al responsable de producción.

Su función será:

- recomendar

- justificar

- detectar anomalías

- proponer mejoras

La decisión final siempre podrá ser humana.

---

# Escalabilidad

El motor deberá poder calcular simultáneamente:

- cientos de tiendas

- miles de productos

- múltiples empresas

Su diseño deberá permitir optimizaciones futuras sin modificar las reglas del negocio.

---

# Objetivo Final

El Motor de Producción Inteligente es la principal ventaja competitiva del proyecto.

Toda evolución del SaaS deberá fortalecer este módulo.

No es un complemento.

Es el corazón del sistema.

# 15. API, Contratos y Comunicación entre Frontend y Backend

## Objetivo

Este capítulo define las normas oficiales para todas las APIs del proyecto.

Toda comunicación entre el frontend y el backend deberá seguir estas reglas.

Nunca crear APIs con formatos distintos.

La consistencia tiene prioridad.

---

# Filosofía

React nunca accederá directamente a la base de datos.

Toda comunicación seguirá el siguiente flujo.

```
React

↓

HTTP

↓

Cloudflare Worker

↓

Services

↓

Repositories

↓

D1
```

Nunca romper esta arquitectura.

---

# REST

La API seguirá principios REST.

Ejemplos.

```
GET

POST

PUT

PATCH

DELETE
```

Utilizar correctamente cada verbo HTTP.

---

# Versionado

Toda API comenzará con:

```
/api/v1/
```

Ejemplo.

```
/api/v1/products

/api/v1/stores

/api/v1/forecast
```

Esto permitirá evolucionar la plataforma sin romper clientes existentes.

---

# Recursos principales

La API estará organizada por dominios.

```
companies

users

stores

business-lines

products

recipes

ingredients

inventory

forecast

production

sales

waste

dashboard

reports

settings
```

Cada recurso tendrá su propio conjunto de endpoints.

---

# Ejemplo

```
GET

/api/v1/products
```

Lista productos.

---

```
GET

/api/v1/products/{id}
```

Obtiene un producto.

---

```
POST

/api/v1/products
```

Crea un producto.

---

```
PUT

/api/v1/products/{id}
```

Actualiza un producto.

---

```
DELETE

/api/v1/products/{id}
```

Desactiva o elimina lógicamente un producto.

---

# Formato de respuestas

Todas las respuestas deberán compartir el mismo formato.

Éxito.

```json
{
  "success": true,
  "data": {}
}
```

---

Error.

```json
{
  "success": false,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product not found."
  }
}
```

Nunca devolver formatos diferentes.

---

# Paginación

Toda lista deberá soportar paginación.

Ejemplo.

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "pageSize": 25,
    "total": 420,
    "pages": 17
  }
}
```

---

# Ordenación

Toda colección deberá permitir:

```
sort

order
```

Ejemplo.

```
?sort=name

?order=asc
```

---

# Filtros

Siempre que tenga sentido.

Ejemplos.

```
status

store

businessLine

date

company
```

---

# Búsqueda

Las búsquedas deberán ser independientes de la paginación.

Ejemplo.

```
?q=croissant
```

---

# Fechas

Todas las fechas utilizarán:

ISO-8601.

Ejemplo.

```
2026-09-15T08:35:00Z
```

Nunca formatos locales.

---

# Identificadores

Todos los recursos tendrán un identificador único.

Nunca utilizar nombres como identificadores.

---

# Validación

Toda petición será validada antes de ejecutar lógica de negocio.

Ejemplos.

- tipos

- campos obligatorios

- rangos

- permisos

---

# Errores

Nunca devolver:

```
500

Internal Server Error
```

como única información.

Siempre proporcionar un código de error conocido.

Ejemplo.

```
FORECAST_NOT_AVAILABLE

STORE_DISABLED

INVALID_PRODUCT
```

---

# Idempotencia

Las operaciones deberán respetar el comportamiento esperado.

GET

Nunca modifica datos.

POST

Crea recursos.

PUT

Reemplaza.

PATCH

Actualiza parcialmente.

DELETE

Elimina o desactiva.

---

# Seguridad

Toda API privada requerirá autenticación.

Toda operación sensible requerirá autorización.

---

# Documentación

Toda API nueva deberá documentar:

Objetivo.

Parámetros.

Respuesta.

Errores.

Ejemplos.

---

# Compatibilidad

Nunca romper clientes existentes.

Los cambios incompatibles deberán introducirse mediante una nueva versión.

---

# Tiempo de respuesta

Objetivo.

Operaciones simples.

Menos de 300 ms.

Consultas complejas.

Menos de 1 segundo.

Procesos pesados.

Asíncronos cuando sea posible.

---

# Objetivo Final

La API debe ser consistente, predecible y fácil de consumir.

El frontend nunca debe necesitar conocer cómo funciona internamente el backend.

La API constituye el contrato oficial entre ambas capas.

Toda evolución futura deberá respetar este contrato.

# 16. Testing, Calidad y Fiabilidad

## Objetivo

La calidad del software constituye un requisito funcional del proyecto.

El objetivo no es únicamente que el sistema funcione.

Debe seguir funcionando durante años mientras evoluciona.

Toda nueva funcionalidad deberá mantener la estabilidad del sistema.

---

# Filosofía

El proyecto prioriza:

- estabilidad
- mantenibilidad
- confianza
- evolución continua

Cada cambio debe aumentar la calidad del sistema.

Nunca reducirla.

---

# Pirámide de Testing

El proyecto seguirá la siguiente estrategia.

```
                E2E

        Integration Tests

           Unit Tests
```

La mayor parte de las pruebas serán unitarias.

---

# Unit Tests

Responsabilidad

Validar pequeñas unidades de lógica.

Ejemplos

- cálculo de forecast

- cálculo de producción

- validaciones

- inventario

Los Unit Tests serán rápidos.

---

# Integration Tests

Validan la interacción entre componentes.

Ejemplos

Service

↓

Repository

↓

Database

Permiten detectar problemas de integración.

---

# End-to-End

Validan procesos completos.

Ejemplo

Login

↓

Forecast

↓

Producción

↓

Confirmación

↓

Dashboard

No es necesario cubrir todos los casos mediante E2E.

---

# Cobertura

La cobertura es una métrica.

No un objetivo.

Es preferible:

80 % de pruebas útiles

que

100 % de pruebas irrelevantes.

---

# Qué debe probarse

Siempre.

✔ reglas del negocio

✔ cálculos

✔ permisos

✔ inventario

✔ forecast

✔ producción

✔ APIs

---

# Qué no necesita pruebas exhaustivas

Generalmente.

- componentes puramente visuales

- constantes

- tipos

- estilos

---

# Regresión

Cada bug importante corregido deberá incorporar un test.

El objetivo es impedir que el mismo error vuelva a aparecer.

---

# Testing del Motor Inteligente

Será el módulo con mayor cobertura.

Deberán probarse.

- forecast

- inventario

- vida útil

- reutilización

- merma

- producción

- capacidad

---

# Calidad del código

Antes de integrar cualquier cambio.

Debe pasar.

```
npm run lint
```

---

Después.

```
npm run typecheck
```

---

Después.

```
npm test
```

---

Finalmente.

```
npm run build
```

---

# Orden obligatorio

Nunca ejecutar únicamente build.

Siempre.

```
Lint

↓

Typecheck

↓

Tests

↓

Build
```

---

# Definition of Green

El proyecto estará "Green" únicamente cuando.

✔ lint correcto

✔ typecheck correcto

✔ tests correctos

✔ build correcto

---

# Código roto

Nunca continuar desarrollando sobre un proyecto con errores.

Primero reparar.

Después continuar.

---

# Calidad antes que velocidad

Es preferible invertir una hora más.

Que introducir deuda técnica.

---

# Revisión

Todo cambio importante deberá responder.

¿Es más sencillo?

¿Es más mantenible?

¿Es más seguro?

¿Es más claro?

Si la respuesta es "no", revisar la implementación.

---

# Deuda Técnica

Toda deuda técnica deberá registrarse.

Nunca ignorarse.

Cuando sea posible.

Resolverla inmediatamente.

---

# Observabilidad

En futuras versiones el sistema incorporará.

- métricas

- logs

- monitorización

- alertas

- trazabilidad

La calidad también depende de la capacidad para detectar problemas.

---

# Calidad del Producto

El éxito del proyecto no se medirá únicamente por nuevas funcionalidades.

También por.

- estabilidad

- facilidad de mantenimiento

- claridad

- ausencia de errores

- facilidad para evolucionar

---

# Principio Final

Cada cambio deberá dejar el proyecto en mejor estado del que estaba antes.

Este principio tendrá prioridad sobre cualquier otra consideración técnica.

# 17. CI/CD, Despliegue y Operaciones

## Objetivo

Este capítulo define el proceso oficial para construir, validar y desplegar Producción Inteligente.

Todo despliegue deberá ser repetible, seguro y verificable.

El objetivo es minimizar errores humanos y garantizar que únicamente llegue a producción código validado.

---

# Filosofía

El despliegue no debe depender de una persona.

Debe depender de un proceso.

Todo cambio debe poder reproducirse en cualquier momento.

---

# Entornos

El proyecto utilizará distintos entornos.

```
Local

↓

Development

↓

Staging

↓

Production
```

Cada entorno tendrá una finalidad específica.

---

# Local

Utilizado por cada desarrollador.

Objetivos.

- desarrollar
- probar
- depurar

Nunca utilizar datos reales de producción.

---

# Development

Entorno compartido.

Objetivos.

- integración
- validaciones
- pruebas funcionales

Puede contener datos de prueba.

---

# Staging

Debe ser lo más parecido posible a Producción.

Objetivos.

- validación final
- pruebas de aceptación
- revisión funcional

Todo despliegue importante deberá pasar por Staging.

---

# Production

Únicamente contendrá código estable.

Nunca utilizar Producción para realizar pruebas.

---

# Pipeline oficial

Todo cambio seguirá este flujo.

```
Desarrollo

↓

Commit

↓

Push

↓

GitHub

↓

CI

↓

Lint

↓

Typecheck

↓

Tests

↓

Build

↓

Deploy

↓

Validación

↓

Producción
```

Nunca saltar etapas.

---

# Validaciones obligatorias

Antes de desplegar.

```
npm run lint
```

---

```
npm run typecheck
```

---

```
npm test
```

---

```
npm run build
```

Solo si las cuatro fases son correctas podrá iniciarse el despliegue.

---

# Compilación

Toda versión desplegada deberá corresponder exactamente con un commit de Git.

Nunca desplegar cambios no versionados.

---

# Migraciones

Las migraciones deberán ejecutarse de forma controlada.

Reglas.

- versionadas
- revisadas
- pequeñas
- reversibles cuando sea posible

Nunca modificar el esquema manualmente en producción.

---

# Variables de entorno

Toda configuración sensible deberá almacenarse mediante variables de entorno.

Ejemplos.

```
DATABASE_URL

JWT_SECRET

API_KEY

R2_BUCKET

ENVIRONMENT
```

Nunca incluir secretos en el código fuente.

---

# Secrets

Nunca almacenar.

- contraseñas
- tokens
- claves privadas
- certificados

Dentro del repositorio.

---

# Rollback

Todo despliegue deberá poder revertirse.

El procedimiento de recuperación deberá estar documentado.

---

# Monitorización

En producción deberán monitorizarse.

- errores
- tiempos de respuesta
- disponibilidad
- consumo
- excepciones

La observabilidad forma parte del producto.

---

# Alertas

El sistema deberá permitir detectar rápidamente.

- caídas
- errores
- degradación del rendimiento
- fallos de despliegue

---

# Disponibilidad

Objetivo.

Alta disponibilidad.

El sistema deberá minimizar interrupciones del servicio.

---

# Escalabilidad

La arquitectura deberá permitir crecer sin rediseños importantes.

Ejemplos.

- más empresas

- más tiendas

- más usuarios

- más productos

- más operaciones

---

# Recuperación

Toda incidencia deberá responder a tres preguntas.

¿Qué ocurrió?

¿Cuándo ocurrió?

¿Cómo se recupera?

---

# Automatización

Siempre que sea posible.

Automatizar.

No depender de procesos manuales repetitivos.

---

# Trazabilidad

Cada despliegue deberá registrar.

- versión
- fecha
- autor
- entorno
- resultado

---

# Principio Operativo

Si un despliegue no puede repetirse automáticamente, el proceso debe mejorarse.

La automatización es un objetivo permanente del proyecto.

---

# Objetivo Final

El despliegue debe ser una operación rutinaria, segura y predecible.

El usuario nunca debería percibir la complejidad técnica que existe detrás del sistema.

# 18. Git, Branching y Estrategia de Versionado

## Objetivo

Este capítulo define el flujo oficial de trabajo con Git.

Todo cambio realizado en el proyecto deberá poder identificarse, revisarse, revertirse y auditarse.

Git forma parte de la arquitectura del proyecto.

---

# Principios

El historial del repositorio debe ser:

- claro
- consistente
- legible
- fácil de revisar

Cada commit debe representar una única idea.

---

# Rama principal

La rama principal será:

```
main
```

Representa siempre una versión estable.

Nunca desarrollar directamente sobre `main`.

---

# Ramas de trabajo

Las nuevas funcionalidades se desarrollarán en ramas independientes.

Ejemplos:

```
feature/authentication

feature/inventory-engine

feature/dashboard-kpis

refactor/router

fix/forecast-calculation
```

Los nombres deberán describir claramente el objetivo.

---

# Convención de commits

Se utilizará Conventional Commits.

Tipos permitidos:

```
feat:
fix:
refactor:
test:
docs:
style:
perf:
build:
ci:
chore:
```

Ejemplos:

```
feat: add inventory movements

fix: correct production calculation

refactor: split forecast service

docs: update AI context

test: add production engine tests
```

---

# Tamaño de los commits

Los commits deberán ser pequeños.

Un commit debe resolver una única tarea.

Evitar commits con cientos de cambios sin relación.

---

# Antes de hacer commit

Siempre ejecutar:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Si cualquiera falla:

No realizar el commit.

---

# Mensajes de commit

El mensaje debe explicar:

Qué cambia.

No cómo se implementó.

Correcto:

```
feat: add production recommendation endpoint
```

Incorrecto:

```
fixed stuff
```

---

# Pull Requests

Toda Pull Request deberá incluir:

## Objetivo

¿Qué problema resuelve?

## Alcance

¿Qué módulos modifica?

## Riesgos

¿Qué podría verse afectado?

## Validación

¿Cómo se comprobó?

---

# Revisión de código

Antes de aceptar una Pull Request revisar:

- arquitectura
- legibilidad
- duplicación
- complejidad
- pruebas
- documentación

No revisar únicamente si "funciona".

---

# Versionado

El proyecto utilizará Semantic Versioning.

Formato:

```
MAJOR.MINOR.PATCH
```

Ejemplo:

```
1.0.0
```

---

# Cambios MAJOR

Cambios incompatibles.

Ejemplo:

- ruptura de APIs
- rediseño completo

---

# Cambios MINOR

Nueva funcionalidad compatible.

Ejemplo:

- nuevo módulo
- nueva pantalla
- nuevo endpoint

---

# Cambios PATCH

Corrección de errores.

Ejemplo:

- bug
- optimización
- corrección visual

---

# Etiquetas

Toda versión importante deberá etiquetarse.

Ejemplo:

```
v1.0.0

v1.1.0

v1.2.3
```

---

# Releases

Cada Release deberá incluir:

- resumen
- funcionalidades nuevas
- correcciones
- cambios incompatibles
- notas de despliegue

---

# Documentación

Si una modificación afecta a la arquitectura:

Actualizar:

- AI_CONTEXT.md
- PROJECT_ROADMAP.md
- README.md

La documentación debe evolucionar junto con el código.

---

# Historial

Nunca reescribir el historial compartido del repositorio.

La trazabilidad del proyecto es un activo importante.

---

# Calidad del repositorio

El repositorio debe permitir que cualquier desarrollador comprenda:

- qué cambió
- cuándo cambió
- por qué cambió

simplemente leyendo el historial de Git.

---

# Objetivo Final

Git no es únicamente un sistema de control de versiones.

Es la memoria del proyecto.

Cada commit debe contribuir a construir un historial claro, útil y mantenible durante toda la vida del producto.

# 19. Definition of Done (DoD) y Checklist Operativo

## Objetivo

Este capítulo define los criterios oficiales que determinan cuándo una tarea, historia de usuario, módulo o Sprint puede considerarse finalizado.

Ningún trabajo se considerará terminado únicamente porque compile o porque "parezca funcionar".

La calidad es un requisito obligatorio.

---

# Filosofía

Una funcionalidad únicamente estará terminada cuando:

- funciona correctamente
- mantiene la arquitectura
- está probada
- está documentada
- puede mantenerse fácilmente

---

# Definition of Ready

Antes de comenzar una tarea deben conocerse claramente:

- objetivo
- alcance
- dependencias
- impacto
- criterios de aceptación

Nunca comenzar desarrollos ambiguos.

---

# Definition of Done

Una tarea se considera terminada únicamente cuando cumple TODOS los siguientes puntos.

---

## Arquitectura

✔ Respeta la arquitectura del proyecto.

✔ No rompe la separación de responsabilidades.

✔ No introduce dependencias innecesarias.

✔ No duplica lógica existente.

---

## Código

✔ El código es claro.

✔ Es legible.

✔ Tiene nombres descriptivos.

✔ Es reutilizable.

✔ Tiene una única responsabilidad.

✔ No contiene código muerto.

✔ No contiene comentarios innecesarios.

---

## Backend

✔ Toda lógica del negocio está en Services.

✔ SQL únicamente en Repositories.

✔ Las Routes únicamente coordinan peticiones.

✔ No existen responsabilidades mezcladas.

---

## Frontend

✔ No contiene lógica del negocio.

✔ Consume únicamente APIs.

✔ Componentes pequeños.

✔ Estado correctamente organizado.

✔ Navegación consistente.

---

## Base de datos

✔ Migraciones correctas.

✔ Relaciones consistentes.

✔ Índices revisados.

✔ Integridad garantizada.

---

## Seguridad

✔ Datos validados.

✔ Permisos revisados.

✔ No existen secretos en el código.

✔ No se registran datos sensibles.

---

## Testing

✔ Existen pruebas cuando corresponde.

✔ No se eliminan pruebas existentes.

✔ No aparecen regresiones conocidas.

---

## Calidad

Debe ejecutarse correctamente:

```bash
npm run lint
```

---

Después.

```bash
npm run typecheck
```

---

Después.

```bash
npm test
```

---

Finalmente.

```bash
npm run build
```

Todos deben finalizar correctamente.

---

## Git

✔ Commit pequeño.

✔ Mensaje descriptivo.

✔ Una única responsabilidad.

✔ Historial limpio.

---

## Documentación

Actualizar cuando corresponda:

- README.md

- PROJECT_ROADMAP.md

- AI_CONTEXT.md

- documentación técnica

Nunca dejar documentación obsoleta.

---

# Checklist antes del Commit

Antes de ejecutar:

```bash
git commit
```

Comprobar:

☐ Código revisado.

☐ Arquitectura respetada.

☐ Sin duplicaciones.

☐ Sin TODO críticos.

☐ Sin console.log innecesarios.

☐ Sin código comentado.

☐ Sin archivos temporales.

☐ Sin secretos.

☐ Tests correctos.

☐ Build correcto.

---

# Checklist antes del Merge

☐ Revisión completada.

☐ Sin conflictos.

☐ Sin deuda técnica conocida.

☐ Documentación actualizada.

☐ Código entendible.

☐ Riesgos identificados.

---

# Checklist antes del Deploy

☐ Lint.

☐ Typecheck.

☐ Tests.

☐ Build.

☐ Variables de entorno.

☐ Migraciones.

☐ Versionado.

☐ Release Notes.

☐ Validación final.

---

# Definition of Sprint Done

Un Sprint únicamente estará terminado cuando:

- Todos los objetivos planificados estén implementados.
- El proyecto compile correctamente.
- Todos los tests pasen.
- No existan errores críticos abiertos.
- La documentación esté actualizada.
- Se haya realizado el commit final.
- El Sprint pueda desplegarse sin modificaciones adicionales.

---

# Deuda Técnica

Toda deuda técnica detectada deberá:

- documentarse
- priorizarse
- planificarse

Nunca ignorarse deliberadamente.

---

# Calidad Continua

Cada Sprint deberá dejar el proyecto en mejor estado que el Sprint anterior.

Nunca utilizar un Sprint para introducir desorden.

---

# Criterio Final

La pregunta definitiva será siempre:

"¿Podría otro desarrollador continuar este proyecto mañana sin necesitar explicaciones adicionales?"

Si la respuesta es "no", el trabajo todavía no está terminado.

---

# Objetivo

El propósito de la Definition of Done no es ralentizar el desarrollo.

Su objetivo es garantizar que el proyecto pueda evolucionar durante muchos años sin degradar su calidad.

La calidad es una característica del producto.

No una fase posterior.

# 20. Visión Estratégica 2030 y Principios del Proyecto

## Objetivo

Este capítulo define la visión a largo plazo de Producción Inteligente.

No describe funcionalidades concretas.

Describe el propósito permanente del proyecto.

Toda decisión futura deberá alinearse con estos principios.

---

# Visión 2030

Producción Inteligente aspira a convertirse en la plataforma de referencia para la planificación inteligente de producción en panaderías y cadenas de alimentación.

El sistema deberá ayudar a las empresas a producir mejor, desperdiciar menos y tomar decisiones basadas en datos.

No pretende sustituir a las personas.

Pretende aumentar su capacidad de decisión.

---

# Misión

Ayudar a cada empresa a fabricar únicamente aquello que realmente necesita producir.

Reducir la incertidumbre.

Reducir el desperdicio.

Mejorar la rentabilidad.

Automatizar procesos repetitivos.

Convertir los datos en decisiones.

---

# Principios Estratégicos

Todas las decisiones deberán respetar estos principios.

## El negocio primero

La tecnología existe para resolver problemas del negocio.

Nunca desarrollar funcionalidades únicamente por interés técnico.

---

## Arquitectura sostenible

El proyecto debe poder evolucionar durante muchos años.

Evitar soluciones rápidas que comprometan el futuro.

---

## Simplicidad

Siempre elegir la solución más sencilla que resuelva correctamente el problema.

La simplicidad facilita la evolución.

---

## Calidad

La calidad nunca será negociable.

Cada Sprint deberá mejorar el proyecto.

Nunca degradarlo.

---

## Escalabilidad

El sistema deberá crecer sin necesidad de rediseños completos.

El aumento de usuarios no debe obligar a cambiar la arquitectura.

---

## Inteligencia Artificial

La IA constituye una herramienta.

No el objetivo.

Su función será:

- recomendar

- detectar patrones

- explicar decisiones

- optimizar procesos

Siempre manteniendo el control humano.

---

## Transparencia

Toda recomendación generada por el sistema deberá poder explicarse.

Nunca ofrecer resultados imposibles de justificar.

La confianza del usuario depende de comprender por qué el sistema recomienda una acción.

---

## Datos

Los datos pertenecen a la empresa cliente.

El sistema únicamente los procesa.

Toda decisión deberá proteger su confidencialidad.

---

## Usuario

El éxito del proyecto se medirá por el éxito de sus usuarios.

Una funcionalidad compleja que nadie utiliza no aporta valor.

---

# Evolución prevista

En los próximos años el sistema podrá incorporar:

- Predicción avanzada mediante IA.

- Optimización automática de producción.

- Simulación de escenarios.

- Recomendaciones comerciales.

- Integración con ERP.

- Integración con TPV.

- Integración con plataformas eCommerce.

- Alertas inteligentes.

- Planificación automática.

Todas estas funcionalidades deberán integrarse sin romper la arquitectura existente.

---

# Política de Contexto de Ejecución

Toda operación sobre datos de negocio deberá ejecutarse dentro de un RequestContext autenticado.

El cliente nunca podrá proporcionar ni modificar directamente:

- `companyId`
- `userId`
- `role`

Estos valores deberán obtenerse exclusivamente a partir de la sesión autenticada validada por el middleware.

La arquitectura deberá evolucionar progresivamente hacia un único objeto:

```typescript
interface RequestContext {
  userId: string;
  companyId: string;
  role: string;
}
```

Todas las capas nuevas del sistema deberán diseñarse para aceptar un RequestContext en lugar de parámetros aislados.

Objetivos:

- Eliminar el paso manual de companyId entre capas.
- Centralizar la información del usuario autenticado.
- Facilitar futuras extensiones (permisos, locale, timezone, feature flags, auditoría, tracing).
- Reducir errores de seguridad.
- Mantener una arquitectura consistente.

Ninguna decisión de diseño debe dificultar esta evolución (por ejemplo, omitiendo paso de parámetros estandarizados entre el Router y los Servicios).

---

# Cultura del Proyecto

Producción Inteligente se desarrollará siguiendo una cultura de mejora continua.

Cada Sprint debe responder a una pregunta:

¿El sistema es mejor hoy que ayer?

Si la respuesta es negativa, el Sprint no ha cumplido su objetivo.

---

# Continuidad

El proyecto debe poder continuar independientemente del equipo que participe.

La documentación constituye parte del producto.

El conocimiento nunca debe depender de una única persona o de una única Inteligencia Artificial.

---

# Responsabilidad

Cada desarrollador y cada IA son responsables de dejar el proyecto en mejor estado del que lo encontraron.

Este principio tiene prioridad sobre cualquier preferencia individual.

---

# Visión del Producto

Producción Inteligente no será únicamente un software de planificación.

Será una plataforma capaz de:

- comprender el negocio,

- anticipar necesidades,

- reducir desperdicios,

- mejorar la productividad,

- facilitar decisiones,

- generar conocimiento.

El objetivo final es que cada decisión importante pueda estar respaldada por información fiable y explicable.

---

# Declaración Final

Este documento constituye la referencia principal para la evolución del proyecto.

Siempre que exista una duda sobre cómo desarrollar una funcionalidad, deberá prevalecer lo definido en este documento.

La arquitectura, el dominio del negocio, la calidad del software y la visión estratégica forman un único conjunto inseparable.

Todo cambio deberá contribuir a construir un producto más sólido, más mantenible y más útil para sus usuarios.

---

# 19. Evolución de Arquitectura (Sprint 4)

## Multi-tenant SaaS

El proyecto ha transicionado hacia una arquitectura multiempresa (SaaS).

- **Seguridad por Defecto:** Todos los repositorios exigen explícitamente el `companyId` para ejecutar operaciones (ej: `WHERE company_id = ?`). Un cliente no puede consultar o manipular datos de otra empresa.
- **Aislamiento en API:** Las rutas protegidas reciben el `companyId` inyectado forzosamente por el `AuthContext` validado, ignorando intentos del cliente por suplantarlo en la petición.
- **Cloudflare R2:** Almacenamiento aislado particionado lógicamente por prefijo `company_[companyId]/`.

## RequestContext (Future-Proofing)

La arquitectura está preparada para mutar el actual `companyId` propagado individualmente hacia un objeto compartido de tipo `RequestContext`:

```typescript
interface RequestContext {
  userId: string;
  companyId: string;
  role: string;
}
```

Ninguna decisión de diseño debe dificultar esta evolución (por ejemplo, omitiendo paso de parámetros estandarizados entre el Router y los Servicios).

---

**Fin del documento**

## Dominio: Recetas e Inventario

Las **Recetas** (Recipes) representan los escandallos (Bill of Materials) para producir artículos.

- Se ha incluido `yield_quantity` (Rendimiento por lote) para permitir escalar fórmulas a diferentes volúmenes sin pérdida de precisión.
- Están compuestas por `recipe_items` (Ingredientes).
- Mantienen estricto Multi-tenant y utilizan el `RequestContext` validado por sesión.
