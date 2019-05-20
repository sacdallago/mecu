const {seedMainUsersWithPostPermissions, seedProteinXProtein} = require('./seedings');
const {
    createVersionTable,
    getTableVersion,
    updateTableVersion
} = require('../settingsTable/settingsTableMethods');

const SEEDING_ROW = 'seeding_version';
const SEEDING_VERSION = 1;

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
        p
            .then(() => seedMainUsersWithPostPermissions(dbConnection))
            .then(() => seedProteinXProtein(dbConnection))
            .catch(e => console.error('e', e));
        console.log('seeding: seedMainUsersWithPostPermissions');
    }

    // if (version < 2) {
    //
    // }
    return p;
}
