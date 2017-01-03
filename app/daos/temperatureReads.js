/**
 * temperatureReads DAO
 *
 * Created by Christian Dallago on 20170103 .
 */

module.exports = function(context) {

    // Imports
    var temperatureReadsModel = context.component('models').module('temperatureReads');

    return {
        bulkCreate: function(items) {
            return temperatureReadsModel.bulkCreate(items);
        }
    };
};