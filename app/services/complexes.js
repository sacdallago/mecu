module.exports = function(context) {
    const complexesController = context.component(`controllers`).module(`complexes`);
    context.api
        .get(`/complex/:id`, complexesController.getById)
        .post(`/complex/find`, complexesController.find)
        .get(`/complex/distancetootherexperiments/:id`, complexesController.getAverageComplexDistancePerExperiment)
        .get(`/complex/hasprotein/:uniprotId/exp/:expId`, complexesController.hasProtein)
    ;
};
