const sql = require('mssql');
// Usamos a configuración do propio server.js para ser infalibles
const dbConfig = {
    user: 'sa',
    password: 'S1sg3k0!!',
    server: 'localhost',
    database: 'sisgeko',
    options: { encrypt: false, trustServerCertificate: true }
};

async function check() {
    try {
        const pool = await sql.connect(dbConfig);
        console.log("\n--- ÚLTIMOS 5 EN cambios_insights ---");
        const res = await pool.request().query("SELECT TOP 5 ID, id_insight, estado, id_usuairo_cambio, fecha_cambio FROM cambios_insights ORDER BY fecha_cambio DESC");
        console.table(res.recordset);

        console.log("\n--- ÚLTIMOS 5 EN cambios_definiciones ---");
        const resDef = await pool.request().query("SELECT TOP 5 ID, id_definicion, estado, id_usuairo_cambio, fecha_cambio FROM cambios_definiciones ORDER BY fecha_cambio DESC");
        console.table(resDef.recordset);

        // Verificar o usuario que as creou
        if (res.recordset.length > 0) {
            const lastId = res.recordset[0].id_usuairo_cambio;
            console.log(`\n--- VERIFICANDO USUARIO ID: ${lastId} ---`);
            const uRes = await pool.request().input('uid', sql.Int, lastId).query("SELECT * FROM usuarios WHERE id_usuario = @uid");
            console.table(uRes.recordset);
        }

        process.exit(0);
    } catch (err) {
        console.error("Error catastrófico:", err);
        process.exit(1);
    }
}
check();
