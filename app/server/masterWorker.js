const consoleStamp      = require(`console-stamp`);
const numCPUs           = 1;//require(`os`).cpus().length;
const cluster           = require(`cluster`);

module.exports = () => {
    // Setup timestamps for logging
    consoleStamp(console,{
        metadata: function () {
            return (`[MASTER]`);
        },
        colors: {
            stamp: `yellow`,
            label: `white`,
            metadata: `red`
        }
    });

    // Fork workers.
    for (var i = 0; i < numCPUs; i++) {
        const worker = cluster.fork();
        console.log(`Spwaning worker ` + worker.id);
    }

    cluster.on(`exit`, function(worker, code, signal) {
        console.log(`worker ` + worker.process.pid + ` died`);
        const newWorker = cluster.fork();
        console.log(`Spwaning worker ` + newWorker.id);
    });
}
