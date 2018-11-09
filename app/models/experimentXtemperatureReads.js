const sequelize = require(`sequelize`);

module.exports = function(context) {
    return context.dbConnection.define(`experiment_temperatureRead`, {
        experimentId: {
            type: sequelize.INTEGER,
            primaryKey: true,
            references: {
                model: `experiments`,
                key: `id`
            },
            onDelete: `CASCADE`,
            onUpdate: `CASCADE`
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
