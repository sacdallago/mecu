module.exports = function(context) {
    const experimentsController = context.component('controllers').module('experiments');
    const securityController = context.component('controllers').module('securityLayer');

    context.api
        .get('/experiment', experimentsController.getRawData)
        .get('/experiment/:id', experimentsController.getRawData)
        .post('/experiment',securityController.loggedIn, securityController.allowedPostRequests, experimentsController.uploadExperiment)
        .get('/experiments', experimentsController.getExperiments)
        .get('/experiments/:uniprotId', experimentsController.getExperimentsWhichHaveProtein)
        ;
};
