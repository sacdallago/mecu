module.exports = function(context) {
    // Imports
    const experimentsDao = context.component('daos').module('experiments');

    return {
        index: function(request, response) {
            return response.render('index', {
                title: 'Home'
            });
        },

        about: function(request, response) {
            return response.render('about', {
                title: 'About'
            });
        },

        error: function(request, response) {
            return response.render('error', {
                title: 'Error',
                message: "There was an unknown error with your request.",
                error: "There was an unknown error with your request."
            });
        },

        search: function(request, response) {
            return response.render('search', {
                title: 'Search for proteins'
            });
        },

        curves: function(request, response) {
            return response.render('curves', {
                title: 'My Selected curves'
            });
        },

        uploadExperiment: function(request, response) {
            return response.render('experimentUpload', {
                title: 'Upload'
            });
        },

        downloads: function(request, response) {
            return experimentsDao.getExperiments()
                .then(function(experiments) {
                    return response.render('downloads', {
                        title: 'Download',
                        experiments: experiments
                    });
                })
                .catch(function(error) {
                    return response.status(500).render('error', {
                        title: 'Error!',
                        message: "There was an unknown error with your request.",
                        error: error
                    });
                });

        }
    }
}