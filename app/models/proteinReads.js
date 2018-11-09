const sequelize = require(`sequelize`);

module.exports = function(context) {

    return context.dbConnection.define(`proteinRead`, {
        experiment: {
            type: sequelize.INTEGER,
            references: {
                model: `experiments`,
                key: `id`
            },
            onDelete: `CASCADE`,
            onUpdate: `CASCADE`
        },
        uniprotId: {
            type: sequelize.STRING,
            references: {
                model: `proteins`,
                key: `uniprotId`
            }
        },
        peptides: {
            type: sequelize.INTEGER,
            allowNull: false
        },
        psms: {
            type: sequelize.STRING,
            allowNull: false
        },
        totalExpt: {
            type: sequelize.INTEGER,
            allowNull: true
        }
    });
};
