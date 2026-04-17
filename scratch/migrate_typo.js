const sql = require('mssql');
const dbConfig = {
    user: 'sa',
    password: 'Password123',
    server: 'localhost',
    database: 'sisgeko',
    options: {
        encrypt: false, trustServerCertificate: true
    }
};

async function migrate() {
    try {
        await sql.connect(dbConfig);
        console.log('Renaming columns in database...');
        
        // Tablas Maestras
        await sql.query("IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'definiciones' AND COLUMN_NAME = 'id_usuairo') EXEC sp_rename 'definiciones.id_usuairo', 'id_usuario', 'COLUMN'");
        await sql.query("IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'insights' AND COLUMN_NAME = 'id_usuairo') EXEC sp_rename 'insights.id_usuairo', 'id_usuario', 'COLUMN'");
        
        // Tablas de Cambios
        await sql.query("IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'cambios_definiciones' AND COLUMN_NAME = 'id_usuairo_cambio') EXEC sp_rename 'cambios_definiciones.id_usuairo_cambio', 'id_usuario_cambio', 'COLUMN'");
        await sql.query("IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'cambios_insights' AND COLUMN_NAME = 'id_usuairo_cambio') EXEC sp_rename 'cambios_insights.id_usuairo_cambio', 'id_usuario_cambio', 'COLUMN'");
        
        console.log('Database migration completed successfully.');
    } catch (e) {
        console.error('Migration error:', e.message);
    } finally {
        process.exit();
    }
}
migrate();
