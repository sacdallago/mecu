const sequelize = require('sequelize');

module.exports = function(context) {
    // Imports
    const complexesModel = context.component('models').module('complexes');

    return {
        getComplex: function(id) {
            console.log('id', id);
            return complexesModel.findAll({
                where: {
                    id
                }
            })
            .then(complexArray => complexArray.length >= 1 ? complexArray[0] : {});
        },

        getComplexWhichHasProtein: function(uniprotId) {
            console.warn(`getComplexWhichHasProtein still uses sql query`);
            const query = `select c.id, c.name, c.proteins, c.comment from complexes c where '${uniprotId}' = any (c.proteins);`
            return context.dbConnection.query(query, {type: sequelize.QueryTypes.SELECT});
        }
    };
};
