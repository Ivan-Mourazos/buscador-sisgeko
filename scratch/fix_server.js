const fs = require('fs');

const startMarker = '// ==========================================';
const endMarker = 'app.post(\'/api/search\',';

try {
    const serverPath = 'c:/Users/ivan.sanchez/Documents/Proyectos DEV/buscador-sisgeko/backend/server.js';
    const content = fs.readFileSync(serverPath, 'utf8');
    const parts = content.split(startMarker);
    
    // El archivo tiene varios bloques con ese marcador.
    // Según view_file, el bloque de aprobación empieza en la parte que contiene "app.get('/api/pending-tasks'"
    
    let pendingTasksIndex = -1;
    for (let i = 0; i < parts.length; i++) {
        if (parts[i].includes("app.get('/api/pending-tasks'")) {
            pendingTasksIndex = i;
            break;
        }
    }

    if (pendingTasksIndex === -1) {
        console.error('No se encontró la sección de tareas pendientes');
        process.exit(1);
    }

    // El contenido que queremos reemplazar está en parts[pendingTasksIndex + 1]
    const currentSectionContent = parts[pendingTasksIndex + 1];
    const afterAuditParts = currentSectionContent.split(endMarker);
    
    const newAuditSection = `// ==========================================
// ENDPOINTS DE FLUJO DE APROBACIÓN (PENDING TASKS)
// ==========================================

app.get('/api/pending-tasks', authenticate, checkRole(['editor']), async (req, res) => {
    try {
        const pool = await poolPromise;
        const defs = await pool.request().query("SELECT c.*, u.nombre as editor FROM cambios_definiciones c JOIN usuarios u ON c.id_usuairo_cambio = u.id WHERE c.estado = 'pendiente' OR c.estado IS NULL ORDER BY fecha_cambio DESC");
        const ins = await pool.request().query("SELECT c.*, u.nombre as editor FROM cambios_insights c JOIN usuarios u ON c.id_usuairo_cambio = u.id WHERE c.estado = 'pendiente' OR c.estado IS NULL ORDER BY fecha_cambio DESC");
        
        const tasks = [
            ...defs.recordset.map(t => ({ ...t, _type: 'definicion' })),
            ...ins.recordset.map(t => ({ ...t, _type: 'insight' }))
        ];
        
        res.json({ success: true, tasks });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error ao obtener tareas' });
    }
});

app.get('/api/history', authenticate, checkRole(['editor']), async (req, res) => {
    try {
        const pool = await poolPromise;
        const defs = await pool.request().query("SELECT c.*, u.nombre as editor, a.nombre as aprobador FROM cambios_definiciones c JOIN usuarios u ON c.id_usuairo_cambio = u.id LEFT JOIN usuarios a ON c.id_aprobador = a.id WHERE c.estado IN ('aprobado', 'rechazado') ORDER BY fecha_aprobacion DESC");
        const ins = await pool.request().query("SELECT c.*, u.nombre as editor, a.nombre as aprobador FROM cambios_insights c JOIN usuarios u ON c.id_usuairo_cambio = u.id LEFT JOIN usuarios a ON c.id_aprobador = a.id WHERE c.estado IN ('aprobado', 'rechazado') ORDER BY fecha_aprobacion DESC");
        
        const history = [
            ...defs.recordset.map(t => ({ ...t, _type: 'definicion' })),
            ...ins.recordset.map(t => ({ ...t, _type: 'insight' }))
        ].sort((a,b) => new Date(b.fecha_aprobacion) - new Date(a.fecha_aprobacion));
        
        res.json({ success: true, history });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error ao obtener historial' });
    }
});

app.post('/api/approve-task', authenticate, checkRole(['editor']), async (req, res) => {
    const { taskId, type, action } = req.body;
    let pool;
    let transaction;
    try {
        pool = await poolPromise;
        const table = type === 'definicion' ? 'cambios_definiciones' : 'cambios_insights';
        const draftRes = await pool.request().input('id', sql.Int, taskId).query(\`SELECT * FROM \${table} WHERE ID = @id\`);
        
        if (draftRes.recordset.length === 0) return res.status(404).json({ success: false, message: 'Tarefa non atopada' });
        const draft = draftRes.recordset[0];

        if (draft.id_usuairo_cambio === req.session.user.id) {
            return res.status(403).json({ success: false, message: 'Non podes aprobar as túas propias edicións' });
        }

        const draftData = JSON.parse(draft.comentario_cambio);
        transaction = new sql.Transaction(pool);
        await transaction.begin();

        if (action === 'approve') {
            if (type === 'definicion') {
                const request = new sql.Request(transaction);
                let groupId = draft.id_definicion;
                if (groupId === 0) {
                    const groupRes = await request.query("SELECT ISNULL(MAX(id_definicion), 0) + 1 as new_id FROM definiciones");
                    groupId = groupRes.recordset[0].new_id;
                }
                await request.input('gid', sql.Int, groupId).query("UPDATE definiciones SET activo = 0 WHERE id_definicion = @gid");
                const verRes = await new sql.Request(transaction).input('gid', sql.Int, groupId).query("SELECT ISNULL(MAX(version), 0) + 1 as next_ver FROM definiciones WHERE id_definicion = @gid");
                const nextVer = verRes.recordset[0].next_ver;

                const insReq = new sql.Request(transaction);
                insReq.input('gid', sql.Int, groupId).input('ver', sql.Int, nextVer).input('tit', sql.NVarChar, draftData.titulo).input('def', sql.NVarChar, draftData.definicion).input('res', sql.NVarChar, draftData.resumen_edicion);
                await insReq.query("INSERT INTO definiciones (id_definicion, version, titulo, definicion, activo, eliminado, resumen_edicion) VALUES (@gid, @ver, @tit, @def, 1, 0, @res)");
                
                if (draftData.familias_vinculadas) {
                    for (const fid of draftData.familias_vinculadas) {
                        await new sql.Request(transaction).input('did', sql.Int, groupId).input('fid', sql.Int, fid).query("INSERT INTO rel_definicion_familia (id_definicion, id_familia) VALUES (@did, @fid)");
                    }
                }
            } else {
                const request = new sql.Request(transaction);
                let groupId = draft.id_insight;
                if (groupId === 0) {
                    const groupRes = await request.query("SELECT ISNULL(MAX(id_insight), 0) + 1 as new_id FROM insights");
                    groupId = groupRes.recordset[0].new_id;
                }
                await request.input('gid', sql.Int, groupId).query("UPDATE insights SET activo = 0 WHERE id_insight = @gid");
                const verRes = await new sql.Request(transaction).input('gid', sql.Int, groupId).query("SELECT ISNULL(MAX(version), 0) + 1 as next_ver FROM insights WHERE id_insight = @gid");
                const nextVer = verRes.recordset[0].next_ver;

                const insReq = new sql.Request(transaction);
                insReq.input('gid', sql.Int, groupId).input('ver', sql.Int, nextVer).input('oi', sql.NVarChar, draftData.origen_informacion).input('doi', sql.NVarChar, draftData.detalle_origen_informacion).input('toi', sql.Float, draftData.id_tipo_origen).input('ins', sql.NVarChar, draftData.insight).input('img', sql.NVarChar, draftData.imagen).input('tit', sql.NVarChar, draftData.titulo).input('res', sql.NVarChar, draftData.resumen_edicion);
                const insRes = await insReq.query("INSERT INTO insights (id_insight, version, activo, eliminado, origen_informacion, detalle_origen_informacion, id_tipo_origen, insight, imagen, titulo, resumen_edicion) OUTPUT inserted.id VALUES (@gid, @ver, 1, 0, @oi, @doi, @toi, @ins, @img, @tit, @res)");
                const newId = insRes.recordset[0].id;

                if (draftData.articulos_vinculados) {
                    for (const aid of draftData.articulos_vinculados) {
                        await new sql.Request(transaction).input('iid', sql.Int, newId).input('aid', sql.Float, aid).query("INSERT INTO rel_Insight_articulo (id_insight, id_articulo) VALUES (@iid, @aid)");
                    }
                }
                if (draftData.procesos_vinculados) {
                    for (const pid of draftData.procesos_vinculados) {
                        await new sql.Request(transaction).input('iid', sql.Int, newId).input('pid', sql.Float, pid).query("INSERT INTO rel_Insight_Proceso (id_insight, id_proceso) VALUES (@iid, @pid)");
                    }
                }
            }
            await new sql.Request(transaction).input('id', sql.Int, taskId).input('aprobador', sql.Int, req.session.user.id).query("UPDATE " + table + " SET estado = 'aprobado', id_aprobador = @aprobador, fecha_aprobacion = GETDATE() WHERE ID = @id");
        } else {
            await new sql.Request(transaction).input('id', sql.Int, taskId).input('aprobador', sql.Int, req.session.user.id).query("UPDATE " + table + " SET estado = 'rechazado', id_aprobador = @aprobador, fecha_aprobacion = GETDATE() WHERE ID = @id");
        }

        await transaction.commit();
        res.json({ success: true, message: action === 'approve' ? 'Cambio aprobado' : 'Cambio rechazado' });
    } catch (error) {
        if (transaction) await transaction.rollback();
        res.status(500).json({ success: false, error: error.message });
    }
});

`;

    // Reconstruir el archivo
    // La parte pendingTasksIndex + 1 contenía el código corrupto de approve-task hasta app.post('/api/search'
    // afterAuditParts[1] contiene lo que iba después de search
    
    parts[pendingTasksIndex + 1] = newAuditSection + 'app.post(\'/api/search\',' + afterAuditParts[1];
    const newContent = parts.join(startMarker);

    fs.writeFileSync(serverPath, newContent);
    console.log('SERVER_JS_FIXED');

} catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
}
