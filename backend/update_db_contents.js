require('dotenv').config();
const sql = require('mssql');
const fs = require('fs');

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

async function generateDbContents() {
    try {
        const pool = await sql.connect(dbConfig);
        const schemaRaw = fs.readFileSync('db_schema_output.json', 'utf8');
        const schema = JSON.parse(schemaRaw);
        
        let md = '# Contenido de la Base de Datos SISGEKO\n\n';
        
        for (const tableName of Object.keys(schema)) {
            md += `## Tabla: ${tableName}\n\n`;
            md += `### Columnas (Estructura)\n`;
            md += `| Columna | Tipo de Dato | Longitud | Nullable |\n`;
            md += `|---------|--------------|----------|----------|\n`;
            
            schema[tableName].forEach(col => {
                md += `| ${col.column_name} | ${col.data_type} | ${col.max_length} | ${col.is_nullable} |\n`;
            });
            md += `\n### Datos de Ejemplo (Top 5)\n`;
            
            try {
                const top5 = await pool.request().query(`SELECT TOP 5 * FROM [${tableName}]`);
                if (top5.recordset.length > 0) {
                    const columns = Object.keys(top5.recordset[0]);
                    md += `| ${columns.join(' | ')} |\n`;
                    md += `| ${columns.map(() => '---').join(' | ')} |\n`;
                    
                    top5.recordset.forEach(row => {
                        const rowData = columns.map(col => {
                            let val = row[col];
                            if (val === null) return 'NULL';
                            if (typeof val === 'string') return val.replace(/\r?\n|\r/g, ' ').substring(0, 100);
                            return val;
                        });
                        md += `| ${rowData.join(' | ')} |\n`;
                    });
                } else {
                    md += `*Mesa vacía*\n`;
                }
            } catch (queryErr) {
                md += `*Error obteniendo datos: ${queryErr.message}*\n`;
            }
            md += `\n---\n\n`;
        }
        
        fs.writeFileSync('db_contents.md', md.trim());
        console.log('db_contents.md actualizado exitosamente.');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

generateDbContents();
