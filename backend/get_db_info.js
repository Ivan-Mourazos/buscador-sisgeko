const sql = require('mssql');
const fs = require('fs');
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

async function exportDatabaseInfo() {
    try {
        console.log('Conectando a SISGEKO...');
        const pool = await sql.connect(dbConfig);
        
        let markdown = '# Contenido de la Base de Datos SISGEKO\n\n';
        
        // Obtener lista de tablas
        const tablesResult = await pool.request().query("SELECT name FROM sys.tables ORDER BY name");
        const tables = tablesResult.recordset.map(r => r.name);
        
        for (const table of tables) {
            markdown += `## Tabla: ${table}\n\n`;
            
            // Obtener columnas
            const colsResult = await pool.request().query(`
                SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = '${table}'
                ORDER BY ORDINAL_POSITION
            `);
            
            markdown += '### Columnas (Estructura)\n';
            markdown += '| Columna | Tipo de Dato | Longitud |\n';
            markdown += '|---------|--------------|----------|\n';
            colsResult.recordset.forEach(col => {
                const len = col.CHARACTER_MAXIMUM_LENGTH ? col.CHARACTER_MAXIMUM_LENGTH : '-';
                markdown += `| ${col.COLUMN_NAME} | ${col.DATA_TYPE} | ${len} |\n`;
            });
            markdown += '\n';
            
            // Obtener datos de ejemplo
            try {
                const dataResult = await pool.request().query(`SELECT TOP 5 * FROM [${table}]`);
                if (dataResult.recordset.length > 0) {
                    markdown += '### Datos de Ejemplo (Top 5)\n';
                    
                    const keys = Object.keys(dataResult.recordset[0]);
                    markdown += `| ${keys.join(' | ')} |\n`;
                    markdown += `| ${keys.map(() => '---').join(' | ')} |\n`;
                    
                    dataResult.recordset.forEach(row => {
                        const values = keys.map(k => {
                            let val = row[k];
                            if (val === null) return 'NULL';
                            // Limpiar saltos de línea y caracteres especiales para markdown
                            return String(val).replace(/(\r\n|\n|\r|\|)/gm, " ");
                        });
                        markdown += `| ${values.join(' | ')} |\n`;
                    });
                } else {
                    markdown += '*La tabla está vacía.*\n';
                }
            } catch (err) {
                markdown += `*Error al obtener datos: ${err.message}*\n`;
            }
            
            markdown += '\n---\n\n';
        }
        
        fs.writeFileSync('db_contents.md', markdown, 'utf8');
        console.log('Fichero db_contents.md generado con éxito.');
        
        sql.close();
    } catch (err) {
        console.error('Error general:', err);
    }
}

exportDatabaseInfo();
