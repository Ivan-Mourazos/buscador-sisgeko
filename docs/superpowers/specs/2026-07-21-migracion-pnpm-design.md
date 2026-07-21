# Migración a pnpm (workspace unificado) — Diseño

**Fecha:** 2026-07-21
**Estado:** Aprobado — pendiente de plan de implementación
**Objetivo:** Migrar `buscador-sisgeko` de npm a pnpm con un workspace unificado, garantizando que todo siga funcionando en desarrollo local (Windows) **y en el servidor de producción Linux**.

---

## 1. Contexto / estado actual

Estructura del repositorio:

- Raíz: `package.json` orquestador (scripts `install:all`, `dev:backend`, `dev:frontend`).
- `backend/`: CommonJS, Express 5, `mssql`, `bcrypt` (módulo **nativo**), `bcryptjs`, `jsonwebtoken`, `multer`, `nodemailer`, `node-cron`, `dotenv`, `cors`, `cookie-parser`.
- `frontend/`: Vite 8, React 19, Tailwind CSS 4, ESLint 9.

Gestión de paquetes actual:

- npm con instalaciones separadas por carpeta.
- **3 lockfiles npm** trackeados: `package-lock.json` (raíz), `backend/package-lock.json`, `frontend/package-lock.json`.
- Un `pnpm-lock.yaml` huérfano y vacío en la raíz (solo `importers: { .: {} }`).
- Sin `pnpm-workspace.yaml`, sin `engines`, sin `.npmrc`, sin `packageManager`, sin CI/CD, sin Dockerfile.

Despliegue: manual en servidor con **PM2**; el backend sirve `frontend/dist`. `README.md` y `README_DEPLOY.md` usan npm; `backend/server.js:1628` muestra un mensaje con `"npm run build"`.

Entorno:

- Local: Windows 11, Node v24.17.0, **pnpm 11.3.0 ya instalado**, corepack 0.35.0.
- Producción: **servidor Linux** (PM2, arranque vía `systemd`/`pm2 startup`).

`.gitignore` ya ignora `node_modules/` y `.env`.

---

## 2. Decisiones tomadas

1. **Estructura:** workspace unificado de pnpm (backend + frontend en un solo `pnpm install` y un único `pnpm-lock.yaml`).
2. **Despliegue:** el plan **incluye** los pasos de servidor Linux (activar pnpm, instalar, build, PM2, docs).
3. **Reproducibilidad:** pin de versión de pnpm vía `packageManager` + corepack.

---

## 3. Diseño

### 3.1 `pnpm-workspace.yaml` (nuevo, raíz)

```yaml
packages:
  - backend
  - frontend
allowBuilds:
  bcrypt: true
```

`bcrypt` es un módulo nativo. pnpm **bloquea por defecto** los scripts de build (`node-gyp-build`/`node-pre-gyp`) de las dependencias; en pnpm 11 un build no aprobado hace **fallar** el install (`ERR_PNPM_IGNORED_BUILDS`). La aprobación se declara con `allowBuilds: { bcrypt: true }` en `pnpm-workspace.yaml` (en pnpm 11 esta clave **reemplaza** a la antigua `onlyBuiltDependencies` de pnpm 10; pnpm 11.3.0 no honra `onlyBuiltDependencies` como aprobación, por lo que el build de `bcrypt` queda bloqueado). Declararlo así hace que la compilación del binario ocurra también en el servidor **sin prompts interactivos**. Como `packageManager` fija pnpm 11.3.0 en local y servidor, `allowBuilds` es la clave efectiva en ambos.

### 3.2 `package.json` raíz (modificado)

- Añadir `"packageManager": "pnpm@11.3.0"`.
- Añadir `"engines": { "node": ">=20", "pnpm": ">=11" }`.
- Reescribir `scripts`:
  - Eliminar `install:all` (innecesario: `pnpm install` en la raíz instala ambos paquetes).
  - `dev:backend`: `pnpm --filter buscador-sisgeko-backend exec node server.js` (ejecuta con cwd = `backend/`, simétrico con `dev:frontend`; así dotenv carga `backend/.env`. Corrige un fallo pre-existente por el que `node backend/server.js` desde la raíz no cargaba el `.env` y abortaba con `JWT_SECRET not found`).
  - `dev:frontend`: `pnpm --filter buscador-sisgeko-frontend dev`.
  - Nuevo `build`: `pnpm --filter buscador-sisgeko-frontend build`.

Los `package.json` de `backend/` y `frontend/` no cambian de contenido de dependencias (solo pasan a ser miembros del workspace).

### 3.3 Limpieza de lockfiles y `node_modules`

- Eliminar: `package-lock.json` (raíz), `backend/package-lock.json`, `frontend/package-lock.json` y el `pnpm-lock.yaml` huérfano.
- Borrar todos los `node_modules` (raíz/backend/frontend).
- Ejecutar `pnpm install` limpio desde la raíz para generar un `pnpm-lock.yaml` real y correcto, que se **commitea**.
- `.gitignore` no requiere cambios (ya ignora `node_modules/`).

### 3.4 Despliegue en servidor Linux (`README_DEPLOY.md`)

Flujo actualizado:

1. Activar pnpm en el servidor: `corepack enable` (usa la versión de `packageManager`; alternativa: `npm i -g pnpm@11.3.0`).
2. Instalar desde la raíz de forma reproducible: `pnpm install --frozen-lockfile`.
3. Compilar el frontend: `pnpm build` (genera `frontend/dist`).
4. (Opcional) `pnpm prune --prod` para reducir el runtime del backend tras el build.
5. PM2 **sin cambios**: `pm2 start server.js --name "sisgeko-search"` / `pm2 restart sisgeko-search`.

Requisito documentado para `bcrypt` en Linux (por si necesita compilar en lugar de usar prebuilt): `build-essential`, `python3`, `make`, `g++`.

### 3.5 Documentación y mensajes

- `README.md`: `npm run install:all` → `pnpm install`; `npm run dev:backend` → `pnpm dev:backend`; `npm run build` → `pnpm build`.
- `README_DEPLOY.md`: pasos de instalación y build a pnpm (según 3.4).
- `backend/server.js:1628`: mensaje `"npm run build"` → `"pnpm build"`.

---

## 4. Robustez Windows (local) → Linux (producción)

Punto crítico del proyecto: el `pnpm-lock.yaml` se genera en Windows pero debe instalar sin fallos en Linux.

- **Binarios por plataforma en el lockfile.** Vite 8 usa **Rolldown** (además de `lightningcss` y `@tailwindcss/oxide`), que traen binarios nativos como dependencias opcionales por plataforma. A diferencia de npm (cuyo bug omitía las variantes no coincidentes y provocaba errores del tipo `Cannot find module @rolldown/binding-linux-x64-gnu`), **pnpm registra en el lockfile las variantes de todas las plataformas**. Un lockfile generado en Windows instala correctamente en Linux. → Riesgo resuelto por diseño.
- **`bcrypt` se resuelve por plataforma en el servidor.** El binario nativo no se arrastra desde Windows; el servidor ejecuta su propio `pnpm install` y obtiene el binario Linux (prebuilt o compilado con el toolchain de 3.4).
- **Misma versión de pnpm en ambos lados** vía `packageManager` + `corepack enable` → sin diferencias de resolución.
- **`--frozen-lockfile` en producción** → falla ruidosamente si el lockfile no cuadra, en vez de mutarlo silenciosamente.

Fallback documentado (no esperado): si algún paquete dependiera de "phantom dependencies" por el `node_modules` estricto de pnpm, se activa `shamefully-hoist=true` en `.npmrc`. Vite/React/Express/mssql no lo necesitan.

---

## 5. Criterios de verificación ("todo funciona")

**Local (Windows):**

1. `pnpm install` limpio sin errores y con `bcrypt` compilado/descargado.
2. `pnpm build` genera `frontend/dist`.
3. `pnpm dev:backend` arranca el servidor y sirve `dist`. (La conexión a SQL Server puede requerir VPN — se anota; no bloquea la migración.)
4. Existe **un solo** `pnpm-lock.yaml` y **ningún** `package-lock.json` en el repo.

**Servidor (Linux) — criterio de "hecho":**

5. `corepack enable` → `pnpm install --frozen-lockfile` sin errores (bcrypt OK, binarios Linux de Rolldown/lightningcss/oxide OK) → `pnpm build` genera `dist` → `pm2 restart sisgeko-search` → la web responde.

---

## 6. Fuera de alcance (YAGNI)

- No se elimina la redundancia `bcrypt` / `bcryptjs` (cambio funcional no relacionado).
- No se introduce CI/CD ni Docker.
- No se refactoriza código de aplicación.
