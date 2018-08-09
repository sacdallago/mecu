module.exports = function(context) {

    // Imports
    const proteinsDao = context.component('daos').module('proteins');
    const proteinReadsDao = context.component('daos').module('proteinReads');
    const temperatureReadsDao = context.component('daos').module('temperatureReads');

    return {
        getProteins: function(request, response) {
            const identifier = request.params.id.toUpperCase();

            if(identifier === undefined){
                response.send([]);
            } else {
                proteinReadsDao.findProteins(identifier)
                    .then(function(proteins){
                        response.send(proteins);
                    })
                    .catch(function(error){
                        response.status(500).send(error);
                });
            }
        },
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
            temperatureReadsDao.getSingleProteinXExperiment(request.params.name, request.params.expid)
                .then(result => {
                    if(result.length === 1) {
                        response.send(result[0]);
                    } else if(result.length > 1) {
                        console.warn('found more than one proteinname*experiment pair');
                        response.send(result[0]);
                    } else {
                        response.send([]);
                    }
                })
                .catch(err => {
                    console.error('getProteinsFromExp', err);
                    response.send([]);
                });
        }
    }
}
