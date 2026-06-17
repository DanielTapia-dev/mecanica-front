# Estructura del proyecto y rutas en Next.js

Este documento explica la estructura actual del frontend de MecanicaNext y como funciona el sistema de rutas con Next.js App Router.

El proyecto usa Next.js `16.2.6`, React 19, TypeScript, Tailwind CSS 4 y una organizacion basada en `src/`.

## Objetivo de la estructura

La estructura busca separar tres responsabilidades:

- Codigo de aplicacion: vive en `src/`.
- Configuracion del proyecto: queda en la raiz.
- Documentacion y assets publicos: quedan fuera del codigo de aplicacion.

Esto evita que la raiz del repositorio mezcle rutas, componentes, configuracion, documentacion y recursos estaticos.

## Mapa actual

```text
.
|-- src/
|   |-- app/
|   |   |-- layout.tsx
|   |   |-- globals.css
|   |   |-- api/
|   |   |   `-- auth/
|   |   |       `-- login/
|   |   |           `-- route.ts
|   |   `-- (protected)/
|   |       |-- layout.tsx
|   |       |-- page.tsx
|   |       |-- usuarios/
|   |       |   `-- page.tsx
|   |       `-- departamentos/
|   |           |-- enderezado/
|   |           |   `-- page.tsx
|   |           |-- lavado/
|   |           |   `-- page.tsx
|   |           |-- mecanica/
|   |           |   `-- page.tsx
|   |           `-- pintura/
|   |               `-- page.tsx
|   |-- components/
|   |   |-- layout/
|   |   `-- ui/
|   |-- features/
|   |   |-- auth/
|   |   |-- dashboard/
|   |   |-- departments/
|   |   `-- users/
|   `-- lib/
|       |-- data/
|       |-- theme/
|       `-- utils.ts
|-- docs/
|-- public/
|-- package.json
|-- next.config.mjs
|-- tsconfig.json
|-- components.json
`-- pnpm-lock.yaml
```

## Carpetas principales

`src/app/` contiene las rutas de Next.js. Aqui solo deberian vivir archivos propios del enrutador: `layout.tsx`, `page.tsx`, `route.ts`, `loading.tsx`, `error.tsx`, `not-found.tsx` y carpetas de segmentos.

`src/components/` contiene componentes reutilizables que no pertenecen a una sola feature. En este proyecto incluye `ui/` para componentes base y `layout/` para la estructura visual general.

`src/features/` contiene codigo agrupado por dominio funcional. Es el lugar correcto para pantallas, tablas, formularios, hooks, tipos y servicios especificos de una parte del negocio.

`src/lib/` contiene utilidades compartidas, integraciones transversales, helpers, datos temporales y providers que no pertenecen claramente a una sola pantalla.

`public/` queda en la raiz porque Next sirve esos archivos como assets estaticos.

`docs/` queda en la raiz para documentacion funcional, tecnica y decisiones de arquitectura.

## Por que se usa `src/`

Next.js permite mover `app/` a `src/app/` para separar el codigo de aplicacion de los archivos de configuracion. Al usar `src/`, tambien conviene mover carpetas como `components/` y `lib/` dentro de `src/`.

Reglas importantes:

- `public/` debe permanecer en la raiz.
- `package.json`, `next.config.mjs`, `tsconfig.json` y archivos `.env.*` deben permanecer en la raiz.
- No debe existir una carpeta `app/` en la raiz si se usa `src/app/`, porque Next prioriza la carpeta raiz y puede ignorar `src/app/`.
- El alias `@/*` apunta a `./src/*` en `tsconfig.json`.

## Rutas actuales del proyecto

Las rutas se generan por carpetas y archivos dentro de `src/app/`.

```text
src/app/(protected)/page.tsx
URL: /
Uso: Dashboard principal.

src/app/(protected)/usuarios/page.tsx
URL: /usuarios
Uso: Administracion de usuarios.

src/app/(protected)/departamentos/enderezado/page.tsx
URL: /departamentos/enderezado

src/app/(protected)/departamentos/pintura/page.tsx
URL: /departamentos/pintura

src/app/(protected)/departamentos/mecanica/page.tsx
URL: /departamentos/mecanica

src/app/(protected)/departamentos/lavado/page.tsx
URL: /departamentos/lavado

src/app/api/auth/login/route.ts
URL: /api/auth/login
Uso: Route Handler interno para hacer proxy al backend de login.
```

## Como funciona App Router

En App Router, las carpetas representan segmentos de URL y los archivos especiales definen comportamiento.

`page.tsx` expone una pagina accesible por URL.

Ejemplo:

```text
src/app/(protected)/usuarios/page.tsx -> /usuarios
```

`layout.tsx` envuelve paginas hijas y se mantiene entre navegaciones dentro de su segmento.

En este proyecto:

- `src/app/layout.tsx` es el root layout. Define `html`, `body`, fuentes, metadata y estilos globales.
- `src/app/(protected)/layout.tsx` aplica `AppShell` a las pantallas protegidas.
- `AppShell` monta `ThemeProvider`, `AuthProvider`, `AuthGuard`, `Sidebar`, `Header` y el contenedor principal.

`route.ts` crea un endpoint HTTP dentro de `app/`.

Ejemplo:

```text
src/app/api/auth/login/route.ts -> /api/auth/login
```

Ese archivo puede exportar funciones HTTP como `GET`, `POST`, `PUT`, `PATCH` o `DELETE`.

## Route groups

Una carpeta entre parentesis, como `(protected)`, organiza rutas sin agregar el nombre de la carpeta a la URL.

Por eso:

```text
src/app/(protected)/usuarios/page.tsx
```

se publica como:

```text
/usuarios
```

y no como:

```text
/protected/usuarios
```

En este proyecto `(protected)` agrupa las pantallas que comparten layout autenticado.

## Como agregar nuevas rutas

Para agregar una pagina normal:

```text
src/app/(protected)/clientes/page.tsx -> /clientes
```

Para agregar una ruta anidada:

```text
src/app/(protected)/clientes/[clienteId]/page.tsx -> /clientes/123
```

Para agregar una ruta de API interna:

```text
src/app/api/clientes/route.ts -> /api/clientes
```

Para agregar una seccion protegida con el mismo layout, debe ir dentro de `(protected)`.

## Como agregar nuevas features

La documentacion funcional del sistema gira alrededor de clientes, vehiculos, ordenes de trabajo, repuestos, departamentos, historial y usuarios. Por eso, al crecer el proyecto se recomienda crear features por dominio:

```text
src/features/work-orders/
src/features/clients/
src/features/vehicles/
src/features/spare-parts/
src/features/departments/
src/features/users/
src/features/auth/
```

Dentro de cada feature se recomienda usar esta forma:

```text
src/features/work-orders/
|-- components/
|-- hooks/
|-- services/
|-- types.ts
`-- schemas.ts
```

Usa `components/` para UI de esa feature, `hooks/` para logica de React, `services/` para llamadas al backend, `types.ts` para tipos TypeScript y `schemas.ts` para validaciones si se agregan librerias de formularios o validacion.

## Reglas de mantenimiento

- Mantener `page.tsx` pequenos: deben componer la pantalla, no contener toda la logica.
- Poner componentes especificos del negocio en `src/features/*/components`.
- Poner componentes genericos en `src/components/ui` o `src/components/layout`.
- Usar imports con `@/` para evitar rutas relativas largas.
- Usar `"use client"` solo cuando el archivo necesite estado, efectos, eventos del navegador, contexto o `localStorage`.
- Mantener llamadas sensibles al backend en Route Handlers o servicios server-side cuando aplique.
- No crear carpetas de ruta si no exponen una pagina, layout o endpoint.

## Referencias

- Next.js Project Structure: https://nextjs.org/docs/app/getting-started/project-structure
- Next.js `src` folder: https://nextjs.org/docs/app/api-reference/file-conventions/src-folder
- Next.js Layouts and Pages: https://nextjs.org/docs/app/getting-started/layouts-and-pages
- Next.js Route Handlers: https://nextjs.org/docs/app/getting-started/route-handlers
- Next.js Route Groups: https://nextjs.org/docs/app/api-reference/file-conventions/route-groups
