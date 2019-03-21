const extractUserGoogleId = require(`../helper.js`).retrieveUserGoogleId;


const UPPER_QUERY_LIMIT = 50;
const queryParams = (query) => {
    let ret = {
        limit: query.limit ? (query.limit > UPPER_QUERY_LIMIT ? 10 : query.limit) : UPPER_QUERY_LIMIT,
        offset: query.offset || 0,
        sortBy: query.sortBy || `id`,
        order:  query.order && (query.order === `ASC` || query.order === `DESC`) ?
            query.order : `ASC`,
        search: query.search
    };
    return ret;
};

module.exports = function(context) {

    const complexesDao = context.component(`daos`).module(`complexes`);
    const temperatureReadsDao = context.component(`daos`).module(`temperatureReads`);

    return {

        getById: function(request, response) {
            complexesDao.getComplex(request.params.id)
                .then(result => response.status(200).send(result))
                .catch(error => {
                    console.error(`getById`, error);
                    return response.status(500).send({});
                });
        },

        find: function(request, response) {
            const start = new Date();
            console.log(`find complex .body`, request.body);

            complexesDao.findComplex(queryParams(request.body), extractUserGoogleId(request))
                .then(result => {
                    console.log(`DURATION find`, (Date.now()-start)/1000);
                    response.status(200).send(result);
                })
                .catch(error => {
                    console.error(`find`, error);
                    return response.status(500).send({});
                });
        },

        hasProtein: function(request, response) {

            const start = new Date();

            complexesDao.getComplexWhichHasProtein(request.params.uniprotId)
                .then(result => {
                    let setOfProteins = new Set();
                    result.forEach(r => {
                        r.proteins.forEach(p => {
                            setOfProteins.add(p);
                        });
                    });
                    setOfProteins = Array.from(setOfProteins);

                    return Promise.all([
                        Promise.resolve(result),
                        temperatureReadsDao.findAndAggregateTempsByIdAndExperiment(
                            setOfProteins.map(p => ({
                                uniprotId: p,
                                experiment: request.params.expId
                            })),
                            extractUserGoogleId(request),
                            `hasProtein`
                        )
                    ]);
                })
                .then(result => {

                    const proteinToTemperatureMap = {};
                    result[1].forEach(tempObj =>
                        proteinToTemperatureMap[tempObj.uniprotId] = {
                            uniprotId: tempObj.uniprotId,
                            experiments: tempObj.experiments
                        }
                    );

                    result[0].forEach(complex => {
                        complex.proteins.forEach((p,i) => {
                            if(proteinToTemperatureMap[p]) {
                                complex.proteins[i] = proteinToTemperatureMap[p];
                            } else {
                                complex.proteins[i] = {uniprotId: p};
                            }
                        });
                    });
                    return result[0];
                })
                .then(result => {
                    console.log(`DURATION hasProtein`, (Date.now()-start)/1000);
                    response.status(200).send(result);
                })
                .catch(error => {
                    console.error(`hasProtein`, error);
                    return response.status(500).send([]);
                });
        },

        getAverageComplexDistancePerExperiment: function(request, response) {
            const start = new Date();
            complexesDao.getAverageComplexDistancePerExperiment(request.params.id, extractUserGoogleId(request))
                .then(result => {
                    console.log(`DURATION getAverageComplexDistancePerExperiment`, (Date.now()-start)/1000);
                    response.status(200).send(result);
                })
                .catch(error => {
                    console.error(`getAverageComplexDistancePerExperiment`, error);
                    return response.status(500).send([]);
                });
        }
    };
};
