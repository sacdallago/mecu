// External imports
const json2csv = require(`json2csv`).parse;

const extractUserGoogleId = require(`../helper.js`).retrieveUserGoogleId;

const UPPER_QUERY_LIMIT = 100;
const queryParams = (query) => {
    let s;
    if(query.search && query.search.constructor === Array && query.search.length > 0) {
        s = [];
        query.search.forEach(v => v && v.length > 0 ? s.push(v.toUpperCase()) : ``);
    } else {
        s = (query.search || ``).toUpperCase();
    }
    let ret = {
        search: s,
        limit: query.limit ? (query.limit > UPPER_QUERY_LIMIT ? 10 : query.limit) : UPPER_QUERY_LIMIT,
        offset: query.offset || 0,
        sortBy: query.sortBy || `id`,
        order: query.order ? (isNaN(parseInt(query.order)) ? 1 : parseInt(query.order)) : 1
    };
    return ret;
};

module.exports = function(context) {

    // Imports
    const temperatureReadsDao = context.component(`daos`).module(`temperatureReads`);

    return {
        searchByUniprotId: function(request, response) {
            const query = queryParams(request.body);
            console.log(`query`, query);
            const start = new Date();
            if(query.search === ``){
                return response.status(200).send([]);
            } else {
                temperatureReadsDao.findAndAggregateTempsBySimilarUniprotId(query, extractUserGoogleId(request))
                    .then(results => {
                        console.log(`DURATION searchByUniprotId`, (Date.now()-start)/1000);
                        return response.status(200).send(results);
                    })
                    .catch(error => {
                        console.error(`searchByUniprotId`, error, query);
                        return response.status(500).send([]);
                    });
            }
        },

        getTemperaturesRaw: function(request, response) {
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

            return temperatureReadsDao.findByUniprotIdAndExperiment(uniprotId, experimentId, extractUserGoogleId(request))
                .then(function(temperatureReads) {

                    if(temperatureReads.length < 1){
                        return response.status(200).send();
                    }

                    temperatureReads = temperatureReads.map(function(read) {
                        return {
                            experiment : read.experiment,
                            uniprotId : read.uniprotId,
                            temperature : read.temperature,
                            ratio : read.ratio
                        };
                    });

                    let fields = Object.keys(temperatureReads[0]);

                    switch(format){
                    case `csv`:
                        temperatureReads = json2csv({
                            data: temperatureReads,
                            quotes: ``,
                            fields: fields
                        });
                        break;
                    case `tsv`:
                        temperatureReads = json2csv({
                            data: temperatureReads,
                            quotes: ``,
                            del: `\t`,
                            fields: fields
                        });
                        break;
                    default:
                        temperatureReads = JSON.stringify(temperatureReads);
                        break;
                    }

                    response.set(`Content-Type`, `text/plain`);
                    return response.status(200).send(new Buffer(temperatureReads));
                })
                .catch(function(error){
                    console.error(error);
                    return response.status(500).send(error);
                });
        }
    };
};
