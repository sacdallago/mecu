
module.exports = function(context) {

    const complexesDao = context.component('daos').module('complexes');

    return {
        queryByName: function(request, response) {
            response.status(200).send('successful');
        }
    }
}
