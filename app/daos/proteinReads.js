const sequelize = require('sequelize');

module.exports = function(context) {

    // Imports
    const proteinReadsModel = context.component('models').module('proteinReads');

    return {
        bulkCreate: function(items, options) {
            return proteinReadsModel.bulkCreate(items, options);
        },

        findProteinExperiment: function(uniprotId, experiment) {
            return proteinReadsModel.findAll({
                attributes: ['uniprotId', 'experiment', 'peptides', 'psms', 'createdAt', 'updatedAt'],
                where: {
                    uniprotId,
                    experiment
                }
            })
            .then(r => r.length > 0 ? r[0].dataValues : {} );
        },

        findUniprotIds: function(uniprotIds, transaction) {
            if(transaction){
                return proteinReadsModel.findAll({
                        attributes: [[context.dbConnection.fn('DISTINCT', context.dbConnection.col('uniprotId')), 'uniprotId']],
                        where: {
                            uniprotId: uniprotIds
                        },
                        transaction: transaction
                    }
                );
            } else {
                return proteinReadsModel.findAll({
                        attributes: [[context.dbConnection.fn('DISTINCT', context.dbConnection.col('uniprotId')), 'uniprotId']],
                        where: {
                            uniprotId: uniprotIds
                        }
                    }
                );
            }
        },
    };
};
