module.exports = function(context) {
    const experimentsController = context.component('controllers').module('experiments');
    const securityController = context.component('controllers').module('securityLayer');

    context.api
        .post('/experiment',securityController.loggedIn, securityController.allowedPostRequests, experimentsController.uploadExperiment);
}