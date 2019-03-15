const sequelize = require(`sequelize`);

const findByUniprotIdAndExperimentSQL = require(`./temperatureReads/findByUniprotIdAndExperiment`);
const findAndAggregateTempsBySimilarUniprotIdSQL = require(`./temperatureReads/findAndAggregateTempsBySimilarUniprotId`);
const findAndAggregateTempsByIdAndExperimentSQL = require(`./temperatureReads/findAndAggregateTempsByIdAndExperiment`);
const getSingleProteinXExperimentSQL = require(`./temperatureReads/getSingleProteinXExperiment`);

module.exports = function(context) {

    // Imports
    const temperatureReadsModel = context.component(`models`).module(`temperatureReads`);

    return {
        bulkCreate: function(items, options) {
            return temperatureReadsModel.bulkCreate(items, options);
        },

        // used for the raw download of the experiment data (TSV data melting curves and CSV data melting curves)
        findByUniprotIdAndExperiment: function(uniprotId, experimentId, requester) {

            const replacements = {
                uploader: requester,
                private: false
            };

            let whereClause = findByUniprotIdAndExperimentSQL.constructWhereClause();

            if(uniprotId !== undefined){
                whereClause += ` and p."uniprotId" = :uniprotId `;
                replacements.uniprotId = uniprotId;
            }

            if(experimentId !== undefined){
                whereClause += ` and e.id = :experimentId`;
                replacements.experimentId = experimentId;
            }

            const query = findByUniprotIdAndExperimentSQL.query(whereClause);

            return context.dbConnection.query(
                query,
                {replacements: replacements},
                {type: sequelize.QueryTypes.SELECT}
            )
                .then(r => r.length > 0 ? r[0] : []);
        },

        // main way to retrieve temperature reads
        findAndAggregateTempsBySimilarUniprotId: function(query, requester) {

            let replacements = {
                offset: query.offset,
                limit: query.limit,
                isPrivate: false,
                uploader: requester
            };

            let whereClause = ``;

            if(query.search.constructor === Array) {
                whereClause += ` AND (`;
                query.search.forEach((v,i) => {
                    if(i != 0) {
                        whereClause += ` OR `;
                    }
                    let replStr = `search`+i;
                    whereClause += `p."uniprotId" like :`+replStr;
                    replacements[replStr] = v;
                });
                whereClause += `)`;
            } else {
                replacements.search = query.search + `%`;
                whereClause = ` AND (p."uniprotId" like :search)`;
            }

            const sqlQuery = findAndAggregateTempsBySimilarUniprotIdSQL.query(whereClause);
            const sqlQueryTotal = findAndAggregateTempsBySimilarUniprotIdSQL.total(whereClause);

            const start = new Date();
            return Promise.all([
                context.dbConnection.query(
                    sqlQuery,
                    {replacements: replacements},
                    {type: sequelize.QueryTypes.SELECT}
                ),
                context.dbConnection.query(
                    sqlQueryTotal,
                    {replacements: replacements},
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

        findAndAggregateTempsByIdAndExperiment: function(uniprodIdExpIdPairs, requester, loginfo = `direct`) {

            if(uniprodIdExpIdPairs.length === 0) {
                return Promise.resolve([]);
            }
            const replacements = {
                uploader: requester,
                isPrivate: false
            };
            let whereClause = `(`;
            uniprodIdExpIdPairs.forEach((v,i) => {
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

            const query = findAndAggregateTempsByIdAndExperimentSQL.query(whereClause);

            const start = new Date();
            return context.dbConnection.query(
                query,
                {replacements: replacements},
                {type: sequelize.QueryTypes.SELECT}
            )
                .then(r => {
                    console.log(`DURATION findAndAggregateTempsByIdAndExperiment ${loginfo || ``}  ${(Date.now()-start)/1000} ms`);
                    return r;
                })
                .then(r => r.length > 0 ? r[0] : [])
                .catch(error => {
                    console.error(`findAndAggregateTempsByIdAndExperiment`, uniprodIdExpIdPairs, requester, error);
                    return [];
                });

        },

        getSingleProteinXExperiment: function(proteinName, experimentId, requester) {

            const start = new Date();

            const query = getSingleProteinXExperimentSQL.query();

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
