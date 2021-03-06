module.exports = function(context) {
    const temperatureReadsController = context.component(`controllers`).module(`temperatureReads`);
    context.api
        .get(`/reads/temperatures/raw`, temperatureReadsController.getTemperaturesRaw)
        .post(`/reads/temperature/search`, temperatureReadsController.searchByUniprotId);
};
