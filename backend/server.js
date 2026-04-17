const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey_sisgeko';

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

        const unifiedResults = allItems.filter(item => checkMatch(item, categories, familias, subfamilias, procesos, tipo_origen));
        res.json({ success: true, results: unifiedResults, facets });
    } catch (error) {
        console.error('Error de API:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
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
            const valRes = await request.query(`SELECT c.caracteristica, c.descripcion as caracteristica_desc, v.valor, v.comentarios FROM valores v JOIN caracteristicas c ON v.id_caracteristica = c.id_caracteristica WHERE v.id_articulo = @id ORDER BY v.orden`);
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
            const defRes = await request.query(`SELECT TOP 1 titulo, definicion FROM definiciones WHERE id_definicion = @id AND (activo = 1 OR activo IS NULL) AND (eliminado = 0 OR eliminado IS NULL) ORDER BY version DESC`);
            if (defRes.recordset.length > 0) {
                details.titulo = defRes.recordset[0].titulo;
                details.textoCompleto = defRes.recordset[0].definicion;
                details.definicion = defRes.recordset[0].definicion;
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

app.post('/api/definiciones', authenticate, checkRole(['editor']), async (req, res) => {
    const data = req.body;
    try {
        const pool = await sql.connect(dbConfig);
        const request = pool.request();
        request.input('id_definicion', sql.Int, 0);
        request.input('id_usuairo', sql.Int, req.user.id);
        request.input('fecha', sql.DateTime, new Date());
        request.input('comentario', sql.NVarChar, JSON.stringify({ ...data, _operation: 'CREATE' }));
        await request.query(`INSERT INTO cambios_definiciones (id_definicion, fecha_cambio, id_usuairo_cambio, comentario_cambio) VALUES (@id_definicion, @fecha, @id_usuairo, @comentario)`);
        res.json({ success: true, message: 'Cambio enviado para aprobación.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error ao enviar cambio', error: error.message });
    }
});

app.put('/api/definiciones/:groupId', authenticate, checkRole(['editor']), async (req, res) => {
    const groupId = parseInt(req.params.groupId);
    const data = req.body;
    try {
        const pool = await sql.connect(dbConfig);
        const request = pool.request();
        request.input('id_definicion', sql.Int, groupId);
        request.input('id_usuairo', sql.Int, req.user.id);
        request.input('fecha', sql.DateTime, new Date());
        request.input('comentario', sql.NVarChar, JSON.stringify({ ...data, _operation: 'UPDATE' }));
        await request.query(`INSERT INTO cambios_definiciones (id_definicion, fecha_cambio, id_usuairo_cambio, comentario_cambio) VALUES (@id_definicion, @fecha, @id_usuairo, @comentario)`);
        res.json({ success: true, message: 'Actualización enviada para aprobación.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error ao enviar actualización', error: error.message });
    }
});

app.post('/api/insights', authenticate, checkRole(['editor']), async (req, res) => {
    const data = req.body;
    try {
        const pool = await sql.connect(dbConfig);
        const request = pool.request();
        request.input('id_insight', sql.Int, 0);
        request.input('id_usuairo', sql.Int, req.user.id);
        request.input('fecha', sql.DateTime, new Date());
        request.input('comentario', sql.NVarChar, JSON.stringify({ ...data, _operation: 'CREATE' }));
        await request.query(`INSERT INTO cambios_insights (id_insight, fecha_cambio, id_usuairo_cambio, comentario_cambio) VALUES (@id_insight, @fecha, @id_usuairo, @comentario)`);
        res.json({ success: true, message: 'Novo Insight enviado para aprobación.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error ao enviar cambio', error: error.message });
    }
});

app.put('/api/insights/:groupId', authenticate, checkRole(['editor']), async (req, res) => {
    const groupId = parseInt(req.params.groupId);
    const data = req.body;
    try {
        const pool = await sql.connect(dbConfig);
        const request = pool.request();
        request.input('id_insight', sql.Int, groupId);
        request.input('id_usuairo', sql.Int, req.user.id);
        request.input('fecha', sql.DateTime, new Date());
        request.input('comentario', sql.NVarChar, JSON.stringify({ ...data, _operation: 'UPDATE' }));
        await request.query(`INSERT INTO cambios_insights (id_insight, fecha_cambio, id_usuairo_cambio, comentario_cambio) VALUES (@id_insight, @fecha, @id_usuairo, @comentario)`);
        res.json({ success: true, message: 'Actualización de Insight enviada para aprobación.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error ao enviar actualización', error: error.message });
    }
});

app.get('/api/pending-tasks', authenticate, checkRole(['editor']), async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const defs = await pool.request().query('SELECT c.*, u.username as editor FROM cambios_definiciones c JOIN usuarios u ON c.id_usuairo_cambio = u.id_usuario ORDER BY fecha_cambio DESC');
        const ins = await pool.request().query('SELECT c.*, u.username as editor FROM cambios_insights c JOIN usuarios u ON c.id_usuairo_cambio = u.id_usuario ORDER BY fecha_cambio DESC');
        const tasks = [...defs.recordset.map(t => ({ ...t, _type: 'definicion' })), ...ins.recordset.map(t => ({ ...t, _type: 'insight' }))];
        res.json({ success: true, tasks });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error ao obter tarefas' });
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

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request().input('user', sql.NVarChar, username).query('SELECT * FROM usuarios WHERE username = @user');
        if (result.recordset.length === 0) return res.status(401).json({ success: false, message: 'Usuario non atopado' });
        const user = result.recordset[0];
        if (password !== user.password) return res.status(401).json({ success: false, message: 'Contrasinal incorrecto' });
        const token = jwt.sign({ id: user.id_usuario, username: user.username, role: user.rol || user.role || 'user' }, JWT_SECRET, { expiresIn: '24h' });
        res.cookie('auth_token', token, { httpOnly: true, secure: false, maxAge: 24 * 60 * 60 * 1000 }).json({ success: true, user: { username: user.username, role: user.rol || user.role || 'user' } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error no servidor' });
    }
});

app.post('/api/logout', (req, res) => {
    res.clearCookie('auth_token').json({ success: true });
});

app.listen(PORT, () => console.log(`Servidor Sisgeko listo en porto ${PORT}`));
