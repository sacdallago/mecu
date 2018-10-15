const extractUserGoogleId = require('../helper.js').retrieveUserGoogleId;


module.exports = function(context) {

    const complexesDao = context.component('daos').module('complexes');
    const temperatureReadsDao = context.component('daos').module('temperatureReads');

    return {

        getById: function(request, response) {
            complexesDao.getComplex(request.params.id)
                .then(result => response.status(200).send(result))
                .catch(error => {
                    console.error('getById', error);
                    return response.status(500).send({});
                });
        },

        hasProtein: function(request, response) {
            const start = new Date();
            console.log('request.params', request.params);
            complexesDao.getComplexWhichHasProtein(request.params.uniprotId)
                .then(result => {
                    let setOfProteins = new Set();
                    result.forEach((r,i,a) => {
                        r.proteins.forEach(p => {
                            setOfProteins.add(p);
                        })
                    })
                    setOfProteins = Array.from(setOfProteins);

                    return Promise.all([
                        Promise.resolve(result),
                        Promise.all(
                            setOfProteins.map(p =>
                                temperatureReadsDao.findAndAggregateTempsByIdAndExperiment(
                                    [{
                                        uniprotId: p,
                                        experiment: request.params.expId
                                    }],
                                    extractUserGoogleId(request)
                                )
                                .then(r => r.length > 0 ? r[0] : {})
                            )
                        )
                    ])
                })
                .then(result => {
                    const proteinToTemperatureMap = {};
                    result[1].forEach(tempObj => proteinToTemperatureMap[tempObj.uniprotId] = {
                        uniprotId: tempObj.uniprotId,
                        experiments: tempObj.experiments}
                    );
                    result[0].forEach(complex => {
                        complex.proteins.forEach((p,i,a) => {
                            if(proteinToTemperatureMap[p]) {
                                complex.proteins[i] = proteinToTemperatureMap[p];
                            } else {
                                complex.proteins[i] = {uniprotId: p};
                            }
                        })
                    });
                    return result[0];
                })
                .then(result => {
                    console.log('DURATION hasProtein', (Date.now()-start)/1000);
                    response.status(200).send(result);
                })
                .catch(error => {
                    console.error('hasProtein', error);
                    return response.status(500).send([]);
                });
        },

        getAverageComplexDistancePerExperiment: function(request, response) {
            const start = new Date();
            complexesDao.getAverageComplexDistancePerExperiment(request.params.id, extractUserGoogleId(request))
                .then(result => {
                    console.log('result', result);
                    console.log('DURATION getAverageComplexDistancePerExperiment', (Date.now()-start)/1000);
                    response.status(200).send(result);
                })
                .catch(error => {
                    console.error('getAverageComplexDistancePerExperiment', error);
                    return response.status(500).send([]);
                });
        }
    }
}
