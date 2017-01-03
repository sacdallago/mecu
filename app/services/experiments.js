module.exports = function(context) {
    const experimentsController = context.component('controllers').module('experiments');
    context.api
        .post('/experiment', experimentsController.uploadExperiment);
}