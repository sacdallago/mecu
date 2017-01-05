module.exports = function(context) {
    const proteinsController = context.component('controllers').module('proteins');
    context.api
        .get('/proteins/search/:id', proteinsController.getProteins);
}