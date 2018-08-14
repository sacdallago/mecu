const uniprotAccessionRegex = /[OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z][0-9]([A-Z][A-Z0-9]{2}[0-9]){1,2}/g;
const matchCount = $('.stats > span > strong');
const ITEM_PER_PAGE_COUNT = 3;

let selectedExperiments = new Set();
let selectedProteins = new Set();
let localStorageDeleted = StorageManager.get().length === 0;
let experimentsQuery = {
    search: undefined,
    limit: ITEM_PER_PAGE_COUNT,
    offset: 0,
    sortBy: 'id',
    order: 1
};

const pullPaginatedExperiments = (query, page) => {
    return ExperimentService.paginatedExperiments(query)
        .then(result => {
            // draw the data retrieved onto the experiments table
            drawExperimentsTable(result.data, 'exp-table-cb');

            // add event handlers to the checkboxes of the experiments table
            addEventHandlerToExperimentsTable('exp-table-cb');
            return result;
        });
}

const drawPaginationComponent = (actualPage, totalPages) => {
    new PaginationComponent(
        '#pagination-component',
        totalPages,
        experimentsQuery.limit,
        actualPage,
        (newPage) => {
            experimentsQuery.offset = (newPage-1)*ITEM_PER_PAGE_COUNT;
            pullPaginatedExperiments(experimentsQuery, newPage)
        }
    );
}

/**
 * fetch melting curves accoring to the experiments and proteins given
 * @param  {number[]} experiments [description]
 * @param  {string[]} proteins    [description]
 * @return { {uniprotId: string, experiments:{experiment: number, reads: {t: number, r: number}[] }[] }[] } list of proteins with the according experiments
 */
const fetchMeltingCurves = function(experiments, proteins){
    const tableBodyIdentifier = '#result-table tbody';
    const tableHeadIdentifier = '#result-table thead tr th:not(:first-child)';

    // always empty table before new request
    $(tableBodyIdentifier).empty();
    $(tableHeadIdentifier).remove();
    if(experiments.length < 1 || proteins.length < 1){
        return;
    }

    experiments = experiments.sort();
    proteins = proteins.sort();

    TemperatureService.temperatureReads(experiments, proteins)
        .then(data => drawProteinXExperimentTable(experiments, proteins, data));
};

/**
 * draw the experiments data table from the retrieved data
 * @param  [{id: number, description: string, lysate: boolean, uploader:string}] data               [description]
 * @param  string checkboxIdentifier how should the checkboxes be identified
 */
const drawExperimentsTable = (data, checkboxIdentifier) => {
    const selectedExperimentsArray = Array.from(selectedExperiments);
    let table = $('#experiments-list-container');
    let tr = $('<tr />');
    let td = $('<td />');
    let div = $('<div />', {'class': 'ui checkbox'});
    let input = $('<input />', {'class':checkboxIdentifier, 'type':'checkbox', 'tabindex':'0'});
    let label = $('<label />');
    let link = $('<a />', {'target':'_blank'});
    table.empty();
    data.forEach(exp => {
        let row = tr.clone();

        // checkbox attributes
        let cbAttriutes = {'id':'cbE'+exp.id, 'data-id':exp.id};
        if(selectedExperimentsArray.indexOf(exp.id) > -1) {
            cbAttriutes.checked = 'true';
        }

        row.append(
            td.clone().append(
                div.clone().append([
                    input.clone().attr(cbAttriutes),
                    label.clone().attr({'for':'cbE'+exp.id})
                ])
            )
        );
        row.append(td.clone().text(exp.id));
        row.append(td.clone().text(exp.description));
        row.append(td.clone().text(exp.lysate));
        row.append(
            td.clone().append(
                link.clone()
                    .attr({'href':'https://plus.google.com/'+exp.uploader})
                    .text('Google Plus Profile')
                )
        );

        table.append(row);
    });
}

/**
 * when checking a checkbox in the experiments table, reload the experiments data
 * @param string checkboxIdentifier
 */
const addEventHandlerToExperimentsTable = (checkboxIdentifier) => {
    let list = document.getElementsByClassName(checkboxIdentifier);
    for(let i = 0; i<list.length; i++) {
        list[i].addEventListener('click', function() {
            if (this.checked) {
                let experimentId = $(this).data('id');
                selectedExperiments.add(experimentId);
                fetchMeltingCurves(Array.from(selectedExperiments), Array.from(selectedProteins));
            } else {
                let experimentId = $(this).data('id');
                selectedExperiments.delete(experimentId);
                fetchMeltingCurves(Array.from(selectedExperiments), Array.from(selectedProteins));
            }
        })
    };
}

/**
 * TODO at the moment draws both the heatmap and the table
 * @param  {[type]} experiments [description]
 * @param  {[type]} proteins    [description]
 * @param  {[type]} data        [description]
 * @return {[type]}             [description]
 */
const drawProteinXExperimentTable = (experiments, proteins, data) => {

    // create header of table
    // experiments.forEach((e,i,a) =>
    //     $('#result-table thead tr')
    //         .append($('<th />')
    //         .attr({'class':'toggle-experiment', 'data-experiment':e, 'data-exp-id':i})
    //         .text(e))
    //     );

    // create table content
    let tableData = [];
    let totalRow = {
        name: 'Total',
        values: new Array(experiments.length).fill(0),
        rating: new Array(experiments.length).fill(0)
    };
    proteins.forEach(p => tableData.push({name: p, values: new Array(experiments.length).fill(0)}));

    data.forEach((d, i, a) => {
        let tableProt = tableData.find(td => td.name === d.uniprotId);

        d.experiments.forEach(e => {
            let idx = experiments.indexOf(e.experiment);
            StorageManager.has({uniprotId: d.uniprotId, experiment: e.experiment},
                (c,h,n) => {
                    if(h == 1) {
                        tableProt.values[idx] = 2; // 2 means: in localStorage
                    } else {
                        tableProt.values[idx] = 1; // 1 means: not in localStorage
                    }
                }
            )
            totalRow.values[idx] += 1;
        })
    });

    // coloring of column on hover: https://stackoverflow.com/questions/1553571/html-hover-table-column
    tableData.forEach(tr => {
        let row = $('<tr />');
        row.append($('<td />').text(tr.name));
        tr.values.forEach((v,i,a) => {
            row.append($('<td />').attr({'class':'toggle-experiment', 'data-experiment':experiments[i], 'data-exp-id':i}).text(v));
        });
        // $('#result-table tbody').append(row);
    })

    // add summary row
    let summaryRow = $('<tr />').append($('<td />').text('Total'));
    totalRow.values.forEach((v,i,a) => {
        totalRow.rating[i] = v/proteins.length;
        summaryRow.append($('<td />').text(v+'/'+proteins.length));
    });

    // FOR NOW: ONLY DRAW HEATMAP
    // $('#result-table tbody').append(summaryRow);
    //
    // addClickHandlerToProteinExperimentTable('toggle-experiment', tableData, experiments);


    // -----------------HEATMAP-----------------------
    // heatmap with total row: https://stackoverflow.com/questions/32978274/does-highchart-heat-map-support-sum-of-values
    // heatmap for more data: https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/highcharts/demo/heatmap-canvas/
    // configuring and drawing heatmap
    highChartsHeatMapConfigObj.title = {text: null};
    highChartsHeatMapConfigObj.xAxis = {
        categories: experiments.map(e => ''+e),
        title: {
            align: 'high',
            offset: 0,
            text: 'Experiments',
            rotation: 0,
            y: 20,
            x: 0 // 20
        }
    };
    highChartsHeatMapConfigObj.yAxis = {
        categories: tableData.map(d => d.name).reverse(), // test [...Array(100).keys()]
        title: {
            align: 'high',
            offset: 0,
            text: 'Proteins',
            rotation: 0,
            y: 0,
            x: -10
        }
    };

    const cNotContained = $('.heatmap-container .legend .c1 .sample').css('background-color');
    const cContained = $('.heatmap-container .legend .c2 .sample').css('background-color');
    const cInStorage = $('.heatmap-container .legend .c3 .sample').css('background-color');

    let nothingSelected = true;
    tableData.forEach(d => d.values.forEach(v => {
        if(v>1){
            nothingSelected = false;
        }
    }));
    let colorAxis = {
        stops: [
            [0, cNotContained],
            [0.5, cContained]
        ]
    };
    if(!nothingSelected) {
        colorAxis.stops.push([1, cInStorage]);
    }
    highChartsHeatMapConfigObj.colorAxis = colorAxis;

    let seriesData = [];
    tableData.forEach((d,i,a) => {
        d.values.forEach((v,j,a2) => {
            if(seriesData[j]) {
                seriesData[j].push([j, tableData.length-1-i, v]);
            } else {
                seriesData[j] = [[j, tableData.length-1-i, v]];
            }
        })
    });
    highChartsHeatMapConfigObj['series'] = seriesData.map((s,i,a) => ({
        name: 'Series '+i,
        borderWidth: .4,
        borderColor: '#95a5a6',
        data: s
    }));
    highChartsHeatMapConfigObj.tooltip = {
        formatter: function () {
            if (this.point.value >= 1) {
                return `Experiment <b>${this.series.xAxis.categories[this.point.x]}</b> has Protein
                <b>${this.series.yAxis.categories[this.point.y]}</b> in it <b>`;
            } else {
                return `Experiment <b>${this.series.xAxis.categories[this.point.x]}</b> does <b>NOT</b> have
                <b>${this.series.yAxis.categories[this.point.y]}</b> Protein in it <b>`;
            }
        }
    };
    highChartsHeatMapConfigObj.plotOptions = {
        series: {
            events: {
                click: function(e) {
                    let tmpList = [];
                    tableData.forEach(protein => protein.values[e.point.x] >= 1 ? tmpList.push(protein.name) : '');
                    saveExperimentToLocalStorage(tmpList, experiments[e.point.x]);
                    drawProteinXExperimentTable(experiments, proteins, data);
                }
            },
            heatmap: {
                states: {
                    hover: {
                        color: '#000000'
                    }
                }
            }
        }
    };

    const colSize = 20;
    const rowSize = 20;
    $('#heatmap').attr(
        {'style':`height:${100+rowSize*proteins.length}px; width:${100+colSize*experiments.length}px`}
    );

    $('.heatmap-container .legend').css('visibility', 'visible');

    Highcharts.chart('heatmap', highChartsHeatMapConfigObj);
}

// const addClickHandlerToProteinExperimentTable = (columnCellIdentifier, data, experiments) => {
//     const list = document.getElementsByClassName(columnCellIdentifier);
//     for(let i = 0; i<list.length; i++) {
//         list[i].addEventListener('click', function(e) {
//             console.log('this', this.getAttribute('data-experiment')); // experimentId
//             let arrId = this.getAttribute('data-exp-id');
//             let tmpList = [];
//             data.forEach(protein => protein.values[arrId] === 1 ? tmpList.push(protein.name) : '');
//             saveExperimentToLocalStorage(tmpList, this.getAttribute('data-experiment'));
//         })
//     }
// }

const saveExperimentToLocalStorage = (proteinList, experiment) => {
    // if the localStorage hasn't been deleted yet and there are some proteins in it
    if(!localStorageDeleted && StorageManager.get().length > 0) {
        if(confirm("There are Proteins still in the local storage. Do you want to overwrite them?")) {
            StorageManager.clear();
            console.log('store cleared');
            localStorageDeleted = true;
            proteinList.forEach(protein => {
                // console.log('adding', {uniprotId: protein, experiment: experiment});
                StorageManager.toggle({uniprotId: protein, experiment: experiment}, () => {});
            });
        }
    // else just add the protein/experiment pair
    } else {
        proteinList.forEach(protein => {
            // console.log('adding', {uniprotId: protein, experiment: experiment});
            StorageManager.toggle({uniprotId: protein, experiment: experiment}, () => {});
        });
    }
}


$(document)
    .ready(() => pullPaginatedExperiments(experimentsQuery)
        .then(result => drawPaginationComponent(1, result.count))
    );

$('textarea.inline.prompt.maxWidth.textarea')
    .keyup(function(){
        let matches = $(this).val().match(uniprotAccessionRegex);

        selectedProteins = new Set(matches);
        matchCount.text(selectedProteins.size);

        fetchMeltingCurves(Array.from(selectedExperiments), Array.from(selectedProteins));
    });
