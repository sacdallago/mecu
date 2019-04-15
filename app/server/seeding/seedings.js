module.exports = {
    seedMainUsersWithPostPermissions: (dbConnection) => dbConnection.query(
            `
                INSERT INTO users ("googleId", "displayName", "allowPost", "deletedAt", "createdAt", "updatedAt", "isAdmin")
                VALUES
                    ('112888342536744012993', 'Klaus Niedermair', true, null, current_timestamp, current_timestamp, true),
                    ('100999724804241693048', 'Chris Soon Heng Tan', true, null, current_timestamp, current_timestamp, true),
                    ('110148531637552433176', 'Christian Dallago', true, null, current_timestamp, current_timestamp, true)
                ON CONFLICT ("googleId") DO UPDATE
                    SET "isAdmin" = EXCLUDED."isAdmin"
            `
        )
}
