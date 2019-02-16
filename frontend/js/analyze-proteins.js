const lACurvesChart = new LoadingAnimation(`#curves-chart`);
const lANodesGraph = new LoadingAnimation(`#nodesGraph`);
const lAPPITable = new LoadingAnimation(`.ppi-table-loading-animation`);
const lAProteinCurves = new LoadingAnimation(`.grid-container`, {size: 50});

let experimentsToDraw = [];
let proteinsToDraw = [];

let ppiTableData = [];
const MAX_ROW_COLS_PPI_TABLE = 11;
let ppiTableRelativeCorrelation = true;

const AMOUNT_OF_PPI_TO_DRAW = 20;

const proteinCurvesGridIdentifier = `.grid-container`;
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

            populateGlobalsGraphs(getColoringValue())
                .then(data => drawProteinsInCubes(data));
            populateDropdowns();
        }
    );
});

function drawProteinsInCubes(proteinsData) {
    // Grid
    lAProteinCurves.start();

    const proteinExperimentObject = [];
    proteinsData.forEach(protein => {
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

    lAProteinCurves.stop();

    HelperFunctions.drawItemForEveryExperiment(proteinCurvesGridIdentifier, proteinExperimentObject, toAppend, AMOUNT_OF_PPI_TO_DRAW);
}

let globalGraph;

function populateGlobalsGraphs(coloringType){

    lACurvesChart.start();
    lANodesGraph.start();

    let proteins = StorageManager.splitUpProteins(StorageManager.getProteins());
    proteins = proteins.filter(p => experimentsToDraw.indexOf(p.experiment) > -1 && proteinsToDraw.indexOf(p.uniprotId) > -1);


    if(proteins.length === 0 || experimentsToDraw.length === 0 || proteinsToDraw.length === 0) {
        $(`#curves-chart`).empty();
        $(`#nodesGraph`).empty();
        $(`#curves-chart`).append($(`<div />`).addClass(`default-text`).append($(`<div />`).text(`Nothing to display selected`) ));
        return;
    }

    return TemperatureService.temperatureReadsToProteinsAndExperimentPairs(proteins)
        .then(data => {

            // creating data series for highcharts
            let series = [];
            data.forEach(protein => {
                protein.experiments.forEach(experiment => {
                    series.push({
                        name: protein.uniprotId+` - `+experiment.experiment,
                        data: experiment.reads.map(r => [r.t, r.r]),
                        color: coloringType === 0 ?
                            HelperFunctions.stringToColor(protein.uniprotId+`-E`+experiment.experiment):
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

            lACurvesChart.stop();
            lANodesGraph.stop();

            Highcharts.chart(`curves-chart`, highChartsCurvesConfigObject);

            // plot distances
            globalGraph = new MecuGraph({element: `#nodesGraph`});
            globalGraph.add(data);


            return data;
        })
        .catch(error => {
            console.error(error);
            return [];
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
    action: function() {
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
}).popup({position: `bottom left`});

// on page drawing finished, start requests
$(document).ready(() => {
    const data = populateDropdowns();

    lAPPITable.start();

    ProteinService.getProteinXProteinDistances(data.proteinList, data.experimentList)
        .then(result => {
            console.log(`ppiDistances`, result);
            // IMPROVEMENT: only save the ones which should be drawn (limited by MAX_ROW_COLS_PPI_TABLE));
            // IMPROVEMENT 2: only request the ones you want to draw!
            ppiTableData = result;

            lAPPITable.stop();

            drawPPITable();
        });

    Promise.resolve()
        .then(() => populateGlobalsGraphs(getColoringValue(), []))
        .then(data => drawProteinsInCubes(data));
});

TourHelper.attachTour('#help-menu-item', [
    {
        target: '#spacedText',
        content: 'This page allows you to analyze your selected proteins. Showing you this works best when you have already a few proteins selected, but I can show you anyway. This page is separated into 4 big sections.',
        placement: ['bottom']
    },
    // 1.selection
    {
        target: '.settings',
        content: 'This part lets you configure WHAT and HOW you see your memorized proteins.',
        placement: ['bottom', 'top']
    },
    {
        before: () => new Promise((resolve, reject) => {
            $('#coloring-dropdown').click();
            setTimeout(() => resolve(), 200);
        }),
        target: '#coloring-dropdown .menu.transition',
        content: 'Here you can choose how your proteins are colored. Either by protein: each protein has it\'s own color and same proteins have the same color. Or by experiment: all proteins of the same experiment have the same color, good for comparing different experiemtns.',
        placement: ['bottom', 'top'],
        after: () => new Promise((resolve, reject) => {
            $('.text-experiments').click();
            setTimeout(() => resolve(), 100);
        })
    },
    {
        target: '#experiments-dropdown',
        content: 'This lets you filter, which experiments you want to select. Removing and adding can be done however one pleases.',
        placement: ['top', 'bottom', 'left']
    },
    {
        target: '#proteins-dropdown',
        content: 'Same with the proteins: removing and adding changes what you see below',
        placement: ['top', 'bottom', 'left']
    },

    // curves
    {
        target: '.curves-graph-container',
        content: 'Here you can see what you configured above. All selected experiments and proteins on the same graph! The graph is interactive and can be hovered over for further details. Each protein curve can be toggled (show/hide).',
        placement: ['right', 'top', 'bottom']
    },
    {
        target: '#fullscreen-button-chart',
        content: 'Clicking here will show you the same graph in a new window in view',
        placement: ['right', 'top', 'left']
    },
    {
        target: '.distances-column',
        content: 'This is a distance graph. Each protein is drawn according to the interaction probability to each other protein. Each protein can be dragged. After releasing it it will try to converge to it\'s correct position. The graph can also be zoomed!',
        placement: ['left', 'top', 'bottom']
    },
    {
        target: '#distance-buttons',
        content: 'Here you can switch, which distance measurement should be used to draw the above graph.',
        placement: ['bottom', 'left', 'top']
    },

    // distance and correlation
    {
        target: '.ppi-table',
        content: 'This table compares each protein to each other. Compared are the distance and the correlation.',
        placement: ['top', 'bottom', 'right']
    },
    {
        target: '.ppi-table',
        content: 'The left (green - white) part of each cell is the distance. Bright green stands for close distance. White a high distance.',
        placement: ['top', 'bottom', 'right']
    },
    {
        target: '.ppi-table',
        content: 'The right (blue - white) part of each cell is the correlation. Blue stands for high correlation. White a low correlation.',
        placement: ['top', 'bottom', 'right']
    },
    {
        target: '#fullscreen-button-ppi',
        content: 'This table can also be viewed in full size, which displays all the proteins (if there are some not displayed here).',
        placement: ['top', 'right', 'bottom']
    },
    {
        target: '#relative-absolute-corr-button',
        content: 'This button toggles, if the correlation should be relative to the now shown proteins, or absolute.',
        placement: ['top', 'right', 'bottom']
    },
    {
        target: '.protein-list',
        content: 'Here you can deselect any protein which you do not want to memorize anymore.',
        placement: ['top', 'right', 'left']
    }
]);
