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
        const request = pool.request();
        
        // Simular búsqueda vacía (todos los resultados)
        const defs = await request.query(`
            SELECT d.id_definicion, d.titulo, d.version
            FROM definiciones d 
            WHERE (d.activo = 1 OR d.activo IS NULL) AND (d.eliminado = 0 OR d.eliminado IS NULL)
            AND d.version = (
                SELECT MAX(version) FROM definiciones d2 
                WHERE d2.id_definicion = d.id_definicion 
                AND (d2.activo = 1 OR d2.activo IS NULL) AND (d2.eliminado = 0 OR d2.eliminado IS NULL)
            )
        `);
        
        const ins = await request.query(`
            SELECT i.id_insight, i.titulo
            FROM insights i 
            WHERE (i.activo = 1 OR i.activo IS NULL) AND (i.eliminado = 0 OR i.eliminado IS NULL)
            AND i.version = (
                SELECT MAX(version) FROM insights i2 
                WHERE i2.id_insight = i.id_insight 
                AND (i2.activo = 1 OR i2.activo IS NULL) AND (i2.eliminado = 0 OR i2.eliminado IS NULL)
            )
        `);

        console.log("DEFINICIONES ENCONTRADAS:", defs.recordset.length);
        defs.recordset.forEach(r => console.log(`DEF ID:${r.id_definicion} Título:"${r.titulo}"`));
        
        console.log("\nINSIGHTS ENCONTRADOS:", ins.recordset.length);
        ins.recordset.forEach(r => console.log(`INS ID:${r.id_insight} Título:"${r.titulo}"`));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
