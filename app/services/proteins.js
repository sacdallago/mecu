module.exports = function(context) {
    const proteinsController = context.component('controllers').module('proteins');
    context.api
        .post('/protein/search/exp/', proteinsController.getProteinsFromExp)
        .get('/protein/:name/experiment/:expid', proteinsController.getSpecProt)
        ;
}
