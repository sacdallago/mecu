const sequelize = require(`sequelize`);

module.exports = function(context) {
    // Imports

    return {
        getProteinInteraction: function(uniprotId) {
            // if interactions for a protein are saved as p1 -> specific protein
            // i switch the two interactor
            const query = `select interactor1, interactor2, correlation, experiments, species from protein_proteins where interactor1 = :interactor1
                    union
                    select interactor2 as interactor1, interactor1 as interactor2, correlation, experiments, species from protein_proteins where interactor2 = :interactor2
                    order by correlation desc;`;
            return context.dbConnection.query(
                query,
                {
                    replacements: {
                        interactor1: uniprotId,
                        interactor2: uniprotId
                    }
                },
                {type: sequelize.QueryTypes.SELECT}
            )
                .then(([result]) => result);
        },

        getProteinXProteinDistances: function(proteinList, experimentList, requester) {

            if(proteinList.length < 2 || experimentList.length === 0) Promise.resolve([]);

            const replacements = {
                uploader: requester
            };

            let proteinWhereClause =  ` ( `;
            proteinList.forEach((p,i) => {
                proteinWhereClause += `"uniprotId" = :protein${i} `;
                replacements[`protein`+i] = p;
                if(i !== proteinList.length - 1) {
                    proteinWhereClause += ` or `;
                }
            });
            proteinWhereClause += ` ) `;

            let experimentWhereClause = ` ( `;
            experimentList.forEach((e,i) => {
                experimentWhereClause += ` experiment = :exp${i}`;
                replacements[`exp`+i] = e;
                if(i !== experimentList.length - 1) {
                    experimentWhereClause += ` or `;
                }
            });
            experimentWhereClause += ` ) `;

            const query = `
            select t.*, pp.correlation as correlation
            from (
                select
                   t1."uniprotId" as interactor1,
                   t2."uniprotId" as interactor2,
                   t1.experiment as interactor1_experiment,
                   t2.experiment as interactor2_experiment,
                   euclidian(t1.vector, t2.vector) as "distance"
                from
                     (
                          SELECT "uniprotId", "experiment", array_agg(ratio order by temperature asc) as "vector"
                          FROM "temperatureReads" tr, experiments e
                          WHERE
                              ${proteinWhereClause} and ${experimentWhereClause} and
                              e.id = tr.experiment and (e.private = false or e.uploader = :uploader)
                          GROUP BY "uniprotId", "experiment"
                     ) t1
                right join
                     (
                          SELECT "uniprotId", "experiment", array_agg(ratio order by temperature asc) as "vector"
                          FROM "temperatureReads" tr, experiments e
                          WHERE
                              ${proteinWhereClause} and ${experimentWhereClause} and
                              e.id = tr.experiment and (e.private = false or e.uploader = :uploader)
                          GROUP BY "uniprotId", "experiment"
                     ) t2
                on
                    t1."uniprotId" = t2."uniprotId" or
                    t1."uniprotId" != t2."uniprotId"
                order by interactor1, interactor2
                ) t
            left join
                protein_proteins as pp
            on (t.interactor1 = pp.interactor1 and t.interactor2 = pp.interactor2) or
                (t.interactor1 = pp.interactor2 and t.interactor2 = pp.interactor1)
            ;`;

            return context.dbConnection.query(
                query,
                {
                    replacements: replacements
                },
                {type: sequelize.QueryTypes.SELECT}
            )
                .then(([result]) => result);
        }
    };
};
