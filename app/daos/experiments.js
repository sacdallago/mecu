/**
 * experiments DAO
 *
 * Created by Christian Dallago on 20170103 .
 */

module.exports = function(context) {

    // Imports
    var experimentsModel = context.component('models').module('experiments');

    return {
        create: function(item, options) {            
            return experimentsModel.create(item, options);
        },

        getExperiments: function(){
            return experimentsModel.findAll({
                attributes: ['id']
            });
        }
    };
};