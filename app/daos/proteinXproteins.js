const sequelize = require(`sequelize`);

const getProteinInteractionSQL = require(`./proteinXproteins/getProteinInteraction`);
const getProteinXProteinDistancesSQL = require(`./proteinXproteins/getProteinXProteinDistances`);

module.exports = function(context) {
    // Imports

    return {
        getProteinInteraction: function(uniprotId) {

            // if interactions for a protein are saved as p1 -> specific protein
            // i switch the two interactor
            const query = getProteinInteractionSQL.query();

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
            proteinList.slice(0,100).forEach((p,i) => {
                proteinWhereClause += `"uniprotId" = :protein${i} `;
                replacements[`protein`+i] = p;
                if(i !== proteinList.length - 1) {
                    proteinWhereClause += ` or `;
                }
            });
            proteinWhereClause += ` ) `;

            let experimentWhereClause = ` ( `;
            experimentList.slice(0,20).forEach((e,i) => {
                experimentWhereClause += ` experiment = :exp${i}`;
                replacements[`exp`+i] = e;
                if(i !== experimentList.length - 1) {
                    experimentWhereClause += ` or `;
                }
            });
            experimentWhereClause += ` ) `;

            const query = getProteinXProteinDistancesSQL.query(proteinWhereClause, experimentWhereClause);

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
