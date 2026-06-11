# Mecanica Front

Aplicacion frontend para el sistema de gestion de taller mecanico, construida con Next.js, React, Tailwind CSS y pnpm.

## Requisitos

- Node.js 24. El proyecto incluye `.nvmrc`.
- pnpm.
- Backend de pruebas corriendo en `http://localhost:8011`.

## Tecnologias y librerias

Dependencias principales:

- Next.js `16.2.6`
- React `^19`
- React DOM `^19`
- Base UI React `^1.5.0`
- Tailwind CSS `^4.2.0`
- shadcn `^4.8.0`
- lucide-react `^1.16.0`
- class-variance-authority `^0.7.1`
- clsx `^2.1.1`
- tailwind-merge `^3.3.1`
- tw-animate-css `^1.4.0`
- Vercel Analytics `1.6.1`

Dependencias de desarrollo:

- TypeScript `5.7.3`
- @types/node `^24`
- @types/react `^19`
- @types/react-dom `^19`
- @tailwindcss/postcss `^4.2.0`
- PostCSS `^8.5`

## Configuracion inicial

Usa la version de Node del proyecto:

```bash
nvm install
nvm use
```

Instala dependencias:

```bash
pnpm install
```

Crea el archivo de variables locales tomando como base la plantilla `.env.example`:

```bash
cp .env.example .env.local
```

`.env.example` contiene los nombres de las variables necesarias para correr el proyecto. El archivo `.env.local` no se versiona en Git y debe existir en cada entorno local con los valores correspondientes.

Para desarrollo local, el valor esperado es:

```env
MECANICA_BACKEND_URL=http://localhost:8011
```

## Backend de pruebas

Antes de iniciar el frontend, asegurate de que el backend este corriendo en el puerto `8011`.

El frontend usa la variable `MECANICA_BACKEND_URL` para conectarse al backend desde las rutas internas de Next.js.

## Correr el proyecto

Inicia el servidor de desarrollo:

```bash
pnpm dev
```

Abre la app en:

```text
http://localhost:3000
```

## Scripts disponibles

```bash
pnpm dev
```

Levanta el servidor de desarrollo.

```bash
pnpm build
```

Genera el build de produccion.

```bash
pnpm start
```

Ejecuta el build de produccion.

```bash
pnpm lint
```

Ejecuta ESLint.

## Verificacion rapida

Para revisar tipos de TypeScript:

```bash
pnpm exec tsc --noEmit
```

Si pnpm reporta scripts de build ignorados para dependencias como `sharp` o `msw`, el repo ya incluye `pnpm-workspace.yaml` con esas dependencias aprobadas. Puedes reconstruirlas con:

```bash
pnpm rebuild
```
