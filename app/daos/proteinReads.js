/**
 * proteinReads DAO
 *
 * Created by Christian Dallago on 20170103 .
 */

module.exports = function(context) {

    // Imports
    var proteinReadsModel = context.component('models').module('proteinReads');

    return {
        bulkCreate: function(items) {
            return proteinReadsModel.bulkCreate(items);
        }
    };
};