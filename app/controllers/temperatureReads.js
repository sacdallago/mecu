/**
 * Created by chdallago on 1/5/17.
 */

module.exports = function(context) {

    const temperatureReadsDao = context.component('daos').module('temperatureReads');
    const proteinReadsDao = context.component('daos').module('proteinReads');
    const experimentsDao = context.component('daos').module('experiments');

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
        }
    }
}