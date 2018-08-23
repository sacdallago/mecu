const loadModels = require('./models/loadModels');

module.exports = function(context) {
    // do the loading of the models explicitly beforehand, this way, the sorting of the function calls
    // (context.component('models')...) afterwars does not matter
    loadModels(context);
    
    const frontendService = context.component('services').module('frontend');
    const proteinsService = context.component('services').module('proteins');
    const experimentsService = context.component('services').module('experiments');
    const temperatureReadsService = context.component('services').module('temperatureReads');
    const complexesService = context.component('services').module('complexes');
}
