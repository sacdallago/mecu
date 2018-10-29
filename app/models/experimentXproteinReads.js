const sequelize = require(`sequelize`);

module.exports = function(context) {
    return context.dbConnection.define(`experiment_proteinRead`, {
        experimentId: {
            type: sequelize.STRING,
            primaryKey: true,
            references: {
                model: `experiments`,
                key: `id`
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
