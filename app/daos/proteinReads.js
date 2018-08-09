/**
 * proteinReads DAO
 *
 * Created by Christian Dallago on 20170103 .
 */

const sequelize = require('sequelize');

module.exports = function(context) {

    // Imports
    const proteinReadsModel = context.component('models').module('proteinReads');

    return {
        bulkCreate: function(items, options) {
            return proteinReadsModel.bulkCreate(items, options);
        },

        findUniprotIdsLike: function(identifier, transaction) {
            if(transaction){
                return proteinReadsModel.findAll({
                        attributes: [[context.dbConnection.fn('DISTINCT', context.dbConnection.col('uniprotId')), 'uniprotId']],
                        where: {
                            uniprotId: {
                                [sequelize.Op.like]: identifier + "%"
                            }
                        },
                        transaction: transaction
                    }
                );
            } else {
                return proteinReadsModel.findAll({
                        attributes: [[context.dbConnection.fn('DISTINCT', context.dbConnection.col('uniprotId')), 'uniprotId']],
                        where: {
                            uniprotId: {
                                [sequelize.Op.like]: identifier + "%"
                            }
                        }
                    }
                );
            }
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
