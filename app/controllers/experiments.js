// External imports
const json2csv = require('json2csv').parse;
const mecuUtils = require('mecu-utils');
const fs = require('fs');
const formidable = require('formidable');


const UPPER_QUERY_LIMIT = 10;
const queryParams = (query) => {
    let ret = {
        limit: query.limit ? (query.limit > UPPER_QUERY_LIMIT ? 10 : query.limit) : UPPER_QUERY_LIMIT,
        offset: query.offset || 0,
        sortBy: query.sortBy || 'id',
        order: query.order ? (isNaN(parseInt(query.order)) ? 1 : parseInt(query.order)) : 1
    };
    return ret;
}

module.exports = function(context) {

    // Imports
    const proteinsModel = context.component('models').module('proteins');
    const experimentsDao = context.component('daos').module('experiments');
    const proteinReadsDao = context.component('daos').module('proteinReads');
    const temperatureReadsDao = context.component('daos').module('temperatureReads');
    const proteinXExperimentModel = context.component('models').module('proteinXexperiments');
    const experimentXProteinReadModel = context.component('models').module('experimentXproteinReads');
    const proteinXProteinReadModel = context.component('models').module('proteinXproteinReads');
    const proteinXTemperatureReadModel = context.component('models').module('proteinXtemperatureReads');
    const experimentXTemperatureReadModel = context.component('models').module('experimentXtemperatureReads');

    return {
        uploadExperiment: function(request, response) {
            const uploadExperimentStartTime = new Date();
            if(request.is('multipart/form-data')) {
                const form = new formidable.IncomingForm();

                form.parse(request, function(error, fields, files) {
                    let data = files.data;
                    const lysate = function(){
                        if(fields.lysate !== undefined){
                            return fields.lysate == 'on';
                        }
                        return false;
                    }();
                    const name = fields.description;

                    if(error || data === undefined || lysate === undefined || name === undefined){
                        response.status(403).render('error', {
                            title: 'Error',
                            message: "Unable to post request",
                            error: error || "Some fields are missing!"
                        });
                        return;
                    }

                    if (data.type != 'text/plain') {
                        response.status(500).render('error', {
                            title: 'Error',
                            message: "Unable to post request",
                            error: "Allowed calls include:\n- multipart/form-data \n With attributes 'data' in text/plain format"
                        });
                        return;
                    }

                    return fs.readFile(data.path, 'utf8', function (error, data) {
                        if(error){
                            return response.status(500).render('error', {
                                title: 'Error',
                                message: "Unable to read file",
                                error: error
                            });
                        }

                        // Transform TSV into JSON data
                        data = mecuUtils.parse(data);

                        let newExperiment = {
                            name: name,
                            metaData: {
                                lysate: lysate
                            },
                            rawData: data,
                            uploader: request.user.get('googleId')
                        };

                        return context.dbConnection.transaction(transaction => {
                            // create the initial experiment
                            return experimentsDao.create(newExperiment, {transaction: transaction, returning: true})
                                .then(experiment => {

                                    let proteinList = new Set();

                                    let proteinReads = data.map(element => {
                                        proteinList.add(element.uniprotId);
                                        return {
                                            uniprotId: element.uniprotId,
                                            experiment: experiment.id,
                                            peptides: element.peptides,
                                            psms: element.psms,
                                            totalExpt: isNaN(element.totalExpt) ? undefined : element.totalExpt
                                        };
                                    });
                                    proteinList = Array.from(proteinList);

                                    let meltingReads = data.map(element => {
                                        return element.reads.map(tempRead => {
                                            tempRead.uniprotId = element.uniprotId;
                                            tempRead.experiment = experiment.id;
                                            return tempRead;
                                        });
                                    }).reduce((elements,element) => elements.concat(element));

                                    // create proteins, necessary for the rest of the m-to-n relationships
                                    let p = Promise.resolve();
                                    const proteinsCreateStartTime = new Date();
                                    proteinList.forEach(protein => {
                                        p = p.then(() => proteinsModel.findOrCreate({where: {uniprotId: protein}, defaults: {uniprotId: protein}}));
                                    });

                                    return p
                                        // Promise.all(
                                        //     proteinList.map(protein =>
                                        //         proteinsModel.findOrCreate({where: {uniprotId: protein}, defaults: {uniprotId: protein}})
                                        //             // HACK: UGLY FUCKING HARD HACK
                                        //             // the timeout for sequelize querys can be set initially in the settings, however, setting it to 2min for every query is bad practice
                                        //             // the problem is, the timer starts when the promise is executed (e.g. proteinsModel.findOrCreate({where: {uniprotId: protein}, defaults: {uniprotId: protein}}))
                                        //             // this means, in this map (here), there could X querys executed parallel, but the db driver can only handle so much at a time, resulting in some
                                        //             // querys to wait forever, which will then time out...
                                        //             // this is the only fast (BAD) solution i found to be working
                                        //             // with more than 8k proteins to be added, this fails as well
                                        //             // CORRECT WAY: use .bulkCreate, which fails when the protein already exists (postgres ON DUPLICATE DO NOTHING is not yet supported by sequelize yay)
                                        //             // CORRECT WAY2: use .findOrCreate sequentially (this takes, for 8100 proteins, about 100 seconds, if all proteins have to be created (O.O), otherwise 8 seconds)
                                        //             // decided to do it the correct2 way, it works, but takes a long time
                                        //             .catch(() => proteinsModel.findOrCreate({where: {uniprotId: protein}, defaults: {uniprotId: protein}}))
                                        //     )
                                        // )
                                        .then(() => {
                                            console.log(`DURATION proteinsModel.findOrCreate(${proteinList.length})`, (Date.now()-proteinsCreateStartTime)/1000);
                                        })
                                        // protein X experiment table
                                        .then(() => proteinXExperimentModel.bulkCreate(
                                                proteinList.map(protein => ({
                                                    uniprotId: protein,
                                                    experimentId: experiment.id
                                                })),
                                                {transaction: transaction, returning: true}
                                            )
                                        )
                                        .then(proteinsXExperimentsCreated => {

                                            return Promise.all([
                                                // proteinReads
                                                proteinReadsDao.bulkCreate(proteinReads, {transaction: transaction, returning: true})
                                                    .then(proteinReadsDaoBulkCreateResult => {

                                                        const experimentXProteinRead = [];
                                                        const proteinXProteinRead = [];
                                                        proteinReadsDaoBulkCreateResult.forEach(proteinRead => {
                                                            experimentXProteinRead.push({
                                                                experimentId: experiment.id,
                                                                proteinReadId: proteinRead.dataValues.id
                                                            });
                                                            proteinXProteinRead.push({
                                                                uniprotId: proteinRead.dataValues.uniprotId,
                                                                proteinReadId: proteinRead.dataValues.id
                                                            });
                                                        });
                                                        return Promise.all([
                                                            // experiment X proteinReads
                                                            experimentXProteinReadModel.bulkCreate(experimentXProteinRead, {transaction: transaction, returning: true}),
                                                            // protein X proteinReads
                                                            proteinXProteinReadModel.bulkCreate(proteinXProteinRead, {transaction: transaction, returning: true})
                                                        ]);
                                                    }),
                                                // temperatureReads
                                                temperatureReadsDao.bulkCreate(meltingReads, {transaction: transaction, returning: true})
                                                    .then(temperatureReadsDaoBulkCreateResult => {

                                                        const experimentXTemperatureRead = [];
                                                        const proteinXTemperatureRead = [];
                                                        temperatureReadsDaoBulkCreateResult.forEach(temperatureRead => {
                                                            experimentXTemperatureRead.push({
                                                                experimentId: experiment.id,
                                                                temperatureReadId: temperatureRead.dataValues.id
                                                            });
                                                            proteinXTemperatureRead.push({
                                                                uniprotId: temperatureRead.dataValues.uniprotId,
                                                                temperatureReadId: temperatureRead.dataValues.id
                                                            });
                                                        });
                                                        return Promise.all([
                                                            // experiment X temperatureReads
                                                            experimentXTemperatureReadModel.bulkCreate(experimentXTemperatureRead, {transaction: transaction, returning: true}),
                                                            // protein X temperatureReads
                                                            proteinXTemperatureReadModel.bulkCreate(proteinXTemperatureRead,{transaction: transaction, returning: true})
                                                        ]);
                                                    })
                                            ]);
                                    });
                                });
                        })
                        .then(result => {
                            console.log('DURATION TOTAL uploadExperiment', (Date.now()-uploadExperimentStartTime)/1000);
                            return response.status(201).render('success', {
                                title: 'Success',
                                message: "Your data has been added to the database!"
                            });
                        })
                        .catch(error => {
                            console.error(`uploadExperiment`, error.message, error);
                            return response.status(500).render('error', {
                                title: 'Error',
                                message: "Unable to create experiment",
                                error: JSON.stringify(error)
                            });
                        });
                    });
                });
            } else {
                response.status(403).render('error', {
                    title: 'Error',
                    message: "Unable to post request",
                    error: "Allowed calls include:\n- multipart/form-data \n With attributes 'data' in text/plain format"
                });
            }
        },

        getProteinsInExperiment: function(request, response) {
            temperatureReadsDao.getDistinctProteinsInExperiment(request.params.id)
                .then(result => response.status(200).send(result))
                .catch(error => {
                    console.error('getExperiment', error);
                    return response.status(500).send(error);
                });
        },

        getExperiment: function(request, response) {
            console.log('request.params', request.params);
            experimentsDao.findExperiment(request.params.id)
                .then(toSend => {
                    if(toSend.private === true && toSend.uploader !== request.user.get('googleId')){
                        console.error('not the owner of the experiment');
                        toSend = {error: 'You are not the owner of the experiment and the experiment is not open to be viewed by others'};
                    }

                    if(toSend.uploader === request.user.get('googleId')){
                        toSend.isUploader = true;
                    }

                    return toSend;
                })
                .then(toSend => response.status(200).send(toSend))
                .catch(error => {
                    console.error('getExperiment', error);
                    return response.status(500).send(error);
                });
        },

        getExperiments: function(request, response) {
            experimentsDao.getExperimentsPaged(queryParams(request.query))
                .then(result => response.status(200).send(result))
                .catch(error => {
                    console.error('getExperiments', error);
                    return response.status(500).send(error);
                });
        },

        getRawData: function(request, response) {
            let identifier;
            const format = request.query.format;

            try {
                identifier = request.params.id;
            } catch (error){
                console.error(error);
                return response.status(400).send(error);
            }

            experimentsDao.getRawData(identifier)
                .then(function(rawData){
                    if (rawData.constructor !== Array) {
                        rawData = [rawData];
                    }
                    rawData = rawData
                        .map(function(experiment){
                            return experiment.get('rawData').map(function(proteinData) {
                                proteinData.experiment = experiment.get('id');
                                return proteinData;
                            });
                        })
                        .reduce(function(previous, current){
                            return previous.concat(current);
                        }, []);

                    let fields = Object.keys(rawData[0]);

                    fields.splice(fields.indexOf("reads"), 1);

                    switch(format){
                        case "csv":
                            rawData = json2csv(rawData, {
                                quotes: '',
                                fields: fields
                            });
                            break;
                        case "tsv":
                            rawData = json2csv(rawData, {
                                quotes: '',
                                del: '\t',
                                fields: fields
                            });
                            break;
                        default:
                            rawData = JSON.stringify(rawData);
                            break;
                    }

                    response.set('Content-Type', 'text/plain');
                    return response.status(200).send(new Buffer(rawData));
                })
                .catch(function(error){
                    console.error(error);
                    return response.status(500).send(error);
                });
        },

        getExperimentsWhichHaveProtein: function(request, response) {
            experimentsDao.getExperimentsWhichHaveProtein(request.params.uniprotId)
                .then(result => response.status(200).send(result.map(e => e.experiment)))
                .catch(error => {
                    console.error('getExperiments', error);
                    return response.status(500).send(error);
                });
        }
    }
};
