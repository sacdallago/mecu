/**
 * Created by chdallago on 1/5/17.
 */

module.exports = function(context) {

    // Imports
    const temperatureReadsDao = context.component('daos').module('temperatureReads');
    const proteinReadsDao = context.component('daos').module('proteinReads');
    const experimentsDao = context.component('daos').module('experiments');

    // External imports
    const json2csv = require('json2csv');

    return {
        searchByUniprotId: function(request, response) {
            const identifier = request.params.id.toUpperCase();

            if(identifier === undefined){
                return response.send([]);
            } else {
                return experimentsDao.getExperiments().then(function(experimentIds) {
                    return proteinReadsDao.findUniprotIds(identifier).then(function(uniprotIds) {
                        return temperatureReadsDao.findByUniprotId(identifier).then(function(reads){
                            let result = uniprotIds.map(function (uniprotId) {
                                let element = {
                                    uniprotId: uniprotId.get("uniprotId")
                                };

                                element.reads = experimentIds
                                    .map(function(experimentId) {
                                        let e = {
                                            experiment: experimentId.get('id')
                                        };

                                        e.reads = reads
                                            .filter(function (tempReads) {
                                                return tempReads.uniprotId == element.uniprotId && tempReads.experiment == e.experiment;
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
                        return response.status(200).send([]);
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

        }
    }
}