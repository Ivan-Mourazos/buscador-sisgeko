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
    // console.log('Conectado al servidor SQL correctamente.');
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
        const { categories = [], familias = [], subfamilias = [], procesos = [], tipo_origen = [] } = filters;
        
        // console.log(`[Busca] Termo: "${query}", Filtros:`, JSON.stringify(filters));

        const pool = await sql.connect(dbConfig);
        const request = pool.request();
        
        // Extraemos las palabras clave individuales
        const words = query.trim().split(/\s+/).filter(w => w.length > 0);
        words.forEach((w, i) => request.input(`q${i}`, sql.NVarChar, `%${w}%`));

        // --- 1. BUSCAR TODAS LAS POSIBLES COINCIDENCIAS POR TEXTO (Base para facetas) ---
        
        // Articulos Base
        let sqlArtBase = `SELECT a.*, f.codigo as familia_nombre FROM articulos a LEFT JOIN familias f ON a.id_familia = f.id_familia WHERE 1=1 `;
        words.forEach((_, i) => { sqlArtBase += ` AND (a.descripcion LIKE @q${i} OR a.codigo LIKE @q${i} OR a.denominacion_proveedor LIKE @q${i})`; });
        const allMatchArts = (await request.query(sqlArtBase)).recordset.map(a => ({ ...a, _type: 'articulo' }));

        // Insights Base
        let sqlInsBase = `
            SELECT i.*, (SELECT tipo_origen FROM tipo_origen WHERE id_tipo_origen = i.id_tipo_origen) as tipo_origen_nombre,
            ISNULL(STUFF((SELECT ', ' + p.proceso FROM rel_Insight_Proceso rip2 JOIN procesos p ON rip2.id_proceso = p.id_proceso WHERE rip2.id_insight = i.id_insight FOR XML PATH('')), 1, 2, ''), '') as procesos_lista
            FROM insights i WHERE 1=1 `;
        words.forEach((_, i) => { sqlInsBase += ` AND (i.insight LIKE @q${i} OR i.titulo LIKE @q${i})`; });
        const allMatchIns = (await request.query(sqlInsBase)).recordset.map(i => ({ ...i, _type: 'insight' }));

        // Definiciones Base
        let sqlDefBase = `SELECT DISTINCT d.*, rdf.id_familia FROM definiciones d LEFT JOIN rel_definicion_familia rdf ON d.id_definicion = rdf.id_definicion WHERE 1=1 `;
        words.forEach((_, i) => { sqlDefBase += ` AND (d.titulo LIKE @q${i} OR d.definicion LIKE @q${i})`; });
        const allMatchDefs = (await request.query(sqlDefBase)).recordset.map(d => ({ ...d, _type: 'definicion' }));

        // --- 2. CÁLCULO DE FACETAS DINÁMICAS ---
        
        const allFamilias = (await pool.request().query("SELECT * FROM familias")).recordset;
        const allSubfamilias = (await pool.request().query("SELECT DISTINCT id_familia, subfamilia AS nombre FROM articulos WHERE subfamilia IS NOT NULL")).recordset;
        const allProcesos = (await pool.request().query("SELECT * FROM procesos")).recordset;
        const allTiposOrigen = (await pool.request().query("SELECT * FROM tipo_origen")).recordset;

        // Necesitamos saber qué insights tienen qué procesos (Mapa para velocidad)
        const matchInsIds = allMatchIns.map(i => i.id_insight);
        let insProcesosMap = {}; // { id_insight: [id_proceso, ...] }
        if (matchInsIds.length > 0) {
            const ripData = await pool.request().query(`SELECT id_insight, id_proceso FROM rel_Insight_Proceso WHERE id_insight IN (${buildInClause(matchInsIds)})`);
            ripData.recordset.forEach(r => {
                if (!insProcesosMap[r.id_insight]) insProcesosMap[r.id_insight] = [];
                insProcesosMap[r.id_insight].push(r.id_proceso);
            });
        }
          // Función de filtrado local para facetas
        const checkMatch = (item, activeCats, activeFams, activeSubs, activeProcs, activeOrigins) => {
            // Categoría
            if (activeCats.length > 0 && !activeCats.includes(item._type)) return false;
            // Familia
            if (activeFams.length > 0) {
                if (String(item.id_familia) === "undefined") return false;
                if (!activeFams.map(String).includes(String(item.id_familia))) return false;
            }
            // Subfamilia
            if (activeSubs.length > 0) {
                if (!item.subfamilia || !activeSubs.includes(item.subfamilia)) return false;
            }
            // Procesos (Solo insights)
            if (activeProcs.length > 0) {
                if (item._type !== 'insight') return false;
                const iProcs = insProcesosMap[item.id_insight] || [];
                if (!activeProcs.some(p => iProcs.includes(p))) return false;
            }
            // Origen (Solo insights)
            if (activeOrigins.length > 0) {
                if (item._type !== 'insight' || !activeOrigins.includes(item.id_tipo_origen)) return false;
            }
            return true;
        };

        const allItems = [...allMatchArts, ...allMatchIns, ...allMatchDefs];

        // --- 2. CÁLCULO DE FACETAS DINÁMICAS OPTIMIZADO ---
        
        // 2a. Categorías: Dependen de familias, subfamilias, procesos y origen
        const itemsForCats = allItems.filter(item => checkMatch(item, [], familias, subfamilias, procesos, tipo_origen));
        const catCounts = { articulo: 0, insight: 0, definicion: 0 };
        itemsForCats.forEach(item => { catCounts[item._type]++; });

        // 2b. Familias: Dependen de categorías, procesos y origen (no de familias/subs)
        const itemsForFams = allItems.filter(item => checkMatch(item, categories, [], [], procesos, tipo_origen));
        const famCounts = {};
        itemsForFams.forEach(item => { famCounts[item.id_familia] = (famCounts[item.id_familia] || 0) + 1; });

        // 2c. Subfamilias: Dependen de categorías, familia, procesos y origen (independientes de otras subs)
        const itemsForSubs = allItems.filter(item => checkMatch(item, categories, familias, [], procesos, tipo_origen));
        const subCounts = {}; // Key: "id_familia-nombre"
        itemsForSubs.forEach(item => {
            if (item.subfamilia) {
                const key = `${item.id_familia}-${item.subfamilia}`;
                subCounts[key] = (subCounts[key] || 0) + 1;
            }
        });

        // 2d. Procesos: Dependen de categorías, familias, subfamilias y origen
        const itemsForProcs = allMatchIns.filter(item => checkMatch(item, categories, familias, subfamilias, [], tipo_origen));
        const procCounts = {};
        itemsForProcs.forEach(item => {
            const iProcs = insProcesosMap[item.id_insight] || [];
            iProcs.forEach(pid => { procCounts[pid] = (procCounts[pid] || 0) + 1; });
        });

        // 2e. Origen: Dependen de categorías, familias, subfamilias y procesos
        const itemsForOrigins = allMatchIns.filter(item => checkMatch(item, categories, familias, subfamilias, procesos, []));
        const originCounts = {};
        itemsForOrigins.forEach(item => {
            if (item.id_tipo_origen) {
                originCounts[item.id_tipo_origen] = (originCounts[item.id_tipo_origen] || 0) + 1;
            }
        });

        const facets = {
            categories: [
                { id: 'articulo', nombre: 'Artigos', count: catCounts.articulo || 0 },
                { id: 'insight', nombre: 'Insights', count: catCounts.insight || 0 },
                { id: 'definicion', nombre: 'Definicións', count: catCounts.definicion || 0 }
            ],
            familias: allFamilias.map(f => ({ ...f, count: famCounts[f.id_familia] || 0 })),
            subfamilias: allSubfamilias.map(s => ({ ...s, count: subCounts[`${s.id_familia}-${s.nombre}`] || 0 })),
            procesos: allProcesos.map(p => ({ ...p, count: procCounts[p.id_proceso] || 0 })),
            tipo_origen: allTiposOrigen.map(t => ({ ...t, count: originCounts[t.id_tipo_origen] || 0 }))
        };

        // --- 3. RESULTADOS FINALES (Filtrados por TODO) ---
        const unifiedResults = allItems.filter(item => 
            checkMatch(item, categories, familias, subfamilias, procesos, tipo_origen)
        );

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
    
    // Normalizamos el SAP/Ruta de entrada para evitar choques de barras
    const safeImgPath = imgPath.replace(/\//g, '\\');
    const fullPath = path.normalize(path.join(networkBase, safeImgPath));

    if (fs.existsSync(fullPath)) {
        res.sendFile(fullPath);
    } else {
        res.status(404).send('Imágen no encontrada: ' + fullPath);
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

// Servir archivos estáticos del frontend (Producción)
const frontendDistPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDistPath));

// Manejar todas las demás rutas para el cliente React (SPA)
app.get('*catchall', (req, res) => {
    const indexPath = path.join(frontendDistPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        // Si no existe (en desarrollo), mostramos un mensaje o dejamos que maneje Express
        res.status(404).json({ success: false, message: 'Interface non compilada. Use npm run build en /frontend' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor backend ejecutándose en el puerto ${PORT}`);
});
