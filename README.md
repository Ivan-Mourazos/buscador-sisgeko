# 🔍 Buscador Sisgeko

O **Buscador Sisgeko** é unha plataforma administrativa e de consulta deseñada para xestionar eficazmente o coñecemento técnico e a información de produtos. Combina un potente motor de busca en tempo real cun panel de administración completo para a xestión de contidos.

---

## ✨ Características Principais

### 1. Motor de Busca Unificado
*   **Consulta Global**: Busca simultánea en tres categorías: **Artigos (Fichas Técnicas)**, **Insights (Leccións Aprendidas)** e **Definicións (Conceptos)**.
*   **Filtros Dinámicos**: Sistema de filtrado por Familias, Subfamilias, Procesos e Orixe da información.
*   **Resultados Intelixentes**: Tarxetas con información contextual e acceso a detalles expandidos.

### 2. Panel de Administración (Gated)
*   **Acceso Protexido**: Interface administrativa accesible mediante login (`admin` / `admin`).
*   **Xestión de Contidos**: Crear, editar ou eliminar calquera rexistro da base de datos de forma visual.
*   **Editor Multistep**: Proceso guiado para a creación de novos elementos con formularios específicos por tipo de dato.

### 3. Xestión Avanzada de Imaxes
*   **Dobre Fluxo**: Soporta tanto a referencia a imaxes xa existentes no servidor como a **subida directa** de novos ficheiros desde o navegador.
*   **Infraestrutura de Rede**: Sincronización automática coa carpeta de rede compartida (`\\192.168.0.128\Sisgeko`).
*   **Previsualización en Vivo**: Comprobación instantánea das imaxes antes de gardar os cambios.

---

## 🛠️ Stack Tecnolóxico

*   **Frontend**: React + Vite + Tailwind CSS v4.
*   **Backend**: Node.js + Express.
*   **Base de Datos**: Microsoft SQL Server (MSSQL).
*   **Almacenamento**: Multer (para a xestión de ficheiros en rede local).

---

## 🚀 Instalación e Configuración

### 1. Requisitos Previos
*   [Node.js](https://nodejs.org/) (v20 recomendada).
*   Conexión á VPN ou rede local de Toldos Gómez (necesario para SQL Server e imaxes).

### 2. Configuración Inicial
Desde a raíz do proxecto, instala todas as dependencias necesarias:
```bash
npm run install:all
```

### 3. Variables de Contorno
Crea un ficheiro `.env` na carpeta `backend/` baseándote no `.env.example` con:
*   Credenciais de SQL Server (IP, Usuario, Contrasinal).
*   Configuración do porto (por defecto `5000`).

---

## ▶️ Execución

Abre **dúas terminais** e executa os seguintes comandos:

**Terminal 1 (Backend):**
```bash
npm run dev:backend
```

**Terminal 2 (Frontend):**
```bash
npm run dev:frontend
```

O buscador estará accesible en `http://localhost:5173/` (Vite redirecciona as chamadas de API automaticamente ao porto `5000`).

---

## 📂 Estrutura do Proxecto

*   `/frontend`: Aplicación React e compoñentes de UI.
*   `/backend`: API Express e controladores de base de datos.
*   `/knowledge`: Historio de cambios e documentación técnica adicional.

---

*Proxecto desenvolvido por Iván Sánchez para Toldos Gómez - 2026*
