
$(document).ready(() => {
    Promise.resolve()
        .then(() => {
            const fullScreenData = StorageManager.getFullScreenPPISettings();
            console.log(`fullScreenData`, fullScreenData);
            ProteinService.getProteinXProteinDistances(fullScreenData.data.proteinList, fullScreenData.data.experimentList)
                .then(result => {
                    console.log(`ppiDistances`, result);
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
