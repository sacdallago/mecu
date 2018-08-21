let localStorageDeleted = StorageManager.get().length === 0;


// grid for experiments which use this protein as well
const grid = $('#experiments-container .grid').isotope({
    // main isotope options
    itemSelector: '.grid-item',
    // set layoutMode
    layoutMode: 'packery',
    packery: {
        gutter: 10
    }
});
grid.on('click', '.grid-item', function(){
    const data = $(this).data('protein');
    let dot = $(this).children('.selected-curve-dot');
    dot.css({'visibility': dot.css('visibility') === 'hidden' ? 'visible' : 'hidden'});
    console.log('data', data.uniprotId, data.experiment.experiment);
    saveExperimentToLocalStorage(data.uniprotId, data.experiment.experiment);
});

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

        ExperimentService.experimentsWhichHaveProtein(query.protein)
            .then(exps => {
                console.log('exps', exps);
                drawOtherExperiments(exps, query.protein, query.experiment);
                TemperatureService.temperatureReads(exps, [query.protein])
                    .then(reads => {
                        console.log('reads', reads);
                        drawExperimentsWhichHaveProtein(reads, query.experiment);
                    })
            });

        ComplexService.getAllComplexesWhichContainProtein(query.protein)
            .then(complexes => {
                console.log('complexes', complexes);
                drawRelatedComplexes(complexes);
            })
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

    $('#protein-data .uniprot-id .value')
        .attr({'target':'_blank', 'href':`https://www.uniprot.org/uniprot/${uniprotId}`})
        .text(uniprotId);
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

const drawOtherExperiments = (experiments, uniprotId, actualExperiment) => {
    const otherExperimentsContainer = $('#other-experiments .other-experiments-container');
    experiments.forEach(e => {
        if(e != actualExperiment) {
            otherExperimentsContainer.append(
                $('<div />').append(
                        $('<a />')
                            .attr({'href':`/protein?protein=${uniprotId}&experiment=${e}`})
                            .text(`Experiment ${e}`)
                    )
                    .addClass('other-experiment')
            )
        }
    })
}

const dateTimeStringPrettify = (dateTime) => {
    const dt = new Date(Date.parse(dateTime));
    return `${dt.getDate()}-${dt.getMonth()+1}-${dt.getFullYear()} ${dt.getHours()}:${dt.getMinutes()}`;
}


/**
 * [drawExperimentsWhichHaveProtein description]
 * @param  {[type]} const [description]
 * @return {[type]}       [description]
 */
const drawExperimentsWhichHaveProtein = (arr, actualExperiment) => {

    // Grid
    grid.empty();

    // Curves
    curves = [];

    let items = [];

    arr.forEach(function(responseProtein){
        let proteins = [];

        responseProtein.experiments.forEach(function(experiment){
            proteins.push({
                uniprotId: responseProtein.uniprotId,
                experiments: [experiment]
            });
        });

        proteins.forEach(function(protein) {
            protein.experiments.forEach(expRead => {
                var html = '';

                html += '<div class="grid-item"' + [protein.uniprotId,expRead.experiment].join('E').toLowerCase() +
                    ' id="' + [protein.uniprotId,expRead.experiment].join('E').toLowerCase() + '">';

                html += '<p style="position: absolute; text-align: center; width: 100%; height: 100%; line-height: 200px; font-size: 1.5rem">' + protein.uniprotId + '</p>';
                html += '<div class="cube"></div>';
                if(expRead.experiment === parseInt(actualExperiment)){
                    html += '<div class="experimentNumber">Actual</div>';
                } else {
                    html += '<div class="experimentNumber">Experiment ' + expRead.experiment + '</div>';
                }
                html += '<div class="selected-curve-dot"></div>';
                html += '</div>';

                let element = $(html);

                element.data("protein", {
                    uniprotId: protein.uniprotId,
                    experiment: expRead
                });

                items.push(element[0]);
            })
        });
    });

    grid.isotope('insert', items);

    arr.forEach(function(responseProtein){
        let proteins = [];

        responseProtein.experiments.forEach(function(experiment){
            proteins.push({
                uniprotId: responseProtein.uniprotId,
                experiments: [experiment]
            });
        });

        proteins.forEach(function(protein) {
            protein.experiments.forEach(expRead => {
                let curve = new MecuLine({
                    element: "#"+[protein.uniprotId,expRead.experiment].join('E').toLowerCase(),
                    width:"200",
                    height:"200",
                    limit: 5,
                    minTemp: 41,
                    maxTemp: 64,
                    minRatio: 0.1,
                    //maxRatio: 1
                });

                curve.add({
                    uniprotId: protein.uniprotId,
                    experiments: [expRead]
                });

                curves.push(curve);
            })
        });
    });

}

const saveExperimentToLocalStorage = (protein, experiment) => {
    // if the localStorage hasn't been deleted yet and there are some proteins in it
    if(!localStorageDeleted && StorageManager.get().length > 0) {
        if(confirm("There are Proteins still in the local storage. Do you want to overwrite them?")) {
            StorageManager.clear();
            console.log('store cleared');
            localStorageDeleted = true;
            console.log('adding', {uniprotId: protein, experiment: experiment});
            StorageManager.toggle({uniprotId: protein, experiment: experiment}, () => {});
        }
    // else just add the protein/experiment pair
    } else {
        console.log('adding', {uniprotId: protein, experiment: experiment});
        StorageManager.toggle({uniprotId: protein, experiment: experiment}, () => {});
    }
}

const drawRelatedComplexes = (complexes) => {
    const relatedComplexesContainer = $('#related-complexes-container');
    if(complexes.length === 0) {
        relatedComplexesContainer.append(
            $('<div />').text('No complexes found which contain this protein.')
        );
        return;
    }
    complexes.forEach(complex => {
        relatedComplexesContainer.append(
            $('<div />').append(
                $('<a />')
                    .attr({'href':`/complex?id=${complex.id}`})
                    .text(complex.id+'   '+complex.name)
            )
        );
    });
}
