module.exports = function(context) {
    const proteinsController = context.component('controllers').module('proteins');
    context.api
        .post('/proteins/search/exp/', proteinsController.getProteinsFromExp)
        .get('/proteins/search/:id', proteinsController.getProteins)
        ;
}
