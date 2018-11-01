/**
 * temperatureReads DAO
 *
 * Created by Christian Dallago on 20170103 .
 */

const sequelize = require(`sequelize`);

module.exports = function(context) {

    // Imports
    const temperatureReadsModel = context.component(`models`).module(`temperatureReads`);

    return {
        bulkCreate: function(items, options) {
            return temperatureReadsModel.bulkCreate(items, options);
        },

        findByUniprotIdAndExperiment: function(uniprotId, experimentId, requester) {
            const replacements = {
                uploader: requester,
                private: false
            };
            let whereClause = `
                where
                (e.private = false or e.uploader = :uploader) and
                tr."uniprotId" = p."uniprotId" and
                tr.experiment = e.id
            `;
            if(uniprotId !== undefined){
                whereClause += `p."uniprotId" = :uniprotId and`;
                replacements.uniprotId = uniprotId;
            }
            if(experimentId !== undefined){
                whereClause += `e.id = :experimentId`;
                replacements.experiment = experimentId;
            }
            const query = `
                SELECT e.id, p."uniprotId", temperature, ratio
                FROM "temperatureReads" tr, proteins p, experiments e
                ${whereClause};
            `;
            return context.dbConnection.query(
                query,
                {replacements: replacements},
                {type: sequelize.QueryTypes.SELECT}
            )
                .then(r => r.length > 0 ? r[0] : []);
        },

        findAndAggregateTempsBySimilarUniprotId: function(query, requester) {
            let replacements = {
                search: query.search+`%`,
                offset: query.offset,
                limit: query.limit,
                isPrivate: false,
                uploader: requester
            };
            let whereClause = ``;
            if(query.search.constructor === Array) {
                whereClause += `AND (`;
                query.search.forEach((v,i,a) => {
                    if(i != 0) {
                        whereClause += ` or `;
                    }
                    let replStr = `search`+i;
                    whereClause += `p."uniprotId" like :`+replStr;
                    replacements[replStr] = v;
                });
                whereClause += `)`;
            } else {
                whereClause = `p."uniprotId" like :search`;
            }
            const sqlQuery = `
                SELECT tmp."uniprotId", json_agg(json_build_object('experiment', tmp.experiment, 'reads', tmp.reads)) AS experiments
                FROM (
                    SELECT tr.experiment, tr."uniprotId", json_agg(json_build_object('t', tr.temperature, 'r', tr.ratio) ORDER BY temperature) AS reads
                    FROM experiments e, "experiment_temperatureReads" e_tr, "temperatureReads" tr, proteins p, "protein_temperatureReads" p_tr
                    WHERE
                        e.id = e_tr."experimentId" AND
                        (e.private = :isPrivate or e.uploader = :uploader) AND
                        e_tr."temperatureReadId" = tr.id AND
                        p_tr."uniprotId" = p."uniprotId" AND
                        p_tr."temperatureReadId" = tr.id
                        ${whereClause}
                    GROUP BY tr."experiment", tr."uniprotId"
                    ORDER BY "uniprotId" asc, experiment asc
                    OFFSET :offset
                    LIMIT :limit
                ) tmp
                group by tmp."uniprotId";
            `;
            const sqlQueryTotal = `
                SELECT count(*) FROM (
                    SELECT count(*)
                    FROM experiments e, "experiment_temperatureReads" e_tr, "temperatureReads" tr, proteins p, "protein_temperatureReads" p_tr
                    WHERE
                        e.id = e_tr."experimentId" AND
                        (e.private = :isPrivate or e.uploader = :uploader) AND
                        e_tr."temperatureReadId" = tr.id AND
                        p_tr."uniprotId" = p."uniprotId" AND
                        p_tr."temperatureReadId" = tr.id
                        ${whereClause}
                    GROUP BY tr."experiment", tr."uniprotId"
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

        findAndAggregateTempsByIdAndExperiment: function(uniprodIdExpIdPairs, requester) {
            if(uniprodIdExpIdPairs.length === 0) {
                return Promise.resolve([]);
            }
            const replacements = {
                uploader: requester,
                isPrivate: false
            };
            let whereClause = `(`;
            uniprodIdExpIdPairs.forEach((v,i,a) => {
                if(i != 0) {
                    whereClause += ` or `;
                }
                let replStrExp = `Exp`+i;
                let replStrPrt = `Prt`+i;
                whereClause += `(p."uniprotId" = :${replStrPrt} AND e."id" = :${replStrExp})`;
                replacements[replStrPrt] = v.uniprotId;
                replacements[replStrExp] = v.experiment;
            });
            whereClause += `) `;

            const query = `
                SELECT tmp."uniprotId", json_agg(json_build_object('experiment', tmp.experiment, 'reads', tmp.reads)) AS experiments
                FROM (
                    SELECT tr.experiment, tr."uniprotId", json_agg(json_build_object('t', tr.temperature, 'r', tr.ratio) ORDER BY temperature) AS reads
                    FROM experiments e, "experiment_temperatureReads" e_tr, "temperatureReads" tr, proteins p, "protein_temperatureReads" p_tr
                    WHERE
                        e.id = e_tr."experimentId" AND
                        (e.private = :isPrivate or e.uploader = ':uploader') AND
                        e_tr."temperatureReadId" = tr.id AND
                        p_tr."uniprotId" = p."uniprotId" AND
                        p_tr."temperatureReadId" = tr.id AND
                        ${whereClause}
                    GROUP BY tr."experiment", tr."uniprotId"
                ) tmp
                GROUP BY tmp."uniprotId";
            `;
            /*
            for the whole database
            Planning time: 0.147 ms
            Execution time: 1377.891 ms
             */

            const start = new Date();
            return context.dbConnection.query(
                query,
                {replacements: replacements},
                {type: sequelize.QueryTypes.SELECT}
            )
                .then(r => {
                    console.log(`DURATION findAndAggregateTempsByIdAndExperiment  ${(Date.now()-start)/1000} ms`);
                    return r;
                })
                .then(r => r.length > 0 ? r[0] : [])
                .catch(error => {
                    console.error(`findAndAggregateTempsByIdAndExperiment`, uniprodIdExpIdPairs, requester);
                    return [];
                });

        },

        getSingleProteinXExperiment: function(proteinName, experimentId, requester) {
            const query = `
                SELECT tr.experiment, tr."uniprotId", json_agg(json_build_object('t', tr.temperature, 'r', tr.ratio)) as reads
                FROM experiments e, "experiment_temperatureReads" e_tr, "temperatureReads" tr, proteins p, "protein_temperatureReads" p_tr
                where
                    e.id = :experimentId and
                    (e.private = :isPrivate or e.uploader = :uploader) AND
                    e.id = e_tr."experimentId" and
                    e_tr."temperatureReadId" = tr.id and
                    p."uniprotId" = :proteinName and
                    p_tr."uniprotId" = p."uniprotId" and
                    p_tr."temperatureReadId" = tr.id
                GROUP BY tr."experiment", tr."uniprotId";
            `;
            const start = new Date();
            return context.dbConnection.query(
                query,
                {
                    replacements: {
                        proteinName: proteinName,
                        experimentId: experimentId,
                        isPrivate: false,
                        uploader: requester
                    }
                },
                {type: sequelize.QueryTypes.SELECT}
            )
                .then(r => {
                    console.log(`DURATION getSingleProteinXExperiment  ${(Date.now()-start)/1000} ms`);
                    return r;
                })
                .then(result => result[0]);
        },

        getDistinctProteinsInExperiment: function(experimentId) {
            return temperatureReadsModel.findAll({
                attributes: [`uniprotId`],
                where: {
                    experiment: experimentId
                },
                group: `uniprotId`
            }
            )
                .then(data => data.map(d => d.uniprotId));
        }
    };
};
