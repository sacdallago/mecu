const sequelize = require(`sequelize`);

module.exports = function(context) {
    return context.dbConnection.define(`protein_temperatureRead`, {
        uniprotId: {
            type: sequelize.STRING,
            primaryKey: true,
            references: {
                model: `proteins`,
                key: `uniprotId`
            }
        },
        temperatureReadId: {
            type: sequelize.INTEGER,
            primaryKey: true,
            references: {
                model: `temperatureReads`,
                key: `id`
            },
            onDelete: `CASCADE`,
            onUpdate: `CASCADE`
        }
    });

};
