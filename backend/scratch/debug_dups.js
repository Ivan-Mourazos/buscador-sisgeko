const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: false,
        enableArithAbort: true
    }
};

async function check() {
    try {
        let pool = await sql.connect(config);
        
        console.log("--- DEFINICIONES ---");
        const defs = await pool.request().query("SELECT id_definicion, version, titulo FROM definiciones ORDER BY id_definicion, version");
        console.table(defs.recordset);

        console.log("\n--- RESULTADOS BUSQUEDA (Simulación) ---");
        const query = `
            SELECT d.id_definicion, d.version, d.titulo
            FROM definiciones d 
            WHERE (d.activo = 1 OR d.activo IS NULL) AND (d.eliminado = 0 OR d.eliminado IS NULL)
            AND d.version = (
                SELECT MAX(version) FROM definiciones d2 
                WHERE d2.id_definicion = d.id_definicion 
                AND (d2.activo = 1 OR d2.activo IS NULL) AND (d2.eliminado = 0 OR d2.eliminado IS NULL)
            )`;
        const results = await pool.request().query(query);
        console.table(results.recordset);
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
