
module.exports = function(context) {

    const proteinsDao = context.component(`daos`).module(`proteins`);
    const experimentsDao = context.component(`daos`).module(`experiments`);
    const proteinReadsDao = context.component(`daos`).module(`proteinReads`);
    const temperatureReadsDao = context.component(`daos`).module(`temperatureReads`);
    const proteinXExperimentModel = context.component(`models`).module(`proteinXexperiments`);
    const experimentXProteinReadModel = context.component(`models`).module(`experimentXproteinReads`);
    const proteinXProteinReadModel = context.component(`models`).module(`proteinXproteinReads`);
    const proteinXTemperatureReadModel = context.component(`models`).module(`proteinXtemperatureReads`);
    const experimentXTemperatureReadModel = context.component(`models`).module(`experimentXtemperatureReads`);


    // -----------------HELPER FUNCTIONS----------------------
    const createProteinListAndProteinReads = (data, experimentId) => {
        let proteinList = new Set();

        let proteinReads = data.map(element => {
            proteinList.add(element.uniprotId);
            return {
                uniprotId: element.uniprotId,
                experiment: experimentId,
                peptides: element.peptides,
                psms: element.psms,
                totalExpt: isNaN(element.totalExpt) ? undefined : element.totalExpt
            };
        });
        proteinList = Array.from(proteinList);
        return {proteinList, proteinReads};
    };

    const createMeltingReads = (data, experimentId) => {
        return data.map(element => {
            return element.reads.map(tempRead => {
                tempRead.uniprotId = element.uniprotId;
                tempRead.experiment = experimentId;
                return tempRead;
            });
        }).reduce((elements,element) => elements.concat(element));
    };

    const createProteinXExperimentData = (list, experimentId) => {
        return list.map(protein => ({
            uniprotId: protein,
            experimentId: experimentId
        }));
    };

    const createEXPandPXP = (list, experimentId) => {
        const experimentXProteinRead = [];
        const proteinXProteinRead = [];
        list.forEach(proteinRead => {
            experimentXProteinRead.push({
                experimentId: experimentId,
                proteinReadId: proteinRead.dataValues.id
            });
            proteinXProteinRead.push({
                uniprotId: proteinRead.dataValues.uniprotId,
                proteinReadId: proteinRead.dataValues.id
            });
        });
        return {experimentXProteinRead, proteinXProteinRead};
    };

    const createEXTRandPXTR = (list, experimentId) => {
        const experimentXTemperatureRead = [];
        const proteinXTemperatureRead = [];
        list.forEach(temperatureRead => {
            experimentXTemperatureRead.push({
                experimentId: experimentId,
                temperatureReadId: temperatureRead.dataValues.id
            });
            proteinXTemperatureRead.push({
                uniprotId: temperatureRead.dataValues.uniprotId,
                temperatureReadId: temperatureRead.dataValues.id
            });
        });
        return {experimentXTemperatureRead, proteinXTemperatureRead};
    };

    // NOTE: why am I calling .bulkCreate onto the dao/model, and not passing the function which I want to call inside as a parameter instead:
    //      when I try to do that, suddenly (happends only on a model) this is undefined (I got no clue why)
    const splitUpArrayAndCallBulkCreateOnDAO = function (array, chainFunction, transaction, logInfo = `DEFAULTLOGINFO`) {

        const MAX_BULKCREATE_AT_ONCE = 2000;
        const startTime = new Date();

        console.log(`${logInfo} amount:`, array.length);

        let p = Promise.resolve([]);

        let result = [];
        for(let i = 0; i < array.length; i += MAX_BULKCREATE_AT_ONCE) {
            p = p
                .then(function () {
                    return chainFunction.bulkCreate(array.slice(i, i+MAX_BULKCREATE_AT_ONCE), {transaction: transaction, returning: true});
                })
                .then(function (r) {
                    result = result.concat(r);
                    console.log(`${logInfo} step ${(i+`-`+(i+MAX_BULKCREATE_AT_ONCE)).padEnd(16, ` `)} ${(new Date()-startTime)/1000}ms`);
                });
        }

        return p.then(function() {return result;});
    };

    // --------------------------------------------------------

    return {
        uploadExperiment: (newExperiment) => {
            const data = newExperiment.rawData;

            return context.dbConnection.transaction(transaction => { // TODO add transaction to bulkCreate
                // create the initial experiment
                return experimentsDao.create(newExperiment, {transaction: transaction, returning: true})
                    .then(experiment => {

                        const {proteinList, proteinReads} = createProteinListAndProteinReads(data, experiment.id);

                        const meltingReads = createMeltingReads(data, experiment.id);

                        const proteinXExperimentData = createProteinXExperimentData(proteinList, experiment.id);

                        // create proteins, necessary for the rest of the m-to-n relationships
                        return splitUpArrayAndCallBulkCreateOnDAO(proteinList, proteinsDao, transaction, `proteinsDao`)

                            // protein X experiment table
                            .then(() => splitUpArrayAndCallBulkCreateOnDAO(proteinXExperimentData, proteinXExperimentModel, transaction, `proteinXExperimentModel`))
                            .then(() => {

                                return Promise.all([
                                    // proteinReads
                                    splitUpArrayAndCallBulkCreateOnDAO(proteinReads, proteinReadsDao, transaction, `proteinReadsDao`)
                                        .then(proteinReadsDaoBulkCreateResult => {

                                            const {experimentXProteinRead, proteinXProteinRead} = createEXPandPXP(proteinReadsDaoBulkCreateResult, experiment.id);

                                            return Promise.all([
                                                // experiment X proteinReads
                                                splitUpArrayAndCallBulkCreateOnDAO(experimentXProteinRead, experimentXProteinReadModel, transaction, `experimentXProteinReadModel`),
                                                // protein X proteinReads
                                                splitUpArrayAndCallBulkCreateOnDAO(proteinXProteinRead, proteinXProteinReadModel, transaction, `proteinXProteinReadModel`),
                                            ]);
                                        }),
                                    // temperatureReads
                                    splitUpArrayAndCallBulkCreateOnDAO(meltingReads, temperatureReadsDao, transaction, `temperatureReadsDao`)
                                        .then(temperatureReadsDaoBulkCreateResult => {

                                            const {experimentXTemperatureRead, proteinXTemperatureRead} = createEXTRandPXTR(temperatureReadsDaoBulkCreateResult, experiment.id);

                                            return Promise.all([
                                                // experiment X temperatureReads
                                                splitUpArrayAndCallBulkCreateOnDAO(experimentXTemperatureRead, experimentXTemperatureReadModel, transaction, `experimentXTemperatureReadModel`),
                                                // protein X temperatureReads
                                                splitUpArrayAndCallBulkCreateOnDAO(proteinXTemperatureRead, proteinXTemperatureReadModel, transaction, `proteinXTemperatureReadModel`),
                                            ]);
                                        })
                                ]);
                            });
                    });
            });
        }
    };

};
