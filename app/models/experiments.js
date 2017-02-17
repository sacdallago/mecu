/**
 * experiment model
 *
 * Created by Christian Dallago on 20161226 .
 */

module.exports = function(context) {
    const userModel = context.component('models').module('users');

    return context.sequelize.define('experiment', {
        inVivo: {
            type: context.Sequelize.BOOLEAN,
            allowNull: false
        },
        cellLine: {
            type: context.Sequelize.STRING,
            allowNull: false
        },
        rawData: {
            type: context.Sequelize.JSONB,
            allowNull: false
        },
        uploader: {
            type: context.Sequelize.STRING,
            allowNull: false,
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
            references: {
                // This is a reference to another model
                model: userModel,

                // This is the column name of the referenced model
                key: 'googleId',

                // This declares when to check the foreign key constraint. PostgreSQL only.
                deferrable: context.Sequelize.Deferrable.INITIALLY_IMMEDIATE
            }
        },
    });
};