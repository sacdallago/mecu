// External imports
const json2csvLib = require(`json2csv`).Parser;

const extractUserGoogleId = require(`../helper.js`).retrieveUserGoogleId;

const UPPER_QUERY_LIMIT = 100;
const queryParams = (query) => {
    let s;
    if(query.search && query.search.constructor === Array) {
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
            const format = request.query.f;
            if(request.query.e !== undefined){
                try{
                    experimentId = parseInt(request.query.e);
                } catch (error){
                    console.error(`given experimentId was not parsable to int`, error);
                    return response.status(400).send(`given experimentId was not parsable to int`);
                }
            }

            return temperatureReadsDao.getTemperatureReadsForTSVCSV(experimentId, extractUserGoogleId(request))
                .then(function(temperatureReads) {

                    temperatureReads = temperatureReads[0];

                    if(temperatureReads.length < 1){
                        return response.status(200).send();
                    }

                    // find all used temperatures (all of them have to have their own column)
                    let columns = new Set();
                    temperatureReads.forEach(read => {
                        Object.keys(read.obj).forEach(k => columns.add(parseInt(k)));
                    });
                    columns = Array.from(columns)
                        .sort((a,b) => a < b ? -1 : (a > b ? 1 : 0))
                        .map(c => ''+c);

                    // final columns to use for csv/tsv
                    let fields = ['uniprotId'].concat(columns);

                    temperatureReads = temperatureReads.map(t => {
                        let ret = {};
                        Array.from(columns).forEach(k => ret[k] = t.obj[k]);
                        ret.uniprotId = t.uniprotId;
                        return ret;
                    });

                    switch(format){
                    case `csv`:
                        let csvParser = new json2csvLib({
                            fields: fields,
                            delimiter: ','
                        });
                        temperatureReads = csvParser.parse(temperatureReads);
                        response.set(`Content-Type`, `text/plain`);
                        break;
                    case `tsv`:
                        let tsvParser = new json2csvLib({
                            fields: fields,
                            delimiter: '\t'
                        });
                        temperatureReads = tsvParser.parse(temperatureReads);
                        response.set(`Content-Type`, `text/plain`);
                        break;
                    default:
                        temperatureReads = JSON.stringify(temperatureReads);
                        response.set(`Content-Type`, `application/json`);
                        break;
                    }

                    return response.status(200).send(Buffer.from(temperatureReads));
                })
                .catch(function(error){
                    console.error(error);
                    return response.status(500).send(error);
                });
        }
    };
};
