const consoleStamp = require(`console-stamp`);
const cluster = require(`cluster`);

const loadComponentsAndConnectToDb = require(`./loadComponentsAndConnectToDb`);
const seeding = require(`./seeding/seeding`);

module.exports = () => {

    consoleStamp(console, {
        metadata: function () {
            return (`[SeedingWorker]`);
        },
        colors: {
            stamp: `yellow`,
            label: `white`,
            metadata: `blue`
        }
    });

    return loadComponentsAndConnectToDb.connect(function(context) {
        return seeding(context.dbConnection);
    });

}
