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
        
        console.log("--- BUSCANDO DUPLICADOS FISICOS (Misma id_definicion y version) ---");
        const dupRes = await pool.request().query(`
            SELECT id_definicion, version, COUNT(*) as qty 
            FROM definiciones 
            GROUP BY id_definicion, version 
            HAVING COUNT(*) > 1
        `);
        console.table(dupRes.recordset);

        if (dupRes.recordset.length > 0) {
            console.log("DETALLE DUPLICADOS:");
            const id = dupRes.recordset[0].id_definicion;
            const det = await pool.request().query(`SELECT * FROM definiciones WHERE id_definicion = ${id}`);
            console.table(det.recordset);
        } else {
            console.log("No hay duplicados de (id_definicion, version).");
        }

        console.log("\n--- BUSCANDO TITULOS REPETIDOS EN DEFINICIONES ---");
        const titleRes = await pool.request().query(`
            SELECT titulo, COUNT(*) as qty 
            FROM definiciones 
            WHERE (activo = 1 OR activo IS NULL) AND (eliminado = 0 OR eliminado IS NULL)
            GROUP BY titulo 
            HAVING COUNT(*) > 1
        `);
        console.table(titleRes.recordset);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
