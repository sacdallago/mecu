/**
 * temperatureReads DAO
 *
 * Created by Christian Dallago on 20170103 .
 */

module.exports = function(context) {

    // Imports
    var temperatureReadsModel = context.component('models').module('temperatureReads');

    return {
        bulkCreate: function(items, options) {
            return temperatureReadsModel.bulkCreate(items, options);
        },

        findByUniprotId: function(identifier, transaction) {
            if (transaction){
                return temperatureReadsModel.findAll({
                        attributes: ['experiment', 'uniprotId', 'temperature', 'ratio'],
                        where: {
                            uniprotId: {
                                $like: identifier + "%"
                            }
                        },
                        transaction: transaction
                    }
                );
            } else {
                return temperatureReadsModel.findAll({
                        attributes: ['experiment', 'uniprotId', 'temperature', 'ratio'],
                        where: {
                            uniprotId: {
                                $like: identifier + "%"
                            }
                        }
                    }
                );
            }
        },

        findByUniprotIdAndExperiment: function(uniprotId, experimentId) {
            let where = {};
            if(uniprotId !== undefined){
                where.uniprotId = uniprotId;
            }
            if(experimentId !== undefined){
                where.experiment = experimentId;
            }
            return temperatureReadsModel.findAll({
                    attributes: ['experiment', 'uniprotId', 'temperature', 'ratio'],
                    where: where
                }
            );
        }
    };
};