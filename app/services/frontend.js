module.exports = function(context) {
    const frontendController = context.component('controllers').module('frontend');
    context.router
        .get('/', frontendController.search)
        .get('/error', frontendController.error)
        .get('/about', frontendController.about)
        .get('/upload', frontendController.uploadExperiment)
        .get('/downloads', frontendController.downloads)
        .get('/curves', frontendController.curves)
        .get('/search', frontendController.bulkSearch)
        .get('/protein', frontendController.protein)
        .get('/complex', frontendController.complex)
        .get('/experiments', frontendController.experiments)
        .get('/experiment', frontendController.experiment);
}
