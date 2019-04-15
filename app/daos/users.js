
module.exports = function(context) {

    // Imports
    const usersModel = context.component(`models`).module(`users`);

    return {
        findOrCreate: function(document) {
            return usersModel.findOrCreate({
                where: {
                    googleId: document.googleId
                },
                defaults: {
                    displayName: document.displayName
                }
            });
        },

        findById: function(id) {
            return usersModel.findOne({
                where: {
                    googleId: id
                }
            });
        },

        getUsersPaginated: ({limit, offset, sortBy, order, search}, requester) => {

            let whereClause = '';
            if (search) {
                whereClause = `WHERE "displayName" LIKE '%${search}%'`
            }

            let query = `
                SELECT "displayName", "googleId", "isAdmin", "allowPost"
                FROM users
                ${whereClause}
            `;
            const selections = `
                ORDER BY "${sortBy}" ${order}
                offset :offset
                limit :limit;
            `;

            return Promise.all([
                    context.dbConnection.query(
                        query+selections,
                        {
                            replacements: {
                                limit: limit,
                                offset: offset
                            }
                        }
                    ),
                    context.dbConnection.query(query)
                ])
                .then(([result, count]) => {
                    return {data: result[0], total: count[0].length};
                });

        },

        isAdmin: function(googleId) {
            return usersModel.findOne({where:{googleId: googleId}})
                .then(user => (user || {isAdmin:false}).isAdmin === true);
        },

        allowUserToPost: function(googleId) {
            return usersModel.update(
                {allowPost: true},
                {
                    returning: true,
                    where: {
                        googleId: googleId
                    }
                }

            )
        },

        disallowUserToPost: function(googleId) {
            return usersModel.update(
                {allowPost: false},
                {
                    returning: true,
                    where: {
                        googleId: googleId
                    }
                }

            )
        },

        makeAdmin: function(googleId) {
            return usersModel.update(
                {isAdmin: true},
                {where: {googleId: googleId}}
            )
        },

        removeAdminRights: function(googleId) {
            return usersModel.update(
                {isAdmin: false},
                {where: {googleId: googleId}}
            )
        }
    };
};
