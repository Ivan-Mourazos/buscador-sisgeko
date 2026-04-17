const sql = require('mssql');
const fs = require('fs');
const dbConfig = {
    user: 'sa',
    password: 'Password123',
    server: 'localhost',
    database: 'sisgeko',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function run() {
    try {
        await sql.connect(dbConfig);
        const r = await sql.query("SELECT TABLE_NAME, COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME IN ('definiciones', 'insights', 'cambios_definiciones', 'cambios_insights', 'usuarios')");
        fs.writeFileSync('c:/Users/ivan.sanchez/Documents/Proyectos DEV/buscador-sisgeko/scratch/db_schema.json', JSON.stringify(r.recordset, null, 2));
        console.log('Schema saved successfully');
    } catch(e) {
        console.error('Error fetching schema:', e.message);
    } finally {
        process.exit();
    }
}
run();
