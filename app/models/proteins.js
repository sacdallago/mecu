/**
 * protein model
 *
 * Created by Christian Dallago on 20161226 .
 */

const sequelize = require('sequelize');


module.exports = function(context) {
    return context.sequelize.define('protein', {
        uniprotId: {
            type: sequelize.STRING,
            // allowNull: false,
            // unique: true,
            primaryKey: true
        },
        primaryGene: {
            type: sequelize.STRING,
            allowNull: false,
            unique: 'primaryGene'
        }
    });
};
