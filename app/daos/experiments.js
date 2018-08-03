/**
 * experiments DAO
 *
 * Created by Christian Dallago on 20170103 .
 */

module.exports = function(context) {

    // Imports
    var experimentsModel = context.component('models').module('experiments');

    return {
        create: function(item, options) {
            return experimentsModel.create(item, options);
        },

        getExperiments: function(options = {}){
            return experimentsModel.findAll({
                    attributes: ['id', 'lysate', 'description', 'uploader'],
                });
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
        }
    };
};
