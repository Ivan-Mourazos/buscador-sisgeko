const { sendPendingTasksEmail } = require('./mailService');
require('dotenv').config();

async function testDirect() {
    console.log("=== INICIANDO TEST SMTP DIRECTO ===");
    console.log("Enviando correo de prueba sin consultar la base de datos...");
    console.log("SMTP_HOST:", process.env.SMTP_HOST);
    console.log("SMTP_PORT:", process.env.SMTP_PORT);
    console.log("SMTP_USER:", process.env.SMTP_USER);
    console.log("SMTP_FROM:", process.env.SMTP_FROM);
    console.log("SMTP_FALLBACK_RECIPIENTS:", process.env.SMTP_FALLBACK_RECIPIENTS);
    console.log("-----------------------------------------");

    const mockTasks = [
        {
            operation: 'CREATE',
            _type: 'definicion',
            titulo: 'Toldo Cofre Motorizado',
            editor: 'Ángel',
            fecha_cambio: new Date()
        },
        {
            operation: 'UPDATE',
            _type: 'insight',
            titulo: 'Dimensións máximas toldo Ámbarbox',
            editor: 'Esteban',
            fecha_cambio: new Date()
        }
    ];

    const recipients = (process.env.SMTP_FALLBACK_RECIPIENTS || 'ivanmourazos@gmail.com')
        .split(',')
        .map(e => e.trim());

    try {
        const result = await sendPendingTasksEmail(recipients, mockTasks);
        console.log("Resultado del envío directo:");
        console.log(JSON.stringify(result, null, 2));
        
        if (result.success) {
            console.log("\n✅ Correo de prueba enviado con éxito!");
        } else {
            console.log("\n❌ El envío falló. Comprueba las credenciales en .env.");
        }
        process.exit(result.success ? 0 : 1);
    } catch (e) {
        console.error("\n❌ Error inesperado:", e);
        process.exit(1);
    }
}

testDirect();
