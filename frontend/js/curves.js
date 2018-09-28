const proteinCurvesGridIdentifier = '.isoGrid';
const proteinCurvesGrid = $(proteinCurvesGridIdentifier).isotope({
    itemSelector: '.grid-item',
    layoutMode: 'packery',
    packery: {
        gutter: 10
    }
});

proteinCurvesGrid.on('click', '.grid-item', function(){
    let self = this;
    const content = $(this).data('grid-item-contents');
    console.log('item contents', content);
    return StorageManager.toggle(
        [{
            uniprotId: content.obj.uniprotId,
            experiment: content.experiment.experiment
        }],
        function(inStorage, added, removed) {
            if(added === 0){
                $(self).removeClass('inStore');
            } else if(removed === 0) {
                $(self).addClass('inStore');
            } else {
                if ($(self).hasClass('inStore')){
                    $(self).removeClass('inStore');
                }
                if (!$(self).hasClass('partiallyInStore')){
                    $(self).addClass('partiallyInStore');
                }
            }

            loadProteins();
            populateGlobalsGraphs();
        }
    );
});

function loadProteins() {
    // Grid
    proteinCurvesGrid.empty();

    // load stored proteins
    let proteins = StorageManager.getProteins();
    if(proteins.length === 0) {
        return;
    }

    // move into own (utils?) file
    let createIdOfProt = (protein) => {
        return (protein.uniprotId + protein.experiments.map(e => e.experiment).join('E')).replace(/\s|\//g, '_');
    }

    TemperatureService.temperatureReadsToProteinsAndExperimentPairs(StorageManager.splitUpProteins(proteins))
        .then(proteins => {

            const proteinExperimentObject = [];
            let index = 0;
            proteins.forEach(protein => {
                protein.experiments.forEach((experiment, i, a) => {
                    proteinExperimentObject.push({
                        uniprotId: protein.uniprotId,
                        experiments: [experiment],
                        index: i
                    });
                });
            });

            const toAppend = (obj, exp) => {
                return [
                    $('<p />')
                        .addClass('grid-item-text')
                        .css({
                            'position': 'absolute',
                            'text-align': 'center',
                            'width': '100%',
                            'line-height': '35px',
                            'font-size': '1.2rem'
                        })
                        .text(obj.uniprotId),
                    $('<div />')
                        .addClass(['experimentNumber', 'grid-item-text'])
                        .text(`Experiment ${exp.experiment}`),
                    $('<div />')
                        .addClass('selected-curve-dot')
                ];
            };

            HelperFunctions.drawItemForEveryExperiment(proteinCurvesGridIdentifier, proteinExperimentObject, toAppend);
        });
};

let globalGraph;

function populateGlobalsGraphs(){
    let proteins = StorageManager.splitUpProteins(StorageManager.getProteins());
    if(proteins.length === 0) {
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
                        name: protein.uniprotId+' '+experiment.experiment,
                        data: experiment.reads.map(r => [r.t, r.r]),
                        color: HelperFunctions.stringToColor(protein.uniprotId+"-E"+experiment.experiment),
                        marker: {symbol: 'circle'}
                    })
                })
            });

            // configuring and plotting highcharts
            highChartsCurvesConfigObject['title.text'] = 'TPCA melting curve';
            highChartsCurvesConfigObject['yAxis.title.text'] = '% alive';
            highChartsCurvesConfigObject['xAxis.title.text'] = 'Temperature';
            highChartsCurvesConfigObject['series'] = series;
            highChartsCurvesConfigObject['tooltip'] = {
                // valueSuffix: '',
                split: true,
                distance: 30,
                padding: 5
            };
            Highcharts.chart('curves-chart', highChartsCurvesConfigObject);

            // plot distances
            // globalGraph = new MecuGraph({element: "#nodesGraph"});
            // globalGraph.add(data);
        })
        .catch(error => {
            console.error(error);
        });
}

populateGlobalsGraphs();

loadProteins();

// Change Distance Metrics logic
$('.ui.button.manhattan').on('click', function(event){
    event.preventDefault();

    globalGraph.changeDistanceMetric(Disi.manhattan);
}).popup({position: 'bottom left'});
$('.ui.button.euclidian').on('click', function(event){
    event.preventDefault();

    globalGraph.changeDistanceMetric(Disi.euclidian);
}).popup({position: 'bottom left'});
$('.ui.button.supremum').on('click', function(event){
    event.preventDefault();

    globalGraph.changeDistanceMetric(Disi.supremum);
}).popup({position: 'bottom left'});
$('.ui.dropdown.button.minkowski').dropdown({
    action: function(e) {
        const rank = $('#rank').val();
        if(rank) {
            console.log('setting minkowski rank: ', $('#rank').val());
            event.preventDefault();
            globalGraph.changeDistanceMetric((a,b) => Disi.minkowski(a,b,rank));
        }

    }
}).popup({position: 'bottom left'});
});
