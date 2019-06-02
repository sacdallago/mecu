const {
    seedMainUsersWithPostPermissions,
    seedProteinXProtein,
    seedComplexes,
    seedCohesionIndex,
    seedComplexDistances
} = require('./seedings');
const {
    createVersionTable,
    getTableVersion,
    updateTableVersion
} = require('../settingsTable/settingsTableMethods');

const SEEDING_ROW = 'seeding_version';
const SEEDING_VERSION = 2;

module.exports = (dbConnection) => Promise.resolve(dbConnection)
    .then(dbConnection => {
        console.log('doing seeding...');
        return dbConnection;
    })
    .then(dbC => {
        return createVersionTable(dbC)
            .then(() => getTableVersion(dbC, SEEDING_ROW))
            .then(resultVersion => doSeeding(resultVersion, dbC))
            .then(r => updateTableVersion(dbC, SEEDING_ROW, SEEDING_VERSION))
    })
    .then(r => {
        console.log('seeding done.');
        return;
    });


const doSeeding = (version, dbConnection) => {
    let p = Promise.resolve();
    if (!version) {
        p = p.then(() => seedMainUsersWithPostPermissions(dbConnection))
    }

    if (version < 2) {
        p = p
            .then(() => seedProteinXProtein(dbConnection))
            .then(() => seedComplexes(dbConnection))
            .then(() => seedCohesionIndex(dbConnection))
            .then(() => seedComplexDistances(dbConnection))
    }

    // additional migrations or more seedings with a new version
    // do not forget to inncrease the SEEDING_VERSION
    // if (version < 3) {
    //
    // }

    p = p.catch(e => console.error('SEEDIG ERROR', e));
    return p;
};
