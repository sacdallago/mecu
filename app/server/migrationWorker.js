const consoleStamp = require(`console-stamp`);
const cluster = require(`cluster`);

const loadComponentsAndConnectToDb = require(`./loadComponentsAndConnectToDb`);
const migrateDb = require(`./migration/migrateDb`);

module.exports = () => {

    consoleStamp(console, {
        metadata: function () {
            return (`[MigrationWorker]`);
        },
        colors: {
            stamp: `yellow`,
            label: `white`,
            metadata: `blue`
        }
    });

    return loadComponentsAndConnectToDb.connect(function(context) {
        return migrateDb(context.dbConnection);
    });

}
