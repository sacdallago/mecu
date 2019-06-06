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

            if(request.is(`multipart/form-data`)) {

                const uploadExperimentStartTime = new Date();

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

                    console.log(`uploading experiment`, name);

                    if(error || data === undefined || lysate === undefined || name === undefined){
                        response.status(403).send({
                            title: `Error`,
                            message: `Unable to post request`,
                            error: `${error}` || `Some fields are missing!`
                        });
                        return;
                    }

                    if (data.type != `text/plain` && data.type != `text/csv`) {
                        response.status(500).send({
                            title: `Error`,
                            message: `Unable to post request`,
                            error: `Allowed calls include:\n- multipart/form-data \n With attributes 'data' in text/plain format. found: ${data.type}`
                        });
                        return;
                    }

                    return fs.readFile(data.path, `utf8`, function (error, data) {
                        if(error){
                            return response.status(500).send({
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
                                lysate: lysate,
                                description: ``
                            },
                            rawData: data,
                            uploader: extractUserGoogleId(request)
                        };

                        return uploadExperimentDao.uploadExperiment(newExperiment)
                            .then((resultExp) => {
                                console.log(`DURATION TOTAL uploadExperiment`, (Date.now()-uploadExperimentStartTime)/1000);
                                return response.status(201).send({
                                    title: `Success`,
                                    message: `Your data has been added to the database!`,
                                    result: resultExp
                                });
                            })
                            .catch(error => {
                                console.error(`uploadExperiment`, error.message, error);
                                return response.status(500).send({
                                    title: `Error`,
                                    message: `Unable to create experiment`,
                                    error: JSON.stringify(error)
                                });
                            });
                    });
                });
            } else {
                response.status(403).send({
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

        getExperimentStatistics: async function(request, response) {
            try {
                let numberOfProteins = await experimentsDao.getProteinCountsInExperiments();
                let experimentProteinStatistics = await experimentsDao.getExperimentStatistics(extractUserGoogleId(request));

                let answer = {
                    experimentStatistics: experimentProteinStatistics,
                    totalUniqueProteins: numberOfProteins
                };

                return response.status(200).send(answer)
            } catch(error) {
                console.error(`getExperiments`, error);
                return response.status(500).send(error);
            }
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
