const sequelize = require('sequelize');

module.exports = function(context) {

    // Imports
    const proteinsModel = context.component('models').module('proteins');

    return {
        create: function(item) {
            return proteinsModel.create(item);
        },

        bulkCreate: function(proteinList) {
            // return proteinsModel.bulkCreate(items, {ignoreDuplicates: true}); // DOES NOT WORK
            let p = Promise.resolve();
            proteinList.forEach(protein => {
                p = p.then(() => context.dbConnection.query(
                    `INSERT INTO public.proteins("uniprotId", "createdAt", "updatedAt") VALUES (:uniprotId, :createdAt, :updatedAt) ON CONFLICT DO NOTHING;`,
                    {
                        replacements: {
                            uniprotId: protein,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        }
                    },
                    {
                        type: sequelize.QueryTypes.INSERT
                    }
                ))
            });
            return p;
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
