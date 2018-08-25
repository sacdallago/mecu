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
            .then(result => result[0])
            .then(proteinInteractions => {
                console.log('proteinInteractions', proteinInteractions);
                return proteinInteractions;
            });
        }
    };
};
