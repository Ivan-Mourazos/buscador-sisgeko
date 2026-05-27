const nodemailer = require('nodemailer');
require('dotenv').config();

// Configuración del transporte de correo
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.example.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465', // true para puerto 465, false para otros
        auth: {
            user: process.env.SMTP_USER || 'user@example.com',
            pass: process.env.SMTP_PASS || 'password'
        }
    });
};

/**
 * Traduce el tipo de operación al gallego.
 */
const getOperationLabel = (op) => {
    switch (String(op).toUpperCase()) {
        case 'CREATE':
            return { text: 'CREACIÓN', bg: '#dcfce7', color: '#166534' };
        case 'UPDATE':
            return { text: 'MODIFICACIÓN', bg: '#dbeafe', color: '#1e40af' };
        case 'DELETE':
            return { text: 'ELIMINACIÓN', bg: '#fee2e2', color: '#991b1b' };
        default:
            return { text: 'REVISIÓN', bg: '#f3f4f6', color: '#374151' };
    }
};

/**
 * Traduce el tipo de contenido al gallego.
 */
const getTypeLabel = (type) => {
    return String(type).toLowerCase() === 'insight' ? 'Insight' : 'Definición';
};

/**
 * Genera el cuerpo HTML del correo con un diseño premium y responsive.
 */
const generateEmailTemplate = (tasks) => {
    const appUrl = process.env.APP_URL || 'http://localhost:5000';
    
    // Generar filas de tareas
    const taskRows = tasks.map(task => {
        const op = getOperationLabel(task.operation);
        const typeLabel = getTypeLabel(task._type);
        const formattedDate = task.fecha_cambio 
            ? new Date(task.fecha_cambio).toLocaleDateString('gl-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
            : 'Non dispoñible';

        return `
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 16px; font-family: 'Segoe UI', Roboto, sans-serif; font-size: 14px; color: #1e293b;">
                    <span style="display: inline-block; padding: 4px 8px; font-size: 11px; font-weight: bold; border-radius: 4px; background-color: #f1f5f9; color: #475569; margin-bottom: 6px;">
                        ${typeLabel}
                    </span>
                    <br/>
                    <strong style="font-size: 15px; color: #0f172a;">${task.titulo}</strong>
                </td>
                <td style="padding: 16px; font-family: 'Segoe UI', Roboto, sans-serif; font-size: 14px; text-align: center;">
                    <span style="display: inline-block; padding: 6px 10px; font-size: 12px; font-weight: bold; border-radius: 9999px; background-color: ${op.bg}; color: ${op.color}; text-transform: uppercase;">
                        ${op.text}
                    </span>
                </td>
                <td style="padding: 16px; font-family: 'Segoe UI', Roboto, sans-serif; font-size: 14px; color: #475569;">
                    <div style="font-weight: 500; color: #334155;">${task.editor || 'Sistema'}</div>
                    <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">${formattedDate}</div>
                </td>
            </tr>
        `;
    }).join('');

    return `
    <!DOCTYPE html>
    <html lang="gl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tarefas Pendentes Sisgeko</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc; -webkit-text-size-adjust: none; text-size-adjust: none;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 40px 0;">
            <tr>
                <td align="center">
                    <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
                        <!-- Cabecera con Degradado -->
                        <tr>
                            <td align="center" style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 32px 24px;">
                                <h1 style="margin: 0; font-family: 'Segoe UI', Roboto, sans-serif; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                                    SISGEKO
                                </h1>
                                <p style="margin: 8px 0 0 0; font-family: 'Segoe UI', Roboto, sans-serif; font-size: 16px; color: #bfdbfe; font-weight: 500;">
                                    Resumo diario de tarefas pendentes de revisión
                                </p>
                            </td>
                        </tr>
                        <!-- Contenido -->
                        <tr>
                            <td style="padding: 32px 24px;">
                                <p style="margin: 0 0 20px 0; font-family: 'Segoe UI', Roboto, sans-serif; font-size: 16px; color: #334155; line-height: 1.6;">
                                    Ola,
                                </p>
                                <p style="margin: 0 0 24px 0; font-family: 'Segoe UI', Roboto, sans-serif; font-size: 16px; color: #334155; line-height: 1.6;">
                                    Detectáronse as seguintes tarefas de edición pendentes de aprobación ou rexeitamento no sistema. Recoméndase a súa revisión:
                                </p>
                                
                                <!-- Tabla de Tareas -->
                                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; margin-bottom: 32px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                                    <thead>
                                        <tr style="background-color: #f1f5f9; border-bottom: 2px solid #e2e8f0;">
                                            <th align="left" style="padding: 12px 16px; font-family: 'Segoe UI', Roboto, sans-serif; font-size: 13px; font-weight: 700; color: #475569; text-transform: uppercase;">Elemento / Título</th>
                                            <th align="center" style="padding: 12px 16px; font-family: 'Segoe UI', Roboto, sans-serif; font-size: 13px; font-weight: 700; color: #475569; text-transform: uppercase; width: 120px;">Operación</th>
                                            <th align="left" style="padding: 12px 16px; font-family: 'Segoe UI', Roboto, sans-serif; font-size: 13px; font-weight: 700; color: #475569; text-transform: uppercase; width: 160px;">Editor / Data</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${taskRows}
                                    </tbody>
                                </table>

                                <!-- Botón de Acción -->
                                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                    <tr>
                                        <td align="center" style="padding: 8px 0;">
                                            <a href="${appUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; font-family: 'Segoe UI', Roboto, sans-serif; font-size: 16px; font-weight: 700; color: #ffffff; text-decoration: none; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); border-radius: 8px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25); border: none;">
                                                Acceder a Sisgeko
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <!-- Pie de Página -->
                        <tr>
                            <td align="center" style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px; text-align: center;">
                                <p style="margin: 0 0 6px 0; font-family: 'Segoe UI', Roboto, sans-serif; font-size: 12px; color: #64748b; font-weight: 600;">
                                    Buscador Sisgeko &copy; ${new Date().getFullYear()}
                                </p>
                                <p style="margin: 0; font-family: 'Segoe UI', Roboto, sans-serif; font-size: 11px; color: #94a3b8; line-height: 1.5;">
                                    Este é un correo automático. Por favor, non responda directamente a esta mensaxe.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;
};

/**
 * Envía la notificación de tareas pendientes.
 * @param {string[]} recipients - Lista de correos destinatarios.
 * @param {object[]} tasks - Lista de tareas pendientes.
 */
const sendPendingTasksEmail = async (recipients, tasks) => {
    if (!recipients || recipients.length === 0) {
        console.warn("[MAIL] Non hai destinatarios para enviar o correo.");
        return { success: false, message: 'Sen destinatarios' };
    }
    if (!tasks || tasks.length === 0) {
        console.log("[MAIL] Non hai tarefas pendentes. Omítese o envío.");
        return { success: true, message: 'Sen tarefas pendentes' };
    }

    const transporter = createTransporter();
    const htmlContent = generateEmailTemplate(tasks);
    const smtpFrom = process.env.SMTP_FROM || '"Sisgeko Notificacións" <noreply@example.com>';

    try {
        console.log(`[MAIL] Enviando resumo de ${tasks.length} tarefas pendentes a: ${recipients.join(', ')}`);
        const info = await transporter.sendMail({
            from: smtpFrom,
            to: recipients.join(', '),
            subject: `📋 Sisgeko: ${tasks.length} tarefa${tasks.length > 1 ? 's' : ''} pendente${tasks.length > 1 ? 's' : ''} de revisión`,
            html: htmlContent
        });
        console.log("[MAIL] Correo enviado correctamente: %s", info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("[MAIL] Error enviando correo:", error.message);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendPendingTasksEmail
};
