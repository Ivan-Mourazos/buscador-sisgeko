const { runDailyNotificationNow } = require('./scheduler');
require('dotenv').config();

async function test() {
    console.log("=== INICIANDO TEST DE CORREO SISGEKO ===");
    console.log("Variables de entorno SMTP cargadas:");
    console.log("SMTP_HOST:", process.env.SMTP_HOST);
    console.log("SMTP_PORT:", process.env.SMTP_PORT);
    console.log("SMTP_USER:", process.env.SMTP_USER);
    console.log("SMTP_FROM:", process.env.SMTP_FROM);
    console.log("SMTP_FALLBACK_RECIPIENTS:", process.env.SMTP_FALLBACK_RECIPIENTS);
    console.log("-----------------------------------------");

    try {
        const result = await runDailyNotificationNow();
        console.log("Resultado del test:");
        console.log(JSON.stringify(result, null, 2));
        
        if (result.success) {
            console.log("\n✅ Test completado con éxito!");
        } else {
            console.log("\n❌ El test falló o no se envió ningún correo.");
        }
        process.exit(result.success ? 0 : 1);
    } catch (e) {
        console.error("\n❌ Error inesperado durante el test:", e);
        process.exit(1);
    }
}

test();
