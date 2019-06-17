const consoleStamp = require(`console-stamp`);
const cluster = require(`cluster`);

const loadComponentsAndConnectToDb = require(`./loadComponentsAndConnectToDb`);
const migrateDb = require(`./migration/migrateDb`);
const loadModels = require(`../models/loadModels`);

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
        return Promise.resolve(loadModels(context))
            .then(() => context.dbConnection.sync())
            .then(() => migrateDb(context.dbConnection));
        });
}
