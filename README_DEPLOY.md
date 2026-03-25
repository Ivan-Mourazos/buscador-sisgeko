# Guía de Despliegue - Buscador Sisgeko

Esta guía detalla los pasos para desplegar la aplicación en un entorno de servidor profesional.

## Requisitos Previos
- Node.js v18+ instalado.
- SQL Server accesible y configurado.

## 1. Configuración Inicial
Desde la raíz del proyecto, instalar las dependencias de ambas partes:

```powershell
# En la carpeta backend
cd backend
npm install

# En la carpeta frontend
cd ../frontend
npm install
```

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
Para que el servidor pueda servir la interfaz web, es necesario compilarla:

```powershell
cd /frontend
npm run build
```
Esto creará la carpeta `frontend/dist`.

## 4. Ejecución del Servidor
La aplicación funciona ahora bajo un **único proceso** (el backend).

```powershell
cd /backend
node server.js
```
*Recomendación: usar PM2 para mantener el proceso vivo:* `pm2 start server.js --name "sisgeko-search"`.

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
