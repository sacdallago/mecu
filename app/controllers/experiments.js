module.exports = function(context) {

    // Imports
    var proteinsDao = context.component('daos').module('proteins');

    return {
        getProteins: function(request, response) {
            const identifier = request.params.id.toUpperCase();

            if(identifier === undefined){
                response.send([]);
            } else {
                proteinsDao.findProteinNames(identifier).then(function(proteins){
                    response.send(proteins);
                }, function(error){
                    response.status(500).send(error);
                });
            }
        }
    }
}