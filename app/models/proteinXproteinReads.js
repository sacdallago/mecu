const sequelize = require(`sequelize`);

module.exports = function(context) {
    return context.dbConnection.define(`protein_proteinRead`, {
        uniprotId: {
            type: sequelize.STRING,
            primaryKey: true,
            references: {
                model: `proteins`,
                key: `uniprotId`
            }
        },
        proteinReadId: {
            type: sequelize.INTEGER,
            primaryKey: true,
            references: {
                model: `proteinReads`,
                key: `id`
            }
        }
    });

};
