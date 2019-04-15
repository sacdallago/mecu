module.exports = {
    createVersionTable: (dbConnection) => dbConnection
        .query(`
            CREATE TABLE IF NOT EXISTS settings (
              table_name varchar(255) UNIQUE,
              version INTEGER
            );
        `),
    getTableVersion: (dbConnection, tableName) => dbConnection
        .query(`
            SELECT version
            FROM settings
            WHERE "table_name" = '${tableName}';
        `)
        .then(r => (r[0][0] || {}).version),
    updateTableVersion: (dbConnection, tableName, version) => dbConnection
        .query(`
            INSERT INTO settings (table_name, version)
            VALUES ('${tableName}', ${version})
            ON CONFLICT (table_name) DO UPDATE
              SET version = EXCLUDED.version;
        `),

}
