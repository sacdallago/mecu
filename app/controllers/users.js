const extractUserGoogleId = require(`../helper.js`).retrieveUserGoogleId;

module.exports = function(context) {

    const userDao = context.component(`daos`).module(`users`);

    return {
        getUsersPaginated: function(request, response) {
            const requester = extractUserGoogleId(request);

            const UPPER_QUERY_LIMIT = 10;
            const queryParamsFun = (query) => {
                let ret = {
                    limit: query.limit ? (query.limit > UPPER_QUERY_LIMIT ? UPPER_QUERY_LIMIT : query.limit) : UPPER_QUERY_LIMIT,
                    offset: query.offset || 0,
                    sortBy: query.sortBy || `id`,
                    order: query.order ? (isNaN(parseInt(query.order)) ? 'ASC' : parseInt(query.order)) : 'ASC'
                };
                return Object.assign(ret, query);
            };

            const queryParams = queryParamsFun(request.body);

            userDao.isAdmin(requester)
                .then(isAdmin => {
                    if (isAdmin) {
                        return userDao.getUsersPaginated(queryParams, extractUserGoogleId(request))
                    } else {
                        throw Error('not an admin, not allowed to view the users');
                    }
                })
                .then(result => response.status(200).send(result))
                .catch(error => {
                    console.error(`getUsersPaginated`, error);
                    return response.status(500).send({error: 'not allowed', errorType: 1});
                });
        },

        allowUserToPost: function(request, response) {
            const requester = extractUserGoogleId(request);

            userDao.isAdmin(requester)
                .then(isAdmin => {
                    if (isAdmin) {
                        return userDao.allowUserToPost(request.params.googleId)
                    } else {
                        throw Error('not an admin, not allowed to change the user');
                    }
                })
                .then(result => {
                    return response.status(200).send('user can now post');
                })
                .catch(error => {
                    console.error(`allowUserToPost`, error);
                    return response.status(500).send('user update error', error);
                });
        },

        disallowUserToPost: function(request, response) {
            const requester = extractUserGoogleId(request);

            userDao.isAdmin(requester)
                .then(isAdmin => {
                    if (isAdmin) {
                        return userDao.disallowUserToPost(request.params.googleId)
                    } else {
                        throw Error('not an admin, not allowed to change the user');
                    }
                })
                .then(result => {
                    return response.status(200).send('user can now not post anymore');
                })
                .catch(error => {
                    console.error(`allowUserToPost`, error);
                    return response.status(500).send('user update error', error);
                });
        },

        makeAdmin: function(request, response) {
            const requester = extractUserGoogleId(request);

            userDao.isAdmin(requester)
                .then(isAdmin => {
                    if (isAdmin) {
                        return userDao.makeAdmin(request.params.googleId)
                    } else {
                        throw Error('not an admin, not allowed to change the user');
                    }
                })
                .then(result => {
                    return response.status(200).send('user can now post');
                })
                .catch(error => {
                    console.error(`allowUserToPost`, error);
                    return response.status(500).send('user update error', error);
                });
        },

        removeAdminRights: function(request, response) {
            const requester = extractUserGoogleId(request);

            userDao.isAdmin(requester)
                .then(isAdmin => {
                    if (isAdmin) {
                        return userDao.removeAdminRights(request.params.googleId)
                    } else {
                        throw Error('not an admin, not allowed to change the user');
                    }
                })
                .then(result => {
                    return response.status(200).send('user can now post');
                })
                .catch(error => {
                    console.error(`allowUserToPost`, error);
                    return response.status(500).send('user update error', error);
                });
        }
    }
}
