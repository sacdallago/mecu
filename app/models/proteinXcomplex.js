const sequelize = require('sequelize');

module.exports = function(context) {
    return context.dbConnection.define('protein_complex', {
        uniprotId: {
            type: sequelize.STRING,
            primaryKey: true
        },
        complexId: {
            type: sequelize.INTEGER,
            primaryKey: true
        }
    });

};
