module.exports = function(context) {

    // Imports
    var proteinsDao = context.component('daos').module('proteins');

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

        protein: function(request, response) {
            const uniprotId = request.params.uniprotId;

            return proteinsDao.findByUniprotId(uniprotId).then(function(requestProtein){
                if(requestProtein) {
                    return response.render('protein', {
                        title: uniprotId,
                        protein: requestProtein
                    });
                } else {
                    return response.render('404', {
                        title: 'No protein',
                        message: "No protein by that name",
                        error: "No protein by that name"
                    });
                }
            }, function(error){
                return response.render('error', {
                    title: 'Error',
                    message: "Unable to retrieve protein data",
                    error: error
                });
            });
        }
    }
}