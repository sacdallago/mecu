$(document).ready(() => {
    const currentUri = URI(window.location.href);
    const query = currentUri.search(true);
    console.log('query', query);
    if(query.protein && query.experiment) {
        Promise.all(
            [
                ProteinService.getSpecificProtein(query.protein, query.experiment)
            ]
        )
        .then(([proteinCurveData]) => {
            console.log('proteinCurveData', proteinCurveData);
            drawProtein(proteinCurveData);
        });
    }
})

/**
 * [drawProteinData description]
 * @param  {experiment: number, uniprotId: string, reads: {r:number, t:number}[] } data [description]
 */
const drawProtein = (data) => {

    drawProteinCurve(data);
}

const drawProteinCurve = (protein) => {
    // these 2 functions can eventually be outsourced into own utils(?) file
    let getHashCode = function(str) {
        var hash = 0;
        if (str.length == 0) return hash;
        for (var i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
    };
    let intToHSL = function(inputInt) {
        var shortened = inputInt % 360;
        return "hsl(" + shortened + ",100%,40%)";
    };

    // creating data series for highcharts
    let series = [];
    series.push({
        name: protein.uniprotId+' '+protein.experiment,
        data: protein.reads.map(r => [r.t, r.r]),
        color: getHashCode(protein.uniprotId+"-E"+protein.experiment).intToHSL(),
        marker: {symbol: 'circle'}
    });

    // configuring and plotting highcharts
    highChartsCurvesConfigObject['title.text'] = 'TPCA melting curve';
    highChartsCurvesConfigObject['yAxis.title.text'] = '% alive';
    highChartsCurvesConfigObject['xAxis.title.text'] = 'Temperature';
    highChartsCurvesConfigObject['series'] = series;
    highChartsCurvesConfigObject['tooltip'] = {
        split: true,
        distance: 30,
        padding: 5
    };
    Highcharts.chart('protein-curve', highChartsCurvesConfigObject);
}
