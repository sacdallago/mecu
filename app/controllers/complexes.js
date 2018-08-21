
module.exports = function(context) {

    const complexesDao = context.component('daos').module('complexes');

    return {
        getById: function(request, response) {
            console.log('request.params', request.params);
            complexesDao.getComplex(request.params.id)
                .then(result => response.status(200).send(result))
                .catch(error => {
                    console.error('getById', error);
                    return response.status(500).send({});
                });
        },
        hasProtein: function(request, response) {
            console.log('request.params', request.params);
            const start = new Date();
            complexesDao.getComplexWhichHasProtein(request.params.uniprotId)
                .then(r => {
                    console.log('DURATION getComplexWhichHasProtein', (Date.now()-start)/1000);
                    return r;
                })
                .then(result => response.status(200).send(result))
                .catch(error => {
                    console.error('getById', error);
                    return response.status(500).send([]);
                });
        }
    }
}
