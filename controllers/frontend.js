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

            // Standardize query element: Either undefined or array.
            const query = (function(){
                if (request.query.q !== undefined){
                    if (request.query.q.constructor === Array){
                        return request.query.q
                    } else {
                        return [request.query.q]
                    }
                } else {
                    return undefined;
                }
            })();

            if(query !== undefined && query.length > 0 && query[0].length > 1){
                // !!! ONLY TAKE FIRST ELEMENT OF QUERY!
                const queryString = query[0].toUpperCase();
                proteinsDao.findProteinNames(queryString).then(function(proteins){
                    return response.render('search', {
                        title: 'Search for proteins',
                        localizations: context.constants.localizations,
                        proteins: proteins
                    });
                }, function(error){
                    return response.status(500).render('error', {
                        title: '500',
                        message: "Cannot retrieve proteins",
                        error: error
                    });
                });
            } else {
                return response.render('search', {
                    title: 'Search for proteins',
                    localizations: context.constants.localizations
                });
            }
        },

        protein: function(request, response) {
            const uniprotId = request.params.uniprotId;

            return proteinsDao.findByUniprotId(uniprotId).then(function(requestProtein){
                if(requestProtein) {
                    return proteinsDao.getPartners(requestProtein).then(function(partners){
                        return response.render('protein', {
                            title: uniprotId,
                            localizations: context.constants.localizations,
                            protein: requestProtein,
                            partners: partners
                        });
                    }, function(error){
                        return response.render('error', {
                            title: 'Error',
                            message: "Unable to retrieve protein interacitons data",
                            error: error
                        });
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