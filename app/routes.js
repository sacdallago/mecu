module.exports = function(context) {
    const frontendService = context.component('services').module('frontend');
    const proteinsService = context.component('services').module('proteins');
    const experimentsService = context.component('services').module('experiments');
    const temperatureReadsService = context.component('services').module('temperatureReads');
}