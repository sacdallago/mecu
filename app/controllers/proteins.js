const extractUserGoogleId = require('../helper.js').retrieveUserGoogleId;

module.exports = function(context) {

    // Imports
    const proteinsDao = context.component('daos').module('proteins');
    const proteinReadsDao = context.component('daos').module('proteinReads');
    const proteinXproteinsDao = context.component('daos').module('proteinXproteins');
    const temperatureReadsDao = context.component('daos').module('temperatureReads');
    const experimentsDao = context.component('daos').module('experiments');

    return {
        getProteinByUniProtId: function(request, response) {
            const identifier = request.params.id.toUpperCase();

            proteinsDao.findByUniprotId(identifier).then(function(protein){
                if(mapping){
                    response.send(protein);
                } else {
                    response.status(404).send();
                }
            }, function(error){
                response.status(500).send(error);
            });
        },

        getProteinsFromExp: function(request, response) {
            let protExpArray = request.body;
            if(protExpArray.constructor == Object) {
                protExpArray = [];
            }

            temperatureReadsDao.findAndAggregateTempsByIdAndExperiment(protExpArray, extractUserGoogleId(request))
                .then(r => response.status(200).send(r))
                .catch(err => {
                    console.error('getProteinsFromExp', err);
                    response.send([]);
                })
        },

        getSpecProt: function(request, response) {
            Promise.all([
                    temperatureReadsDao.getSingleProteinXExperiment(request.params.name, request.params.expid, extractUserGoogleId(request)),
                    proteinReadsDao.findProteinExperiment(request.params.name, request.params.expid, extractUserGoogleId(request)),
                    experimentsDao.findExperiment(request.params.expid, extractUserGoogleId(request))
                ])
                .then(([tempData, proteinData, experimentData]) => {

                    if(tempData.length > 0) {
                        response.send({
                            uniprotId: tempData[0].uniprotId,
                            experiment: tempData[0].experiment,
                            reads: tempData[0].reads,
                            psms: proteinData.psms,
                            peptides: proteinData.peptides,
                            p_createdAt: proteinData.createdAt,
                            p_updatedAt: proteinData.updatedAt,
                            lysate: experimentData.metaData.lysate,
                            name: experimentData.name,
                            description: experimentData.metaData.description,
                            uploader: experimentData.uploader,
                            e_createdAt: experimentData.createdAt,
                            e_updatedAt: experimentData.updatedAt
                        });
                    } else {
                        console.log('getSpecProt: no experimentXprotein data found', request.params.name, request.params.expid);
                        response.status(200).send({});
                    }
                })
                .catch(err => {
                    console.error('getSpecProt', err);
                    response.send({});
                });
        },

        getProteinInteractions: function(request, response) {

            proteinXproteinsDao.getProteinInteraction(request.params.uniprotId)
                .then(result => {
                    let setOfProteins = new Set();
                    result.forEach(r => {
                        setOfProteins.add(r.interactor1);
                        setOfProteins.add(r.interactor2);
                    })
                    setOfProteins = Array.from(setOfProteins);

                    return Promise.all([
                        Promise.resolve(result),
                        temperatureReadsDao.findAndAggregateTempsByIdAndExperiment(
                            setOfProteins.map(p => ({
                                uniprotId: p,
                                experiment: request.params.expId
                            })),
                            extractUserGoogleId(request)
                        )
                    ]);
                })
                .then(result => {
                    const proteinToTemperatureMap = {};
                    result[1].filter(r => !!r).forEach(tempObj => proteinToTemperatureMap[tempObj.uniprotId] = {
                        uniprotId: tempObj.uniprotId,
                        experiments: tempObj.experiments
                    });
                    result[0].forEach(interaction => {
                        interaction.interactor1 =
                            proteinToTemperatureMap[interaction.interactor1] ||
                            { uniprotId: interaction.interactor1 };
                        interaction.interactor2 =
                            proteinToTemperatureMap[interaction.interactor2] ||
                            { uniprotId: interaction.interactor2 };
                    });
                    return result[0];
                })
                .then(result => response.status(200).send(result))
                .catch(error => {
                    console.error('getProteinInteractions', error);
                    return response.status(500).send({});
                });
        },

        getProteinExperimentCombinations: function(request, response) {
            let protExpArray = request.body;
            if(protExpArray.constructor == Object) {
                protExpArray = [];
            }

            proteinsDao.findProteinExperimentCombinations(protExpArray, extractUserGoogleId(request))
                .then(r => response.status(200).send(r))
                .catch(err => {
                    console.error('getProteinExperimentCombinations', err);
                    response.send([]);
                })
        },

        getProteinXProteinDistances: function(request, response) {
            const proteinList = request.body.proteinList || [];
            const experimentList = request.body.experimentList || [];

            const start = new Date();
            proteinXproteinsDao.getProteinXProteinDistances(proteinList, experimentList, extractUserGoogleId(request))
                .then(r => {
                    console.log('DURATION getProteinXProteinDistances', (Date.now()-start)/1000);
                    response.status(200).send(r);
                })
                .catch(err => {
                    console.error('getProteinXProteinDistances', err);
                    response.send([]);
                })
        }
    }
}
