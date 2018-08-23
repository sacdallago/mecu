/**
 * users DAO
 *
 * Created by Christian Dallago on 20160626 .
 */

module.exports = function(context) {

    // Imports
    const usersModel = context.component('models').module('users');

    return {
        findOrCreate: function(document) {
            return usersModel.findOrCreate({
                where: {
                    googleId: document.googleId
                },
                defaults: {
                    displayName: document.displayName
                }
            });
        },

        findById: function(id) {
            return usersModel.findOne({
                where: {
                    googleId: id
                }
            });
        }
    };
};
