
$(document).ready(() => {
    Promise.resolve()
        .then(() => {
            const fullScreenData = StorageManager.getFullScreenPPISettings();
            console.log('fullScreenData', fullScreenData);
            const ppiDistances = ProteinService.getProteinXProteinDistances(fullScreenData.data.proteinList, fullScreenData.data.experimentList)
                .then(result => {
                    console.log('ppiDistances', result);
                    FullscreenHelper.drawPPITable('ppi-thead', 'ppi-tbody', result, fullScreenData.relativeCorrelation);
                })
        });
});
