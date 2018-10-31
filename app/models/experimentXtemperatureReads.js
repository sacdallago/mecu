const sequelize = require(`sequelize`);

module.exports = function(context) {
    return context.dbConnection.define(`experiment_temperatureRead`, {
        experimentId: {
            type: sequelize.STRING,
            primaryKey: true,
            references: {
                model: `experiments`,
                key: `id`
            }
        },
        temperatureReadId: {
            type: sequelize.INTEGER,
            primaryKey: true,
            references: {
                model: `temperatureReads`,
                key: `id`
            }
        }
    });

};
