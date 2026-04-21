const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('CRITICAL ERROR: JWT_SECRET not found in .env');
    process.exit(1);
}

app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Middleware de autenticación
const authenticate = (req, res, next) => {
    const token = req.cookies.auth_token;
    if (!token) return res.status(401).json({ success: false, message: 'Acceso denegado' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ success: false, message: 'Token inválido' });
    }
};

// Middleware de roles
const checkRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Privilegios insuficientes' });
        }
        next();
    };
};

// Configuración de la base de datos
const dbConfig = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'your_password',
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_NAME || 'your_db',
    options: {
        encrypt: false,
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
        
        const pool = await sql.connect(dbConfig);
        const request = pool.request();
        
        const words = query.trim().split(/\s+/).filter(w => w.length > 0);
        words.forEach((w, i) => request.input(`q${i}`, sql.NVarChar, `%${w}%`));

        let currentUser = null;
        if (req.cookies.auth_token) {
            try {
                currentUser = jwt.verify(req.cookies.auth_token, JWT_SECRET);
            } catch (e) {}
        }

        // Articulos Base
        let sqlArtBase = `SELECT a.*, f.codigo as familia_nombre FROM articulos a LEFT JOIN familias f ON a.id_familia = f.id_familia WHERE 1=1 `;
        words.forEach((_, i) => { sqlArtBase += ` AND (a.descripcion LIKE @q${i} OR a.codigo LIKE @q${i} OR a.denominacion_proveedor LIKE @q${i})`; });
        sqlArtBase += ` ORDER BY a.descripcion ASC`;
        const allMatchArts = (await request.query(sqlArtBase)).recordset.map(a => ({ ...a, _type: 'articulo' }));

        // Insights Base
        let sqlInsBase = `
            SELECT i.*, (SELECT tipo_origen FROM tipo_origen WHERE id_tipo_origen = i.id_tipo_origen) as tipo_origen_nombre,
            ISNULL(STUFF((SELECT ', ' + p.proceso FROM rel_Insight_Proceso rip2 JOIN procesos p ON rip2.id_proceso = p.id_proceso WHERE rip2.id_insight = i.id_insight FOR XML PATH('')), 1, 2, ''), '') as procesos_lista
            FROM insights i 
            WHERE (i.activo = 1 OR i.activo IS NULL) AND (i.eliminado = 0 OR i.eliminado IS NULL)
            AND i.version = (
                SELECT MAX(version) FROM insights i2 
                WHERE i2.id_insight = i.id_insight 
                AND (i2.activo = 1 OR i2.activo IS NULL) AND (i2.eliminado = 0 OR i2.eliminado IS NULL)
            ) `;
        words.forEach((_, i) => { sqlInsBase += ` AND (i.insight LIKE @q${i} OR i.titulo LIKE @q${i})`; });
        sqlInsBase += ` ORDER BY i.titulo ASC`;
        let allMatchIns = (await request.query(sqlInsBase)).recordset.map(i => ({ ...i, _type: 'insight' }));

        // Definiciones Base
        let sqlDefBase = `
            SELECT d.*, 
            ISNULL(STUFF((
                SELECT ', ' + f.codigo 
                FROM rel_definicion_familia rdf2 
                JOIN familias f ON rdf2.id_familia = f.id_familia 
                WHERE rdf2.id_definicion = d.id_definicion 
                FOR XML PATH('')
            ), 1, 2, ''), '') as familias_lista
            FROM definiciones d 
            WHERE (d.activo = 1 OR d.activo IS NULL) AND (d.eliminado = 0 OR d.eliminado IS NULL)
            AND d.version = (
                SELECT MAX(version) FROM definiciones d2 
                WHERE d2.id_definicion = d.id_definicion 
                AND (d2.activo = 1 OR d2.activo IS NULL) AND (d2.eliminado = 0 OR d2.eliminado IS NULL)
            ) `;
        words.forEach((_, i) => { sqlDefBase += ` AND (d.titulo LIKE @q${i} OR d.definicion LIKE @q${i})`; });
        sqlDefBase += ` ORDER BY d.titulo ASC`;
        let allMatchDefs = (await request.query(sqlDefBase)).recordset.map(d => ({ ...d, _type: 'definicion' }));

        if (currentUser && currentUser.role === 'editor') {
            const reqDrafts = pool.request();
            reqDrafts.input('userId', sql.Int, currentUser.id);
            const draftDefs = await reqDrafts.query(`SELECT * FROM cambios_definiciones WHERE id_usuairo_cambio = @userId`);
            draftDefs.recordset.forEach(row => {
                try {
                    const draftData = JSON.parse(row.comentario_cambio);
                    const item = { ...draftData, id_definicion: row.id_definicion, _type: 'definicion', _isDraft: true, _operation: draftData._operation };
                    if (row.id_definicion > 0) allMatchDefs = allMatchDefs.filter(d => d.id_definicion !== row.id_definicion);
                    allMatchDefs.push(item);
                } catch(e) {}
            });
            const draftIns = await reqDrafts.query(`SELECT * FROM cambios_insights WHERE id_usuairo_cambio = @userId`);
            draftIns.recordset.forEach(row => {
                try {
                    const draftData = JSON.parse(row.comentario_cambio);
                    const item = { ...draftData, id_insight: row.id_insight, _type: 'insight', _isDraft: true, _operation: draftData._operation };
                    if (row.id_insight > 0) allMatchIns = allMatchIns.filter(i => i.id_insight !== row.id_insight);
                    allMatchIns.push(item);
                } catch(e) {}
            });
        }

        const allFamilias = (await pool.request().query("SELECT * FROM familias")).recordset;
        const allSubfamilias = (await pool.request().query("SELECT DISTINCT id_familia, subfamilia AS nombre FROM articulos WHERE subfamilia IS NOT NULL")).recordset;
        const allProcesos = (await pool.request().query("SELECT * FROM procesos")).recordset;
        const allTiposOrigen = (await pool.request().query("SELECT * FROM tipo_origen")).recordset;

        const matchInsIds = allMatchIns.map(i => i.id_insight);
        let insProcesosMap = {};
        if (matchInsIds.length > 0) {
            const ripData = await pool.request().query(`SELECT id_insight, id_proceso FROM rel_Insight_Proceso WHERE id_insight IN (${buildInClause(matchInsIds)})`);
            ripData.recordset.forEach(r => {
                if (!insProcesosMap[r.id_insight]) insProcesosMap[r.id_insight] = [];
                insProcesosMap[r.id_insight].push(r.id_proceso);
            });
        }

        const checkMatch = (item, activeCats, activeFams, activeSubs, activeProcs, activeOrigins) => {
            if (activeCats.length > 0 && !activeCats.includes(item._type)) return false;
            if (activeFams.length > 0) {
                if (String(item.id_familia) === "undefined") return false;
                if (!activeFams.map(String).includes(String(item.id_familia))) return false;
            }
            if (activeSubs.length > 0) {
                if (!item.subfamilia || !activeSubs.includes(item.subfamilia)) return false;
            }
            if (activeProcs.length > 0) {
                if (item._type !== 'insight') return false;
                const iProcs = insProcesosMap[item.id_insight] || [];
                if (!activeProcs.some(p => iProcs.includes(p))) return false;
            }
            if (activeOrigins.length > 0) {
                if (item._type !== 'insight' || !activeOrigins.includes(item.id_tipo_origen)) return false;
            }
            return true;
        };

        const allItems = [...allMatchArts, ...allMatchIns, ...allMatchDefs];
        const itemsForCats = allItems.filter(item => checkMatch(item, [], familias, subfamilias, procesos, tipo_origen));
        const catCounts = { articulo: 0, insight: 0, definicion: 0 };
        itemsForCats.forEach(item => { catCounts[item._type]++; });
        const itemsForFams = allItems.filter(item => checkMatch(item, categories, [], [], procesos, tipo_origen));
        const famCounts = {};
        itemsForFams.forEach(item => { famCounts[item.id_familia] = (famCounts[item.id_familia] || 0) + 1; });
        const itemsForSubs = allItems.filter(item => checkMatch(item, categories, familias, [], procesos, tipo_origen));
        const subCounts = {};
        itemsForSubs.forEach(item => {
            if (item.subfamilia) {
                const key = `${item.id_familia}-${item.subfamilia}`;
                subCounts[key] = (subCounts[key] || 0) + 1;
            }
        });
        const itemsForProcs = allMatchIns.filter(item => checkMatch(item, categories, familias, subfamilias, [], tipo_origen));
        const procCounts = {};
        itemsForProcs.forEach(item => {
            const iProcs = insProcesosMap[item.id_insight] || [];
            iProcs.forEach(pid => { procCounts[pid] = (procCounts[pid] || 0) + 1; });
        });
        const itemsForOrigins = allMatchIns.filter(item => checkMatch(item, categories, familias, subfamilias, procesos, []));
        const originCounts = {};
        itemsForOrigins.forEach(item => {
            if (item.id_tipo_origen) originCounts[item.id_tipo_origen] = (originCounts[item.id_tipo_origen] || 0) + 1;
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

        const unifiedResults = allItems
            .filter(item => checkMatch(item, categories, familias, subfamilias, procesos, tipo_origen))
            .sort((a, b) => {
                const clean = (s) => String(s || '').toLowerCase().replace(/^[^a-z0-9áéíóúüñ]+/i, '').trim();
                const titleA = clean(a.titulo || a.descripcion);
                const titleB = clean(b.titulo || b.descripcion);
                return titleA.localeCompare(titleB, 'es', { sensitivity: 'base', numeric: true });
            });
        res.json({ success: true, results: unifiedResults, facets });
    } catch (error) {
        console.error('Error de API:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});

app.get('/api/form-options', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const arts = await pool.request().query('SELECT id_articulo, descripcion FROM articulos ORDER BY descripcion');
        const procs = await pool.request().query('SELECT id_proceso, proceso as nombre FROM procesos ORDER BY proceso');
        const origins = await pool.request().query('SELECT id_tipo_origen, tipo_origen as label FROM tipo_origen ORDER BY tipo_origen');
        const fams = await pool.request().query('SELECT id_familia as value, codigo as label FROM familias ORDER BY codigo');
        const subs = await pool.request().query('SELECT DISTINCT subfamilia FROM articulos WHERE subfamilia IS NOT NULL ORDER BY subfamilia');
        res.json({
            success: true,
            articulos: arts.recordset,
            procesos: procs.recordset,
            tipo_origen: origins.recordset.map(o => ({ value: o.id_tipo_origen, label: o.label })),
            familias: fams.recordset,
            subfamilias: subs.recordset.map(s => ({ value: s.subfamilia, label: s.subfamilia }))
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error ao obter opcións', error: error.message });
    }
});

app.get('/api/details', async (req, res) => {
    try {
        const { type, id } = req.query;
        const pool = await sql.connect(dbConfig);
        const request = pool.request();
        request.input('id', sql.Int, parseInt(id));
        let details = {};
        if (type === 'articulo') {
            const valRes = await request.query(`SELECT c.caracteristica, c.descripcion as caracteristica_desc, v.valor, v.comentarios, v.norma FROM valores v JOIN caracteristicas c ON v.id_caracteristica = c.id_caracteristica WHERE v.id_articulo = @id ORDER BY v.orden`);
            details.caracteristicas = valRes.recordset;
            const imgRes = await request.query(`SELECT DISTINCT i.imagen FROM insights i JOIN rel_Insight_articulo ria ON i.id_insight = ria.id_insight WHERE ria.id_articulo = @id AND i.imagen IS NOT NULL AND i.imagen != ''`);
            details.imagenes = imgRes.recordset.map(r => r.imagen);
        } else if (type === 'insight') {
            const basicRes = await request.query(`SELECT i.*, t.tipo_origen as tipo_origen_nombre, STUFF((SELECT ', ' + p.proceso FROM rel_Insight_Proceso rip2 JOIN procesos p ON rip2.id_proceso = p.id_proceso WHERE rip2.id_insight = i.id_insight FOR XML PATH('')), 1, 2, '') as procesos_lista FROM insights i LEFT JOIN tipo_origen t ON i.id_tipo_origen = t.id_tipo_origen WHERE i.id_insight = @id`);
            if (basicRes.recordset.length > 0) Object.assign(details, basicRes.recordset[0]);
            const intRes = await request.query(`SELECT it.intencion FROM rel_insight_intencion rii JOIN intenciones it ON rii.id_intencion = it.id_intencion WHERE rii.id_insight = @id`);
            details.intenciones = intRes.recordset.map(i => i.intencion);
            const procsRes = await request.query(`SELECT id_proceso FROM rel_Insight_Proceso WHERE id_insight = @id`);
            details.procesos_vinculados = procsRes.recordset.map(p => p.id_proceso);
            const artsRes = await request.query(`SELECT id_articulo FROM rel_Insight_articulo WHERE id_insight = @id`);
            details.articulos_vinculados = artsRes.recordset.map(a => a.id_articulo);
        } else if (type === 'definicion') {
            const defRes = await request.query(`SELECT TOP 1 titulo, definicion, resumen_edicion FROM definiciones WHERE id_definicion = @id AND (activo = 1 OR activo IS NULL) AND (eliminado = 0 OR eliminado IS NULL) ORDER BY version DESC`);
            if (defRes.recordset.length > 0) {
                details.titulo = defRes.recordset[0].titulo;
                details.textoCompleto = defRes.recordset[0].definicion;
                details.definicion = defRes.recordset[0].definicion;
                details.resumen_edicion = defRes.recordset[0].resumen_edicion;
            }
            const famsRes = await request.query(`SELECT f.id_familia as id, f.codigo as nombre FROM rel_definicion_familia rdf JOIN familias f ON rdf.id_familia = f.id_familia WHERE rdf.id_definicion = @id`);
            details.familias_vinculadas = famsRes.recordset.map(f => f.id);
            details.familias_nombres = famsRes.recordset.map(f => f.nombre).join(', ');
        }
        res.json({ success: true, details });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
    }
});

app.post('/api/definiciones', authenticate, checkRole(['editor', 'admin']), async (req, res) => {
    const data = req.body;
    try {
        const pool = await sql.connect(dbConfig);
        const request = pool.request();
        request.input('id_definicion', sql.Int, 0);
        request.input('id_usuario', sql.Int, req.user.id);
        request.input('fecha', sql.DateTime, new Date());
        request.input('comentario', sql.NVarChar, JSON.stringify({ ...data, _operation: 'CREATE' }));
        await request.query(`INSERT INTO cambios_definiciones (id_definicion, fecha_cambio, id_usuairo_cambio, comentario_cambio) VALUES (@id_definicion, @fecha, @id_usuario, @comentario)`);
        res.json({ success: true, message: 'Cambio enviado para aprobación.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error ao enviar cambio', error: error.message });
    }
});

app.put('/api/definiciones/:groupId', authenticate, checkRole(['editor', 'admin']), async (req, res) => {
    const groupId = parseInt(req.params.groupId);
    const data = req.body;
    try {
        const pool = await sql.connect(dbConfig);
        const request = pool.request();
        request.input('id_definicion', sql.Int, groupId);
        request.input('id_usuario', sql.Int, req.user.id);
        request.input('fecha', sql.DateTime, new Date());
        request.input('comentario', sql.NVarChar, JSON.stringify({ ...data, _operation: 'UPDATE' }));
        await request.query(`INSERT INTO cambios_definiciones (id_definicion, fecha_cambio, id_usuairo_cambio, comentario_cambio) VALUES (@id_definicion, @fecha, @id_usuario, @comentario)`);
        res.json({ success: true, message: 'Actualización enviada para aprobación.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error ao enviar actualización', error: error.message });
    }
});

app.post('/api/insights', authenticate, checkRole(['editor', 'admin']), async (req, res) => {
    const data = req.body;
    console.log("RECIBIDA PETICIÓN CREAR INSIGHT:", data);
    try {
        const pool = await sql.connect(dbConfig);
        const request = pool.request();
        request.input('id_usuario', sql.Int, req.user.id);
        request.input('fecha', sql.DateTime, new Date());
        request.input('comentario', sql.NVarChar, JSON.stringify({ ...data, _operation: 'CREATE' }));
        
        // NO inclurimos id_insight porque al ser 0 fallaría la FK
        const query = `INSERT INTO cambios_insights (fecha_cambio, id_usuairo_cambio, comentario_cambio) 
                       VALUES (@fecha, @id_usuario, @comentario)`;
        
        console.log("EJECUTANDO QUERY DINÁMICO (CREACIÓN):", query);
        await request.query(query);
        res.json({ success: true, message: 'Novo Insight enviado para aprobación.' });
    } catch (error) {
        console.error("!!! ERROR SQL INSERT INSIGHT !!!", error.message);
        res.status(500).json({ success: false, message: 'Error ao enviar cambio: ' + error.message });
    }
});

app.put('/api/insights/:groupId', authenticate, checkRole(['editor', 'admin']), async (req, res) => {
    const groupId = parseInt(req.params.groupId);
    const data = req.body;
    try {
        const pool = await sql.connect(dbConfig);
        const request = pool.request();
        request.input('id_insight', sql.Int, groupId);
        request.input('id_usuario', sql.Int, req.user.id);
        request.input('fecha', sql.DateTime, new Date());
        request.input('comentario', sql.NVarChar, JSON.stringify({ ...data, _operation: 'UPDATE' }));
        await request.query(`INSERT INTO cambios_insights (id_insight, fecha_cambio, id_usuairo_cambio, comentario_cambio) VALUES (@id_insight, @fecha, @id_usuario, @comentario)`);
        res.json({ success: true, message: 'Actualización de Insight enviada para aprobación.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error ao enviar actualización: ' + error.message });
    }
});

app.delete('/api/definiciones/:id', authenticate, checkRole(['editor', 'admin']), async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const request = pool.request();
        const { id } = req.params;
        const comentario = JSON.stringify({ _operation: 'DELETE', titulo: req.query.titulo || 'Eliminación de Definición' });

        await request
            .input('id_def', sql.Int, id)
            .input('fecha', sql.DateTime, new Date())
            .input('id_usuario', sql.Int, req.user.id)
            .input('comentario', sql.NVarChar, comentario)
            .query(`INSERT INTO cambios_definiciones (id_definicion, fecha_cambio, id_usuairo_cambio, comentario_cambio) VALUES (@id_def, @fecha, @id_usuario, @comentario)`);
        
        res.json({ success: true, message: 'Solicitude de eliminación enviada a aprobación.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error ao enviar solicitude de borrado: ' + error.message });
    }
});

app.delete('/api/insights/:id', authenticate, checkRole(['editor', 'admin']), async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const request = pool.request();
        const { id } = req.params;
        const comentario = JSON.stringify({ _operation: 'DELETE', titulo: req.query.titulo || 'Eliminación de Insight' });

        await request
            .input('id_ins', sql.Int, id)
            .input('fecha', sql.DateTime, new Date())
            .input('id_usuario', sql.Int, req.user.id)
            .input('comentario', sql.NVarChar, comentario)
            .query(`INSERT INTO cambios_insights (id_insight, fecha_cambio, id_usuairo_cambio, comentario_cambio) VALUES (@id_ins, @fecha, @id_usuario, @comentario)`);
            
        res.json({ success: true, message: 'Solicitude de eliminación enviada a aprobación.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error ao enviar solicitude de borrado: ' + error.message });
    }
});

app.get('/api/pending-tasks', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const qIns = `
            SELECT c.*, u.username as editor_nombre 
            FROM cambios_insights c 
            JOIN usuarios u ON c.id_usuairo_cambio = u.id_usuario 
            WHERE (c.estado IS NULL OR c.estado LIKE '%pendiente%') 
            ORDER BY c.fecha_cambio DESC`;
        const qDefs = `
            SELECT c.*, u.username as editor_nombre 
            FROM cambios_definiciones c 
            JOIN usuarios u ON c.id_usuairo_cambio = u.id_usuario 
            WHERE (c.estado IS NULL OR c.estado LIKE '%pendiente%') 
            ORDER BY c.fecha_cambio DESC`;
        
        const ins = await pool.request().query(qIns);
        const defs = await pool.request().query(qDefs);
        
        const tasks = [
            ...defs.recordset.map(t => {
                let data = {};
                try { data = JSON.parse(t.comentario_cambio); } catch(e) {}
                return { 
                    ...t, 
                    _type: 'definicion', 
                    operation: data._operation || 'UPDATE',
                    titulo: data.titulo || 'Sen título',
                    editor: t.editor_nombre
                };
            }), 
            ...ins.recordset.map(t => {
                let data = {};
                try { data = JSON.parse(t.comentario_cambio); } catch(e) {}
                return { 
                    ...t, 
                    _type: 'insight', 
                    operation: data._operation || 'UPDATE',
                    titulo: data.titulo || data.insight || 'Sen título',
                    editor: t.editor_nombre
                };
            })
        ].sort((a, b) => new Date(b.fecha_cambio) - new Date(a.fecha_cambio));
        
        res.json({ success: true, tasks });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

app.get('/api/debug-db', authenticate, async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const ins = await pool.request().query("SELECT TOP 10 * FROM cambios_insights ORDER BY fecha_cambio DESC");
        const defs = await pool.request().query("SELECT TOP 10 * FROM cambios_definiciones ORDER BY fecha_cambio DESC");
        res.json({ insights: ins.recordset, definiciones: defs.recordset });
    } catch (e) {
        res.status(500).send(e.message);
    }
});

app.get('/api/activity-log', authenticate, checkRole(['editor', 'admin']), async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        // 1. Desde tablas de cambios (aprobados recientemente)
        const qDefCambios = `SELECT c.ID, c.id_definicion as origId, c.comentario_cambio, c.fecha_aprobacion, u.username as editor, a.username as aprobador, 'definicion' as _type 
                      FROM cambios_definiciones c 
                      JOIN usuarios u ON c.id_usuairo_cambio = u.id_usuario 
                      LEFT JOIN usuarios a ON c.id_aprobador = a.id_usuario
                      WHERE c.estado = 'APROBADO'`;
        
        const qInsCambios = `SELECT c.ID, c.id_insight as origId, c.comentario_cambio, c.fecha_aprobacion, u.username as editor, a.username as aprobador, 'insight' as _type 
                      FROM cambios_insights c 
                      JOIN usuarios u ON c.id_usuairo_cambio = u.id_usuario 
                      LEFT JOIN usuarios a ON c.id_aprobador = a.id_usuario
                      WHERE c.estado = 'APROBADO'`;

        // 2. Desde tablas maestras (aprobados antiguos o que ya no están en cambios)
        const qDefMaster = `SELECT id_definicion as ID, id_definicion as origId, 
                            JSON_QUERY('{"titulo":"' + titulo + '","_operation":"HISTO"}') as comentario_cambio, 
                            '2000-01-01' as fecha_aprobacion, 'sistema' as editor, resumen_edicion as aprobador, 'definicion' as _type 
                            FROM definiciones WHERE resumen_edicion IS NOT NULL AND resumen_edicion != ''`;
        
        const qInsMaster = `SELECT id_insight as ID, id_insight as origId, 
                            JSON_QUERY('{"titulo":"' + titulo + '","_operation":"HISTO"}') as comentario_cambio, 
                            '2000-01-01' as fecha_aprobacion, 'sistema' as editor, resumen_edicion as aprobador, 'insight' as _type 
                            FROM insights WHERE resumen_edicion IS NOT NULL AND resumen_edicion != ''`;

        const defsC = await pool.request().query(qDefCambios);
        const insC = await pool.request().query(qInsCambios);
        const defsM = await pool.request().query(qDefMaster);
        const insM = await pool.request().query(qInsMaster);
        
        const logs = [...defsC.recordset, ...insC.recordset, ...defsM.recordset, ...insM.recordset]
                      .sort((a, b) => {
                          const dateA = a.fecha_aprobacion ? new Date(a.fecha_aprobacion) : new Date(0);
                          const dateB = b.fecha_aprobacion ? new Date(b.fecha_aprobacion) : new Date(0);
                          return dateB - dateA;
                      });
        
        res.json({ success: true, logs });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error ao obter historial: ' + error.message });
    }
});

app.get('/api/history', authenticate, checkRole(['editor', 'admin']), async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const qDefCambios = `SELECT c.ID, c.id_definicion as origId, c.comentario_cambio, c.fecha_cambio, c.fecha_aprobacion, LOWER(c.estado) as estado, u.username as editor, a.username as aprobador, 'definicion' as _type 
                      FROM cambios_definiciones c 
                      JOIN usuarios u ON c.id_usuairo_cambio = u.id_usuario 
                      LEFT JOIN usuarios a ON c.id_aprobador = a.id_usuario
                      WHERE c.estado IN ('APROBADO', 'RECHAZADO')`;
        
        const qInsCambios = `SELECT c.ID, c.id_insight as origId, c.comentario_cambio, c.fecha_cambio, c.fecha_aprobacion, LOWER(c.estado) as estado, u.username as editor, a.username as aprobador, 'insight' as _type 
                      FROM cambios_insights c 
                      JOIN usuarios u ON c.id_usuairo_cambio = u.id_usuario 
                      LEFT JOIN usuarios a ON c.id_aprobador = a.id_usuario
                      WHERE c.estado IN ('APROBADO', 'RECHAZADO')`;

        // 2. Históricos maestros (migrados)
        const qDefMaster = `SELECT id_definicion as ID, id_definicion as origId, titulo,
                      NULL as fecha_cambio, '2000-01-01' as fecha_aprobacion, 'aprobado' as estado, 'sistema' as editor, resumen_edicion as aprobador, 'definicion' as _type 
                      FROM definiciones WHERE resumen_edicion IS NOT NULL AND resumen_edicion != ''`;
        
        const qInsMaster = `SELECT id_insight as ID, id_insight as origId, titulo,
                      NULL as fecha_cambio, '2000-01-01' as fecha_aprobacion, 'aprobado' as estado, 'sistema' as editor, resumen_edicion as aprobador, 'insight' as _type 
                      FROM insights WHERE resumen_edicion IS NOT NULL AND resumen_edicion != ''`;

        const defsC = await pool.request().query(qDefCambios);
        const insC = await pool.request().query(qInsCambios);
        const defsM = await pool.request().query(qDefMaster);
        const insM = await pool.request().query(qInsMaster);
        
        // Mapear maestros para que tengan el mismo formato JSON que los cambios
        const masterHistory = [...defsM.recordset, ...insM.recordset].map(row => ({
            ...row,
            comentario_cambio: JSON.stringify({ titulo: row.titulo, _operation: 'HISTO' })
        }));

        const history = [...defsC.recordset, ...insC.recordset, ...masterHistory]
                      .sort((a, b) => {
                          const dateA = a.fecha_aprobacion ? new Date(a.fecha_aprobacion) : new Date(0);
                          const dateB = b.fecha_aprobacion ? new Date(b.fecha_aprobacion) : new Date(0);
                          return dateB - dateA;
                      });
        
        res.json({ success: true, history });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error ao obter historial: ' + error.message });
    }
});

// ENDPOINT DE APROBACIÓN
app.post('/api/pending-tasks/:type/:taskId/approve', authenticate, checkRole(['editor', 'admin']), async (req, res) => {
    const { type, taskId } = req.params;
    const approverId = req.user.id;

    try {
        const pool = await sql.connect(dbConfig);
        const tableCambios = type === 'insight' ? 'cambios_insights' : 'cambios_definiciones';
        const searchId = type === 'insight' ? 'id_insight' : 'id_definicion';
        const tableMain = type === 'insight' ? 'insights' : 'definiciones';

        // 1. Obtener el cambio
        const changeRes = await pool.request()
            .input('id', sql.Int, taskId)
            .query(`SELECT * FROM ${tableCambios} WHERE ID = @id`);
        
        if (changeRes.recordset.length === 0) return res.status(404).json({ success: false, message: 'Cambio non atopado' });
        const change = changeRes.recordset[0];

        // 2. REGLA DE CUATRO OJOS
        if (change.id_usuairo_cambio === approverId) {
            return res.status(403).json({ success: false, message: 'Non podes aprobar as túas propias edicións' });
        }

        const data = JSON.parse(change.comentario_cambio);
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const request = new sql.Request(transaction);
            
            // 3. Obtener nueva versión
            let nextVersion = 1;
            if (change[searchId] > 0) {
                const verRes = await request.input('currentId', sql.Int, change[searchId])
                                           .query(`SELECT MAX(version) as maxV FROM ${tableMain} WHERE ${searchId} = @currentId`);
                nextVersion = (verRes.recordset[0].maxV || 0) + 1;
                data[searchId] = change[searchId]; 
            } else {
                const maxIdRes = await request.query(`SELECT MAX(${searchId}) as maxId FROM ${tableMain}`);
                data[searchId] = (maxIdRes.recordset[0].maxId || 0) + 1;
            }

            // 4. Inserción en tabla maestra
            if (data._operation === 'DELETE') {
                await request.input('targetId', sql.Int, change[searchId]).query(`UPDATE ${tableMain} SET eliminado = 1 WHERE ${searchId} = @targetId`);
            } else if (type === 'insight') {
                await request
                    .input('insId', sql.Int, data.id_insight).input('tit', sql.NVarChar, data.titulo).input('ins', sql.NVarChar, data.insight)
                    .input('img', sql.NVarChar, data.imagen).input('ori', sql.NVarChar, data.origen_informacion).input('det', sql.NVarChar, data.detalle_origen_informacion)
                    .input('tip', sql.Int, data.id_tipo_origen || 1).input('ver', sql.Int, nextVersion)
                    .input('res', sql.NVarChar, `Aprobado por ${req.user.username}`)
                    .query(`INSERT INTO insights (id_insight, titulo, insight, imagen, origen_informacion, detalle_origen_informacion, id_tipo_origen, version, resumen_edicion, activo, eliminado) 
                            VALUES (@insId, @tit, @ins, @img, @ori, @det, @tip, @ver, @res, 1, 0)`);
            } else {
                await request
                    .input('defId', sql.Int, data.id_definicion).input('tit', sql.NVarChar, data.titulo).input('def', sql.NVarChar, data.definicion)
                    .input('ver', sql.Int, nextVersion).input('res', sql.NVarChar, `Aprobado por ${req.user.username}`)
                    .query(`INSERT INTO definiciones (id_definicion, titulo, definicion, version, resumen_edicion, activo, eliminado) 
                            VALUES (@defId, @tit, @def, @ver, @res, 1, 0)`);
            }

            // 5. Marcar como APROBADO en historial de cambios (HISTORIAL SEGURO)
            await new sql.Request(transaction)
                .input('idC', sql.Int, taskId)
                .input('appId', sql.Int, approverId)
                .query(`UPDATE ${tableCambios} SET estado = 'APROBADO', fecha_aprobacion = GETDATE(), id_aprobador = @appId WHERE ID = @idC`);

            await transaction.commit();
            res.json({ success: true, message: 'Aprobado con éxito.' });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error: ' + error.message });
    }
});

// ENDPOINT DE RECHAZO
app.post('/api/pending-tasks/:type/:taskId/reject', authenticate, checkRole(['editor', 'admin']), async (req, res) => {
    const { type, taskId } = req.params;
    const approverId = req.user.id;
    try {
        const pool = await sql.connect(dbConfig);
        const table = type === 'insight' ? 'cambios_insights' : 'cambios_definiciones';
        await pool.request()
            .input('id', sql.Int, taskId)
            .input('appId', sql.Int, approverId)
            .query(`UPDATE ${table} SET estado = 'RECHAZADO', fecha_aprobacion = GETDATE(), id_aprobador = @appId WHERE ID = @id`);
        res.json({ success: true, message: 'Cambio rexeitado.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error ao rexeitar: ' + error.message });
    }
});

const fs = require('fs');
const path = require('path');
const isLinux = process.platform === 'linux';
const networkBase = process.env.IMAGE_PATH || (isLinux ? '/mnt/sisgeko' : '\\\\192.168.0.128\\Sisgeko');

app.get('/api/images', (req, res) => {
    const { imgPath } = req.query;
    if (!imgPath) return res.status(400).send('Falta ruta');
    let safePath = isLinux ? imgPath.replace(/\\/g, '/') : imgPath.replace(/\//g, '\\');
    const fullPath = path.normalize(path.join(networkBase, safePath));
    if (fs.existsSync(fullPath)) res.sendFile(fullPath);
    else res.status(404).send('Imaxe non atopada');
});

app.get('/api/me', authenticate, (req, res) => {
    res.json({ success: true, user: req.user });
});



app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request().input('user', sql.NVarChar, username).query('SELECT * FROM usuarios WHERE username = @user');
        if (result.recordset.length === 0) return res.status(401).json({ success: false, message: 'Usuario non atopado' });
        const user = result.recordset[0];
        
        // Comparación simple contra password_hash
        if (password !== user.password_hash) {
            return res.status(401).json({ success: false, message: 'Contrasinal incorrecto' });
        }

        const roleString = user.id_rol === 1 ? 'editor' : (user.id_rol === 2 ? 'admin' : 'user');
        
        // Redundancia total para evitar fallos en frontend
        const userSession = { 
            id: user.id_usuario, 
            username: user.username, 
            role: roleString,
            rol: roleString 
        };

        const token = jwt.sign(userSession, JWT_SECRET, { expiresIn: '24h' });
        res.cookie('auth_token', token, { httpOnly: true, secure: false, maxAge: 24 * 60 * 60 * 1000 }).json({ 
            success: true, 
            user: userSession 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error no servidor' });
    }
});

app.post('/api/logout', (req, res) => {
    res.clearCookie('auth_token').json({ success: true });
});

app.get('/api/pending-count', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const ins = await pool.request().query("SELECT COUNT(*) as count FROM cambios_insights WHERE (estado IS NULL OR estado LIKE '%pendiente%')");
        const defs = await pool.request().query("SELECT COUNT(*) as count FROM cambios_definiciones WHERE (estado IS NULL OR estado LIKE '%pendiente%')");
        const total = (ins.recordset[0]?.count || 0) + (defs.recordset[0]?.count || 0);
        res.json({ success: true, count: total });
    } catch (e) {
        res.json({ success: true, count: 0 });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor Sisgeko listo en puerto ${PORT}`);
});
