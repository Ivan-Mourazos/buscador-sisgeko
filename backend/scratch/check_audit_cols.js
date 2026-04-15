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

async function checkAuditCols() {
    try {
        let pool = await sql.connect(config);
        const defs = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'definiciones'");
        const ins = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'insights'");
        console.log('DEFINICIONES:', defs.recordset.map(c => c.COLUMN_NAME));
        console.log('INSIGHTS:', ins.recordset.map(c => c.COLUMN_NAME));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkAuditCols();
