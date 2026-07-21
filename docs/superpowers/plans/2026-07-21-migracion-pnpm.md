# Migración a pnpm (workspace unificado) — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar `buscador-sisgeko` de npm (3 lockfiles) a un workspace pnpm unificado que funcione en desarrollo local (Windows) y en el servidor de producción Linux.

**Architecture:** Un `pnpm-workspace.yaml` en la raíz engloba `backend/` y `frontend/`. Un único `pnpm install` instala ambos con un solo `pnpm-lock.yaml`. El `bcrypt` nativo se compila mediante `allowBuilds` (clave de pnpm 11; reemplaza a `onlyBuiltDependencies` de pnpm 10). Los scripts raíz orquestan con `--filter`. Documentación y despliegue PM2 se actualizan a pnpm.

**Tech Stack:** pnpm 11.3.0, corepack, Node 20+, Vite 8 / React 19 (frontend), Express 5 / mssql / bcrypt (backend), PM2 (servidor Linux).

## Global Constraints

- **Gestor de paquetes:** pnpm 11.3.0, fijado con `"packageManager": "pnpm@11.3.0"` + corepack. No volver a usar npm para instalar.
- **`bcrypt` es módulo nativo:** debe aprobarse su build con `allowBuilds: { bcrypt: true }` en `pnpm-workspace.yaml` (clave de pnpm 11; `onlyBuiltDependencies` de pnpm 10 es ignorada por pnpm 11.3.0). Sin ella, el install falla con `ERR_PNPM_IGNORED_BUILDS`.
- **Un solo lockfile:** al final debe existir únicamente `pnpm-lock.yaml` en la raíz; ningún `package-lock.json` en el repo.
- **Nombres de paquetes del workspace (usar en `--filter`):** frontend = `buscador-sisgeko-frontend`; backend = `buscador-sisgeko-backend`.
- **Producción Linux:** instalación reproducible con `pnpm install --frozen-lockfile`; PM2 sin cambios (`node server.js`).
- **Multiplataforma:** el lockfile se genera en Windows pero debe instalar en Linux; pnpm registra los binarios opcionales de todas las plataformas (Rolldown, lightningcss, @tailwindcss/oxide, bcrypt), por lo que es portable.
- **Rama de trabajo:** `migracion-pnpm` (ya creada).

---

### Task 1: Núcleo de la migración — workspace, limpieza e instalación limpia

**Files:**
- Create: `pnpm-workspace.yaml`
- Modify: `package.json` (raíz)
- Delete: `package-lock.json`, `backend/package-lock.json`, `frontend/package-lock.json`
- Regenerate: `pnpm-lock.yaml` (raíz — reemplaza el huérfano vacío)

**Interfaces:**
- Produces: workspace pnpm funcional; scripts raíz `dev:backend`, `dev:frontend`, `build`; `pnpm-lock.yaml` real y commiteado.

- [ ] **Step 1: Confirmar rama y estado limpio**

Run (PowerShell):
```powershell
git branch --show-current
git status --short
```
Expected: rama `migracion-pnpm`; sin cambios sin commitear (salvo el spec ya commiteado).

- [ ] **Step 2: Borrar los `node_modules` de raíz, backend y frontend**

Run (PowerShell):
```powershell
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue node_modules, backend\node_modules, frontend\node_modules
```
Expected: sin error; las carpetas dejan de existir.

- [ ] **Step 3: Eliminar los 3 lockfiles npm del control de versiones**

Run (PowerShell):
```powershell
git rm --quiet package-lock.json backend/package-lock.json frontend/package-lock.json
```
Expected: `rm 'package-lock.json'`, `rm 'backend/package-lock.json'`, `rm 'frontend/package-lock.json'`.

- [ ] **Step 4: Crear `pnpm-workspace.yaml`**

Create `pnpm-workspace.yaml`:
```yaml
packages:
  - backend
  - frontend
# pnpm 11 aprueba los builds nativos con `allowBuilds` (reemplaza a
# `onlyBuiltDependencies` de pnpm 10). Necesario para compilar `bcrypt`.
allowBuilds:
  bcrypt: true
```

- [ ] **Step 5: Actualizar `package.json` (raíz)**

Reemplazar el contenido completo de `package.json` por:
```json
{
  "name": "buscador-sisgeko",
  "version": "1.0.0",
  "private": true,
  "packageManager": "pnpm@11.3.0",
  "engines": {
    "node": ">=20",
    "pnpm": ">=11"
  },
  "scripts": {
    "dev:backend": "pnpm --filter buscador-sisgeko-backend exec node server.js",
    "dev:frontend": "pnpm --filter buscador-sisgeko-frontend dev",
    "build": "pnpm --filter buscador-sisgeko-frontend build"
  }
}
```
(Se elimina `install:all`: `pnpm install` en la raíz ya instala ambos paquetes.)

- [ ] **Step 6: Instalar todo el workspace con pnpm**

Run (PowerShell):
```powershell
pnpm install
```
Expected: termina con `Done` y ejecuta el build de `bcrypt` (`node-gyp-build`); **no** debe fallar con `ERR_PNPM_IGNORED_BUILDS` ni mostrar `Ignored build scripts: bcrypt` (si ocurre, `allowBuilds` no está aplicándose — revisar Step 4). Se crea/actualiza `pnpm-lock.yaml` y aparecen `node_modules` en raíz, `backend/` y `frontend/`.

- [ ] **Step 7: Verificar que `bcrypt` quedó compilado y cargable**

Run (PowerShell):
```powershell
pnpm --filter buscador-sisgeko-backend exec node -e "require('bcrypt'); console.log('bcrypt OK')"
```
Expected: imprime `bcrypt OK` sin errores de módulo nativo.

- [ ] **Step 8: Verificar un único lockfile y sin `package-lock.json`**

Run (PowerShell):
```powershell
Test-Path pnpm-lock.yaml
Get-ChildItem -Recurse -Filter package-lock.json -File | Where-Object { $_.FullName -notmatch 'node_modules' }
```
Expected: `True`; el segundo comando no devuelve nada (ningún `package-lock.json` fuera de `node_modules`).

- [ ] **Step 9: Commit**

Run (PowerShell):
```powershell
git add pnpm-workspace.yaml package.json pnpm-lock.yaml
git commit -m "build: migrar a workspace pnpm unificado y eliminar lockfiles npm"
```
Expected: commit con `pnpm-workspace.yaml` y `package.json` modificados, `pnpm-lock.yaml` actualizado y los 3 `package-lock.json` eliminados.

---

### Task 2: Verificación funcional local (build del frontend + arranque del backend)

**Files:**
- (Sin cambios de código — tarea de verificación. `frontend/dist` está en `.gitignore`.)

**Interfaces:**
- Consumes: workspace instalado de la Task 1.
- Produces: confirmación de que `pnpm build` y `pnpm dev:backend` funcionan tras la migración.

- [ ] **Step 1: Compilar el frontend con el script raíz**

Run (PowerShell):
```powershell
pnpm build
```
Expected: Vite compila sin errores; termina con `✓ built in ...`.

- [ ] **Step 2: Verificar que se generó `frontend/dist`**

Run (PowerShell):
```powershell
Test-Path frontend\dist\index.html
```
Expected: `True`.

- [ ] **Step 3: Arrancar el backend con el script raíz**

Run (PowerShell):
```powershell
pnpm dev:backend
```
Expected: el proceso corre con cwd = `backend/`, dotenv carga las variables de `backend/.env` (`injected env (18)`) y el servidor escucha (`🚀 Servidor Sisgeko listo en puerto 5000` + el scheduler node-cron). **No** debe fallar con errores de resolución de módulos (`Cannot find module 'express'`, `bcrypt`, etc.) ni con `JWT_SECRET not found`. Un error de conexión a SQL Server es aceptable aquí si no hay VPN — indica que el runtime cargó correctamente. Detener con `Ctrl+C`.

> **Nota:** `dev:backend` usa `pnpm --filter ... exec node server.js` (no `node backend/server.js`) precisamente para que el cwd sea `backend/` y dotenv encuentre el `.env`.

- [ ] **Step 4: (Sin commit)**

`frontend/dist` está ignorado por git y no hay cambios de código. Esta tarea es una compuerta de verificación; no genera commit.

---

### Task 3: Actualizar documentación y mensaje in-app a pnpm

**Files:**
- Modify: `README.md`
- Modify: `README_DEPLOY.md`
- Modify: `backend/server.js` (línea del mensaje de error ~1628)

**Interfaces:**
- Consumes: scripts raíz definidos en la Task 1 (`pnpm install`, `pnpm dev:backend`, `pnpm build`).
- Produces: documentación coherente con pnpm, incluyendo el runbook de despliegue Linux.

- [ ] **Step 1: Actualizar `README.md`**

En `README.md`, sustituir:
- `npm run install:all` → `pnpm install`
- `npm run dev:backend` → `pnpm dev:backend`
- `npm run build` (frontend) → `pnpm build`

Verificar que no quedan comandos `npm ...` en el README:
```powershell
Select-String -Path README.md -Pattern "npm "
```
Expected: sin coincidencias.

- [ ] **Step 2: Actualizar el bloque de instalación de `README_DEPLOY.md`**

Reemplazar el bloque «## 1. Configuración Inicial» (los `cd backend/frontend` + `npm install`) por:
````markdown
## 1. Configuración Inicial

Activar pnpm en el servidor (usa la versión fijada en `packageManager`):

```bash
corepack enable
# Alternativa si corepack no está disponible: npm i -g pnpm@11.3.0
```

Instalar todas las dependencias del workspace desde la raíz, de forma reproducible:

```bash
pnpm install --frozen-lockfile
```

> **Nota (bcrypt en Linux):** si el servidor necesita compilar el binario nativo
> en lugar de descargar un prebuilt, instalar antes el toolchain:
> `sudo apt-get install -y build-essential python3 make g++`.
````

- [ ] **Step 3: Actualizar el bloque de build de `README_DEPLOY.md`**

Reemplazar el bloque «## 3. Generar la Web (Build)» por:
````markdown
## 3. Generar la Web (Build)

Compilar el frontend desde la raíz del proyecto:

```bash
pnpm build
```

Esto creará la carpeta `frontend/dist`.
````

- [ ] **Step 4: Actualizar el flujo de actualización PM2 de `README_DEPLOY.md`**

En el bloque «Panel de estatísticas de uso», reemplazar:
```powershell
cd frontend
npm run build
cd ../backend
pm2 restart sisgeko-search
```
por:
```bash
pnpm build
pm2 restart sisgeko-search
```

Verificar que no quedan comandos `npm ...` (excepto el `npm i -g pnpm` de fallback):
```powershell
Select-String -Path README_DEPLOY.md -Pattern "npm run|npm install"
```
Expected: sin coincidencias.

- [ ] **Step 5: Actualizar el mensaje en `backend/server.js`**

En `backend/server.js` (~línea 1628), reemplazar el texto:
`Ejecute "npm run build" en el frontend.`
por:
`Ejecute "pnpm build" desde la raíz del proyecto.`

Verificar:
```powershell
Select-String -Path backend\server.js -Pattern "npm run build"
```
Expected: sin coincidencias.

- [ ] **Step 6: Commit**

Run (PowerShell):
```powershell
git add README.md README_DEPLOY.md backend/server.js
git commit -m "docs: actualizar instrucciones y mensaje in-app de npm a pnpm"
```
Expected: commit con los 3 archivos.

---

### Task 4: Validación en el servidor Linux (runbook de producción)

**Files:**
- (Sin cambios de repo — ejecución en el servidor vía SSH. Compuerta final de "todo funciona en Linux".)

**Interfaces:**
- Consumes: rama `migracion-pnpm` con las Tasks 1-3 (pusheada/mergeada según se decida).
- Produces: confirmación de que producción arranca con pnpm.

- [ ] **Step 1: Traer los cambios al servidor**

En el servidor (bash), dentro del directorio del proyecto:
```bash
git fetch origin
git checkout migracion-pnpm   # o main si ya se mergeó
git pull
```
Expected: el árbol contiene `pnpm-workspace.yaml`, `pnpm-lock.yaml` y sin `package-lock.json`.

- [ ] **Step 2: Activar pnpm en el servidor**

Run (bash):
```bash
corepack enable
pnpm -v
```
Expected: imprime `11.3.0` (o la versión de `packageManager`). Si `corepack` no existe: `npm i -g pnpm@11.3.0`.

- [ ] **Step 3: Instalación reproducible**

Run (bash):
```bash
pnpm install --frozen-lockfile
```
Expected: termina `Done` sin error. Si falla por `bcrypt` (falta de toolchain): `sudo apt-get install -y build-essential python3 make g++` y reintentar (nota: bcrypt 6 trae prebuilds linux-x64 glibc+musl, así que normalmente no compila). No debe fallar por binarios de Rolldown/lightningcss/oxide (el lockfile ya incluye las variantes Linux).

- [ ] **Step 4: Verificar `bcrypt` en Linux**

Run (bash):
```bash
pnpm --filter buscador-sisgeko-backend exec node -e "require('bcrypt'); console.log('bcrypt OK')"
```
Expected: `bcrypt OK`.

- [ ] **Step 5: Build del frontend en el servidor**

Run (bash):
```bash
pnpm build
test -f frontend/dist/index.html && echo "dist OK"
```
Expected: build sin errores y `dist OK`.

- [ ] **Step 6: Reiniciar PM2 y comprobar la web**

Run (bash):
```bash
pm2 restart sisgeko-search
pm2 status
curl -sS -o /dev/null -w "%{http_code}\n" http://localhost:5000/
```
Expected: proceso `online` en `pm2 status`; `curl` devuelve `200`.

- [ ] **Step 7: (Sin commit)**

Runbook de validación en servidor; no genera cambios en el repo.

---

## Notas de fallback (no esperadas)

- **Build de `bcrypt` bloqueado (`ERR_PNPM_IGNORED_BUILDS`):** confirmar que `pnpm-workspace.yaml` usa `allowBuilds: { bcrypt: true }` (pnpm 11). Si se ejecutara con pnpm 10, esa versión usa `onlyBuiltDependencies: [bcrypt]` en su lugar. Alternativa interactiva: `pnpm approve-builds` (interactivo y muta `pnpm-workspace.yaml`; **no apto** para CI/despliegue no interactivo — en el servidor usar siempre `allowBuilds`).
- **Phantom dependencies por `node_modules` estricto:** crear `.npmrc` en la raíz con `shamefully-hoist=true` y reinstalar. (Vite/React/Express/mssql no lo requieren; usar solo si un módulo falla al resolverse.)
