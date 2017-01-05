/**
 * proteinReads DAO
 *
 * Created by Christian Dallago on 20170103 .
 */

module.exports = function(context) {

    // Imports
    var proteinReadsModel = context.component('models').module('proteinReads');

    return {
        bulkCreate: function(items, options) {
            return proteinReadsModel.bulkCreate(items, options);
        },

        findProteins: function(identifier, transaction) {
            if(transaction){
                return proteinReadsModel.findAll({
                        attributes: ['experiment', 'uniprotId', 'peptides', 'psms'],
                        where: {
                            uniprotId: {
                                $like: identifier + "%"
                            }
                        },
                        transaction: transaction
                    }
                );
            } else {
                return proteinReadsModel.findAll({
                        attributes: ['experiment', 'uniprotId', 'peptides', 'psms'],
                        where: {
                            uniprotId: {
                                $like: identifier + "%"
                            }
                        }
                    }
                );
            }

        },

        findUniprotIds: function(identifier, transaction) {
            if(transaction){
                return proteinReadsModel.findAll({
                        attributes: [[context.sequelize.fn('DISTINCT', context.sequelize.col('uniprotId')), 'uniprotId']],
                        where: {
                            uniprotId: {
                                $like: identifier + "%"
                            }
                        },
                        transaction: transaction
                    }
                );
            } else {
                return proteinReadsModel.findAll({
                        attributes: [[context.sequelize.fn('DISTINCT', context.sequelize.col('uniprotId')), 'uniprotId']],
                        where: {
                            uniprotId: {
                                $like: identifier + "%"
                            }
                        }
                    }
                );
            }
        },
    };
};