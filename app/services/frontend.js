module.exports = function(context) {
    const frontendController = context.component('controllers').module('frontend');
    context.router
        .get('/', frontendController.search)
        .get('/error', frontendController.error)
        .get('/about', frontendController.about)
        .get('/upload', frontendController.uploadExperiment)
        .get('/downloads', frontendController.downloads)
        .get('/analyze-proteins', frontendController.analyzeProteins)
        .get('/search', frontendController.bulkSearch)
        .get('/protein', frontendController.protein)
        .get('/complexes', frontendController.complexes)
        .get('/complex', frontendController.complex)
        .get('/experiments', frontendController.experiments)
        .get('/experiment', frontendController.experiment)
        .get('/storage-proteins-fullscreen', frontendController.storageProteinsFullscreen)
        .get('/ppi-fullscreen', frontendController.ppiFullscreen)
        ;
}
