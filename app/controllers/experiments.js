// External imports
const json2csv = require(`json2csv`).parse;
const mecuUtils = require(`mecu-utils`);
const fs = require(`fs`);
const formidable = require(`formidable`);

const extractUserGoogleId = require(`../helper.js`).retrieveUserGoogleId;

const UPPER_QUERY_LIMIT = 10;
const queryParams = (query) => {
    let ret = {
        limit: query.limit ? (query.limit > UPPER_QUERY_LIMIT ? 10 : query.limit) : UPPER_QUERY_LIMIT,
        offset: query.offset || 0,
        sortBy: query.sortBy || `id`,
        order: query.order ? (isNaN(parseInt(query.order)) ? 1 : parseInt(query.order)) : 1
    };
    return Object.assign(ret, query);
};

module.exports = function(context) {

    // Imports
    const experimentsDao = context.component(`daos`).module(`experiments`);
    const temperatureReadsDao = context.component(`daos`).module(`temperatureReads`);
    const uploadExperimentDao = context.component(`daos`).module(`experimentUpload`);


    return {
        uploadExperiment: function(request, response) {
            console.log(`uploading experiment`);
            const uploadExperimentStartTime = new Date();
            if(request.is(`multipart/form-data`)) {
                const form = new formidable.IncomingForm();

                form.parse(request, function(error, fields, files) {
                    let data = files.data;
                    const lysate = function(){
                        if(fields.lysate !== undefined){
                            return fields.lysate == `on`;
                        }
                        return false;
                    }();
                    const name = fields.description;

                    if(error || data === undefined || lysate === undefined || name === undefined){
                        response.status(403).render(`error`, {
                            title: `Error`,
                            message: `Unable to post request`,
                            error: error || `Some fields are missing!`
                        });
                        return;
                    }

                    if (data.type != `text/plain`) {
                        response.status(500).render(`error`, {
                            title: `Error`,
                            message: `Unable to post request`,
                            error: `Allowed calls include:\n- multipart/form-data \n With attributes 'data' in text/plain format`
                        });
                        return;
                    }

                    return fs.readFile(data.path, `utf8`, function (error, data) {
                        if(error){
                            return response.status(500).render(`error`, {
                                title: `Error`,
                                message: `Unable to read file`,
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
                            uploader: extractUserGoogleId(request)
                        };

                        return uploadExperimentDao.uploadExperiment(newExperiment)
                            .then(() => {
                                console.log(`DURATION TOTAL uploadExperiment`, (Date.now()-uploadExperimentStartTime)/1000);
                                return response.status(201).render(`success`, {
                                    title: `Success`,
                                    message: `Your data has been added to the database!`
                                });
                            })
                            .catch(error => {
                                console.error(`uploadExperiment`, error.message, error);
                                return response.status(500).render(`error`, {
                                    title: `Error`,
                                    message: `Unable to create experiment`,
                                    error: JSON.stringify(error)
                                });
                            });
                    });
                });
            } else {
                response.status(403).render(`error`, {
                    title: `Error`,
                    message: `Unable to post request`,
                    error: `Allowed calls include:\n- multipart/form-data \n With attributes 'data' in text/plain format`
                });
            }
        },

        getProteinsInExperiment: function(request, response) {
            temperatureReadsDao.getDistinctProteinsInExperiment(request.params.id)
                .then(result => response.status(200).send(result))
                .catch(error => {
                    console.error(`getExperiment`, error);
                    return response.status(500).send(error);
                });
        },

        getExperiment: function(request, response) {

            const requester = extractUserGoogleId(request);

            experimentsDao.findExperimentWithoutCheck(request.params.id)
                .then(toSend => {
                    if(toSend.private === true && toSend.uploader !== requester){
                        console.error(`${requester} not the owner of the experiment ${request.params.id}`);
                        toSend = {error: `You are not the owner of the experiment and the experiment is not open to be viewed by others`};
                    }

                    if(toSend.uploader === requester){
                        toSend.isUploader = true;
                    }

                    return toSend;
                })
                .then(toSend => response.status(200).send(toSend))
                .catch(error => {
                    console.error(`getExperiment`, error);
                    return response.status(500).send(error);
                });
        },

        updateExperiment: function(request, response) {
            console.log(`request.params`, request.params);
            console.log(`request.body`, request.body);
            if(request.params.id && request.body) {
                let experimentToUpdate = request.body;
                delete experimentToUpdate.id;
                experimentsDao.update(request.params.id, experimentToUpdate)
                    .then(result => result[1][0])
                    .then(({id, name, metaData, description}) => {
                        response.status(200).send({id, name, metaData, description});
                    })
                    .catch(error => {
                        console.error(`updateExperiment`, error);
                        return response.status(500).send(error);
                    });

            }
        },

        getExperiments: function(request, response) {
            experimentsDao.getExperimentsPaged(queryParams(request.query), extractUserGoogleId(request))
                .then(result => response.status(200).send(result))
                .catch(error => {
                    console.error(`getExperiments`, error);
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

            experimentsDao.getRawData(identifier, extractUserGoogleId(request))
                .then(function(rawData){
                    if (rawData.constructor !== Array) {
                        rawData = [rawData];
                    }
                    rawData = rawData
                        .map(function(experiment){
                            return experiment.get(`rawData`).map(function(proteinData) {
                                proteinData.experiment = experiment.get(`id`);
                                return proteinData;
                            });
                        })
                        .reduce(function(previous, current){
                            return previous.concat(current);
                        }, []);

                    let fields = Object.keys(rawData[0]);

                    fields.splice(fields.indexOf(`reads`), 1);

                    switch(format){
                    case `csv`:
                        rawData = json2csv(rawData, {
                            quotes: ``,
                            fields: fields
                        });
                        break;
                    case `tsv`:
                        rawData = json2csv(rawData, {
                            quotes: ``,
                            del: `\t`,
                            fields: fields
                        });
                        break;
                    default:
                        rawData = JSON.stringify(rawData);
                        break;
                    }

                    response.set(`Content-Type`, `text/plain`);
                    return response.status(200).send(new Buffer(rawData));
                })
                .catch(function(error){
                    console.error(error);
                    return response.status(500).send(error);
                });
        },

        getExperimentsWhichHaveProtein: function(request, response) {
            experimentsDao.getExperimentsWhichHaveProtein(request.params.uniprotId, extractUserGoogleId(request))
                .then(result => response.status(200).send(result))
                .catch(error => {
                    console.error(`getExperiments`, error);
                    return response.status(500).send(error);
                });
        },

        getExperimentsWhichHaveComplex: function(request, response) {
            const start = new Date();
            experimentsDao.getExperimentsWhichHaveComplex(request.params.complexId, extractUserGoogleId(request))
                .then(result => {
                    console.log(`DURATION getExperimentsWhichHaveComplex`, (Date.now()-start)/1000);
                    response.status(200).send(result);
                })
                .catch(error => {
                    console.error(`getExperimentsWhichHaveComplex`, error);
                    return response.status(500).send([]);
                });
        }
    };
};
