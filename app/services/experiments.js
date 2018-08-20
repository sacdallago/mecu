module.exports = function(context) {
    const experimentsController = context.component('controllers').module('experiments');
    const securityController = context.component('controllers').module('securityLayer');

    context.api
        // .get('/experiment', experimentsController.getRawData) // too much data to send/handle, disabling for now
        // .get('/experiment/:id', experimentsController.getExperiment) // to implement if necessary
        .get('/experiment/raw/:id', experimentsController.getRawData)
        .post('/experiment',securityController.loggedIn, securityController.allowedPostRequests, experimentsController.uploadExperiment)
        .get('/experiments', experimentsController.getExperiments)
        .get('/experiments/:uniprotId', experimentsController.getExperimentsWhichHaveProtein)
        ;
};
