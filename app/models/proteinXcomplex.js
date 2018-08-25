const sequelize = require('sequelize');

module.exports = function(context) {
    return context.dbConnection.define('protein_complex', {
        uniprotId: {
            type: sequelize.STRING,
            primaryKey: true,
            references: {
                model: 'proteins',
                key: 'uniprotId'
            }
        },
        complexId: {
            type: sequelize.INTEGER,
            primaryKey: true,
            references: {
                model: 'complexes',
                key: 'id'
            }
        }
    });

};
