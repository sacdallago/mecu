const sequelize = require(`sequelize`);

module.exports = function(context) {

    return context.dbConnection.define(`proteinRead`, {
        experiment: {
            type: sequelize.INTEGER,
        },
        uniprotId: {
            type: sequelize.STRING,
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
