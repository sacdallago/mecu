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

            temperatureReadsDao.findAndAggregateTempsByIdAndExperiment(protExpArray)
                .then(r => response.status(200).send(r))
                .catch(err => {
                    console.error('getProteinsFromExp', err);
                    response.send([]);
                })
        },

        getSpecProt: function(request, response) {
            Promise.all([
                    temperatureReadsDao.getSingleProteinXExperiment(request.params.name, request.params.expid),
                    proteinReadsDao.findProteinExperiment(request.params.name, request.params.expid),
                    experimentsDao.findExperiment(request.params.expid)
                ])
                .then(([tempData, proteinData, experimentData]) => {
                    if(tempData.length > 0 && proteinData.length > 0 && experimentData.length > 0) {
                        response.send({
                            uniprotId: tempData[0].uniprotId,
                            experiment: tempData[0].experiment,
                            reads: tempData[0].reads,
                            psms: proteinData[0].psms,
                            peptides: proteinData[0].peptides,
                            p_createdAt: proteinData[0].createdAt,
                            p_updatedAt: proteinData[0].updatedAt,
                            lysate: experimentData[0].lysate,
                            description: experimentData[0].description,
                            uploader: experimentData[0].uploader,
                            e_createdAt: experimentData[0].createdAt,
                            e_updatedAt: experimentData[0].updatedAt
                        });
                    } else {
                        throw Error('no data found', tempData, proteinData);
                    }
                })
                .catch(err => {
                    console.error('getProteinsFromExp', err);
                    response.send({});
                });
        },

        getProteinInteractions: function(request, response) {
            console.log('request.params', request.params);
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
                            }))
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
        }
    }
}
