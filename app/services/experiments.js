module.exports = function(context) {
    const experimentsController = context.component(`controllers`).module(`experiments`);
    const securityController = context.component(`controllers`).module(`securityLayer`);

    context.api
        .get(`/experiment/:id`, experimentsController.getExperiment)
        .post(`/experiment/:id`, securityController.loggedIn, experimentsController.updateExperiment)
        .post(`/experiment`, securityController.loggedIn, securityController.allowedPostRequests, experimentsController.uploadExperiment)
        .get(`/experiments`, experimentsController.getExperiments)
        .get(`/experiments/proteins/:id`, experimentsController.getProteinsInExperiment)
        .get(`/experiments/containing/complex/:complexId`, experimentsController.getExperimentsWhichHaveComplex)
        .get(`/experiments/containing/protein/:uniprotId`, experimentsController.getExperimentsWhichHaveProtein)
    ;
};
