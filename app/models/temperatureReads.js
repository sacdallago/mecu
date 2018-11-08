const sequelize = require(`sequelize`);

module.exports = function(context) {

    return context.dbConnection.define(`temperatureRead`, {
        // don't delete database entries but set the newly added attribute deletedAt
        // to the current date (when deletion was done). paranoid will only work if
        // timestamps are enabled
        experiment: {
            type: sequelize.INTEGER,
            unique: `_id`,
            references: {
                model: `experiments`,
                key: `id`
            },
            onDelete: `CASCADE`,
            onUpdate: `CASCADE`
        },
        uniprotId: {
            type: sequelize.STRING,
            unique: `_id`,
            references: {
                model: `proteins`,
                key: `uniprotId`
            }
        },
        temperature: {
            type: sequelize.INTEGER,
            unique: `_id`,
            allowNull: false
        },
        ratio: {
            type: sequelize.FLOAT,
            allowNull: false
        }
    });
};
