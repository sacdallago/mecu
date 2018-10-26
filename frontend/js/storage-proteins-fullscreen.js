const graphIdentifier = '#graph';


function populateGlobalsGraphs(proteinsToDraw, experimentsToDraw, coloringType){

    let proteins = StorageManager.splitUpProteins(StorageManager.getProteins());
    proteins = proteins.filter(p => experimentsToDraw.indexOf(p.experiment) > -1 && proteinsToDraw.indexOf(p.uniprotId) > -1);

    if(proteins.length === 0 || experimentsToDraw.length === 0 || proteinsToDraw.length === 0) {
        $('#curves-chart').empty();
        $('#nodesGraph').empty();
        return;
    }

    TemperatureService.temperatureReadsToProteinsAndExperimentPairs(proteins)
        .then(data => {
            // creating data series for highcharts
            let series = [];
            data.forEach(protein => {
                protein.experiments.forEach(experiment => {
                    series.push({
                        name: protein.uniprotId+' - '+experiment.experiment,
                        data: experiment.reads.map(r => [r.t, r.r]),
                        color: coloringType === 0 ?
                            HelperFunctions.stringToColor(protein.uniprotId):
                            HelperFunctions.stringToColor(experiment.experiment*12+''),
                        marker: {symbol: 'circle'}
                    })
                })
            });

            // configuring and plotting highcharts
            highChartsCurvesConfigObject['title'] = {
                text: 'TPCA melting curve'
            };
            highChartsCurvesConfigObject['xAxis']['title'] = {
                enabled: true,
                text: 'Temperature'
            };
            highChartsCurvesConfigObject['yAxis']['title'] = {
                enabled: true,
                text: '% alive'
            };
            highChartsCurvesConfigObject['series'] = series;
            highChartsCurvesConfigObject['tooltip'] = {
                distance: 30,
                padding: 5,
                formatter: function() {
                    return `<b>${this.series.name}</b><br><b>${this.x}</b> C°<br /><b>${(this.y*100).toFixed(2)}</b> %`;
                }
            };
            console.log('highChartsCurvesConfigObject', highChartsCurvesConfigObject)
            Highcharts.chart(graphIdentifier.slice(1,999), highChartsCurvesConfigObject);
        })
        .catch(error => {
            console.error(error);
        });
}

$(document).ready(() => {
    Promise.resolve()
        .then(() => {
            const fullScreenData = StorageManager.getFullScreenProteinsSettings();
            console.log('fullScreenData', fullScreenData);
            populateGlobalsGraphs(
                fullScreenData.proteins,
                fullScreenData.experiments,
                fullScreenData.coloring
            );
        });
});
