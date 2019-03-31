
$(document).ready(() => {
    Promise.resolve()
        .then(() => {
            const fullScreenData = StorageManager.getFullScreenPPISettings();
            console.log(`fullScreenData`, fullScreenData);
            ProteinService.getProteinXProteinDistances(fullScreenData.data.proteinList, fullScreenData.data.experimentList)
                .then(result => {
                    console.log(`ppiDistances`, result);

                    filteredData = result.sort((a,b) => a.interactor1_experiment - b.interactor1_experiment);

                    Heatmap.draw(
                        result,
                        "#heatmap",
                        false,
                        Math.min($(window).width()-40, $(window).height()-40),
                        {bottom: 6, right: 6}
                    );
                });
        });
});
