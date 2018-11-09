const sequelize = require(`sequelize`);

module.exports = function(context) {
    return context.dbConnection.define(`protein_experiment`, {
        uniprotId: {
            type: sequelize.STRING,
            primaryKey: true,
            references: {
                model: `proteins`,
                key: `uniprotId`
            }
        },
        experimentId: {
            type: sequelize.INTEGER,
            primaryKey: true,
            references: {
                model: `experiments`,
                key: `id`
            },
            onDelete: `CASCADE`,
            onUpdate: `CASCADE`
        }
    });

};
