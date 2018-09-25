const sequelize = require('sequelize');

module.exports = function(context) {
    // Imports
    const complexesModel = context.component('models').module('complexes');

    return {
        getComplex: function(id) {
            return complexesModel.findAll({
                where: {
                    id
                }
            })
            .then(complexArray => complexArray.length >= 1 ? complexArray[0] : {});
        },

        getComplexWhichHasProtein: function(uniprotId) {
            const query = `
                select c.id, c.name, c.comment, c.proteins
                from complexes c, proteins p, protein_complexes cp
                where c.id = cp."complexId" and p."uniprotId" = cp."uniprotId" and p."uniprotId" = :uniprotId;
            `;
            return context.dbConnection.query(
                    query,
                    {replacements: {uniprotId: uniprotId}},
                    {type: sequelize.QueryTypes.SELECT}
                )
                .then(result => result[0]);
        }
    };
};
