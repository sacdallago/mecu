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
        },
        getProteinByUniProtID: function(request, response) {
            const identifier = request.params.id.toUpperCase();

            proteinsDao.findByUniprotId(identifier).then(function(protein){
                if(mapping){
                    response.send(protein);
                } else {
                    response.status(404).send();
                }
            }, function(error){
                response.status(500).send(error);
            });

        }
    }
}