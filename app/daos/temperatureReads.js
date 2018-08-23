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

        findByUniprotId: function(identifier, transaction) {
            if (transaction){
                return temperatureReadsModel.findAll({
                        attributes: ['experiment', 'uniprotId', 'temperature', 'ratio'],
                        where: {
                            uniprotId: {
                                [sequelize.Op.like]: identifier + "%"
                            }
                        },
                        transaction: transaction
                    }
                );
            } else {
                return temperatureReadsModel.findAll({
                        attributes: ['experiment', 'uniprotId', 'temperature', 'ratio'],
                        where: {
                            uniprotId: {
                                [sequelize.Op.like]: identifier + "%"
                            }
                        }
                    }
                );
            }
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

        findAndAggregateTempsByIdAndExperiment: function(uniprodIdExpIdPairs) {
            // create where clause

            // TODO bad way to create where, refactor!
            let where = ' where (';
            uniprodIdExpIdPairs.forEach((e, i, a) => {
                let tmp = `(pr."uniprotId" = '`+e.uniprotId+`' AND `;
                tmp += `pr.experiment = '`+e.experiment+`')`;

                if(i === uniprodIdExpIdPairs.length-1) {
                    console.log(i);
                } else {
                    tmp+=' OR ';
                }
                where += tmp;
            });
            where += ')';
            if(uniprodIdExpIdPairs.length === 0) {
                where = '';
            }

            const query = `
                select tmp."uniprotId", json_agg(json_build_object('experiment', tmp.experiment, 'reads', tmp.reads)) as experiments
                from (
                  SELECT pr.experiment, pr."uniprotId", json_agg(json_build_object('t', pr.temperature, 'r', pr.ratio)) as reads
                  FROM "temperatureReads" pr
                  `+where+`
                  GROUP BY pr."experiment", pr."uniprotId"
                ) tmp
                group by tmp."uniprotId"
            `;
            // console.log('query', query);
            console.warn(`findAndAggregateTempsByIdAndExperiment still uses SQL query`);
            /*
            for the whole database
            Planning time: 0.147 ms
            Execution time: 1377.891 ms
             */

            return context.dbConnection.query(query, {type: sequelize.QueryTypes.SELECT});

            // TODO better solution for the above query, but subquerys are not supported
            // find better way to impl
            //
            // let where = {
            //     [sequelize.Op.or]: uniprodIdExpIdPairs
            // };
            //
            //
            // return temperatureReadsModel.findAll({
            //     raw: true,
            //     attributes: [
            //         'experiment',
            //         'uniprotId',
            //         [
            //             sequelize.fn(
            //                 'json_agg',
            //                 sequelize.fn(
            //                     'json_build_object',
            //                     't',
            //                     'temperature',
            //                     'reads',
            //                     'reads'
            //                 )
            //             ),
            //             'reads'
            //         ]
            //     ],
            //     where: where,
            //     group: ['experiment', 'uniprotId']
            // });

            /*
            select tmp."uniprotId", json_agg(json_build_object('experiment', tmp.experiment, 'reads', tmp.reads)) as reads
            from (
              SELECT pr.experiment, pr."uniprotId", json_agg(json_build_object('t', pr.temperature, 'r', pr.ratio)) as reads
              FROM "temperatureReads" pr
              where (pr."uniprotId" = 'A0AVT1' and pr.experiment = '1') or (pr.experiment = '2' and pr."uniprotId" = 'A0AVF1')
              GROUP BY pr."experiment", pr."uniprotId"
            ) tmp
            group by tmp."uniprotId"
            ;
             */
        },

        getSingleProteinXExperiment: function(proteinName, experimentId) {
            /*
            SELECT pr.experiment, pr."uniprotId", json_agg(json_build_object('t', pr.temperature, 'r', pr.ratio)) as reads
            FROM "temperatureReads" pr
            where pr."uniprotId" = 'P12004' and pr.experiment = '1'
            GROUP BY pr."experiment", pr."uniprotId";
             */
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
        }
    };
};
