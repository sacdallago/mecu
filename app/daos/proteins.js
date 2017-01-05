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
            var deferred = context.promises.defer();
            
            item.updatedAt = Date.now();

            proteinsModel.update({ "uniprotId": item.uniprotId }, item, {
                upsert: true,
                setDefaultsOnInsert : true
            }, function(error, insertedItem) {
                if (error) {
                    console.error(error);
                    deferred.reject(error);
                }
                deferred.resolve(insertedItem);
            });

            return deferred.promise;
        },
        
        findByUniprotId: function(identifier) {
            var deferred = context.promises.defer();

            proteinsModel.findOne({uniprotId:  identifier})
                .exec(function(error, result) {
                if (error) {
                    console.error(error);
                    deferred.reject(error);
                } else {
                    deferred.resolve(result);
                }
            });

            return deferred.promise;
        },
    };
};