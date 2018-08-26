// External imports
const json2csv = require('json2csv').parse;

module.exports = function(context) {

    // Imports
    const temperatureReadsDao = context.component('daos').module('temperatureReads');
    const proteinReadsDao = context.component('daos').module('proteinReads');
    const experimentsDao = context.component('daos').module('experiments');

    return {
        searchByUniprotId: function(request, response) {
            const identifier = request.params.id.toUpperCase();
            const start = new Date();
            if(identifier === undefined){
                return response.send([]);
            } else {
                return experimentsDao.getExperiments().then(function(experimentIds) {
                    return proteinReadsDao.findUniprotIdsLike(identifier).then(function(uniprotIds) {
                        return temperatureReadsDao.findByUniprotId(identifier).then(function(reads){
                            let result = uniprotIds.map(function (uniprotId) {
                                let element = {
                                    uniprotId: uniprotId.get("uniprotId")
                                };

                                element.experiments = experimentIds
                                    .map(function(experimentId) {
                                        let e = {
                                            experiment: experimentId.get('id')
                                        };

                                        e.reads = reads
                                            .filter(function (tempReads) {
                                                return tempReads.uniprotId === element.uniprotId && tempReads.experiment === e.experiment;
                                            })
                                            .map(function(fullObj) {
                                                return {
                                                    t: fullObj.temperature,
                                                    r: fullObj.ratio,
                                                }
                                            });

                                        return e;
                                    })
                                    .filter(function(experimentRelativeReads){
                                        return experimentRelativeReads.reads.length > 0;
                                    });

                                return element;
                            });
                            console.log('DURATION searchByUniprotId', (Date.now()-start)/1000)
                            return response.send(result);
                        })
                            .catch(function(error){
                                console.error(error);
                                return response.status(500).send(error);
                            });
                    })
                        .catch(function(error){
                            console.error(error);
                            return response.status(500).send(error);
                        });
                })
                    .catch(function(error){
                        console.error(error);
                        return response.status(500).send(error);
                    });
            }
        },

        getTemperatures: function(request, response) {
            let experimentId;

            if(request.query.e !== undefined){
                try{
                    experimentId = parseInt(request.query.e);
                } catch (error){
                    console.error(error);
                    return response.status(400).send(error);
                }
            }

            const uniprotId = request.query.p;
            const format = request.query.format;

            return temperatureReadsDao.findByUniprotIdAndExperiment(uniprotId, experimentId)
                .then(function(temperatureReads) {

                    if(temperatureReads.length < 1){
                        return response.status(200).send();
                    }

                    temperatureReads = temperatureReads.map(function(read) {
                        return {
                            experiment : read.get('experiment'),
                            uniprotId : read.get('uniprotId'),
                            temperature : read.get('temperature'),
                            ratio : read.get('ratio')
                        }
                    });

                    let fields = Object.keys(temperatureReads[0]);

                    switch(format){
                        case "csv":
                            temperatureReads = json2csv({
                                data: temperatureReads,
                                quotes: '',
                                fields: fields
                            });
                            break;
                        case "tsv":
                            temperatureReads = json2csv({
                                data: temperatureReads,
                                quotes: '',
                                del: '\t',
                                fields: fields
                            });
                            break;
                        default:
                            temperatureReads = JSON.stringify(temperatureReads);
                            break;
                    }

                    response.set('Content-Type', 'text/plain');
                    return response.status(200).send(new Buffer(temperatureReads));
                })
                .catch(function(error){
                    console.error(error);
                    return response.status(500).send(error);
                });
        },

        // P55072
        getByUniProtIdsAndExperiments: function(request, response) {
            const uniprotIds = request.body.proteins;
            const experiments = request.body.experiments;

            return Promise.all([
                proteinReadsDao.findUniprotIds(uniprotIds),
                temperatureReadsDao.findByUniprotIdAndExperiment(uniprotIds, experiments)
            ]).then(([proteins, reads]) => {

                let result = proteins.map((newUniProtId) => {
                    let element = {uniprotId: newUniProtId.get('uniprotId')};

                    element.experiments = experiments.map((experimentId) => {
                            let e = {experiment: experimentId};

                            e.reads = reads.filter(tempReads =>
                                    tempReads.uniprotId == element.uniprotId &&
                                    tempReads.experiment == e.experiment
                                )
                                .map(fullObj => ({t:fullObj.temperature, r: fullObj.ratio}));

                            return e;
                        })
                        .filter(e => e.reads.length > 0);

                    return element;
                });

                return response.send(result);
            })
            .catch(function(error){
                console.error(error);
                return response.status(500).send(error);
            });
        }
    }
};
