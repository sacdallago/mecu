/**
 * experiment model
 *
 * Created by Christian Dallago on 20161226 .
 */

const sequelize = require('sequelize');


module.exports = function(context) {
    const userModel = context.component('models').module('users');

    return context.dbConnection.define('experiment', {
        lysate: {
            type: sequelize.BOOLEAN,
            allowNull: false
        },
        description: {
            type: sequelize.STRING,
            allowNull: false
        },
        rawData: {
            type: sequelize.JSONB,
            allowNull: false
        },
        uploader: {
            type: sequelize.STRING,
            allowNull: false,
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
            references: {
                // This is a reference to another model
                model: userModel,

                // This is the column name of the referenced model
                key: 'googleId',

                // This declares when to check the foreign key constraint. PostgreSQL only.
                deferrable: sequelize.Deferrable.INITIALLY_IMMEDIATE
            }
        },
    });
};
