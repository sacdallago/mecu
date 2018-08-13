module.exports = function(context) {
    const complexesController = context.component('controllers').module('complexes');
    context.api
        .get('/complex', complexesController.queryByName);

};
