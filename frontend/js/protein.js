$(document).ready(() => {
    const currentUri = URI(window.location.href);
    const query = currentUri.search(true);
    console.log('query', query);
    if(query.protein && query.experiment) {
        ProteinService.getSpecificProtein(query.protein, query.experiment)
            .then(proteinData => {
                console.log('proteinCurveData', proteinData);
                if(Object.keys(proteinData).length > 0) {
                    drawProtein(proteinData);
                }
            });
    }
})

/**
 * [drawProteinData description]
 * @param  {experiment: number, uniprotId: string, reads: {r:number, t:number}[] } data [description]
 */
const drawProtein = (data) => {

    drawProteinCurve(data);
    writeProteinMetaData(data);
}

const drawProteinCurve = ({uniprotId, experiment, reads}) => {
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
        name: uniprotId+' '+experiment,
        data: reads.map(r => [r.t, r.r]),
        color: getHashCode(uniprotId+"-E"+experiment).intToHSL(),
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
    highChartsCurvesConfigObject['legend'] = {enabled: false};
    Highcharts.chart('protein-curve', highChartsCurvesConfigObject);
}

const writeProteinMetaData = ({
        uniprotId, peptides, psms, p_createdAt, p_updatedAt, experiment, description,
        lysate, e_createdAt, e_updatedAt, uploader
    }) => {
    $('#protein-name').text(uniprotId);

    $('#protein-data .uniprot-id .value').text(uniprotId);
    $('#protein-data .peptides .value').text(peptides);
    $('#protein-data .psms .value').text(psms);
    $('#protein-data .created .value').text(dateTimeStringPrettify(p_createdAt));
    $('#protein-data .updated .value').text(dateTimeStringPrettify(p_updatedAt));

    $('#experiment-data .description .value').text(description);
    $('#experiment-data .lysate .value').text(lysate);
    $('#experiment-data .created .value').text(dateTimeStringPrettify(e_createdAt));
    $('#experiment-data .updated .value').text(dateTimeStringPrettify(e_updatedAt));
    $('#experiment-data .uploader .value').attr({'href':'https://plus.google.com/'+uploader})
        .text('Google Plus Profile');
}


const dateTimeStringPrettify = (dateTime) => {
    const dt = new Date(Date.parse(dateTime));
    return `${dt.getDate()}-${dt.getMonth()+1}-${dt.getFullYear()} ${dt.getHours()}:${dt.getMinutes()}`;
}
