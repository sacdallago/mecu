/**
 * user model
 *
 * Created by Christian Dallago on 20160626 .
 */

const sequelize = require('sequelize');

module.exports = function(context) {
    return context.dbConnection.define('user', {
        googleId: {
            type: sequelize.STRING,
            allowNull: false,
            primaryKey: true
        },
        displayName:  {
            type: sequelize.STRING
        },
        allowPost: {
            type: sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        deletedAt: {
            type: sequelize.DATE(3)
        }
    });
};
