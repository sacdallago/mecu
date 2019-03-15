module.exports = function(context) {
    const temperatureReadsController = context.component(`controllers`).module(`temperatureReads`);
    context.api
        .get(`/reads/temperatures/raw`, temperatureReadsController.getTemperaturesRaw)
        .get(`/reads/temperatures/raw/:e`, temperatureReadsController.getTemperaturesRaw)
        .post(`/reads/temperature/search`, temperatureReadsController.searchByUniprotId)
    ;

};
