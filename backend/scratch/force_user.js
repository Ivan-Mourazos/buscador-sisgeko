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
        console.log('Conectado a la BD.');

        // 1. Limpiar rastro de angel
        await sql.query("DELETE FROM usuarios WHERE username = 'angel'");
        
        // 2. Insertar angel con rol 1 (editor)
        await sql.query("INSERT INTO usuarios (username, password_hash, id_rol, activo) VALUES ('angel', '8613', 1, 1)");
        
        console.log('Usuario angel insertado correctamente.');

        // 3. Verificar
        const res = await sql.query("SELECT * FROM usuarios WHERE username = 'angel'");
        console.log('Resultado verificación:', res.recordset);

        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

run();
