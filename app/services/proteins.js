module.exports = function(context) {
    const proteinsController = context.component('controllers').module('proteins');
    context.api
        .get('/proteins/uniprot/:id', proteinsController.getProteinByUniProtID)
        .get('/proteins/search/:id', proteinsController.getProteins);
}