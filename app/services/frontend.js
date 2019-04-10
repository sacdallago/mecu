module.exports = function(context) {
    const frontendController = context.component(`controllers`).module(`frontend`);
    context.router
        .get(`/`, frontendController.index)
        .get(`/search`, frontendController.search)
        .get(`/error`, frontendController.error)
        .get(`/about`, frontendController.about)
        .get(`/users`, frontendController.users)
        .get(`/upload`, frontendController.uploadExperiment)
        .get(`/analyze-proteins`, frontendController.analyzeProteins)
        .get(`/bulkSearch`, frontendController.bulkSearch)
        .get(`/protein`, frontendController.protein)
        .get(`/complexes`, frontendController.complexes)
        .get(`/complex`, frontendController.complex)
        .get(`/experiments`, frontendController.experiments)
        .get(`/experiment`, frontendController.experiment)
        .get(`/storage-proteins-fullscreen`, frontendController.storageProteinsFullscreen)
        .get(`/ppi-fullscreen`, frontendController.ppiFullscreen)
        .get(`/success`, frontendController.success)
        .get(`/upload-experiment-guide`, frontendController.uploadExperimentGuide)
        .get(`/template-file-download`, frontendController.templateFileDowload)
    ;
};
