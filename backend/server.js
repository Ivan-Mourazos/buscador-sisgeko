const express = require('express');
const sql = require('mssql');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Configuración de la base de datos
const dbConfig = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'your_password',
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_NAME || 'your_db',
    options: {
        encrypt: false, // Cambiado al false de entorno local
        trustServerCertificate: true
    }
};

// Comprobar conexión
sql.connect(dbConfig).then(() => {
    console.log('Conectado al servidor SQL correctamente.');
}).catch(err => {
    console.error('La conexión a la base de datos falló.', err.message);
});

// Helper seguro para el IN (soporta números e strings)
const buildInClause = (arr) => arr.map(x => {
    const num = Number(x);
    return !isNaN(num) ? num : `'${String(x).replace(/'/g, "''")}'`;
}).join(',');

// Nuevo Endpoint Avanzado POST /api/search
app.post('/api/search', async (req, res) => {
    try {
        const { query = "", filters = {} } = req.body;
        const { familias = [], subfamilias = [], procesos = [], tipo_origen = [] } = filters;
        
        console.log(`[Busca] Termo: "${query}", Filtros:`, JSON.stringify(filters));

        const pool = await sql.connect(dbConfig);
        const request = pool.request();
        
        // Extraemos las palabras clave individuales
        const words = query.trim().split(/\s+/).filter(w => w.length > 0);
        words.forEach((w, i) => request.input(`q${i}`, sql.NVarChar, `%${w}%`));

        // 1. BUSCAR ARTICULOS
        let sqlArt = `
            SELECT a.*, f.codigo as familia_nombre 
            FROM articulos a
            LEFT JOIN familias f ON a.id_familia = f.id_familia
            WHERE 1=1
        `;
        words.forEach((_, i) => {
            sqlArt += ` AND (a.descripcion LIKE @q${i} OR a.codigo LIKE @q${i} OR a.denominacion_proveedor LIKE @q${i})`;
        });
        if (familias.length > 0) sqlArt += ` AND a.id_familia IN (${buildInClause(familias)})`;
        if (subfamilias.length > 0) sqlArt += ` AND a.subfamilia IN (${buildInClause(subfamilias)})`;
        
        const resArticulos = await request.query(sqlArt);
        const articulos = resArticulos.recordset.map(a => ({ ...a, _type: 'articulo' }));
        const matchedArticuloIds = articulos.map(a => a.id_articulo);

        // 2. BUSCAR INSIGHTS (Incluímos nomes dos procesos relacionados) - Fallback para SQL 2014
        let sqlIns = `
            SELECT i.*, 
            (SELECT tipo_origen FROM tipo_origen WHERE id_tipo_origen = i.id_tipo_origen) as tipo_origen_nombre,
            ISNULL(STUFF((
                SELECT ', ' + p.proceso 
                FROM rel_Insight_Proceso rip2 
                JOIN procesos p ON rip2.id_proceso = p.id_proceso 
                WHERE rip2.id_insight = i.id_insight 
                FOR XML PATH('')
            ), 1, 2, ''), '') as procesos_lista
            FROM insights i
            WHERE 1=1
        `;
        words.forEach((_, i) => {
            sqlIns += ` AND (i.insight LIKE @q${i} OR i.titulo LIKE @q${i})`;
        });

        // Joins necesarios solo para filtros específicos si existen
        if (familias.length > 0 || subfamilias.length > 0) {
            sqlIns += ` AND i.id_insight IN (SELECT id_insight FROM rel_Insight_articulo ria JOIN articulos a ON ria.id_articulo = a.id_articulo WHERE 1=1 `;
            if (familias.length > 0) sqlIns += ` AND a.id_familia IN (${buildInClause(familias)})`;
            if (subfamilias.length > 0) sqlIns += ` AND a.subfamilia IN (${buildInClause(subfamilias)})`;
            sqlIns += `)`;
        }
        
        if (procesos.length > 0) {
            sqlIns += ` AND i.id_insight IN (SELECT id_insight FROM rel_Insight_Proceso WHERE id_proceso IN (${buildInClause(procesos)}))`;
        }
        
        if (tipo_origen.length > 0) {
            sqlIns += ` AND i.id_tipo_origen IN (${buildInClause(tipo_origen)})`;
        }

        const resInsights = await request.query(sqlIns);
        const insights = resInsights.recordset.map(i => ({ ...i, _type: 'insight' }));

        // 3. BUSCAR DEFINICIONES
        let sqlDef = `
            SELECT DISTINCT d.*, rdf.id_familia
            FROM definiciones d
            LEFT JOIN rel_definicion_familia rdf ON d.id_definicion = rdf.id_definicion
            WHERE 1=1
        `;
        words.forEach((_, i) => {
            sqlDef += ` AND (d.titulo LIKE @q${i} OR d.definicion LIKE @q${i})`;
        });
        if (familias.length > 0) {
            sqlDef += ` AND rdf.id_familia IN (${buildInClause(familias)})`;
        }
        const resDefiniciones = await request.query(sqlDef);
        let definiciones = resDefiniciones.recordset.map(d => ({ ...d, _type: 'definicion' }));

        // 4. APLICAR FILTRO DE ORIGEN (Global)
        // Como articulos y definiciones son "internos", si hay un filtro de origen externo activo, 
        // estos desaparecen de los resultados.
        let filteredArticulos = articulos;
        if (tipo_origen.length > 0) {
            filteredArticulos = [];
            definiciones = [];
        }

        // FACETAS
        const allFamilias = (await pool.request().query("SELECT * FROM familias")).recordset;
        const allSubfamilias = (await pool.request().query("SELECT DISTINCT id_familia AS id_familia, subfamilia AS nombre FROM articulos WHERE subfamilia IS NOT NULL")).recordset;
        const allProcesos = (await pool.request().query("SELECT * FROM procesos")).recordset;
        const allTiposOrigen = (await pool.request().query("SELECT * FROM tipo_origen")).recordset;

        let facets = {
            familias: allFamilias.map(f => {
                const countArts = filteredArticulos.filter(a => a.id_familia === f.id_familia).length;
                const countIns = insights.filter(i => i.id_familia === f.id_familia).length;
                const countDefs = definiciones.filter(d => d.id_familia === f.id_familia).length;
                return { ...f, count: countArts + countIns + countDefs };
            }),
            subfamilias: allSubfamilias.map(s => {
                const countArts = filteredArticulos.filter(a => a.subfamilia === s.nombre && a.id_familia === s.id_familia).length;
                const countIns = insights.filter(i => i.subfamilia === s.nombre && i.id_familia === s.id_familia).length;
                return { ...s, count: countArts + countIns };
            })
        };

        const matchedInsightIds = insights.map(i => i.id_insight);
        let insightCountByProceso = {};
        if(matchedInsightIds.length > 0) {
            const ripData = await pool.request().query(`SELECT id_proceso, count(id_insight) as cnt FROM rel_Insight_Proceso WHERE id_insight IN (${buildInClause(matchedInsightIds)}) GROUP BY id_proceso`);
            ripData.recordset.forEach(r => insightCountByProceso[r.id_proceso] = r.cnt);
        }

        facets.procesos = allProcesos.map(p => ({
            ...p,
            count: insightCountByProceso[p.id_proceso] || 0
        }));

        facets.tipo_origen = allTiposOrigen.map(t => ({
            ...t,
            count: insights.filter(i => i.id_tipo_origen === t.id_tipo_origen).length
        }));

        const unifiedResults = [...filteredArticulos, ...insights, ...definiciones];

        res.json({
            success: true,
            results: unifiedResults,
            facets
        });

    } catch (error) {
        console.error('Error de API:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
    }
});

// Endpoint dinamico de detalles
app.get('/api/details', async (req, res) => {
    try {
        const { type, id } = req.query;
        if (!type || !id) return res.status(400).json({ success: false, message: 'Falta type o id' });
        
        const pool = await sql.connect(dbConfig);
        const request = pool.request();
        request.input('id', sql.Int, parseInt(id));
        
        let details = {};
        
        if (type === 'articulo') {
            const valRes = await request.query(`
                SELECT c.caracteristica, c.descripcion as caracteristica_desc, v.valor, v.comentarios 
                FROM valores v 
                JOIN caracteristicas c ON v.id_caracteristica = c.id_caracteristica 
                WHERE v.id_articulo = @id
                ORDER BY v.orden
            `);
            details.caracteristicas = valRes.recordset;

            // También buscamos imágenes en los insights relacionados
            const imgRes = await request.query(`
                SELECT DISTINCT i.imagen
                FROM insights i
                JOIN rel_Insight_articulo ria ON i.id_insight = ria.id_insight
                WHERE ria.id_articulo = @id AND i.imagen IS NOT NULL AND i.imagen != ''
            `);
            details.imagenes = imgRes.recordset.map(r => r.imagen);
        } else if (type === 'insight') {
            const basicRes = await request.query(`
                SELECT i.*, t.tipo_origen as tipo_origen_nombre,
                STUFF((
                    SELECT ', ' + p.proceso 
                    FROM rel_Insight_Proceso rip2 
                    JOIN procesos p ON rip2.id_proceso = p.id_proceso 
                    WHERE rip2.id_insight = i.id_insight 
                    FOR XML PATH('')
                ), 1, 2, '') as procesos_lista
                FROM insights i 
                LEFT JOIN tipo_origen t ON i.id_tipo_origen = t.id_tipo_origen
                WHERE i.id_insight = @id
            `);
            if (basicRes.recordset.length > 0) {
                Object.assign(details, basicRes.recordset[0]);
            }

            const intRes = await request.query(`
                SELECT it.intencion
                FROM rel_insight_intencion rii
                JOIN intenciones it ON rii.id_intencion = it.id_intencion
                WHERE rii.id_insight = @id
            `);
            details.intenciones = intRes.recordset.map(i => i.intencion);
        } else if (type === 'definicion') {
            const defRes = await request.query(`SELECT definicion FROM definiciones WHERE id_definicion = @id`);
            if (defRes.recordset.length > 0) {
                details.textoCompleto = defRes.recordset[0].definicion;
            }
        }
        
        
        res.json({ success: true, details });
    } catch (error) {
        console.error('Error de API details:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
    }
});

const fs = require('fs');
const path = require('path');

// Configuración de Multer para subida de imaxes
const multer = require('multer');
const networkBase = '\\\\192.168.0.128\\Sisgeko';

// Endpoint para servir las imágenes (Lectura)
app.get('/api/images', (req, res) => {
    const { imgPath } = req.query;
    if (!imgPath) return res.status(400).send('Falta ruta de imagen');
    
    // 1. Opcional a futuro: si migráis a un servidor HTTP web en vez de carpetas
    if (process.env.IMAGE_SERVER_URL) {
        const formattedPath = imgPath.replace(/\\/g, '/');
        const baseUrl = process.env.IMAGE_SERVER_URL.replace(/\/$/, '');
        const redirectUrl = `${baseUrl}/${formattedPath}`;
        return res.redirect(redirectUrl);
    }

    // 2. Leer las fotos directamente de la carpeta de RED local (UNC Windows)
    const fullPath = path.join(networkBase, imgPath);

    if (fs.existsSync(fullPath)) {
        res.sendFile(fullPath);
    } else {
        res.status(404).send('Imagen no encontrada en servidor de red: ' + fullPath);
    }
});

// Configuración de almacenamiento para Subidas (Escritura)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (!fs.existsSync(networkBase)) {
            return cb(new Error('Servidor de rede non accesible: ' + networkBase));
        }
        cb(null, networkBase);
    },
    filename: (req, file, cb) => {
        // Mantemos o nome orixinal pero saneamos espazos
        const cleanName = file.originalname.replace(/\s+/g, '_');
        cb(null, cleanName);
    }
});

const upload = multer({ storage: storage });

// Endpoint para subir imaxes
app.post('/api/upload', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Non se recibiu ningún ficheiro' });
        }
        res.json({ 
            success: true, 
            message: 'Imaxe subida correctamente',
            filename: req.file.filename 
        });
    } catch (error) {
        console.error('Error na subida:', error);
        res.status(500).json({ success: false, message: 'Error ao gardar a imaxe', error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor backend ejecutándose en el puerto ${PORT}`);
});
