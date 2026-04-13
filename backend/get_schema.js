require('dotenv').config();
const sql = require('mssql');

const dbConfig = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'your_password',
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_NAME || 'your_db',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function getDBStructure() {
    try {
        const pool = await sql.connect(dbConfig);
        
        // Query to get all tables and their columns (SQL Server)
        const tablesQuery = `
            SELECT 
                t.name AS table_name,
                c.name AS column_name,
                ty.name AS data_type,
                c.max_length,
                c.is_nullable
            FROM sys.tables t
            INNER JOIN sys.columns c ON t.object_id = c.object_id
            INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
            ORDER BY t.name, c.column_id;
        `;
        
        const result = await pool.request().query(tablesQuery);
        
        const schema = {};
        for (const row of result.recordset) {
            if (!schema[row.table_name]) {
                schema[row.table_name] = [];
            }
            schema[row.table_name].push(row);
        }
        
        const fs = require('fs');
        fs.writeFileSync('db_schema_output.json', JSON.stringify(schema, null, 2));
        console.log('Schema written to db_schema_output.json');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

getDBStructure();
