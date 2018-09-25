const sequelize = require('sequelize');

module.exports = function(context) {

    // Imports
    const experimentsModel = context.component('models').module('experiments');
    const temperatureReadsModel = context.component('models').module('temperatureReads');

    return {
        create: function(item, options) {
            return experimentsModel.create(item, options);
        },

        getExperiments: function(options = {}, uploader){
            return experimentsModel.findAll({
                attributes: ['id', 'name', 'metaData', 'uploader'],
                where: {
                    [sequelize.Op.or]: [
                        {private: false},
                        {uploader: uploader}
                    ]
                }
            });
        },

        findExperiment: function(id, uploader) {
            return experimentsModel.findAll({
                    attributes: ['id', 'name', 'metaData', 'uploader', 'private', 'createdAt', 'updatedAt'],
                    where: {
                        id: id,
                        [sequelize.Op.or]: [
                            {private: false},
                            {uploader: uploader}
                        ]
                    }
                })
                .then(result => result.length > 0 ? result[0].dataValues : {})
        },

        update: function(id, update) {
            return experimentsModel.update(
                update,
                {
                    returning: true,
                    where: {
                        id: id
                    }
                }
            );
        },

        getExperimentsPaged: function(options, uploader) {
            // add search if necessary
            return Promise.all([
                    experimentsModel.count({
                        where: {
                            [sequelize.Op.or]: [
                                {private: false},
                                {uploader: uploader}
                            ]
                        }
                    }),
                    experimentsModel.findAll({
                        attributes: ['id', 'name', 'metaData', 'uploader'],
                        where: {
                            [sequelize.Op.or]: [
                                {private: false},
                                {uploader: uploader}
                            ]
                        },
                        limit: options.limit,
                        offset: options.offset,
                        order: [
                            [options.sortBy, (options.order === -1 ? 'DESC' : 'ASC')]
                        ]
                    })
                ])
                .then(([count, result]) => ({count, data:result}));
        },

        getRawData: function(id, uploader){
            if(id !== undefined) {
                return experimentsModel.findById(
                    id,
                    {
                        attributes: ['rawData', 'id'],
                        where: {
                            [sequelize.Op.or]: [
                                {private: false},
                                {uploader: uploader}
                            ]
                        }
                    }
                );
            } else {
                return experimentsModel.findAll(
                    {
                        attributes: ['rawData', 'id'],
                        where: {
                            [sequelize.Op.or]: [
                                {private: false},
                                {uploader: uploader}
                            ]
                        }
                    }
                );
            }
        },

        getExperimentsWhichHaveProtein: function(uniprotId, uploader) {
            const query = `
                SELECT "uniprotId", "experimentId"
                FROM protein_experiments pe, experiments e
                WHERE
                    pe."uniprotId" = :uniprotId and
                    pe."experimentId" = e.id and
                    (e.private = false or e.uploader = :uploader);
            `;
            return context.dbConnection.query(
                    query,
                    {
                        replacements: {
                            uniprotId,
                            uploader
                        }
                    },
                    {type: sequelize.QueryTypes.SELECT}
                )
                .then(r => r.length > 0 ? r[0] : []);
        }
    };
};
