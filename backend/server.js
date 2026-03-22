const express = require('express');
const sql = require('mssql');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Database configuration
const dbConfig = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'your_password',
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_NAME || 'your_db',
    options: {
        encrypt: true, 
        trustServerCertificate: true // True for local dev
    }
};

// Check DB Connection once on start
sql.connect(dbConfig).then(() => {
    console.log('Connected to SQL Server successfully.');
}).catch(err => {
    console.error('Database connection failed. Ensure SQL Server is running.', err.message);
});

// GET /api/search endpoint
app.get('/api/search', async (req, res) => {
    try {
        // Example filter parameters from URL
        const { query, category, minPrice, maxPrice } = req.query;
        
        const pool = await sql.connect(dbConfig);
        const request = pool.request();
        
        // Base query - adjust table name as needed
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
        console.error('API Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});
