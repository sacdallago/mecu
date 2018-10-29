
$(document).ready(() => {
    Promise.resolve()
        .then(() => {
            const fullScreenData = StorageManager.getFullScreenPPISettings();
            console.log(`fullScreenData`, fullScreenData);
            ProteinService.getProteinXProteinDistances(fullScreenData.data.proteinList, fullScreenData.data.experimentList)
                .then(result => {
                    console.log(`ppiDistances`, result);
                    FullscreenHelper.drawPPITable(`ppi-thead`, `ppi-tbody`, result, fullScreenData.relativeCorrelation);
                });
        });
});
