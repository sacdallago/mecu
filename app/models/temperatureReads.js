/**
 * Created by chdallago on 1/2/17.
 */

/**
 * meltingRead model
 *
 * Created by Christian Dallago on 20161226 .
 */

const sequelize = require('sequelize');

module.exports = function(context) {

    const experimentsModel = context.component('models').module('experiments');
    const proteinsModel = context.component('models').module('proteins');

    return context.dbConnection.define('temperatureRead', {
        // don't delete database entries but set the newly added attribute deletedAt
        // to the current date (when deletion was done). paranoid will only work if
        // timestamps are enabled
        experiment: {
            type: sequelize.INTEGER,
            unique: '_id',
            allowNull: false,
        },
        uniprotId: {
            type: sequelize.STRING,
            unique: '_id',
            allowNull: false,
        },
        temperature: {
            type: sequelize.INTEGER,
            unique: '_id',
            allowNull: false
        },
        ratio: {
            type: sequelize.FLOAT,
            allowNull: false
        }
    });
};
