/**
 * Created by chdallago on 1/5/17.
 */

module.exports = function(context) {
    const temperatureReadsController = context.component('controllers').module('temperatureReads');
    context.api
        .get('/reads/temperature/search/:id', temperatureReadsController.searchByUniprotId)
        .get('/reads/temperatures', temperatureReadsController.getTemperatures)
        .post('/reads/temperature', temperatureReadsController.getByUniProtIdsAndExerminets);

};