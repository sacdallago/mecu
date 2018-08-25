module.exports = function(context) {
    const complexesController = context.component('controllers').module('complexes');
    context.api
        .get('/complex/:id', complexesController.getById)
        .get('/complex/hasprotein/:uniprotId', complexesController.hasProtein)
        ;
};
