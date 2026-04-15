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
        
        const defs = await pool.request().query("SELECT id_definicion as id, titulo, 'definicion' as type FROM definiciones");
        const ins = await pool.request().query("SELECT id_insight as id, titulo, 'insight' as type FROM insights");
        const arts = await pool.request().query("SELECT id_articulo as id, descripcion as titulo, 'articulo' as type FROM articulos");

        const all = [...defs.recordset, ...ins.recordset, ...arts.recordset];
        const counts = {};
        all.forEach(x => {
            if (x.titulo) {
                counts[x.titulo] = (counts[x.titulo] || 0) + 1;
            }
        });

        const dups = Object.keys(counts).filter(t => counts[t] > 1);
        console.log("TITULOS REPETIDOS EN TODAS LAS TABLAS:");
        dups.forEach(t => {
            console.log(`- "${t}" (${counts[t]} veces):`, all.filter(x => x.titulo === t).map(x => `${x.type} (ID:${x.id})`));
        });
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
