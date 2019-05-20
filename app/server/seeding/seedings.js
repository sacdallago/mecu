const request = require('request');

const seedLocations = {
    proteinXProtein: 'http://maintenance.dallago.us/public/mecu/0_PROTEINXPROTEIN.sql',
    complexes: 'http://maintenance.dallago.us/public/mecu/1_COMPLEXES.sql',
    cohestionIndex: 'http://maintenance.dallago.us/public/mecu/2_COHESIONINDEX.sql',
    complexDistances: 'http://maintenance.dallago.us/public/mecu/3_COMPLEX_DISTANCES.sql'
};

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
    ),

    seedProteinXProtein: (dbConnection) => {
        return new Promise((resolve, _) => {
            request.get(seedLocations.proteinXProtein, (error, response, body) => {
                if (!error && response.statusCode === 200) {
                    dbConnection.query(body).then(r => resolve(r));
                } else {
                    console.warn('Could not get ' + seedLocations.proteinXProtein);
                    resolve();
                }
            });
        });
    }
}
