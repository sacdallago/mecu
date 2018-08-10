module.exports = function(context) {

    // Imports
    const proteinsDao = context.component('daos').module('proteins');
    const proteinReadsDao = context.component('daos').module('proteinReads');
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
            console.log('request.body', request.body);
            let protExpArray = request.body;
            if(protExpArray.constructor == Object) {
                protExpArray = [];
            }
            console.log('protExpArray', protExpArray);

            temperatureReadsDao.findAndAggregateTempsByIdAndExperiment(protExpArray)
                .then(r => {
                    console.log('rtemperatureReadsDao.findAndAggregateTempsByIdAndExperiment', r);
                    response.send(r);
                })
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
        }
    }
}
