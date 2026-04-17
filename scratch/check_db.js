const sql = require('mssql');
const dbConfig = {
    user: 'sa',
    password: 'vosa_password', // Usa la que tengas configurada
    server: 'localhost',
    database: 'sisgeko', // Cambia si es otra
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function check() {
    try {
        const pool = await sql.connect(dbConfig);
        console.log("--- CONTIDO DE cambios_insights ---");
        const res = await pool.request().query("SELECT ID, id_insight, estado, id_usuairo_cambio FROM cambios_insights");
        console.table(res.recordset);
        
        console.log("\n--- CONTIDO DE cambios_definiciones ---");
        const resDef = await pool.request().query("SELECT ID, id_definicion, estado, id_usuairo_cambio FROM cambios_definiciones");
        console.table(resDef.recordset);
        
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}
check();
