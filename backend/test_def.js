const sql = require('mssql');
require('dotenv').config();

async function test() {
    const dbConfig = {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        server: process.env.DB_SERVER,
        database: process.env.DB_DATABASE,
        options: { encrypt: false, enableArithAbort: true }
    };
    
    let pool;
    let transaction;
    try {
        pool = await sql.connect(dbConfig);
        transaction = new sql.Transaction(pool);
        await transaction.begin();
        const request = new sql.Request(transaction);

        const groupRes = await request.query(`SELECT ISNULL(MAX(id_definicion), 0) + 1 as new_group_id FROM definiciones`);
        const newGroupId = groupRes.recordset[0].new_group_id;

        request.input('id_definicion', sql.Int, newGroupId);
        request.input('version', sql.Int, 1);
        request.input('titulo', sql.NVarChar, 'asdf');
        request.input('definicion', sql.NVarChar, 'asdf');
        request.input('activo', sql.Bit, 1);
        request.input('eliminado', sql.Bit, 0);

        await request.query(`
            INSERT INTO definiciones (id_definicion, version, titulo, definicion, activo, eliminado)
            VALUES (@id_definicion, @version, @titulo, @definicion, @activo, @eliminado)
        `);

        // Simulamos éxito
        await transaction.rollback();
        console.log("Success");
    } catch (error) {
        console.log("ERROR", error);
        if (transaction) await transaction.rollback();
    }
    process.exit();
}
test();
