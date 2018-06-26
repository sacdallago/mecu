/**
 * proteins DAO
 *
 * Created by Christian Dallago on 20160611 .
 */

module.exports = function(context) {

    // Imports
    var proteinsModel = context.component('models').module('proteins');

    return {
        create: function(item) {
            return proteinsModel.create(item);
        },

        bulkCreate: function(items) {
            return proteinsModel.bulkCreate(items, {ignoreDuplicates: true});
        },

        update: function(item) {
            item.updatedAt = Date.now();

            return proteinsModel.update({ "uniprotId": item.uniprotId }, item, {
                    upsert: true,
                    setDefaultsOnInsert : true
                })
                .catch(err => {
                    conole.error(error);
                    return Promise.reject(error);
                });
        },

        findByUniprotId: function(identifier) {
            return proteinsModel.findOne({uniprotId:  identifier})
                .catch(error => {
                    console.error(error);
                    return Promise.reject(error);
                });
        },

        findByUniprotIds: function(uniProtIds) {
            return proteinsModel.find({uniprotId:  uniProtIds})
                .catch(error => {
                    console.error(error);
                    return Promise.reject(error);
                });
        }
    };
};
