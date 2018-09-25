/**
 * temperatureReads DAO
 *
 * Created by Christian Dallago on 20170103 .
 */

const sequelize = require('sequelize');

module.exports = function(context) {

    // Imports
    const temperatureReadsModel = context.component('models').module('temperatureReads');

    return {
        bulkCreate: function(items, options) {
            return temperatureReadsModel.bulkCreate(items, options);
        },

        findByUniprotIdAndExperiment: function(uniprotId, experimentId) {
            let where = {};
            if(uniprotId !== undefined){
                where.uniprotId = uniprotId;
            }
            if(experimentId !== undefined){
                where.experiment = experimentId;
            }
            return temperatureReadsModel.findAll({
                    attributes: ['experiment', 'uniprotId', 'temperature', 'ratio'],
                    where: where
                }
            );
        },

        findByUniprotIdsAndExperiments: function(uniprotIds, experimentIds) {
            let where = {};
            if(uniprotId !== undefined){
                where.uniprotId = uniprotIds;
            }
            if(experimentId !== undefined){
                where.experiment = experimentIds;
            }
            return temperatureReadsModel.findAll({
                    attributes: ['experiment', 'uniprotId', 'temperature', 'ratio'],
                    where: where
                }
            );
        },

        findAndAggregateTempsBySimilarUniprotId: function(query) {
            let replacements = {
                search: query.search+'%',
                offset: query.offset,
                limit: query.limit
            };
            let whereClause = '';
            if(query.search.constructor === Array) {
                query.search.forEach((v,i,a) => {
                    if(i != 0) {
                        whereClause += ' or '
                    };
                    let replStr = 'search'+i;
                    whereClause += 'pr."uniprotId" like :'+replStr;
                    replacements[replStr] = v;
                })
            } else {
                whereClause = 'pr."uniprotId" like :search';
            }
            const sqlQuery = `
                select tmp."uniprotId", json_agg(json_build_object('experiment', tmp.experiment, 'reads', tmp.reads)) as experiments
                from (
                    SELECT pr.experiment, pr."uniprotId", json_agg(json_build_object('t', pr.temperature, 'r', pr.ratio) order by temperature) as reads
                    FROM "temperatureReads" pr
                    where ${whereClause}
                    GROUP BY pr."experiment", pr."uniprotId"
                    order by "uniprotId" asc, experiment asc
                    offset :offset
                    limit :limit
                ) tmp
                group by tmp."uniprotId";
            `;
            const sqlQueryTotal = `
                select count(*) from (
                    select count(*)
                    FROM "temperatureReads" pr
                    where ${whereClause}
                    GROUP BY pr."experiment", pr."uniprotId"
                ) t;
            `;
            const start = new Date();
            return Promise.all([
                    context.dbConnection.query(
                        sqlQuery,
                        {
                            replacements: replacements
                        },
                        {type: sequelize.QueryTypes.SELECT}
                    ),
                    context.dbConnection.query(
                        sqlQueryTotal,
                        {
                            replacements: replacements
                        },
                        {type: sequelize.QueryTypes.SELECT}
                    )
                ])
                .then(r => {
                    console.log(`DURATION findAndAggregateTempsBySimilarUniprotId (PAGINATED)  ${(Date.now()-start)/1000} ms`);
                    return r;
                })
                .then(([results, total]) => {
                    return {total: total[0][0].count || 0, data: results[0] || []};
                });
        },

        findAndAggregateTempsByIdAndExperiment: function(uniprodIdExpIdPairs) {

            const replacements = {};
            let whereClause = 'WHERE (';
            uniprodIdExpIdPairs.forEach((v,i,a) => {
                if(i != 0) {
                    whereClause += ' or '
                };
                let replStrExp = 'Exp'+i;
                let replStrPrt = 'Prt'+i;
                whereClause += `(pr."uniprotId" = :${replStrPrt} AND pr."experiment" = :${replStrExp})`;
                replacements[replStrPrt] = v.uniprotId;
                replacements[replStrExp] = v.experiment;
            });
            if(uniprodIdExpIdPairs.length === 0) {
                whereClause = '';
            } else {
                whereClause += ') ';
            }

            const query = `
                select tmp."uniprotId", json_agg(json_build_object('experiment', tmp.experiment, 'reads', tmp.reads)) as experiments
                from (
                  SELECT pr.experiment, pr."uniprotId", json_agg(json_build_object('t', pr.temperature, 'r', pr.ratio) order by temperature) as reads
                  FROM "temperatureReads" pr
                  ${whereClause}
                  GROUP BY pr."experiment", pr."uniprotId"
                ) tmp
                group by tmp."uniprotId"
            `;
            // console.warn(`findAndAggregateTempsByIdAndExperiment SQL query: ${query}`);
            /*
            for the whole database
            Planning time: 0.147 ms
            Execution time: 1377.891 ms
             */

            return context.dbConnection.query(
                query,
                {replacements: replacements},
                {type: sequelize.QueryTypes.SELECT}
            )
            .then(r => r.length > 0 ? r[0] : {});

        },

        getSingleProteinXExperiment: function(proteinName, experimentId) {
             const query = `
                 SELECT pr.experiment, pr."uniprotId", json_agg(json_build_object('t', pr.temperature, 'r', pr.ratio)) as reads
                 FROM "temperatureReads" pr
                 where pr."uniprotId" = :proteinName and pr.experiment = :experimentId
                 GROUP BY pr."experiment", pr."uniprotId"
             `;
             console.warn(`getSingleProteinXExperiment still uses SQL query`);
             // console.log('query', query);
             return context.dbConnection.query(
                     query,
                     {
                         replacements: {
                             proteinName: proteinName,
                             experimentId: experimentId
                         }
                     },
                     {type: sequelize.QueryTypes.SELECT}
                 )
                 .then(result => result[0]);
        },

        getDistinctProteinsInExperiment: function(experimentId) {
            return temperatureReadsModel.findAll({
                        attributes: ['uniprotId'],
                        where: {
                            experiment: experimentId
                        },
                        group: 'uniprotId'
                    }
                )
                .then(data => data.map(d => d.uniprotId));
        }
    };
};
