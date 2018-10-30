const sequelize = require(`sequelize`);

module.exports = function(context) {

    // Imports
    const experimentsModel = context.component(`models`).module(`experiments`);

    return {
        create: function(item, options) {
            return experimentsModel.create(item, options);
        },

        getExperiments: function(options = {}, requester){
            return experimentsModel.findAll({
                attributes: [`id`, `name`, `metaData`, `uploader`],
                where: {
                    [sequelize.Op.or]: [
                        {private: false},
                        {uploader: requester}
                    ]
                }
            });
        },

        findExperiment: function(id, requester) {
            return experimentsModel.findAll({
                attributes: [`id`, `name`, `metaData`, `uploader`, `private`, `createdAt`, `updatedAt`],
                where: {
                    id: id,
                    [sequelize.Op.or]: [
                        {private: false},
                        {uploader: requester}
                    ]
                }
            })
                .then(result => result.length > 0 ? result[0].dataValues : {});
        },
        findExperimentWithoutCheck: function(id) {
            return experimentsModel.findAll({
                attributes: [`id`, `name`, `metaData`, `uploader`, `private`, `createdAt`, `updatedAt`],
                where: {id: id}
            })
                .then(result => result.length > 0 ? result[0].dataValues : {});
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

        getExperimentsPaged: function(options, requester) {
            // add search if necessary
            return Promise.all([
                experimentsModel.count({
                    where: {
                        [sequelize.Op.or]: [
                            {private: false},
                            {uploader: requester}
                        ]
                    }
                }),
                experimentsModel.findAll({
                    attributes: [`id`, `name`, `metaData`, `uploader`],
                    where: {
                        [sequelize.Op.or]: [
                            {private: false},
                            {uploader: requester}
                        ]
                    },
                    limit: options.limit,
                    offset: options.offset,
                    order: [
                        [options.sortBy, (options.order === -1 ? `DESC` : `ASC`)]
                    ]
                })
            ])
                .then(([count, result]) => ({count, data:result}));
        },

        getRawData: function(id, requester){
            if(id !== undefined) {
                return experimentsModel.findById(
                    id,
                    {
                        attributes: [`rawData`, `id`],
                        where: {
                            [sequelize.Op.or]: [
                                {private: false},
                                {uploader: requester}
                            ]
                        }
                    }
                );
            } else {
                return experimentsModel.findAll(
                    {
                        attributes: [`rawData`, `id`],
                        where: {
                            [sequelize.Op.or]: [
                                {private: false},
                                {uploader: requester}
                            ]
                        }
                    }
                );
            }
        },

        getExperimentsWhichHaveProtein: function(uniprotId, requester) {
            const query = `
                SELECT "experimentId", name
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
                        uploader: requester
                    }
                },
                {type: sequelize.QueryTypes.SELECT}
            )
                .then(r => r.length > 0 ? r[0] : []);
        },

        getExperimentsWhichHaveComplex: (complexId, requester) => {
            const query = `
                SELECT DISTINCT e.id, e.name
                FROM
                    experiments e,
                    protein_experiments pe,
                    (SELECT "uniprotId" FROM protein_complexes pc WHERE pc."complexId" = :complexId) proteins
                WHERE
                    pe."uniprotId" = proteins."uniprotId" AND
                    pe."experimentId" = e.id AND
                    (e.private = false or e.uploader = :uploader);
            `;
            return context.dbConnection.query(
                query,
                {
                    replacements: {
                        complexId,
                        uploader: requester
                    }
                },
                {type: sequelize.QueryTypes.SELECT}
            )
                .then(result => result[0]);
        }
    };
};
