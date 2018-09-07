/**
 * meltingRead model
 *
 * Created by Christian Dallago on 20161226 .
 */

const sequelize = require('sequelize');


module.exports = function(context) {

    const experimentsModel = context.component('models').module('experiments');
    const proteinsModel = context.component('models').module('proteins');

    return context.dbConnection.define('proteinRead', {
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
