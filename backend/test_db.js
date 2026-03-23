const sql = require('mssql');
require('dotenv').config();

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: false, // For local or standard connections
        trustServerCertificate: true
    }
};

async function testConnection() {
    try {
        console.log('Intentando conectar a la base de datos...');
        const pool = await sql.connect(dbConfig);
        console.log('Conexión exitosa.');
        
        console.log('Obteniendo datos de la tabla "articulos"...');
        const result = await pool.request().query("SELECT TOP 3 * FROM articulos");
        console.log('Datos recibidos:', result.recordset);
        
        sql.close();
    } catch (err) {
        console.error('Error:', err);
    }
}

testConnection();
