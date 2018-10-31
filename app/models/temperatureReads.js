const sequelize = require(`sequelize`);

module.exports = function(context) {

    return context.dbConnection.define(`temperatureRead`, {
        // don't delete database entries but set the newly added attribute deletedAt
        // to the current date (when deletion was done). paranoid will only work if
        // timestamps are enabled
        experiment: {
            type: sequelize.INTEGER,
            unique: `_id`,
            allowNull: false,
        },
        uniprotId: {
            type: sequelize.STRING,
            unique: `_id`,
            allowNull: false,
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
