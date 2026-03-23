# Contenido de la Base de Datos SISGEKO

## Tabla: articulos

### Columnas (Estructura)
| Columna | Tipo de Dato | Longitud |
|---------|--------------|----------|
| id_articulo | int | - |
| codigo | nvarchar | 255 |
| descripcion | nvarchar | 255 |
| denominacion_proveedor | nvarchar | 255 |
| subfamilia | nvarchar | 255 |
| id_familia | int | - |

### Datos de Ejemplo (Top 5)
| id_articulo | codigo | descripcion | denominacion_proveedor | subfamilia | id_familia |
| --- | --- | --- | --- | --- | --- |
| 1 | AMBARBOX | Toldo cofre de punto recto | Microbox 300 | Toldo cofre | 1 |
| 2 | XACOBEO | Toldo de brazos invisibles para pequeñas dimensiones | Art 250 | Brazos invisibles | 1 |
| 3 | KÜADBOX | Toldo cofre de gama alta con formas minimalistas | Küadbox | Toldo cofre | 1 |
| 11 | PUNTORECTO | Toldo clásico, con brazo de punto recto o "directo" | PRT | Toldos Clásicos | 1 |
| 13 | CORALBOX | Toldo cofre hasta 6 m. de línea y 4 de salida | STORBOX 400 | Toldo cofre | 1 |

---

## Tabla: caracteristicas

### Columnas (Estructura)
| Columna | Tipo de Dato | Longitud |
|---------|--------------|----------|
| id_caracteristica | int | - |
| caracteristica | nchar | 100 |
| descripcion | nvarchar | 255 |
| comentario | nchar | 255 |

### Datos de Ejemplo (Top 5)
| id_caracteristica | caracteristica | descripcion | comentario |
| --- | --- | --- | --- |
| 1 | Peso                                                                                                 | NULL | Normalmente se expresa en gramos por metro cuadrado                                                                                                                                                                                                             |
| 2 | Soporte                                                                                              | Base textil o material extructural sobre el cual se aplica el recubrimiento | Normalmente poliester, puede indicarse el grosor del hilo                                                                                                                                                                                                       |
| 3 | Recubrimiento                                                                                        | Capa o capas de material que se aplican sobre el soporte textil | Normalmente PVC                                                                                                                                                                                                                                                 |
| 4 | Ancho                                                                                                | Medida del ancho de la pieza o rollo en el que se sirve el material | Suele expresarse en centímetros, puede haber distintos para un mismo material                                                                                                                                                                                   |
| 6 | Acabado                                                                                              | Tratamiento final aplicado sobre el recubrimiento | NULL |

---

## Tabla: definiciones

### Columnas (Estructura)
| Columna | Tipo de Dato | Longitud |
|---------|--------------|----------|
| id_definicion | int | - |
| titulo | nvarchar | 255 |
| definicion | nvarchar | -1 |

### Datos de Ejemplo (Top 5)
| id_definicion | titulo | definicion |
| --- | --- | --- |
| 1 | Partes de la estructura o elemento mecánico de un toldo | El elemento mecánico o estructura de un toldo lo forman: - los soportes, que sirven para anclar el toldo en la pared y sujetar el resto de elementos, - los perfiles o tubos: el perfil delantero o tubo de carga y el perfil trasero o tubo de enrolle. Algunos modelos tienen además perfiles protectores (los modelos cofres y semicofres) - los brazos que permiten la proyección del toldo, hay diferentes tipos de brazos siendo los dos tipos más comunes los llamados brazos invisibles y brazos de punto recto - los sistemas de accionamiento, que permiten la apertura y cierre del toldo. Pueden ser manuales (mediante manivela y máquina elevadora) o por medio de motor. |
| 2 | Toldos de brazos invisibles | Es el tipo de toldo más común. En este tipo de toldo los brazos son plegables y tienen dos puntos de sujeción: uno en el soporte y otro en el tubo delantero o de carga. Cuando el toldo está cerrado, los brazos quedan plegados bajo el tubo de enrolle. |
| 3 | Brazos de punto recto | Los brazos llamados de punto recto para toldos de fachada son rígidos, no plegables y tienen dos puntos de anclaje: uno en el tubo delantero o de carga y otro en la pared por debajo de los soportes que sujetan el tubo de enrolle. Con el toldo cerrado el brazo queda pegado a la pared, una vez abierto el brazo queda perpendicular a la pared (desde el soporte del brazo, hasta el tubo de carga o delantero). Se recomienda su instalación en ventanas y lugares altos ya que con el toldo abierto |
| 4 | Tipos de tejidos para un toldo de fachada | Los tejidos más comunes para un toldo de fachada son: - tejido acrílico, el más común, especialmente diseñado para protección solar con gran solidez de color, no es completamente impermeable, pero es más eficaz para proporcionar sombra - tejido acrílico resinado, es un tejido acrílico que ha recibido un tratamiento para mejorar su impermeabilidad (sin lograrla totalmente) - tejido de poliester recubierto de PVC, completamente impermeable y muy resistente a las roturas - tejidos técnicos microperforados, como por ejemplo el SOLTIS, muy duraderos con un alto nivel de aislamiento térmico y eficaces para reducir el calor por su capacidad de transpiración |
| 5 | Dimensiones de un toldo | Las dimensiones de un toldo, como conjunto o sistema, se definen por dos variables: - El frente o línea del toldo, que equivale a lo ancho del sistema en paralelo a la parede de extremo a extremo, - La salida del toldos, o proyeccción máxima que alcanza un toldo cuando está totamente abierto.  Mientras que cada toldo se fabrica con el frente o línea adecuado a cada cliente, la salida está determinada por el largo del brazo, que se fabrica de forma estándar y su medida viene dada, normalmente de 25 en 25 centímetros. |

---

## Tabla: familias

### Columnas (Estructura)
| Columna | Tipo de Dato | Longitud |
|---------|--------------|----------|
| id_familia | int | - |
| codigo | varchar | 50 |
| descripcion | varchar | 255 |

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
| Columna | Tipo de Dato | Longitud |
|---------|--------------|----------|
| id_insight | int | - |
| origen_informacion | nvarchar | 255 |
| detalle_origen_informacion | nvarchar | 255 |
| id_tipo_origen | float | - |
| insight | nvarchar | -1 |
| imagen | nvarchar | 255 |
| titulo | nvarchar | 255 |

### Datos de Ejemplo (Top 5)
| id_insight | origen_informacion | detalle_origen_informacion | id_tipo_origen | insight | imagen | titulo |
| --- | --- | --- | --- | --- | --- | --- |
| 3 | AMBARBOX - CATALOGO COMERCIAL DEL PROVEEDOR | Página 2 | 1 | El toldo cofre MICROBOX-300 ofrece una completa autoprotección del tejido frente a los agentes atmosféricos, permitiendo además alargar enormemente la vida útil de todos del producto. Su sistema de anclaje multi-soporte es perfecto para obtener grandes líneas y destaca además por la alta capacidad de enrolle dentro de los perfiles cofre, pudiendo alcanzar unas dimensiones máximas de 5 m. de línea y 1,40 m. de proyección, con ángulo variable hasta los 180º. | NULL | Descripción general del toldo cofre AMBARBOX |
| 4 | AMBARBOX - CATALOGO COMERCIAL DEL PROVEEDOR | Página 3 | 1 | MICROBOX 300 destaca por: • Autoprotección del tejido conservándolo en perfecto estado. • Estructura elegante y funcional, diseñada para conseguir, hasta en su último detalle, la integración perfecta del toldo en la fachada • Ideal para instalar en ventanas. • Brazos punto recto con tensión (PRT) con inclinación hasta 180º. | NULL | Ventajas del toldo AMBARBOX |
| 6 | AMBARBOX - CATALOGO COMERCIAL DEL PROVEEDOR | Página 4 | 1 | MICROBOX-300 gracias a la gran capacidad de inclinación de los brazos, resulta ideal para instalar en ventanas de edificios residenciales y también en escaparates de comercios. Su diseño de líneas suaves armoniza con los ambientes más exigentes, resultando un producto muy atractivo para destacar la elegancia de las fachadas clásicas y comercios con aire tradicional. | NULL | Instalaciones para la que es adecuado el toldo AMBARBOX |
| 7 | AMBARBOX - CATALOGO COMERCIAL DEL PROVEEDOR | Página 5 | 1 | El toldo cofre AMBARBOX puede alcanzar, con dos brazos, un máximo de 5 metros de frente con una salida de 1,40 m | AMBARBOX\AMBARBOX - DIMENSIONES MÁXIMAS.jpg | Dimensiones máximas del toldo AMBARBOX |
| 8 | Tarifa Llaza Enero 2025 | Página 100 | 1 | Las dimensiones del soporte del AMBARBOX dependen de si se coloca en posición frontal, a techo o entre paredes.  - En posición frontal ocupa 132 mm de ancho y 126 mm  de alto.  - En posición a techo ocupa 12mm 3 de ancho y 135 mm de alto | AMBARBOX\AMBARBOX - COTAS.jpg | Dimensiones de los soportes del toldo AMBARBOX |

---

## Tabla: intenciones

### Columnas (Estructura)
| Columna | Tipo de Dato | Longitud |
|---------|--------------|----------|
| id_intencion | int | - |
| intencion | nvarchar | 255 |

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
| Columna | Tipo de Dato | Longitud |
|---------|--------------|----------|
| id_proceso | float | - |
| proceso | nvarchar | 255 |
| descripcion | nvarchar | 255 |

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
| Columna | Tipo de Dato | Longitud |
|---------|--------------|----------|
| id_rel_definicion_familia | int | - |
| id_definicion | int | - |
| id_familia | int | - |

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
| Columna | Tipo de Dato | Longitud |
|---------|--------------|----------|
| id_rel_insight_articulo | int | - |
| id_insight | float | - |
| id_articulo | float | - |

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
| Columna | Tipo de Dato | Longitud |
|---------|--------------|----------|
| id_rel_insight_intencion | int | - |
| id_insight | float | - |
| id_intencion | float | - |

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
| Columna | Tipo de Dato | Longitud |
|---------|--------------|----------|
| id_rel_insight_proceso | int | - |
| id_insight | float | - |
| id_proceso | float | - |
| criticidad | int | - |

### Datos de Ejemplo (Top 5)
| id_rel_insight_proceso | id_insight | id_proceso | criticidad |
| --- | --- | --- | --- |
| 20 | 3 | 3 | NULL |
| 21 | 4 | 3 | NULL |
| 22 | 6 | 3 | NULL |
| 23 | 7 | 3 | NULL |
| 24 | 7 | 2 | NULL |

---

## Tabla: tipo_origen

### Columnas (Estructura)
| Columna | Tipo de Dato | Longitud |
|---------|--------------|----------|
| id_tipo_origen | float | - |
| tipo_origen | nvarchar | 255 |

### Datos de Ejemplo (Top 5)
| id_tipo_origen | tipo_origen |
| --- | --- |
| 1 | Proveedor |
| 2 | Experiencia |
| 3 | Externo no proveedor |

---

## Tabla: valores

### Columnas (Estructura)
| Columna | Tipo de Dato | Longitud |
|---------|--------------|----------|
| id_valor | int | - |
| id_caracteristica | int | - |
| id_articulo | int | - |
| orden | int | - |
| valor | nvarchar | 100 |
| norma | nvarchar | 100 |
| comentarios | nvarchar | 255 |

### Datos de Ejemplo (Top 5)
| id_valor | id_caracteristica | id_articulo | orden | valor | norma | comentarios |
| --- | --- | --- | --- | --- | --- | --- |
| 18 | 9 | 24 | 1 | 0,52 mm | ISO 5084 | NULL |
| 19 | 2 | 24 | 2 | 1.100 dTex PES HT 990 den | NULL | 1.100 dTex indica que 10.000 m de hilo pesan 1.100 gramos. PES HT indica que es poliester de alta tenacidad (high tenacity), 990 den indica que 9.000 metros de hilo pesan 990 gramos |
| 20 | 3 | 24 | 3 | PVC multicapa sistema LOWICK en ambas caras | NULL | LOWICK es un tratamiento específico de Saint Clair textiles para evitar el moho por capilaridad, ayuda a que el tejido dure más tiempo y parezca nuevo |
| 21 | 6 | 24 | 4 | Lacado CLEANGARD en ambas caras | NULL | CLEANGARD es un tratamiento para conseguir una superficie lisa y más limpia, una protección resistente a la intemperie |
| 22 | 1 | 24 | 5 | 680 g/m² | ISO 3801 | NULL |

---

