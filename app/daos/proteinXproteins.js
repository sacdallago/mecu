const sequelize = require('sequelize');

module.exports = function(context) {
    // Imports
    const proteinXproteinModel = context.component('models').module('proteinXprotein');

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
            .then(([result, metadata]) => result);
        },

        getProteinXProteinDistances: function(proteinList, experimentList, requester) {

            if(proteinList.length < 2 || experimentList.length === 0) Promise.resolve([]);

            const replacements = {
                uploader: requester
            };

            let proteinWhereClause =  ' ( ';
            let proteinFillClause = ' ';
            proteinList.forEach((p,i) => {
                proteinWhereClause += `"uniprotId" = :protein${i} `;
                proteinFillClause += `select :protein${i} as interactor1, NULL AS geneId1, :protein${i} as interactor2, NULL AS geneId2, NULL AS correlation, NULL AS experiments, NULL AS pmids, NULL AS sources, NULL AS species, NULL AS createdAt, NULL AS updatedAt`
                replacements['protein'+i] = p;
                if(i !== proteinList.length - 1) {
                    proteinWhereClause += ' or ';
                    proteinFillClause += ' UNION ALL ';
                }
            });
            proteinWhereClause += ' ) ';

            let experimentWhereClause = ' ( ';
            experimentList.forEach((e,i) => {
                experimentWhereClause += ` experiment = :exp${i}`;
                replacements['exp'+i] = e;
                if(i !== experimentList.length - 1) {
                    experimentWhereClause += ' or ';
                }
            });
            experimentWhereClause += ' ) ';

            const query = `
            select
                   t1."uniprotId" as interactor1,
                   t2."uniprotId" as interactor2,
                   t1.experiment as interactor1_exp,
                   t2.experiment as interactor2_exp,
                   euclidian(t1.vector, t2.vector) as "distance",
                   pp.correlation as correlation
            from
                 (SELECT "uniprotId", "experiment", array_agg(ratio order by temperature asc) as "vector"
                  FROM "temperatureReads"
                  WHERE ${proteinWhereClause} and ${experimentWhereClause}
                  GROUP BY "uniprotId", "experiment") t1,
                 (SELECT "uniprotId", "experiment", array_agg(ratio order by temperature asc) as "vector"
                  FROM "temperatureReads"
                  WHERE ${proteinWhereClause} and ${experimentWhereClause}
                  GROUP BY "uniprotId", "experiment") t2,
                  (
                      select * from protein_proteins UNION ALL
                      ${proteinFillClause}
                  ) as pp,
                 experiments e
            where (
                      (t1."uniprotId" = pp.interactor1 and t2."uniprotId" = pp.interactor2)
                  ) and
                  e.id = t1.experiment and
                  (e.private = false or e.uploader = :uploader)
            order by interactor1, interactor2
            ;`;
            console.log('query', query);

            return context.dbConnection.query(
                    query,
                    {
                        replacements: replacements
                    },
                    {type: sequelize.QueryTypes.SELECT}
                )
            .then(([result, metadata]) => result);
        }
    };
};
