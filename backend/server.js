const express = require('express');
const sql = require('mssql');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Configuración de la base de datos
const dbConfig = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'your_password',
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_NAME || 'your_db',
    options: {
        encrypt: true, 
        trustServerCertificate: true // True para entorno local de desarrollo
    }
};

// Comprobar conexión a la base de datos al inicio
sql.connect(dbConfig).then(() => {
    console.log('Conectado al servidor SQL correctamente.');
}).catch(err => {
    console.error('La conexión a la base de datos falló. Asegúrese de que el servidor SQL esté en ejecución.', err.message);
});

// Endpoint GET para /api/search
app.get('/api/search', async (req, res) => {
    try {
        // Parámetros de filtro de ejemplo de la URL
        const { query, category, minPrice, maxPrice } = req.query;
        
        const pool = await sql.connect(dbConfig);
        const request = pool.request();
        
        // Consulta base - ajusta el nombre de la tabla según sea necesario
        let sqlstr = 'SELECT * FROM Products WHERE 1=1';

        if (query) {
            sqlstr += ' AND Name LIKE @query';
            request.input('query', sql.NVarChar, `%${query}%`);
        }
        
        if (category) {
            sqlstr += ' AND Category = @category';
            request.input('category', sql.NVarChar, category);
        }
        
        if (minPrice) {
            sqlstr += ' AND Price >= @minPrice';
            request.input('minPrice', sql.Decimal, minPrice);
        }
        
        if (maxPrice) {
            sqlstr += ' AND Price <= @maxPrice';
            request.input('maxPrice', sql.Decimal, maxPrice);
        }

        const result = await request.query(sqlstr);
        
        res.json({
            success: true,
            results: result.recordset
        });
    } catch (error) {
        console.error('Error de API:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor backend ejecutándose en el puerto ${PORT}`);
});
