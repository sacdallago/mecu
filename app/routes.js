const loadModels = require(`./models/loadModels`);

module.exports = function(context) {
    // do the loading of the models explicitly beforehand, this way, the sorting of the function calls
    // (context.component('models')...) afterwars does not matter
    loadModels(context);

    context.component(`services`).module(`frontend`);
    context.component(`services`).module(`proteins`);
    context.component(`services`).module(`experiments`);
    context.component(`services`).module(`temperatureReads`);
    context.component(`services`).module(`complexes`);
    context.component(`services`).module(`usermanagement`);
};
