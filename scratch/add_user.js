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

async function createUser() {
    try {
        await sql.connect(dbConfig);
        const username = 'ivan';
        const passwordHash = '$2b$10$JDk9xyxJtZQc7jn/QO0DuOeKyCW3g0m2GY3.YBvO6AmNHNRSu/KYu';
        const name = 'Ivan Sanchez';
        const role = 'editor';

        const request = new sql.Request();
        request.input('username', sql.NVarChar, username);
        request.input('password', sql.NVarChar, passwordHash);
        request.input('name', sql.NVarChar, name);
        request.input('role', sql.NVarChar, role);

        await request.query("INSERT INTO usuarios (username, password, name, role) VALUES (@username, @password, @name, @role)");
        console.log('Usuario creado exitosamente: ' + username);
    } catch (err) {
        console.error('Error insertando usuario:', err);
    } finally {
        await sql.close();
    }
}

createUser();
