module.exports = function(context) {
    const proteinsController = context.component('controllers').module('proteins');
    context.api
        .post('/proteins/search/exp/', proteinsController.getProteinsFromExp)
        .get('/proteins/:name/experiment/:expid', proteinsController.getSpecProt)
        .get('/proteins/:id', proteinsController.getProteins)
        ;
}
