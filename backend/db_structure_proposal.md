# Estructura de la Base de Datos SISGEKO (Extendida: Artículos, Definiciones, Insights)

Este documento detalla la estructura completa de tablas para el sistema SISGEKO, incorporando el **control de versiones y borrado lógico** en todas las entidades principales.

## 1. Tablas de Seguridad y Acceso

Permiten identificar quién realiza los cambios y qué permisos tiene.

### Tabla: `roles`
*   `id_rol` (INT, PK, Identity): ID único del rol.
*   `nombre_rol` (NVARCHAR(50)): 'Admin', 'Editor', 'Lector'.

### Tabla: `usuarios`
*   `id_usuario` (INT, PK, Identity): ID único.
*   `username` (NVARCHAR(100), UNIQUE): Nombre de acceso.
*   `password_hash` (NVARCHAR(MAX)): Contraseña cifrada.
*   `id_rol` (INT, FK -> roles): Rol asignado.
*   `activo` (BIT): Estado del usuario (1=Activo).

---

## 2. Gestión de Contenidos con Versionado Universal

Se aplica un sistema de **"Master-Version"** para permitir la conservación e historial de cambios.

### Tabla: `articulos` (Versionado)
*   **`id_articulo` (INT, PK):** Identificador único de esta versión técnica.
*   **`id_grupo_articulo` (INT):** ID común para todas las versiones del mismo artículo.
*   **`version` (INT):** 1, 2, 3...
*   **`es_actual` (BIT):** 1 si es el vigente.
*   **`eliminado` (BIT):** 1 si se ha ocultado.
*   `codigo`, `descripcion`, `denominacion_proveedor`, `subfamilia`, `id_familia`.
*   `fecha_cambio`, `id_usuario_cambio`.

### Tabla: `definiciones` (Versionado)
*   **`id_definicion` (INT, PK):** Identificador único de la versión literaria.
*   **`id_grupo_definicion` (INT):** ID común para el grupo de versiones.
*   **`version` (INT):** 1, 2, 3...
*   **`es_actual` (BIT):** 1 si es el vigente.
*   **`eliminado` (BIT):** 1 si se ha ocultado.
*   `titulo`, `definicion`.
*   `fecha_cambio`, `id_usuario_cambio`.

### Tabla: `insights` (Versionado)
*   **`id_insight` (INT, PK):** Identificador único de la versión del insight.
*   **`id_grupo_insight` (INT):** ID común para el grupo de versiones.
*   **`version` (INT):** 1, 2, 3...
*   **`es_actual` (BIT):** 1 si es el vigente.
*   **`eliminado` (BIT):** 1 si se ha ocultado.
*   `titulo`, `insight`, `origen_informacion`, `detalle_origen`, `id_tipo_origen`, `imagen`.
*   `fecha_cambio`, `id_usuario_cambio`.

---

## 3. Relaciones Vinculadas a Versiones Específicas

Para asegurar que al "recuperar" algo vuelva exactamente a su estado anterior, las tablas de relación apuntarán al ID de la versión específica:

- **`valores`**: Apuntará a `id_articulo` (versión específica).
- **`rel_definicion_familia`**: Apuntará a `id_definicion` (versión específica).
- **`rel_Insight_articulo`**: Apuntará a `id_insight` (versión específica) y `id_articulo` (versión específica).
- **`rel_insight_intencion`**: Apuntará a `id_insight` (versión específica).
- **`rel_Insight_Proceso`**: Apuntará a `id_insight` (versión específica).

---

## 4. Estrategia de Funcionamiento

1.  **Lectura del Buscador**: Las queries usarán `WHERE es_actual = 1 AND eliminado = 0`.
2.  **Edición**: Al modificar un elemento, se inserta una nueva fila con `version = version_actual + 1`, se marca como `es_actual = 1`, y el registro anterior se marca como `es_actual = 0`. Las tablas de relaciones asociadas se duplican apuntando al nuevo ID de versión.
3.  **Borrado**: Únicamente se cambia `eliminado = 1` en la versión que tenga `es_actual = 1`.
4.  **Recuperación**: El sistema busca en el histórico por `id_grupo_X` y permite restaurar cualquier versión antigua marcándola de nuevo como `es_actual=1` y `eliminado=0`.

---

## 5. Tablas de Soporte (Sin cambios estructurales)
- `familias`, `procesos`, `tipo_origen`, `intenciones`, `caracteristicas`.
