# Web Search App

Aplicación web Full-Stack construida con:
- **Backend**: Node.js, Express, mssql (SQL Server).
- **Frontend**: React (Vite), Tailwind CSS.

## Requisitos
- Node.js (v18+)
- SQL Server

## Primeros Pasos

### 1. Backend
- Navega a la carpeta `backend/`
- Crea un archivo `.env` basado en la configuración dada o usa las credenciales por defecto configuradas. Se requiere `DB_USER`, `DB_PASSWORD`, `DB_SERVER` y `DB_NAME`.
- Instala las dependencias y arranca el servidor:
  ```bash
  cd backend
  npm install
  npm start # o node server.js
  ```

### 2. Frontend
- Navega a la carpeta `frontend/`
- Instala las dependencias e inicia el servidor de desarrollo:
  ```bash
  cd frontend
  npm install
  npm run dev
  ```

## Estructura
- El servidor Node estará escuchando peticiones en `http://localhost:5000`.
- El cliente React estará accesible en `http://localhost:5173`.
