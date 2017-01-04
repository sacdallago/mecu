/**
 * logins model
 *
 * Created by Christian Dallago on 20160626 .
 */

module.exports = function(context) {
    
    const usersModel = context.component('models').module('users');

    return context.sequelize.define('login', {
        ref: {
            type: context.Sequelize.STRING,
            references: {
                // This is a reference to another model
                model: usersModel,

                // This is the column name of the referenced model
                key: 'googleId',

                // This declares when to check the foreign key constraint. PostgreSQL only.
                deferrable: context.Sequelize.Deferrable.INITIALLY_IMMEDIATE
            }
        },
        expires: {
            type: context.Sequelize.DATE,
            defaultValue: function(){
                return Date.now() + (7 * 24 * 60 * 60 * 1000);
            }
        }
    });
}