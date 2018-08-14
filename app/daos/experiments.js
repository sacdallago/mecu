/**
 * experiments DAO
 *
 * Created by Christian Dallago on 20170103 .
 */

module.exports = function(context) {

    // Imports
    const experimentsModel = context.component('models').module('experiments');
    const temperatureReadsModel = context.component('models').module('temperatureReads');

    return {
        create: function(item, options) {
            return experimentsModel.create(item, options);
        },

        getExperiments: function(options = {}){
            return experimentsModel.findAll({
                attributes: ['id', 'lysate', 'description', 'uploader'],
            });
        },

        findExperiment: function(id) {
            return experimentsModel.findAll({
                attributes: ['id', 'lysate', 'description', 'uploader', 'createdAt', 'updatedAt'],
                where: {
                    id
                }
            })
        },

        getExperimentsPaged: function(options) {
            // add search if necessary
            return Promise.all([
                    experimentsModel.count(),
                    experimentsModel.findAll({
                        attributes: ['id', 'lysate', 'description', 'uploader'],
                        limit: options.limit,
                        offset: options.offset,
                        order: [
                            [options.sortBy, (options.order === -1 ? 'DESC' : 'ASC')]
                        ]
                    })
                ])
                .then(([count, result]) => ({count, data:result}));
        },

        getRawData: function(id){
            if(id !== undefined) {
                return experimentsModel.findById(id, {
                    attributes: ['rawData', 'id']
                });
            } else {
                return experimentsModel.findAll({
                    attributes: ['rawData', 'id']
                });
            }
        },

        getExperimentsWhichHaveProtein: function(uniprotId) {
            return temperatureReadsModel.findAll({
                attributes: ['experiment'],
                where: {
                    uniprotId
                },
                group: ['experiment', 'uniprotId']
            })
        }
    };
};
