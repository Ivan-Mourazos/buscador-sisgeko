# Buscador Sisgeko

Aplicación web con un frontend en React (Vite + Tailwind CSS v4) y un backend en Node.js (Express) que conecta a una base de datos SQL Server.

## 🚀 Requisitos Previos

- [Node.js](https://nodejs.org/) instalado (recomendado v18 o superior).
- Acceso a la VPN o red local si usas una base de datos interna.

## 🛠️ Configuración Inicial (Primera vez)

1. **Clonar repositorio:**
   Una vez hayas clonado este proyecto en tu equipo de trabajo, navega hasta la carpeta raíz del proyecto.

2. **Instalar todas las dependencias:**
   Desde la carpeta raíz, ejecuta este comando para instalar las librerías del backend y frontend de una sola vez:
   ```bash
   npm run install:all
   ```

3. **Configurar Variables de Entorno (Backend):**
   - Ve a la carpeta `backend/`.
   - Haz una copia del archivo `.env.example` y nómbrala `.env`.
   - Rellena el archivo `.env` con las credenciales reales de la base de datos (IP, Usuario, Contraseña).

## ▶️ Ejecución en Desarrollo

Para trabajar en el proyecto, necesitas levantar tanto el servidor de React como el de la API de Node.js. 

Abre **dos terminales** diferentes en la raíz del proyecto y ejecuta:

**Terminal 1 (Backend):**
```bash
npm run dev:backend
```

**Terminal 2 (Frontend):**
```bash
npm run dev:frontend
```

El frontend estará disponible en tu navegador en la URL que muestre Vite (por ejemplo: `http://localhost:5173/`).

*Nota: Durante el desarrollo, Vite está configurado para redirigir automáticamente todas las peticiones a `/api` hacia `http://localhost:5000`, evitando así problemas de CORS sin tener que cambiar la URL manualmente en el código.*
