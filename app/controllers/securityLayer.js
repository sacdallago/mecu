module.exports = function() {
    return {
        allowedPostRequests: function(request, response, next){
            if(request.user.get(`allowPost`) == true){
                next();
            } else {
                response.status(403).send({
                    error: `Not allowed to upload experiments`,
                    message: `Sorry, you don't have the right to upload experiments.`
                });
            }
        },

        loggedIn: function(request, response, next){
            if(request.user){
                next();
            } else {
                response.status(403).render(`error`, {
                    title: `Not logged in`,
                    message: `Sorry, you appear not to be logged in.`
                });
            }
        }
    };
};
