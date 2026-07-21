# Guía de Despliegue - Buscador Sisgeko

Esta guía detalla los pasos para desplegar la aplicación en un entorno de servidor profesional.

## Requisitos Previos
- Node.js v18+ instalado.
- SQL Server accesible y configurado.

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

## 2. Variables de Entorno
Crear un archivo `.env` en la carpeta `/backend` con los siguientes parámetros:

```dotenv
PORT=5000
DB_USER=usuario_sql
DB_PASSWORD=password_sql
DB_SERVER=servidor_o_ip
DB_NAME=nombre_de_la_db
```

## 3. Generar la Web (Build)

Compilar el frontend desde la raíz del proyecto:

```bash
pnpm build
```

Esto creará la carpeta `frontend/dist`.

## 4. Ejecución Permanente (Sin Consola Activa)
Para que la aplicación no se cierre al salir de la sesión SSH o cerrar la consola, existen dos opciones recomendadas:

### Opción A: Usar PM2 (Recomendado para Node.js)
PM2 es un gestor de procesos que mantiene la app viva en segundo plano y la reinicia si falla.

```bash
# Instalar PM2 globalmente (herramienta de sistema, independiente del proyecto).
# Se usa npm porque viene con Node y no requiere `pnpm setup` previo.
npm install -g pm2

# Iniciar la aplicación
cd backend
pm2 start server.js --name "sisgeko-search"

# Ver estado
pm2 status

# --- CONFIGURACIÓN DE AUTO-ARRANQUE EN LINUX ---
# 1. Generar el comando de inicio para el sistema:
pm2 startup

# IMPORTANTE: El comando anterior te devolverá una línea que empieza por 'sudo env PATH...'.
# Tienes que COPIAR y PEGAR ese comando exacto en la terminal para que surta efecto.

# 2. Una vez ejecutado lo anterior, guarda el estado actual:
pm2 save
# -----------------------------------------------
```

### Panel de estatísticas de uso

O panel crea automaticamente a táboa `usage_events` no primeiro acceso. Se o
usuario configurado en `DB_USER` non ten permiso para crear táboas, un
administrador de SQL Server debe executar previamente o script
`backend/analytics.sql`.

Despois de actualizar o proxecto, recompilar o frontend e reiniciar PM2:

```bash
pnpm build
pm2 restart sisgeko-search
```

As estatísticas comezan a rexistrarse desde ese momento; non recuperan visitas
anteriores. O acceso ao panel está limitado aos roles `admin` e `editor`.

### Opción B: Como Servicio del Sistema
- **Windows**: Pueden usar [NSSM](https://nssm.cc/) para convertir `node server.js` en un Servicio de Windows (se inicia solo, sin login).
- **Linux**: Crear un archivo de servicio en `systemd` (`/etc/systemd/system/sisgeko.service`).

## 5. Integración con Apache/Nginx (Recomendado)
Para usar el puerto estándar (80/443), configurar un Proxy Inverso que apunte al puerto 5000.

### Ejemplo Apache:
```apache
<VirtualHost *:80>
    ServerName buscador.tuservidor.com
    ProxyPreserveHost On
    ProxyPass / http://localhost:5000/
    ProxyPassReverse / http://localhost:5000/
</VirtualHost>
```
