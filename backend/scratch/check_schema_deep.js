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

async function checkSchema() {
    try {
        let pool = await sql.connect(config);
        const res = await pool.request().query(`
            SELECT 
                t.TABLE_NAME, 
                c.COLUMN_NAME, 
                c.DATA_TYPE, 
                c.IS_NULLABLE,
                pk.CONSTRAINT_NAME as PRIMARY_KEY
            FROM INFORMATION_SCHEMA.COLUMNS c
            JOIN INFORMATION_SCHEMA.TABLES t ON c.TABLE_NAME = t.TABLE_NAME
            LEFT JOIN (
                SELECT tc.TABLE_NAME, kcu.COLUMN_NAME, tc.CONSTRAINT_NAME
                FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
                JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
                WHERE tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
            ) pk ON t.TABLE_NAME = pk.TABLE_NAME AND c.COLUMN_NAME = pk.COLUMN_NAME
            WHERE t.TABLE_NAME IN ('definiciones', 'rel_definicion_familia', 'articulos', 'familias')
            ORDER BY t.TABLE_NAME, c.ORDINAL_POSITION
        `);
        console.log(JSON.stringify(res.recordset, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSchema();
