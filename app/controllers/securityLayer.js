/**
 * Created by chdallago on 13/02/2017.
 */


module.exports = function(context) {
    return {
        allowedPostRequests: function(request, response, next){
            if(request.user.get("allowPost") == true){
                next();
            } else {
                response.status(403).render('error', {
                    title: 'Not allowed to send post requests',
                    message: "Sorry, you don't have the right to send POST requests to the server."
                });
            }
        },

        loggedIn: function(request, response, next){
            if(request.user){
                next();
            } else {
                response.status(403).render('error', {
                    title: 'Not logged in',
                    message: "Sorry, you appear not to be logged in."
                });
            }
        }
    }
}