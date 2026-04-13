# Contenido de la Base de Datos SISGEKO

## Tabla: articulos

### Columnas (Estructura)
| Columna | Tipo de Dato | Longitud | Nullable |
|---------|--------------|----------|----------|
| id_articulo | int | 4 | false |
| codigo | nvarchar | 510 | true |
| descripcion | nvarchar | 510 | true |
| denominacion_proveedor | nvarchar | 510 | true |
| subfamilia | nvarchar | 510 | true |
| id_familia | int | 4 | true |

### Datos de Ejemplo (Top 5)
| id_articulo | codigo | descripcion | denominacion_proveedor | subfamilia | id_familia |
| --- | --- | --- | --- | --- | --- |
| 1 | AMBARBOX | Toldo cofre de punto recto | Microbox 300 | Toldo cofre | 1 |
| 2 | XACOBEO | Toldo de brazos invisibles para pequeñas dimensiones | Art 250 | Brazos invisibles | 1 |
| 3 | KÜADBOX | Toldo cofre de gama alta con formas minimalistas | Küadbox | Toldo cofre | 1 |
| 11 | PUNTORECTO | Toldo clásico, con brazo de punto recto o "directo" | PRT | Toldos Clásicos | 1 |
| 13 | CORALBOX | Toldo cofre hasta 6 m. de línea y 4 de salida | STORBOX 400 | Toldo cofre | 1 |

---

## Tabla: cambios_definiciones

### Columnas (Estructura)
| Columna | Tipo de Dato | Longitud | Nullable |
|---------|--------------|----------|----------|
| ID | int | 4 | false |
| id_definicion | int | 4 | true |
| fecha_cambio | datetime | 8 | true |
| id_usuairo_cambio | int | 4 | true |
| comentario_cambio | nvarchar | -1 | true |

### Datos de Ejemplo (Top 5)
*Mesa vacía*

---

## Tabla: caracteristicas

### Columnas (Estructura)
| Columna | Tipo de Dato | Longitud | Nullable |
|---------|--------------|----------|----------|
| id_caracteristica | int | 4 | false |
| caracteristica | nchar | 200 | true |
| descripcion | nvarchar | 510 | true |
| comentario | nchar | 510 | true |

### Datos de Ejemplo (Top 5)
| id_caracteristica | caracteristica | descripcion | comentario |
| --- | --- | --- | --- |
| 1 | Peso                                                                                                 | NULL | Normalmente se expresa en gramos por metro cuadrado                                                  |
| 2 | Soporte                                                                                              | Base textil o material extructural sobre el cual se aplica el recubrimiento | Normalmente poliester, puede indicarse el grosor del hilo                                            |
| 3 | Recubrimiento                                                                                        | Capa o capas de material que se aplican sobre el soporte textil | Normalmente PVC                                                                                      |
| 4 | Ancho                                                                                                | Medida del ancho de la pieza o rollo en el que se sirve el material | Suele expresarse en centímetros, puede haber distintos para un mismo material                        |
| 6 | Acabado                                                                                              | Tratamiento final aplicado sobre el recubrimiento | NULL |

---

## Tabla: definiciones

### Columnas (Estructura)
| Columna | Tipo de Dato | Longitud | Nullable |
|---------|--------------|----------|----------|
| ID | int | 4 | false |
| id_definicion | int | 4 | false |
| version | int | 4 | false |
| titulo | nvarchar | 510 | true |
| definicion | nvarchar | -1 | true |
| activo | bit | 1 | true |
| eliminado | bit | 1 | true |

### Datos de Ejemplo (Top 5)
| ID | id_definicion | version | titulo | definicion | activo | eliminado |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 1 | 1 | Partes de la estructura o elemento mecánico de un toldo | El elemento mecánico o estructura de un toldo lo forman: - los soportes, que sirven para anclar el t | NULL | NULL |
| 2 | 2 | 1 | Toldos de brazos invisibles | Es el tipo de toldo más común. En este tipo de toldo los brazos son plegables y tienen dos puntos de | NULL | NULL |
| 3 | 3 | 1 | Brazos de punto recto | Los brazos llamados de punto recto para toldos de fachada son rígidos, no plegables y tienen dos pun | NULL | NULL |
| 4 | 4 | 1 | Tipos de tejidos para un toldo de fachada | Los tejidos más comunes para un toldo de fachada son: - tejido acrílico, el más común, especialmente | NULL | NULL |
| 5 | 5 | 1 | Dimensiones de un toldo | Las dimensiones de un toldo, como conjunto o sistema, se definen por dos variables: - El frente o lí | NULL | NULL |

---

## Tabla: familias

### Columnas (Estructura)
| Columna | Tipo de Dato | Longitud | Nullable |
|---------|--------------|----------|----------|
| id_familia | int | 4 | false |
| codigo | varchar | 50 | true |
| descripcion | varchar | 255 | true |

### Datos de Ejemplo (Top 5)
| id_familia | codigo | descripcion |
| --- | --- | --- |
| 1 | Toldo de fachada | NULL |
| 2 | Cintas de elevación | NULL |
| 3 | Cintas de trincaje | NULL |
| 4 | Lona | NULL |
| 5 | LONAS PARA PISCINA | COBERTORES PARA PISCINAS |

---

## Tabla: insights

### Columnas (Estructura)
| Columna | Tipo de Dato | Longitud | Nullable |
|---------|--------------|----------|----------|
| id_insight | int | 4 | false |
| origen_informacion | nvarchar | 510 | true |
| detalle_origen_informacion | nvarchar | 510 | true |
| id_tipo_origen | float | 8 | true |
| insight | nvarchar | -1 | true |
| imagen | nvarchar | 510 | true |
| titulo | nvarchar | 510 | true |

### Datos de Ejemplo (Top 5)
| id_insight | origen_informacion | detalle_origen_informacion | id_tipo_origen | insight | imagen | titulo |
| --- | --- | --- | --- | --- | --- | --- |
| 3 | AMBARBOX - CATALOGO COMERCIAL DEL PROVEEDOR | Página 2 | 1 | El toldo cofre MICROBOX-300 ofrece una completa autoprotección del tejido frente a los agentes atmos | NULL | Descripción general del toldo cofre AMBARBOX |
| 4 | AMBARBOX - CATALOGO COMERCIAL DEL PROVEEDOR | Página 3 | 1 | MICROBOX 300 destaca por: • Autoprotección del tejido conservándolo en perfecto estado. • Estructura | NULL | Ventajas del toldo AMBARBOX |
| 6 | AMBARBOX - CATALOGO COMERCIAL DEL PROVEEDOR | Página 4 | 1 | MICROBOX-300 gracias a la gran capacidad de inclinación de los brazos, resulta ideal para instalar e | NULL | Instalaciones para la que es adecuado el toldo AMBARBOX |
| 7 | AMBARBOX - CATALOGO COMERCIAL DEL PROVEEDOR | Página 5 | 1 | El toldo cofre AMBARBOX puede alcanzar, con dos brazos, un máximo de 5 metros de frente con una sali | AMBARBOX\AMBARBOX - DIMENSIONES MÁXIMAS.jpg | Dimensiones máximas del toldo AMBARBOX |
| 8 | Tarifa Llaza Enero 2025 | Página 100 | 1 | Las dimensiones del soporte del AMBARBOX dependen de si se coloca en posición frontal, a techo o ent | AMBARBOX\AMBARBOX - COTAS.jpg | Dimensiones de los soportes del toldo AMBARBOX |

---

## Tabla: intenciones

### Columnas (Estructura)
| Columna | Tipo de Dato | Longitud | Nullable |
|---------|--------------|----------|----------|
| id_intencion | int | 4 | false |
| intencion | nvarchar | 510 | true |

### Datos de Ejemplo (Top 5)
| id_intencion | intencion |
| --- | --- |
| 1 | ¿Cuál es la descripción general de {ARTÍCULO}? |
| 2 | ¿Cuáles son las principales ventajas de {ARTICULO}? |
| 3 | ¿Para que usos es adecuado {ARTICULO}? |
| 4 | ¿Qué dimensiones máximas puede alcanzar el {ARTICULO}? |
| 5 | ¿Cuánto ocupan los soportes de {ARTICULO}? |

---

## Tabla: procesos

### Columnas (Estructura)
| Columna | Tipo de Dato | Longitud | Nullable |
|---------|--------------|----------|----------|
| id_proceso | float | 8 | false |
| proceso | nvarchar | 510 | true |
| descripcion | nvarchar | 510 | true |

### Datos de Ejemplo (Top 5)
| id_proceso | proceso | descripcion |
| --- | --- | --- |
| 1 | Producción | NULL |
| 2 | Instalación | NULL |
| 3 | Comercial | NULL |
| 4 | Diseño | NULL |
| 5 | Compras | NULL |

---

## Tabla: rel_definicion_familia

### Columnas (Estructura)
| Columna | Tipo de Dato | Longitud | Nullable |
|---------|--------------|----------|----------|
| id_rel_definicion_familia | int | 4 | false |
| id_definicion | int | 4 | true |
| id_familia | int | 4 | true |

### Datos de Ejemplo (Top 5)
| id_rel_definicion_familia | id_definicion | id_familia |
| --- | --- | --- |
| 1 | 12 | 2 |
| 5 | 12 | 3 |
| 9 | 1 | 1 |
| 10 | 2 | 1 |
| 11 | 3 | 1 |

---

## Tabla: rel_Insight_articulo

### Columnas (Estructura)
| Columna | Tipo de Dato | Longitud | Nullable |
|---------|--------------|----------|----------|
| id_rel_insight_articulo | int | 4 | false |
| id_insight | float | 8 | true |
| id_articulo | float | 8 | true |

### Datos de Ejemplo (Top 5)
| id_rel_insight_articulo | id_insight | id_articulo |
| --- | --- | --- |
| 16 | 14 | 3 |
| 17 | 4 | 1 |
| 18 | 6 | 1 |
| 19 | 7 | 1 |
| 20 | 15 | 3 |

---

## Tabla: rel_insight_intencion

### Columnas (Estructura)
| Columna | Tipo de Dato | Longitud | Nullable |
|---------|--------------|----------|----------|
| id_rel_insight_intencion | int | 4 | false |
| id_insight | float | 8 | true |
| id_intencion | float | 8 | true |

### Datos de Ejemplo (Top 5)
| id_rel_insight_intencion | id_insight | id_intencion |
| --- | --- | --- |
| 1 | 3 | 1 |
| 2 | 4 | 2 |
| 3 | 6 | 3 |
| 4 | 7 | 4 |
| 5 | 8 | 5 |

---

## Tabla: rel_Insight_Proceso

### Columnas (Estructura)
| Columna | Tipo de Dato | Longitud | Nullable |
|---------|--------------|----------|----------|
| id_rel_insight_proceso | int | 4 | false |
| id_insight | float | 8 | true |
| id_proceso | float | 8 | true |
| criticidad | int | 4 | true |

### Datos de Ejemplo (Top 5)
| id_rel_insight_proceso | id_insight | id_proceso | criticidad |
| --- | --- | --- | --- |
| 20 | 3 | 3 | NULL |
| 21 | 4 | 3 | NULL |
| 22 | 6 | 3 | NULL |
| 23 | 7 | 3 | NULL |
| 24 | 7 | 2 | NULL |

---

## Tabla: roles

### Columnas (Estructura)
| Columna | Tipo de Dato | Longitud | Nullable |
|---------|--------------|----------|----------|
| id_rol | int | 4 | false |
| nombre_rol | nvarchar | 100 | true |

### Datos de Ejemplo (Top 5)
*Mesa vacía*

---

## Tabla: tipo_origen

### Columnas (Estructura)
| Columna | Tipo de Dato | Longitud | Nullable |
|---------|--------------|----------|----------|
| id_tipo_origen | float | 8 | false |
| tipo_origen | nvarchar | 510 | true |

### Datos de Ejemplo (Top 5)
| id_tipo_origen | tipo_origen |
| --- | --- |
| 1 | Proveedor |
| 2 | Experiencia |
| 3 | Externo no proveedor |
| 4 | No conformidad |

---

## Tabla: usuarios

### Columnas (Estructura)
| Columna | Tipo de Dato | Longitud | Nullable |
|---------|--------------|----------|----------|
| id_usuario | int | 4 | false |
| username | nvarchar | 200 | true |
| password_hash | nvarchar | -1 | true |
| id_rol | int | 4 | true |
| activo | bit | 1 | true |

### Datos de Ejemplo (Top 5)
*Mesa vacía*

---

## Tabla: valores

### Columnas (Estructura)
| Columna | Tipo de Dato | Longitud | Nullable |
|---------|--------------|----------|----------|
| id_valor | int | 4 | false |
| id_caracteristica | int | 4 | true |
| id_articulo | int | 4 | true |
| orden | int | 4 | true |
| valor | nvarchar | 200 | true |
| norma | nvarchar | 200 | true |
| comentarios | nvarchar | 510 | true |

### Datos de Ejemplo (Top 5)
| id_valor | id_caracteristica | id_articulo | orden | valor | norma | comentarios |
| --- | --- | --- | --- | --- | --- | --- |
| 18 | 9 | 24 | 1 | 0,52 mm | ISO 5084 | NULL |
| 19 | 2 | 24 | 2 | 1.100 dTex PES HT 990 den | NULL | 1.100 dTex indica que 10.000 m de hilo pesan 1.100 gramos. PES HT indica que es poliester de alta te |
| 20 | 3 | 24 | 3 | PVC multicapa sistema LOWICK en ambas caras | NULL | LOWICK es un tratamiento específico de Saint Clair textiles para evitar el moho por capilaridad, ayu |
| 21 | 6 | 24 | 4 | Lacado CLEANGARD en ambas caras | NULL | CLEANGARD es un tratamiento para conseguir una superficie lisa y más limpia, una protección resisten |
| 22 | 1 | 24 | 5 | 680 g/m² | ISO 3801 | NULL |

---