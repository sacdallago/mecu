let experimentsToDraw = [];
let proteinsToDraw = [];
const AMOUNT_OF_PPI_TO_DRAW = 20;
let ppiTableData = [];
const MAX_ROW_COLS_PPI_TABLE = 12;

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
    if(!data) return;
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

            populateGlobalsGraphs(getColoringValue());
            loadProteins();
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

            HelperFunctions.drawItemForEveryExperiment(proteinCurvesGridIdentifier, proteinExperimentObject, toAppend, AMOUNT_OF_PPI_TO_DRAW);
        });
};

let globalGraph;

function populateGlobalsGraphs(coloringType){

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
                // valueSuffix: '',
                // split: true,
                distance: 30,
                padding: 5,
                formatter: function() {
                    return `<b>${this.series.name}</b><br><b>${this.x}</b> C°<br /><b>${(this.y*100).toFixed(2)}</b> %`;
                }
                // if you want to show the whole line(vertical) in one tooltip
                // formatter: function() {
                //     var s = [];
                //
                //     $.each(this.points, function(i, point) {
                //         s.push('<span style="color:#D31B22;font-weight:bold;">'+ point.series.name +' : '+
                //             point.y +'<span>');
                //     });
                //
                //     return s.join(' and ');
                // },
                // shared: true
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

const getColoringValue = () => {
    return parseInt(document.querySelector('#coloring-dropdown .value').value);
}
const getExperimentsValue = () => {
    return parseInt(document.querySelector('#experiments-dropdown .value').value);
}
const drawExperimentsSelect = (experiments) => {
    const menu = document.querySelector('#experiments-dropdown .menu');
    experiments.forEach(exp => {
        let newExp = document.createElement('div');
        newExp.classList.add('item');
        newExp.setAttribute('data-value', exp);
        newExp.innerText = 'Experiment '+exp;
        menu.appendChild(newExp);
    });

    document.querySelector('#experiments-dropdown .value').setAttribute('value', experiments.join(','));

    experimentsToDraw = experiments;

    $('#experiments-dropdown').dropdown({
        clearable: false,
        onChange: (e) => {
            experimentsToDraw = e.split(',').map(e => parseInt(e));
            populateGlobalsGraphs(getColoringValue());
        }
    });
}
const drawProteinsSelect = (proteins) => {
    const menu = document.querySelector('#proteins-dropdown .menu');
    proteins.forEach(p => {
        let newProt = document.createElement('div');
        newProt.classList.add('item');
        newProt.setAttribute('data-value', p);
        newProt.innerText = p;
        menu.appendChild(newProt);
    });

    document.querySelector('#proteins-dropdown .value').setAttribute('value', proteins.join(','));

    proteinsToDraw = proteins;

    $('#proteins-dropdown').dropdown({
        clearable: false,
        onChange: (e) => {
            proteinsToDraw = e.split(',');
            populateGlobalsGraphs(getColoringValue());
        }
    });
}

const drawPPITable = (relativeCorrelation) => {

    const thead = $('#ppi-thead');
    thead.empty();
    const tbody = $('#ppi-tbody');
    tbody.empty();

    const pPlusE = (obj, id) => obj[id]+'-'+obj[id+'_exp'];
    const extractE = (obj) => {
        return obj.split('-')[1];
    }

    const proteinSet = {};
    ppiTableData.forEach(p => {
        if(!(proteinSet[pPlusE(p,'interactor1')] || []).find(o =>
                o.interactor1 === p.interactor1 &&
                o.interactor2 === p.interactor2 &&
                o.interactor1_exp === p.interactor1_exp &&
                o.interactor2_exp === p.interactor2_exp
            )
        ) {
            proteinSet[pPlusE(p,'interactor1')] ? proteinSet[pPlusE(p,'interactor1')].push(p) : proteinSet[pPlusE(p,'interactor1')] = [p];
        }
        if(!(proteinSet[pPlusE(p,'interactor2')] || []).find(o =>
                o.interactor1 === p.interactor1 &&
                o.interactor2 === p.interactor2 &&
                o.interactor1_exp === p.interactor1_exp &&
                o.interactor2_exp === p.interactor2_exp
            )
        ) {
            proteinSet[pPlusE(p,'interactor2')] ? proteinSet[pPlusE(p,'interactor2')].push(p) : proteinSet[pPlusE(p,'interactor2')] = [p];
        }
    });
    let proteinArray = Object.keys(proteinSet)

    // sort the table rows/columns by experiment
    proteinArray.sort((a,b) => {
        let tmp1 = a.split('-').map(t => t.trim());
        let tmp2 = b.split('-').map(t => t.trim());
        return parseInt(tmp1[1]) > parseInt(tmp2[1]);
    });

    // only show MAX_ROW_COLS_PPI_TABLE
    if(proteinArray.length > MAX_ROW_COLS_PPI_TABLE) {
        proteinArray = proteinArray.slice(0,MAX_ROW_COLS_PPI_TABLE);
    }

    // popuplate header
    const trhead = $('<tr />');
    trhead.append($('<th />'));
    trhead.append(
        proteinArray.map(p =>
            $('<th>')
                .attr({'style': `background-color: ${HelperFunctions.stringToColor(extractE(p)+'000')}`})
                .text(p)
            )
    );
    thead.append(trhead);

    // find out what's min and max of all correlations to be shown
    const minMaxCorr = {min: Number.MAX_SAFE_INTEGER, max: Number.MIN_SAFE_INTEGER};
    if(relativeCorrelation) {
        proteinArray.forEach(p1 =>
            proteinArray.forEach(p2 => {
                proteinSet[p1].forEach(pTmp => {
                    if(pTmp.correlation !== null && pTmp.correlation < minMaxCorr.min) minMaxCorr.min = pTmp.correlation;
                    if(pTmp.correlation !== null && pTmp.correlation > minMaxCorr.max) minMaxCorr.max = pTmp.correlation;
                })
            })
        )
    }

    proteinArray.forEach((p1,i) => {
        const row = $('<tr />').append($('<td />').attr({'style': `background-color: ${HelperFunctions.stringToColor(extractE(p1)+'000')}`}).text(p1));
        for(let empty = 0; empty < i; empty++) {
            row.append($('<td />'));
        }
        proteinArray.slice(i,proteinArray.length).forEach(p2 => {
            const tdata = $('<td />');
            let d;
                    d = proteinSet[p1].find(obj => {

                        return (pPlusE(obj,'interactor1') === p1 && pPlusE(obj,'interactor2') === p2) ||
                            (pPlusE(obj,'interactor1') === p2 && pPlusE(obj,'interactor2') === p1)
                    });
            if(d) {
                tdata.append(
                    $('<div />')
                        .addClass('table-data-content')
                        .append([
                            $('<div />')
                                .text(d.distance.toFixed(2))
                                .addClass('distance-div')
                                .attr({'style': `background-color: rgba(0,255,0, ${1-d.distance})`}),
                            $('<div />')
                                .addClass('correlation-div')
                                .text(d.correlation ? d.correlation.toFixed(2) : '-')
                                .attr({'style': `background-color: rgb(52, 152, 219, ${
                                    relativeCorrelation && d.correlation ?
                                        (d.correlation - minMaxCorr.min) / (minMaxCorr.max - minMaxCorr.min):
                                        d.correlation || 0
                                    })`}),
                        ])
                        .attr({
                            'data-html':`(${d.interactor1} ${d.interactor1_exp}) <-> (${d.interactor2} ${d.interactor2_exp}):<br>
                                Distance: ${d.distance.toFixed(5)}<br>
                                Correlation: ${d.correlation ? d.correlation : 'no data'}`
                        })
                        .popup({position: 'bottom left'})
                    );
            }
            row.append(tdata);
        });

        tbody.append(row);
    })


}

$('#coloring-dropdown').dropdown({
    onChange: () => {
        populateGlobalsGraphs(getColoringValue());
    }
});

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

$('#fullscreen-button').on('click', function() {
    // set storage settings for fullscreen
    StorageManager.setFullScreenProteinsSettings(
        proteinsToDraw,
        experimentsToDraw,
        parseInt(document.querySelector('#coloring-dropdown .value').value)
    );

    window.open(`/storage-proteins-fullscreen`, '_blank');
});
$('#relative-absolute-corr-button').on('click', function() {
    switch($('#relative-absolute-corr-button').text()) {
        case 'Relative correlation':
            drawPPITable(true);
            $('#relative-absolute-corr-button').text('Absolute Correlation');
            break;
        case 'Absolute Correlation':
            drawPPITable(false);
            $('#relative-absolute-corr-button').text('Relative correlation');
            break;

    }
})

// on page drawing finished, start requests
$(document).ready(() => {
    // populate experiments dropdown
    const inStorage = StorageManager.getProteins();
    const experimentsSet = new Set();
    const proteinsSet = new Set();
    inStorage.forEach(p => {
        proteinsSet.add(p.uniprotId);
        p.experiment.forEach(e => experimentsSet.add(e));
    });
    const proteinList = Array.from(proteinsSet);
    const experimentList = Array.from(experimentsSet);
    drawExperimentsSelect(experimentList);
    drawProteinsSelect(proteinList);


    const ppiDistances = ProteinService.getProteinXProteinDistances(proteinList, experimentList)
        .then(result => {
            console.log('ppiDistances', result);
            ppiTableData = result;
            drawPPITable(true);
        })

    Promise.resolve()
        .then(() => populateGlobalsGraphs(getColoringValue(), []))
        .then(() => loadProteins())
        .then(() => {
            return
        });
});
