const sequelize = require(`sequelize`);

module.exports = function(context) {

    return context.dbConnection.define(`temperatureRead`, {
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
