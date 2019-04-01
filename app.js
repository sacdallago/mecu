'use strict';

const cluster = require(`cluster`);

const runMasterWorker = require(`./app/server/masterWorker`);
const runSlaveWorker = require(`./app/server/slaveWorker`);
const runMigrationWorker = require(`./app/server/migrationWorker`);
const runSeedingWorker = require(`./app/server/seedingWorker`);

if (cluster.isMaster) {
    Promise.resolve()
        .then(() => runMigrationWorker())
        .then(() => runSeedingWorker())
        .then(() => runMasterWorker());
} else {
    runSlaveWorker();
}
