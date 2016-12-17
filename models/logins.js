/**
 * logins model
 *
 * Created by Christian Dallago on 20160626 .
 */

const usersModel = context.component('models').module('users');

module.exports = function(context) {

    return context.sequelize.define('login', {
        id: {
            type: context.Sequelize.UUID,
            default: context.Sequelize.UUIDV1,
            primaryKey: true
        },
        ref: {
            type: context.Sequelize.STRING,
            references: {
                // This is a reference to another model
                model: usersModel,

                // This is the column name of the referenced model
                key: 'googleId',

                // This declares when to check the foreign key constraint. PostgreSQL only.
                deferrable: context.Sequelize.Deferrable.INITIALLY_IMMEDIATE
            },
            expires: {
                type: Sequelize.DATE,
                defaultValue: function(){
                    return Date.now() + (7 * 24 * 60 * 60 * 1000);
                }
            }
        }
    });
}