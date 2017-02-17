module.exports = function(context) {
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
        }
    }
}