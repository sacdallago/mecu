const sequelize = require(`sequelize`);

module.exports = function(context) {
    return context.dbConnection.define(`protein`, {
        uniprotId: {
            type: sequelize.STRING,
            primaryKey: true
        }
    });
};
