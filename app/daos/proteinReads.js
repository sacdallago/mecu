/**
 * proteinReads DAO
 *
 * Created by Christian Dallago on 20170103 .
 */

module.exports = function(context) {

    // Imports
    const proteinReadsModel = context.component('models').module('proteinReads');
    const Op = context.Sequelize.Op;

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
                                [Op.like]: identifier + "%"
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
                                [Op.like]: identifier + "%"
                            }
                        }
                    }
                );
            }

        },

        findUniprotIdsLike: function(identifier, transaction) {
            if(transaction){
                return proteinReadsModel.findAll({
                        attributes: [[context.sequelize.fn('DISTINCT', context.sequelize.col('uniprotId')), 'uniprotId']],
                        where: {
                            uniprotId: {
                                [Op.like]: identifier + "%"
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
                                [Op.like]: identifier + "%"
                            }
                        }
                    }
                );
            }
        },

        findUniprotIds: function(uniprotIds, transaction) {
            if(transaction){
                return proteinReadsModel.findAll({
                        attributes: [[context.sequelize.fn('DISTINCT', context.sequelize.col('uniprotId')), 'uniprotId']],
                        where: {
                            uniprotId: uniprotIds
                        },
                        transaction: transaction
                    }
                );
            } else {
                return proteinReadsModel.findAll({
                        attributes: [[context.sequelize.fn('DISTINCT', context.sequelize.col('uniprotId')), 'uniprotId']],
                        where: {
                            uniprotId: uniprotIds
                        }
                    }
                );
            }
        },
    };
};