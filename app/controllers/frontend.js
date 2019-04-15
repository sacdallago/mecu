const extractUserGoogleId = require(`../helper.js`).retrieveUserGoogleId;

module.exports = function(context) {
    // Imports
    const experimentsDao = context.component(`daos`).module(`experiments`);

    return {

        index: function(request, response) {
            return response.render(`start-page`, {
                title: `Home`
            });
        },

        about: function(request, response) {
            return response.render(`about`, {
                title: `About`
            });
        },

        users: function(request, response) {
            return response.render(`users`, {
                title: `Users`
            });
        },

        error: function(request, response) {
            return response.render(`error`, {
                title: `Error`,
                message: `There was an unknown error with your request.`,
                error: `There was an unknown error with your request.`
            });
        },

        search: function(request, response) {
            return response.render(`search`, {
                title: `Search for proteins`
            });
        },

        bulkSearch: function(request, response) {
            return response.render(`bulkSearch`, {
                title: `Search for proteins`
            });
        },

        analyzeProteins: function(request, response) {
            return response.render(`analyze-proteins`, {
                title: `Analyze selected proteins`
            });
        },

        protein: function(request, response) {
            return response.render(`protein`, {title: `Protein`});
        },

        complexes: function(request, response) {
            return response.render(`complexes`, {title: `Find Complex`});
        },

        complex: function(request, response) {
            return response.render(`complex`, {title: `Complex`});
        },

        experiments: function(request, response) {
            return response.render(`experiments`, {title: `Experiments`});
        },

        experiment: function(request, response) {
            return response.render(`experiment`, {title: `Experiment ${request.query.id}`});
        },

        uploadExperiment: function(request, response) {
            return response.render(`experimentUpload`, {
                title: `Upload`
            });
        },

        storageProteinsFullscreen: function(request, response) {
            return response.render(`storage-proteins-fullscreen`, {
                title: `Proteins Fullscreen`
            });
        },

        ppiFullscreen: function(request, response) {
            return response.render(`ppi-fullscreen`, {
                title: `Distances and Correlations amongst proteins`
            });
        },

        success: function(request, response) {
            return response.render(`success`, {
                title: `Experiment upload successful`,
                message: `Your experiment has been uploaded successfully!`
            });
        },

        uploadExperimentGuide: function(request, response) {
            return response.render(`upload-experiment-guide`, {
                title: `How to upload an experiment`
            });
        },

        templateFileDowload: function(request, response) {
            return response.download(`./frontend/public/files/template-file.xls`);
        }
    };
};
