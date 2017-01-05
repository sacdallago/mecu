module.exports = function(context) {

    // Imports
    var proteinsDao = context.component('daos').module('proteins');
    var proteinReadsDao = context.component('daos').module('proteinReads');

    return {
        getProteins: function(request, response) {
            const identifier = request.params.id.toUpperCase();

            if(identifier === undefined){
                response.send([]);
            } else {
                proteinReadsDao.findProteins(identifier)
                    .then(function(proteins){
                        response.send(proteins);
                    })
                    .catch(function(error){
                        response.status(500).send(error);
                });
            }
        },
        getProteinByUniProtId: function(request, response) {
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