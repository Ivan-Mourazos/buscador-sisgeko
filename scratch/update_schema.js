const sql = require('mssql');
require('dotenv').config();

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function run() {
    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        const tables = ['cambios_definiciones', 'cambios_insights'];

        for (const table of tables) {
            console.log(`Checking table: ${table}`);
            const columns = await request.query(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${table}'`);
            const colNames = columns.recordset.map(c => c.COLUMN_NAME.toLowerCase());

            if (!colNames.includes('estado')) {
                console.log(`Adding 'estado' to ${table}`);
                await request.query(`ALTER TABLE ${table} ADD estado NVARCHAR(20) DEFAULT 'pendiente'`);
            }
            if (!colNames.includes('id_aprobador')) {
                console.log(`Adding 'id_aprobador' to ${table}`);
                await request.query(`ALTER TABLE ${table} ADD id_aprobador INT`);
            }
            if (!colNames.includes('fecha_aprobacion')) {
                console.log(`Adding 'fecha_aprobacion' to ${table}`);
                await request.query(`ALTER TABLE ${table} ADD fecha_aprobacion DATETIME`);
            }
        }
        console.log('SCHEMA_UPDATED');
    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        await sql.close();
    }
}

run();
