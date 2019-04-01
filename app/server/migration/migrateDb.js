const {alterTableUsersAddIsAdmin} = require('./migrations');
const {
    createVersionTable,
    getTableVersion,
    updateTableVersion
} = require('../settingsTable/settingsTableMethods');

const VERSION_ROW = 'app_version';
const SCHEMA_VERSION = 1;

module.exports = (dbConnection) => Promise.resolve(dbConnection)
    .then(dbConnection => {
        console.log('doing db migrations...');
        return dbConnection;
    })
    .then(dbC => {
        return createVersionTable(dbC)
            .then(() => getTableVersion(dbC, VERSION_ROW))
            .then(resultVersion => doMigrations(resultVersion, dbC))
            .then(r => updateTableVersion(dbC, VERSION_ROW, SCHEMA_VERSION))
    })
    .then(r => {
        console.log('migrations done.');
        return;
    });


const doMigrations = (version, dbConnection) => {
    let p = Promise.resolve();
    if (!version) {
        p.then(() => alterTableUsersAddIsAdmin(dbConnection));
        console.log('migrating: alterTableUsersAddIsAdmin')
    }

    // if (version < 2) {
    //
    // }
    return p;
}
