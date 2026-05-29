const cron = require('node-cron');
const sql = require('mssql');
const { sendPendingTasksEmail } = require('./mailService');
require('dotenv').config();

// Configuración de base de datos reutilizando variables
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

/**
 * Obtiene la lista de destinatarios (correos de administradores y editores activos).
 * Si la columna 'email' no existe en la base de datos, recurre al fallback de .env.
 */
const getRecipients = async (pool) => {
    try {
        console.log("[SCHEDULER] Obtendo destinatarios de base de datos...");
        
        // Primero verificamos si existe la columna email para evitar errores fatales de consulta
        const checkCol = await pool.request().query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'email'
        `);

        if (checkCol.recordset.length > 0) {
            // La columna existe, consultamos los correos en la base de datos
            const result = await pool.request().query(`
                SELECT email 
                FROM usuarios 
                WHERE activo = 1 AND id_rol IN (1, 2) AND email IS NOT NULL AND email != ''
            `);
            const emails = result.recordset.map(r => r.email.trim());
            
            if (emails.length > 0) {
                console.log(`[SCHEDULER] Atopados ${emails.length} correos de administradores/editores en BD.`);
                return emails;
            }
        } else {
            console.warn("[SCHEDULER] A columna 'email' non existe na táboa 'usuarios'. Usando fallback.");
        }
    } catch (error) {
        console.error("[SCHEDULER] Erro consultando columna email en BD, usando fallback:", error.message);
    }

    // Fallback si la columna no existe o no tiene correos configurados
    const fallback = process.env.SMTP_FALLBACK_RECIPIENTS;
    if (fallback) {
        const fallbackEmails = fallback.split(',').map(e => e.trim()).filter(e => e.length > 0);
        console.log(`[SCHEDULER] Usando correos de fallback de .env: ${fallbackEmails.join(', ')}`);
        return fallbackEmails;
    }

    console.error("[SCHEDULER] Non se configuraron correos nin en BD nin en .env (SMTP_FALLBACK_RECIPIENTS).");
    return [];
};

/**
 * Obtiene todas las tareas pendientes de aprobación en cambios_insights y cambios_definiciones.
 */
const getPendingTasks = async (pool) => {
    console.log("[SCHEDULER] Consultando tarefas pendentes...");
    const qIns = `
        SELECT c.ID, c.id_insight, c.fecha_cambio, c.comentario_cambio, u.username as editor_nombre 
        FROM cambios_insights c 
        JOIN usuarios u ON c.id_usuairo_cambio = u.id_usuario 
        WHERE (c.estado IS NULL OR c.estado LIKE '%pendiente%')
    `;
    const qDefs = `
        SELECT c.ID, c.id_definicion, c.fecha_cambio, c.comentario_cambio, u.username as editor_nombre 
        FROM cambios_definiciones c 
        JOIN usuarios u ON c.id_usuairo_cambio = u.id_usuario 
        WHERE (c.estado IS NULL OR c.estado LIKE '%pendiente%')
    `;

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

    return tasks;
};

/**
 * Ejecuta el proceso de comprobación de tareas y envío de correos.
 */
const runDailyNotificationNow = async () => {
    console.log("[SCHEDULER] Iniciando proceso de notificación de tarefas pendentes...");
    let pool;
    try {
        pool = await sql.connect(dbConfig);
        
        const tasks = await getPendingTasks(pool);
        if (tasks.length === 0) {
            console.log("[SCHEDULER] Non hai tarefas pendentes. Non se envía correo.");
            return { success: true, count: 0 };
        }

        const recipients = await getRecipients(pool);
        if (recipients.length === 0) {
            console.warn("[SCHEDULER] Non hai destinatarios dispoñibles. Abortando envío.");
            return { success: false, message: 'Sen destinatarios' };
        }

        const mailResult = await sendPendingTasksEmail(recipients, tasks);
        return { success: mailResult.success, count: tasks.length };
    } catch (error) {
        console.error("[SCHEDULER] Erro executando notificación de tarefas:", error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Inicializa el planificador de node-cron.
 */
const initScheduler = () => {
    // Configurable por .env (por defecto: de lunes a viernes a las 08:00 AM)
    const cronSchedule = process.env.SMTP_CRON_SCHEDULE || '0 8 * * 1-5';
    
    console.log(`[SCHEDULER] Programando notificaciones de tarefas. Cron: "${cronSchedule}"`);
    
    cron.schedule(cronSchedule, async () => {
        console.log("[SCHEDULER] Cron disparado. Executando comprobación diaria...");
        await runDailyNotificationNow();
    });
};

module.exports = {
    initScheduler,
    runDailyNotificationNow
};
