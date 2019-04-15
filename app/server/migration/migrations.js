module.exports = {
    alterTableUsersAddIsAdmin: (dbConnection) => dbConnection.query(
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS "isAdmin" BOOLEAN;`
        )
}
