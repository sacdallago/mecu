module.exports = function(context) {
    const frontendController = context.component('controllers').module('frontend');
    context.router
        .get('/', frontendController.search)
        .get('/error', frontendController.error)
        //.get('/search', frontendController.search)
        .get('/protein/:uniprotId', frontendController.protein)
        .get('/about', frontendController.about);
}