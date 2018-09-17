const grid = $('.isoGrid').isotope({
    // main isotope options
    itemSelector: '.grid-item',
    // set layoutMode
    layoutMode: 'packery',
    packery: {
        gutter: 10
    }
});

grid.on('click', '.grid-item', function(){
    let self = this;
    return StorageManager.toggle(
        $(this).data('protein'),
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
    grid.empty();

    // load stored proteins
    let proteins = StorageManager.get();
    if(proteins.length === 0) {
        return;
    }

    // move into own (utils?) file
    let createIdOfProt = (protein) => {
        return (protein.uniprotId + protein.experiments.map(e => e.experiment).join('E')).replace(/\s|\//g, '_');
    }

    TemperatureService.temperatureReadsToProteinsAndExperimentPairs(StorageManager.splitUpProteins(proteins))
        .then(proteins => {
            curves = [];

            let items = [];

            proteins.forEach(function(protein) {
                var html = `<div class="grid-item" id="${createIdOfProt(protein)}">`; //"${protein.experiments.map(e => e.experiment).join('E')}"
                html += '<p style="position: absolute; text-align: center; width: 100%; height: 100%; line-height: 200px; font-size: 1.5rem">' + protein.uniprotId + '</p>';

                if(protein.experiments.length === 1){
                    html += '<div class="experimentNumber">' + protein.experiments[0].experiment + '</div>';
                } else {
                    // html += '<div class="curvesCount">' + protein.reads.length + '</div>';
                }
                html += '</div>';

                var element = $(html);
                element.data("protein", protein);
                StorageManager.has(protein, function(storage, hasCount) {
                    if(hasCount === protein.experiments.length){
                        element.addClass('inStore');
                    } else if(hasCount > 0) {
                        element.addClass('partiallyInStore');
                    }
                });
                items.push(element[0]);
            });

            grid.isotope('insert', items);

            // adding lines to the above created divs
            proteins.forEach(function(protein) {
                // TODO the creation of the div and the addition of the MecuLine should be done in one
                // swoop (this step and the step before) -> rework MecuLine?
                let curve = new MecuLine({
                    element: '#'+createIdOfProt(protein), // "#"+
                    width:"200",
                    height:"200",
                    limit: 5,
                    minTemp: 40,
                    maxTemp: 65,
                    minRatio: 0.1
                });

                curve.add(protein);
                curves.push(curve);
            });
        })
};

let globalGraph;

function populateGlobalsGraphs(){
    let proteins = StorageManager.splitUpProteins(StorageManager.get());
    if(proteins.length === 0) {
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
            Highcharts.chart('curvesGraph', highChartsCurvesConfigObject);

            // plot distances
            globalGraph = new MecuGraph({element: "#nodesGraph"});
            globalGraph.add(data);
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
});

$('.ui.button.euclidian').on('click', function(event){
    event.preventDefault();

    globalGraph.changeDistanceMetric(Disi.euclidian);
});

$('.ui.button.supremum').on('click', function(event){
    event.preventDefault();

    globalGraph.changeDistanceMetric(Disi.supremum);
});

$('.ui.button.tanimoto').on('click', function(event){
    event.preventDefault();

    globalGraph.changeDistanceMetric(function(A,B) {
        return 10*(1-Disi.tanimoto(A,B));
    });
});

$('.ui.button.dice').on('click', function(event){
    event.preventDefault();

    globalGraph.changeDistanceMetric(function(A,B) {
        return 10*(1-Disi.dice(A,B));
    });
});

$('.ui.button.cosine').on('click', function(event){
    event.preventDefault();

    globalGraph.changeDistanceMetric(function(A,B) {
        return 20*(1-Disi.cosine(A,B));
    });
});

$('.ui.dropdown.button.minkowski').dropdown({
    action: 'nothing'
});
