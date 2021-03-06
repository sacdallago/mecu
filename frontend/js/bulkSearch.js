const lAExperimentsList = new LoadingAnimation(`#experiments-list-container`, {
    size: 20,
    subElementCreateFunction: () => {
        const highestElement = document.createElement(`tr`);
        const lowestElement = document.createElement(`td`);
        lowestElement.setAttribute(`colspan`, `1`);
        lowestElement.style.display = `flex`;
        lowestElement.style[`justify-content`] = `center`;
        lowestElement.style[`align-items`] = `center`;
        highestElement.appendChild(lowestElement);
        return [highestElement, lowestElement];
    }
});
const lAHeatmap = new LoadingAnimation(`#heatmap`);

const DELAY_REQUEST_UNTIL_NO_KEY_PRESSED_FOR_THIS_AMOUNT_OF_TIME = 400;
const modalIdentifier = `#add-protein-modal`;
ModalService.createAddProteinToLocalStorageModalWithNoYesAddButtons(modalIdentifier);
const analyzeButtonIdentifier = `#analyze-button`;
const uniprotAccessionRegex = /[OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z][0-9]([A-Z][A-Z0-9]{2}[0-9]){1,2}/g;
const matchCount = $(`.stats > span > strong`);
const ITEM_PER_PAGE_COUNT = 10;

let selectedExperiments = new Set();
let selectedProteins = new Set();
let experimentsQuery = {
    search: undefined,
    limit: ITEM_PER_PAGE_COUNT,
    offset: 0,
    sortBy: `id`,
    order: 1
};

const pullPaginatedExperiments = (query) => {
    return ExperimentService.paginatedExperiments(query)
        .then(result => {
            // draw the data retrieved onto the experiments table
            console.log(`experiments data`, result.data);
            drawExperimentsTable(result.data, `exp-table-cb`);

            // add event handlers to the checkboxes of the experiments table
            addEventHandlerToExperimentsTable(`exp-table-cb`);
            return result;
        });
};

const drawPaginationComponent = (actualPage, totalPages) => {
    new PaginationComponent(
        `#pagination-component`,
        totalPages,
        experimentsQuery.limit,
        actualPage,
        (newPage) => {
            experimentsQuery.offset = (newPage-1)*ITEM_PER_PAGE_COUNT;
            pullPaginatedExperiments(experimentsQuery);
        }
    );
};

/**
 * fetch melting curves accoring to the experiments and proteins given
 * @param  {number[]} experiments [description]
 * @param  {string[]} proteins    [description]
 * @return { {uniprotId: string, experiments:{experiment: number, reads: {t: number, r: number}[] }[] }[] } list of proteins with the according experiments
 */
const fetchMeltingCurves = function(experiments, proteins){

    lAHeatmap.start();

    // always empty table before new request
    if(experiments.length < 1 || proteins.length < 1){
        $(`#heatmap`).empty();
        $(`#heatmap`).text(`Here you will see a which experiment has which protein.`);
        return;
    }

    experiments = experiments.sort();
    proteins = proteins.sort();

    const arr = [];
    experiments.forEach(e =>
        proteins.forEach(p => arr.push({uniprotId: p, experiment: e}))
    );

    ProteinService.getProteinExperimentCombinations(arr)
        .then(data => {
            console.log(`getProteinExperimentCombinations`, data);
            return data;
        })
        .then(data => drawProteinXExperimentHeatmap(experiments, proteins, data));
};

/**
 * draw the experiments data table from the retrieved data
 * @param  [{id: number, description: string, lysate: boolean, uploader:string}] data               [description]
 * @param  string checkboxIdentifier how should the checkboxes be identified
 */
const drawExperimentsTable = (data, checkboxIdentifier) => {

    lAExperimentsList.stop();
    if(data.length === 0) {
        const noData = document.createElement(`td`);
        noData.textContent = `No experiments found`;
        document.querySelector(`#experiments-list-container`).appendChild(
            document.createElement(`tr`).appendChild(noData)
        );
    }

    const selectedExperimentsArray = Array.from(selectedExperiments);
    let table = $(`#experiments-list-container`);
    let tr = $(`<tr />`);
    let td = $(`<td />`);
    let div = $(`<div />`, {'class': `ui checkbox`});
    let input = $(`<input />`, {'class':checkboxIdentifier, 'type':`checkbox`, 'tabindex':`0`});
    let label = $(`<label />`);
    let link = $(`<a />`, {'target':`_blank`});
    table.empty();
    data.forEach(exp => {
        let row = tr.clone();

        // checkbox attributes
        let cbAttriutes = {'id':`cbE`+exp.id, 'data-id':exp.id};
        if(selectedExperimentsArray.indexOf(exp.id) > -1) {
            cbAttriutes.checked = `true`;
        }

        row.append(
            td.clone().append(
                div.clone().append([
                    input.clone().attr(cbAttriutes),
                    label.clone().attr({'for':`cbE`+exp.id})
                ])
            )
        );
        row.append(td.clone().text(exp.id));
        row.append(td.clone().addClass(`name`).text(exp.name));
        row.append(td.clone().addClass(`description`).text(
            exp.metaData.description && exp.metaData.description.length > 200 ?
                exp.metaData.description.slice(0,200)+`...` :
                exp.metaData.description));
        row.append(
            td.clone().addClass(`uploader`).append(
                link.clone()
                    .attr({'href':`https://plus.google.com/`+exp.uploader})
                    .text(`Google Plus Profile`)
            )
        );

        table.append(row);
    });
};

/**
 * when checking a checkbox in the experiments table, reload the experiments data
 * @param string checkboxIdentifier
 */
const addEventHandlerToExperimentsTable = (checkboxIdentifier) => {
    let list = document.getElementsByClassName(checkboxIdentifier);
    for(let i = 0; i<list.length; i++) {
        list[i].addEventListener(`click`, function() {
            if (this.checked) {
                let experimentId = $(this).data(`id`);
                selectedExperiments.add(experimentId);
                fetchMeltingCurves(Array.from(selectedExperiments), Array.from(selectedProteins));
            } else {
                let experimentId = $(this).data(`id`);
                selectedExperiments.delete(experimentId);
                fetchMeltingCurves(Array.from(selectedExperiments), Array.from(selectedProteins));
            }
        });
    }
};

/**
 * TODO draw proteinXexperiment heatmap
 * @param  { number[] } experiments list of experiments
 * @param  { string[] } proteins    list of proteins
 * @param  { } data                 data as retrieved from the server
 */
const drawProteinXExperimentHeatmap = (experiments, proteins, data) => {

    // create table content
    let tableData = [];
    let totalRow = {
        name: `Total`,
        values: new Array(experiments.length).fill(0),
        rating: new Array(experiments.length).fill(0)
    };
    proteins.forEach(p => tableData.push({name: p, values: new Array(experiments.length).fill(0)}));

    data.forEach(d => {
        let tableProt = tableData.find(td => td.name === d.uniprotId);

        d.experiments.forEach(e => {
            let idx = experiments.indexOf(e);
            StorageManager.has({uniprotId: d.uniprotId, experiment: e},
                (c,h) => {
                    if(h == 1) {
                        tableProt.values[idx] = 2; // 2 means: in localStorage
                    } else {
                        tableProt.values[idx] = 1; // 1 means: not in localStorage
                    }
                }
            );
            totalRow.values[idx] += 1;
        });
    });

    // -----------------HEATMAP-----------------------
    // heatmap with total row: https://stackoverflow.com/questions/32978274/does-highchart-heat-map-support-sum-of-values
    // heatmap for more data: https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/highcharts/demo/heatmap-canvas/
    // configuring and drawing heatmap
    highChartsHeatMapConfigObj.title = {text: null};
    highChartsHeatMapConfigObj.xAxis = {
        categories: experiments.map(e => ``+e),
        title: {
            align: `high`,
            offset: 0,
            text: `Experiments`,
            rotation: 0,
            y: 20,
            x: 0 // 20
        }
    };
    highChartsHeatMapConfigObj.yAxis = {
        categories: tableData.map(d => d.name).reverse(), // test [...Array(100).keys()]
        title: {
            align: `high`,
            offset: 0,
            text: `Proteins`,
            rotation: 0,
            y: 0,
            x: -10
        },
        endOnTick: false,
        labels: {
            staggerLines: 2
        }
    };

    const cNotContained = $(`.heatmap-container .legend .c1 .sample`).css(`background-color`);
    const cContained = $(`.heatmap-container .legend .c2 .sample`).css(`background-color`);
    const cInStorage = $(`.heatmap-container .legend .c3 .sample`).css(`background-color`);

    // count contained, selected and total protein/experiment pairs, to decide, which color
    // scheme to use (has to do with how highcharts heatmap coloring works)
    let contained = 0;
    let selected = 0;
    let total = 0;
    tableData.forEach(d => d.values.forEach(v => {
        if(v == 1 || v == 2) {
            contained++;
        }
        if(v == 2){
            selected++;
        }
        total++;
    }));
    // console.log('contained/selected/total', contained, selected, total);

    let colorAxis = {};
    // none contained (selected not interesting)
    if(contained == 0) {
        // console.log('none contained (selected not interesting)')
        colorAxis.stops = [
            [0, cNotContained],
            [1, cNotContained]
        ];
    } else
    // all contained and nothing selected
    if(total == contained && selected == 0) {
        // console.log('all contained and nothing selected')
        colorAxis.stops = [
            [0, cContained],
            [1, cContained]
        ];
    } else
    // all contained and some selected
    if(total == contained && selected > 0 && selected < total) {
        // console.log('all contained and some selected')
        colorAxis.stops = [
            [0, cContained],
            [1, cInStorage]
        ];
    } else
    // not all contained and nothing selected
    if(contained != total && selected == 0) {
        // console.log('not all contained and nothing selected')
        colorAxis.stops = [
            [0, cNotContained],
            [1, cContained]
        ];
    } else
    // not all contained and some selected
    if(contained != total && selected > 0 && selected < total) {
        // console.log('not all contained and some selected')
        colorAxis.stops = [
            [0, cNotContained],
            [0.5, cContained],
            [1, cInStorage]
        ];
    } else
    // total == selected
    if(selected == total) {
        // console.log('total == selected')
        colorAxis.stops = [
            [0, cInStorage],
            [1, cInStorage]
        ];
    }
    highChartsHeatMapConfigObj.colorAxis = colorAxis;

    let seriesData = [];
    tableData.forEach((d,i) => {
        d.values.forEach((v,j) => {
            if(seriesData[j]) {
                seriesData[j].push([j, tableData.length-1-i, v]);
            } else {
                seriesData[j] = [[j, tableData.length-1-i, v]];
            }
        });
    });
    highChartsHeatMapConfigObj.series = seriesData.map((s,i,a) => ({
        name: `Series `+i,
        borderWidth: .4,
        borderColor: `#000000`,
        data: s
    }));
    highChartsHeatMapConfigObj.tooltip = {
        useHTML: true,
        formatter: function () {
            if (this.point.value >= 1) {
                return `<div class="custom-chart-tooltip">Experiment <b>${this.series.xAxis.categories[this.point.x]}</b> has Protein
                <b>${this.series.yAxis.categories[this.point.y]}</b> in it <b></div>`;
            } else {
                return `<div class="custom-chart-tooltip">Experiment <b>${this.series.xAxis.categories[this.point.x]}</b> does <b>NOT</b> have
                <b>${this.series.yAxis.categories[this.point.y]}</b> Protein in it <b></div>`;
            }
        }
    };

    highChartsHeatMapConfigObj.plotOptions = {
        series: {
            events: {
                click: function(e) {
                    let tmpList = [];
                    tableData.forEach(protein => protein.values[e.point.x] >= 1 ? tmpList.push(protein.name) : ``);

                    ModalService.openProteinAddModalAndWaitForAction(
                        modalIdentifier,
                        () => {},
                        () => {
                            StorageManager.clear();
                            StorageManager.toggle(
                                tmpList.map(p => ({uniprotId: p, experiment: experiments[e.point.x]})),
                                () => {}
                            );
                            drawProteinXExperimentHeatmap(experiments, proteins, data);
                            enableShowButton();
                        },
                        () => {
                            StorageManager.add(
                                tmpList.map(p => ({uniprotId: p, experiment: experiments[e.point.x]})),
                                () => {}
                            );
                            drawProteinXExperimentHeatmap(experiments, proteins, data);
                            enableShowButton();
                        }
                    );

                }
            },
            heatmap: {
                states: {
                    hover: {
                        color: `#000000`
                    }
                }
            }
        }
    };

    const colSize = 20;
    const rowSize = 27;
    const heatmapHeight = highChartsHeatMapConfigObj.chart.marginTop +
        highChartsHeatMapConfigObj.chart.marginBottom +
        rowSize*proteins.length;
    const heatmapWidth = highChartsHeatMapConfigObj.chart.marginRight +
        highChartsHeatMapConfigObj.chart.marginLeft +
        experiments.length*colSize;
    $(`#heatmap`).attr(
        {'style':`height:${heatmapHeight}px; width:${heatmapWidth}px`}
    );

    lAHeatmap.stop();

    Highcharts.chart(`heatmap`, highChartsHeatMapConfigObj);
};

const enableShowButton = () => {
    $(analyzeButtonIdentifier).removeClass(`disabled`).addClass(`green`);
};

const populateProteinSearch = () => {
    const text = Array.from(selectedProteins).reduce((acc,c) => acc+=(c+` `), ``);
    $(`textarea.protein-list`).val(text);
};

$(`textarea.inline.prompt.maxWidth.textarea`)
    .keyup(function(){
        let matches = $(this).val().match(uniprotAccessionRegex);

        selectedProteins = new Set(matches);
        matchCount.text(selectedProteins.size);

        HelperFunctions.delay(
            () => fetchMeltingCurves(Array.from(selectedExperiments), Array.from(selectedProteins)),
            DELAY_REQUEST_UNTIL_NO_KEY_PRESSED_FOR_THIS_AMOUNT_OF_TIME
        );
    });

const startLoading = () => Promise.resolve()
    .then(() => {
        selectedExperiments = new Set();
        selectedProteins = new Set();
        
        // populate selectedProteins and selectedExperiments with the data from localStorage
        const storageData = StorageManager.getProteins();

        storageData.forEach(proteinWithExperimentsList => {
            selectedProteins.add(proteinWithExperimentsList.uniprotId);
            proteinWithExperimentsList.experiment.forEach(experiment => selectedExperiments.add(experiment));
        });

        if(storageData.length > 0) {
            enableShowButton();
        }

        lAExperimentsList.start();
    })
    .then(() => populateProteinSearch())
    .then(() => pullPaginatedExperiments(experimentsQuery))
    .then(result => drawPaginationComponent(1, result.count))
    .then(() => fetchMeltingCurves(Array.from(selectedExperiments), Array.from(selectedProteins)))


$(document).ready(() => startLoading());



let proteinsToSaveWhileInTour;
TourHelper.attachTour(
    '#help-menu-item',
    [
        {
            target: '#spacedText',
            content: 'This page is an advanced search page.',
            placement: ['bottom']
        },
        {
            before: () => {
                proteinsToSaveWhileInTour = StorageManager.getProteinsRaw();
                StorageManager.setProteinsRaw({"P12004":[4,5,6,7,8],"P00374":[4,5,6,7,8],"P00015":[9],"P00403":[4,5,6,7,8],"P00493":[9],"P00750":[4,7],"P01036":[5,7],"P01583":[4]});
                return startLoading();
            },
            target: '#experiment-list',
            content: 'First select which experiments you are interested in by checking the box to the left.',
            placement: ['bottom']
        },
        {
            target: '#protein-input',
            content: 'Then enter a list of UniProt Accession numbers of interest (tab, comma or space separated).',
            placement: ['bottom']
        },
        {
            target: '#heatmap',
            content: 'Here you can see which proteins from your list have been studied in an experiment.',
            placement: ['bottom']
        },
        {
            target: '#heatmap',
            content: 'Clicking on an item in the matrix will add the corresponding experiment (column) for later visualization.',
            placement: ['bottom']
        },
        {
            target: '#analyze-button',
            content: 'Clicking this button, you can proceed to the visualization tools.',
            placement: ['bottom']
        }
    ],
    () => {
        StorageManager.setProteinsRaw(proteinsToSaveWhileInTour);
        return startLoading();
    },
    () => {
        StorageManager.setProteinsRaw(proteinsToSaveWhileInTour);
        return startLoading();
    }
);
