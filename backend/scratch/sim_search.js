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
        
        const query = "cintas";
        const words = query.trim().split(/\s+/).filter(w => w.length > 0);
        words.forEach((w, i) => request.input(`q${i}`, sql.NVarChar, `%${w}%`));

        console.log("--- BUSCANDO ARTICULOS ---");
        let sqlArtBase = `SELECT a.id_articulo, a.descripcion FROM articulos a WHERE 1=1 `;
        words.forEach((_, i) => { sqlArtBase += ` AND (a.descripcion LIKE @q${i} OR a.codigo LIKE @q${i})`; });
        const arts = await request.query(sqlArtBase);
        console.log("ARTICULOS MATCH:", arts.recordset.length);

        console.log("\n--- BUSCANDO INSIGHTS ---");
        let sqlInsBase = `
            SELECT i.id_insight, i.titulo, i.insight
            FROM insights i 
            WHERE (i.activo = 1 OR i.activo IS NULL) AND (i.eliminado = 0 OR i.eliminado IS NULL)
            AND i.version = (
                SELECT MAX(version) FROM insights i2 
                WHERE i2.id_insight = i.id_insight 
                AND (i2.activo = 1 OR i2.activo IS NULL) AND (i2.eliminado = 0 OR i2.eliminado IS NULL)
            ) `;
        words.forEach((_, i) => { sqlInsBase += ` AND (i.insight LIKE @q${i} OR i.titulo LIKE @q${i})`; });
        const ins = await request.query(sqlInsBase);
        console.log("INSIGHTS MATCH:", ins.recordset.length);
        ins.recordset.forEach(r => console.log(`  - ID:${r.id_insight} Título:"${r.titulo}"`));

        console.log("\n--- BUSCANDO DEFINICIONES ---");
        let sqlDefBase = `
            SELECT d.id_definicion, d.titulo
            FROM definiciones d 
            WHERE (d.activo = 1 OR d.activo IS NULL) AND (d.eliminado = 0 OR d.eliminado IS NULL)
            AND d.version = (
                SELECT MAX(version) FROM definiciones d2 
                WHERE d2.id_definicion = d.id_definicion 
                AND (d2.activo = 1 OR d2.activo IS NULL) AND (d2.eliminado = 0 OR d2.eliminado IS NULL)
            ) `;
        words.forEach((_, i) => { sqlDefBase += ` AND (d.titulo LIKE @q${i} OR d.definicion LIKE @q${i})`; });
        const defs = await request.query(sqlDefBase);
        console.log("DEFINICIONES MATCH:", defs.recordset.length);
        defs.recordset.forEach(r => console.log(`  - ID:${r.id_definicion} Título:"${r.titulo}"`));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
