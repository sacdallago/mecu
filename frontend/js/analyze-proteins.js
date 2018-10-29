let experimentsToDraw = [];
let proteinsToDraw = [];

let ppiTableData = [];
const MAX_ROW_COLS_PPI_TABLE = 11;
let ppiTableRelativeCorrelation = true;

const AMOUNT_OF_PPI_TO_DRAW = 20;

const proteinCurvesGridIdentifier = `.isoGrid`;
const proteinCurvesGrid = $(proteinCurvesGridIdentifier).isotope({
    itemSelector: `.grid-item`,
    layoutMode: `packery`,
    packery: {
        gutter: 10
    }
});

proteinCurvesGrid.on(`click`, `.grid-item`, function(){
    let self = this;
    const content = $(this).data(`grid-item-contents`);
    if(!content) return;
    return StorageManager.toggle(
        [{
            uniprotId: content.obj.uniprotId,
            experiment: content.experiment.experiment
        }],
        function(inStorage, added, removed) {
            if(added === 0){
                $(self).removeClass(`inStore`);
            } else if(removed === 0) {
                $(self).addClass(`inStore`);
            } else {
                if ($(self).hasClass(`inStore`)){
                    $(self).removeClass(`inStore`);
                }
                if (!$(self).hasClass(`partiallyInStore`)){
                    $(self).addClass(`partiallyInStore`);
                }
            }

            populateGlobalsGraphs(getColoringValue());
            loadProteins();
            populateDropdowns();
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
        return (protein.uniprotId + protein.experiments.map(e => e.experiment).join(`E`)).replace(/\s|\//g, `_`);
    };

    TemperatureService.temperatureReadsToProteinsAndExperimentPairs(StorageManager.splitUpProteins(proteins))
        .then(proteins => {

            const proteinExperimentObject = [];
            proteins.forEach(protein => {
                protein.experiments.forEach((experiment, i) => {
                    proteinExperimentObject.push({
                        uniprotId: protein.uniprotId,
                        experiments: [experiment],
                        index: i
                    });
                });
            });

            const toAppend = (obj, exp) => {
                return [
                    $(`<p />`)
                        .addClass(`grid-item-text`)
                        .css({
                            'position': `absolute`,
                            'text-align': `center`,
                            'width': `100%`,
                            'line-height': `35px`,
                            'font-size': `1.2rem`
                        })
                        .text(obj.uniprotId),
                    $(`<div />`)
                        .addClass([`experimentNumber`, `grid-item-text`])
                        .text(`Experiment ${exp.experiment}`),
                    $(`<div />`)
                        .addClass(`selected-curve-dot`)
                ];
            };

            HelperFunctions.drawItemForEveryExperiment(proteinCurvesGridIdentifier, proteinExperimentObject, toAppend, AMOUNT_OF_PPI_TO_DRAW);
        });
}

let globalGraph;

function populateGlobalsGraphs(coloringType){

    let proteins = StorageManager.splitUpProteins(StorageManager.getProteins());
    proteins = proteins.filter(p => experimentsToDraw.indexOf(p.experiment) > -1 && proteinsToDraw.indexOf(p.uniprotId) > -1);

    if(proteins.length === 0 || experimentsToDraw.length === 0 || proteinsToDraw.length === 0) {
        $(`#curves-chart`).empty();
        $(`#nodesGraph`).empty();
        $(`#curves-chart`).append($(`<div />`).addClass(`default-text`).append($(`<div />`).text(`Nothing to display selected`) ));
        return;
    }

    TemperatureService.temperatureReadsToProteinsAndExperimentPairs(proteins)
        .then(data => {
            // creating data series for highcharts
            let series = [];
            data.forEach(protein => {
                protein.experiments.forEach(experiment => {
                    series.push({
                        name: protein.uniprotId+` - `+experiment.experiment,
                        data: experiment.reads.map(r => [r.t, r.r]),
                        color: coloringType === 0 ?
                            HelperFunctions.stringToColor(protein.uniprotId):
                            HelperFunctions.stringToColor(experiment.experiment*12+``),
                        marker: {symbol: `circle`}
                    });
                });
            });

            // configuring and plotting highcharts
            highChartsCurvesConfigObject[`title`] = {
                text: `TPCA melting curve`
            };
            highChartsCurvesConfigObject[`xAxis`][`title`] = {
                enabled: true,
                text: `Temperature`
            };
            highChartsCurvesConfigObject[`yAxis`][`title`] = {
                enabled: true,
                text: `% alive`
            };
            highChartsCurvesConfigObject[`series`] = series;
            highChartsCurvesConfigObject[`tooltip`] = {
                distance: 30,
                padding: 5,
                formatter: function() {
                    return `<b>${this.series.name}</b><br><b>${this.x}</b> C°<br /><b>${(this.y*100).toFixed(2)}</b> %`;
                }
            };
            Highcharts.chart(`curves-chart`, highChartsCurvesConfigObject);

            // plot distances
            // globalGraph = new MecuGraph({element: "#nodesGraph"});
            // globalGraph.add(data);
        })
        .catch(error => {
            console.error(error);
        });
}

const getColoringValue = () => {
    return parseInt(document.querySelector(`#coloring-dropdown .value`).value);
};
const drawExperimentsSelect = (experiments) => {
    const menu = document.querySelector(`#experiments-dropdown .menu`);
    experiments.forEach(exp => {
        let newExp = document.createElement(`div`);
        newExp.classList.add(`item`);
        newExp.setAttribute(`data-value`, exp);
        newExp.innerText = `Experiment `+exp;
        menu.appendChild(newExp);
    });

    document.querySelector(`#experiments-dropdown .value`).setAttribute(`value`, experiments.join(`,`));

    experimentsToDraw = experiments;

    $(`#experiments-dropdown`).dropdown({
        clearable: false,
        onChange: (e) => {
            experimentsToDraw = e.split(`,`).map(e => parseInt(e));
            populateGlobalsGraphs(getColoringValue());
            drawPPITable();
        }
    });
};
const drawProteinsSelect = (proteins) => {
    const menu = document.querySelector(`#proteins-dropdown .menu`);
    proteins.forEach(p => {
        let newProt = document.createElement(`div`);
        newProt.classList.add(`item`);
        newProt.setAttribute(`data-value`, p);
        newProt.innerText = p;
        menu.appendChild(newProt);
    });

    document.querySelector(`#proteins-dropdown .value`).setAttribute(`value`, proteins.join(`,`));

    proteinsToDraw = proteins;

    $(`#proteins-dropdown`).dropdown({
        clearable: false,
        onChange: (e) => {
            proteinsToDraw = e.split(`,`);
            populateGlobalsGraphs(getColoringValue());
            drawPPITable();
        }
    });
};

const drawPPITable = () => {
    const filteredData = ppiTableData.filter(obj => {
        if(
            (proteinsToDraw.indexOf(obj.interactor1) > -1 && experimentsToDraw.indexOf(obj.interactor1_experiment) > -1) &&
            (proteinsToDraw.indexOf(obj.interactor2) > -1 && experimentsToDraw.indexOf(obj.interactor2_experiment) > -1)
        ) {
            return true;
        }
        return false;
    });

    FullscreenHelper.drawPPITable(`ppi-thead`, `ppi-tbody`, filteredData, ppiTableRelativeCorrelation, MAX_ROW_COLS_PPI_TABLE);
};

const populateDropdowns = () => {
    // populate experiments/proteins dropdown
    const inStorage = StorageManager.getProteins();
    const experimentsSet = new Set();
    const proteinsSet = new Set();
    inStorage.forEach(p => {
        proteinsSet.add(p.uniprotId);
        p.experiment.forEach(e => experimentsSet.add(e));
    });
    const proteinList = Array.from(proteinsSet);
    const experimentList = Array.from(experimentsSet);
    drawProteinsSelect(proteinList);
    drawExperimentsSelect(experimentList);

    return {proteinList: proteinList, experimentList: experimentList};
};


$(`#coloring-dropdown`).dropdown({
    onChange: () => {
        populateGlobalsGraphs(getColoringValue());
    }
});

// Change Distance Metrics logic
$(`.ui.button.manhattan`).on(`click`, function(event){
    event.preventDefault();

    globalGraph.changeDistanceMetric(Disi.manhattan);
}).popup({position: `bottom left`});
$(`.ui.button.euclidian`).on(`click`, function(event){
    event.preventDefault();

    globalGraph.changeDistanceMetric(Disi.euclidian);
}).popup({position: `bottom left`});
$(`.ui.button.supremum`).on(`click`, function(event){
    event.preventDefault();

    globalGraph.changeDistanceMetric(Disi.supremum);
}).popup({position: `bottom left`});
$(`.ui.dropdown.button.minkowski`).dropdown({
    action: function(e) {
        const rank = $(`#rank`).val();
        if(rank) {
            console.log(`setting minkowski rank: `, $(`#rank`).val());
            event.preventDefault();
            globalGraph.changeDistanceMetric((a,b) => Disi.minkowski(a,b,rank));
        }

    }
}).popup({position: `bottom left`});

$(`#fullscreen-button-chart`).on(`click`, function() {
    // set storage settings for fullscreen
    StorageManager.setFullScreenProteinsSettings(
        proteinsToDraw,
        experimentsToDraw,
        parseInt(document.querySelector(`#coloring-dropdown .value`).value)
    );

    window.open(`/storage-proteins-fullscreen`, `_blank`);
});
$(`#relative-absolute-corr-button`).on(`click`, function() {
    switch($(`#relative-absolute-corr-button`).text()) {
    case `Relative correlation`:
        ppiTableRelativeCorrelation = true;
        drawPPITable();
        $(`#relative-absolute-corr-button`).text(`Absolute Correlation`);
        break;
    case `Absolute Correlation`:
        ppiTableRelativeCorrelation = false;
        drawPPITable();
        $(`#relative-absolute-corr-button`).text(`Relative correlation`);
        break;

    }
});
$(`#fullscreen-button-ppi`).on(`click`, function() {

    // set storage settings for fullscreen
    StorageManager.setFullscreenPPISettings(
        proteinsToDraw,
        experimentsToDraw,
        $(`#relative-absolute-corr-button`).text() === `Relative correlation`
    );

    window.open(`/ppi-fullscreen`, `_blank`);
});

// on page drawing finished, start requests
$(document).ready(() => {
    const data = populateDropdowns();

    ProteinService.getProteinXProteinDistances(data.proteinList, data.experimentList)
        .then(result => {
            console.log(`ppiDistances`, result);
            // IMPROVEMENT: only save the ones which should be drawn (limited by MAX_ROW_COLS_PPI_TABLE));
            // IMPROVEMENT 2: only request the ones you want to draw!
            ppiTableData = result;
            drawPPITable();
        });

    Promise.resolve()
        .then(() => populateGlobalsGraphs(getColoringValue(), []))
        .then(() => loadProteins());
});
