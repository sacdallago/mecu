const sequelize = require(`sequelize`);

module.exports = function(context) {
    return context.dbConnection.define(`experiment_proteinRead`, {
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
