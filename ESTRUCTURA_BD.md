# Estructura de la Base de Datos SISGEKO

Este documento define la estructura íntegra de la base de datos necesaria para que la aplicación **Buscador Sisgeko** funcione correctamente. Puedes y debes actualizar este documento conforme se realicen modificaciones o actualizaciones en las tablas y columnas por parte de la empresa.

La base de datos actual está diseñada pensada en SQL Server (`mssql`), soportando relaciones entre artículos, insights (conocimiento/información), definiciones y facetas (familias, procesos, origen, etc.).

---

## Índice de Tablas

1. **Tablas Principales**
   - `familias`: Categorías principales de los productos.
   - `articulos`: Catálogo de artículos o productos.
   - `definiciones`: Diccionario o glosario de términos.
   - `insights`: Conocimiento estructurado, ventajas, guías, etc.

2. **Tablas de Entidades Auxiliares (Facetas/Filtros)**
   - `caracteristicas`: Definición de atributos de los artículos (peso, medidas, acabados...).
   - `procesos`: Fases o departamentos relevantes (Producción, Instalación, Comercial...).
   - `tipo_origen`: Procedencia del insight (Proveedor, Experiencia, Externo...).
   - `intenciones`: Preguntas o intenciones de búsqueda asociadas a los insights.

3. **Tablas Relacionales (Intermedias / Muchos a Muchos)**
   - `valores`: Asigna valores específicos de características concretas a artículos concretos.
   - `rel_definicion_familia`: Relaciona definiciones con familias.
   - `rel_Insight_Proceso`: Relaciona insights con procesos.
   - `rel_Insight_articulo`: Relaciona insights con artículos específicos.
   - `rel_insight_intencion`: Relaciona insights con preguntas/intenciones.

---

## Detalle de Tablas y Columnas

### 1. familias
Agrupa de forma principal los artículos y definiciones.
* **id_familia** (`INT`, Primary Key)
* **codigo** (`VARCHAR(50)`): Abreviatura o código de familia.
* **descripcion** (`VARCHAR(255)`): Nombre de la familia (ej. "Toldo de fachada", "Lona").

### 2. articulos
Catálogo base de la aplicación.
* **id_articulo** (`INT`, Primary Key)
* **id_familia** (`INT`): Foreign Key -> `familias.id_familia`.
* **codigo** (`NVARCHAR(255)`): Código interno.
* **descripcion** (`NVARCHAR(255)`): Nombre del artículo.
* **denominacion_proveedor** (`NVARCHAR(255)`): Nombre comercial u original.
* **subfamilia** (`NVARCHAR(255)`): Subcategoría textual para facetado lógico (ej. "Toldo cofre").

### 3. caracteristicas
Define qué atributos se pueden medir o detallar de los artículos.
* **id_caracteristica** (`INT`, Primary Key)
* **caracteristica** (`NCHAR(100)`): Nombre de la característica ("Peso", "Ancho").
* **descripcion** (`NVARCHAR(255)`): Explicación de la característica.
* **comentario** (`NCHAR(255)`): Notas adicionales de uso interno.

### 4. valores
Unión para especificar el valor concreto de una característica en un artículo específico.
* **id_valor** (`INT`, Primary Key)
* **id_caracteristica** (`INT`): Foreign Key -> `caracteristicas.id_caracteristica`.
* **id_articulo** (`INT`): Foreign Key -> `articulos.id_articulo`.
* **orden** (`INT`): Para ordenar la presentación en la interfaz.
* **valor** (`NVARCHAR(100)`): Dato concreto (ej. "680 g/m²").
* **norma** (`NVARCHAR(100)`): Normativa aplicada (ej. "ISO 3801").
* **comentarios** (`NVARCHAR(255)`): Detalles del valor.

### 5. definiciones
Glosario. Conceptos generales que no son artículos ni insights per se.
* **id_definicion** (`INT`, Primary Key)
* **titulo** (`NVARCHAR(255)`): Término a definir.
* **definicion** (`NVARCHAR(MAX)` / Texto largo): Explicación completa del término.

### 6. rel_definicion_familia
Unión entre definiciones y las familias de productos a las que aplica (ej. La definición de "Brazos invisibles" aplica a la familia "Toldo de fachada").
* **id_rel_definicion_familia** (`INT`, Primary Key)
* **id_definicion** (`INT`): Foreign Key -> `definiciones.id_definicion`.
* **id_familia** (`INT`): Foreign Key -> `familias.id_familia`.

### 7. tipo_origen
Categoriza de dónde sale el Insight.
* **id_tipo_origen** (`FLOAT` o `INT`, Primary Key)
* **tipo_origen** (`NVARCHAR(255)`): "Proveedor", "Experiencia", etc.

### 8. procesos
Estructura departamental o de proceso a los que afecta un insight.
* **id_proceso** (`FLOAT` o `INT`, Primary Key)
* **proceso** (`NVARCHAR(255)`): "Comercial", "Instalación", etc.
* **descripcion** (`NVARCHAR(255)`): Detalle extra.

### 9. insights
Fichas de conocimiento o manuales concretos.
* **id_insight** (`INT`, Primary Key)
* **id_tipo_origen** (`FLOAT` o `INT`): Foreign Key -> `tipo_origen.id_tipo_origen`.
* **titulo** (`NVARCHAR(255)`): Título del contenido.
* **insight** (`NVARCHAR(MAX)` / Texto largo): Texto enriquecido o contenido extenso.
* **origen_informacion** (`NVARCHAR(255)`): Documento o manual fuente (ej. "Catálogo Comercial").
* **detalle_origen_informacion** (`NVARCHAR(255)`): (ej. "Página 2").
* **imagen** (`NVARCHAR(255)`): Ruta de la imagen (ej: `AMBARBOX\AMBARBOX.jpg`).

### 10. rel_Insight_Proceso
Unión entre el conocimiento y los departamentos (ej. este Insight aplica a Instalación y Producción).
* **id_rel_insight_proceso** (`INT`, Primary Key)
* **id_insight** (`INT`): Foreign Key -> `insights.id_insight`.
* **id_proceso** (`FLOAT` o `INT`): Foreign Key -> `procesos.id_proceso`.
* **criticidad** (`INT`): (Opcional) nivel de importancia.

### 11. rel_Insight_articulo
Relaciona un conocimiento o manual directamente con uno o varios artículos.
* **id_rel_insight_articulo** (`INT`, Primary Key)
* **id_insight** (`INT`): Foreign Key -> `insights.id_insight`.
* **id_articulo** (`INT`): Foreign Key -> `articulos.id_articulo`.

### 12. intenciones
Preguntas frecuentes que se derivan o responden gracias a los insights.
* **id_intencion** (`INT`, Primary Key)
* **intencion** (`NVARCHAR(255)`): "Pregunta tipo" (ej. "¿Para qué usos es adecuado {ARTICULO}?").

### 13. rel_insight_intencion
Unión entre las preguntas y los insights que las resuelven.
* **id_rel_insight_intencion** (`INT`, Primary Key)
* **id_insight** (`INT`): Foreign Key -> `insights.id_insight`.
* **id_intencion** (`INT`): Foreign Key -> `intenciones.id_intencion`.

---

## Script SQL de Creación Rápida (DDL)

Este script te permite generar rápidamente la estructura completa en un servidor SQL Server desde cero:

```sql
-- == 1. TABLAS PRINCIPALES INDEPENDIENTES ==

CREATE TABLE familias (
    id_familia INT PRIMARY KEY,
    codigo VARCHAR(50),
    descripcion VARCHAR(255)
);

CREATE TABLE caracteristicas (
    id_caracteristica INT PRIMARY KEY,
    caracteristica NCHAR(100),
    descripcion NVARCHAR(255),
    comentario NCHAR(255)
);

CREATE TABLE definiciones (
    id_definicion INT PRIMARY KEY,
    titulo NVARCHAR(255),
    definicion NVARCHAR(MAX)
);

CREATE TABLE procesos (
    id_proceso FLOAT PRIMARY KEY,
    proceso NVARCHAR(255),
    descripcion NVARCHAR(255)
);

CREATE TABLE tipo_origen (
    id_tipo_origen FLOAT PRIMARY KEY,
    tipo_origen NVARCHAR(255)
);

CREATE TABLE intenciones (
    id_intencion INT PRIMARY KEY,
    intencion NVARCHAR(255)
);


-- == 2. TABLAS DEPENDIENTES NIVEL 1 ==

CREATE TABLE articulos (
    id_articulo INT PRIMARY KEY,
    codigo NVARCHAR(255),
    descripcion NVARCHAR(255),
    denominacion_proveedor NVARCHAR(255),
    subfamilia NVARCHAR(255),
    id_familia INT,
    CONSTRAINT FK_articulos_familias FOREIGN KEY (id_familia) REFERENCES familias(id_familia)
);

CREATE TABLE insights (
    id_insight INT PRIMARY KEY,
    origen_informacion NVARCHAR(255),
    detalle_origen_informacion NVARCHAR(255),
    id_tipo_origen FLOAT,
    insight NVARCHAR(MAX),
    imagen NVARCHAR(255),
    titulo NVARCHAR(255),
    CONSTRAINT FK_insights_tipo_origen FOREIGN KEY (id_tipo_origen) REFERENCES tipo_origen(id_tipo_origen)
);

CREATE TABLE rel_definicion_familia (
    id_rel_definicion_familia INT PRIMARY KEY,
    id_definicion INT,
    id_familia INT,
    CONSTRAINT FK_rdf_definiciones FOREIGN KEY (id_definicion) REFERENCES definiciones(id_definicion),
    CONSTRAINT FK_rdf_familias FOREIGN KEY (id_familia) REFERENCES familias(id_familia)
);


-- == 3. TABLAS DEPENDIENTES NIVEL 2 (Tablas de Relación final N:M) ==

CREATE TABLE valores (
    id_valor INT PRIMARY KEY,
    id_caracteristica INT,
    id_articulo INT,
    orden INT,
    valor NVARCHAR(100),
    norma NVARCHAR(100),
    comentarios NVARCHAR(255),
    CONSTRAINT FK_val_caracteristicas FOREIGN KEY (id_caracteristica) REFERENCES caracteristicas(id_caracteristica),
    CONSTRAINT FK_val_articulos FOREIGN KEY (id_articulo) REFERENCES articulos(id_articulo)
);

CREATE TABLE rel_Insight_Proceso (
    id_rel_insight_proceso INT PRIMARY KEY,
    id_insight INT,
    id_proceso FLOAT,
    criticidad INT,
    CONSTRAINT FK_rip_insights FOREIGN KEY (id_insight) REFERENCES insights(id_insight),
    CONSTRAINT FK_rip_procesos FOREIGN KEY (id_proceso) REFERENCES procesos(id_proceso)
);

CREATE TABLE rel_Insight_articulo (
    id_rel_insight_articulo INT PRIMARY KEY,
    id_insight INT,
    id_articulo INT,
    CONSTRAINT FK_ria_insights FOREIGN KEY (id_insight) REFERENCES insights(id_insight),
    CONSTRAINT FK_ria_articulos FOREIGN KEY (id_articulo) REFERENCES articulos(id_articulo)
);

CREATE TABLE rel_insight_intencion (
    id_rel_insight_intencion INT PRIMARY KEY,
    id_insight INT,
    id_intencion INT,
    CONSTRAINT FK_rii_insights FOREIGN KEY (id_insight) REFERENCES insights(id_insight),
    CONSTRAINT FK_rii_intenciones FOREIGN KEY (id_intencion) REFERENCES intenciones(id_intencion)
);
```

---

## 🏗 Cómo mantener este documento (Para la Empresa)

Cuando se solicite actualizar la base de datos (por ejemplo, añadiendo un nuevo campo "precio" a los artículos, o una nueva tabla "documentos"), debes venir a este archivo (`ESTRUCTURA_BD.md`) y:

1. Modificar la lista que lo explica en la sección **Detalle de Tablas y Columnas**. Ejemplo: Añadir `* **precio** (FLOAT): Coste del artículo` bajo `articulos`.
2. Actualizar el **Script SQL** que se encuentra en la parte inferior, añadiendo la columna (`precio FLOAT`) o la tabla correspondiente en su nivel correcto según dependencias. 

De esta manera, el equipo técnico sabrá siempre cómo montar la base de datos desde cero si cambian de servidor o levantan un entorno de desarrollo nuevo.
