const uniprotAccessionRegex = /[OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z][0-9]([A-Z][A-Z0-9]{2}[0-9]){1,2}/g;
const matchCount = $('.stats > span > strong');
const ITEM_PER_PAGE_COUNT = 10;

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

$(document).ready(
    ExperimentService.paginatedExperiments(experimentsQuery)
        .then(result => {
            // draw the data retrieved onto the experiments table
            drawExperimentsTable(result.data, 'cb');

            // add event handlers to the checkboxes of the experiments table
            addEventHandlerToExperimentsTable('cb');
        })
    );

$('textarea.inline.prompt.maxWidth.textarea')
    .keyup(function(){
        let matches = $(this).val().match(uniprotAccessionRegex);

        selectedProteins = new Set(matches);
        matchCount.text(selectedProteins.size);

        fetchMeltingCurves(Array.from(selectedExperiments), Array.from(selectedProteins));
    });

// $('body').on('click', 'tr[class=toggle-protein]', function() {
//
//     console.log(this, $(this).attr('id'));
//
//     let self = this;
//     const toggleProtein = function(inStorage, added, removed) {
//         if(added === 0){
//             $(self).removeClass('inStore');
//         } else if(removed === 0) {
//             $(self).addClass('inStore');
//         } else {
//             if ($(self).hasClass('inStore')){
//                 $(self).removeClass('inStore');
//             }
//         }
//     };
//
//     console.log('Storage', StorageManager.get());
//
//     // if the localStorage hasn't been deleted yet and there are some proteins in it
//     if(!localStorageDeleted && StorageManager.get().length > 0) {
//         if(confirm("There are Proteins still in the local storage. Do you want to overwrite them?")) {
//             StorageManager.clear();
//             console.log('store cleared');
//             localStorageDeleted = true;
//             selectedExperiments.forEach(v => {
//                 let tmp = {uniprotId:$(this).attr('id'), experiment:v};
//                 console.log('tmp', tmp);
//                 StorageManager.toggle(tmp, toggleProtein);
//             });
//         }
//     } else {
//         console.log('protein toggle', {uniprotId:$(this).attr('id'), experiment:[0]});
//         selectedExperiments.forEach(v => {
//             StorageManager.toggle({uniprotId:$(this).attr('id'), experiment:v}, toggleProtein);
//         });
//     }
//     console.log('localStorage', StorageManager.get(), StorageManager.get().length);
// });

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
        row.append(
            td.clone().append(
                div.clone().append([
                    input.clone().attr({'id':'cbE'+exp.id, 'data-id':exp.id}),
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
    experiments.forEach((e,i,a) =>
        $('#result-table thead tr')
            .append($('<th />')
            .attr({'class':'toggle-experiment', 'data-experiment':e, 'data-exp-id':i})
            .text(e))
        );

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
            tableProt.values[idx] = 1;
            totalRow.values[idx] += 1;
        })
    });

    console.log('tableData', tableData);

    // coloring of column on hover: https://stackoverflow.com/questions/1553571/html-hover-table-column
    tableData.forEach(tr => {
        let row = $('<tr />');
        row.append($('<td />').text(tr.name));
        tr.values.forEach((v,i,a) => {
            row.append($('<td />').attr({'class':'toggle-experiment', 'data-experiment':experiments[i], 'data-exp-id':i}).text(v));
        });
        $('#result-table tbody').append(row);
    })

    // add summary row
    let summaryRow = $('<tr />').append($('<td />').text('Total'));
    totalRow.values.forEach((v,i,a) => {
        totalRow.rating[i] = v/proteins.length;
        summaryRow.append($('<td />').text(v+'/'+proteins.length));
    });
    $('#result-table tbody').append(summaryRow);

    addClickHandlerToProteinExperimentTable('toggle-experiment', tableData, experiments);


    // -----------------HEATMAP-----------------------
    // heatmap for more data: https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/highcharts/demo/heatmap-canvas/
    // configuring and drawing heatmap
    highChartsHeatMapConfigObj.chart.title = {text: null};
    highChartsHeatMapConfigObj['xAxis'] = {
        categories: experiments.map(e => ''+e),
        title: {
            align: 'high',
            offset: 0,
            text: 'Experiments',
            rotation: 0,
            y: 0,
            x: 0 // 20
        }
    };
    highChartsHeatMapConfigObj['yAxis'] = {
        categories: tableData.map(d => d.name), // test [...Array(100).keys()]
        title: {
            align: 'high',
            offset: 0,
            text: 'Proteins',
            rotation: 0,
            y: -10
        }
    };
    let seriesData = [];
    tableData.forEach((d,i,a) => {
        d.values.forEach((v,j,a2) => {
            seriesData.push([j,tableData.length-1-i,v]);
        })
    });
    console.log('seriesData', seriesData);
    highChartsHeatMapConfigObj['series'] = [{
        name: '',
        borderWidth: 1,
        data: seriesData,
        dataLabels: {
            enabled: false,
            color: '#000000'
        }
    }];
    highChartsHeatMapConfigObj['tooltip'] = {
        formatter: function () {
            if (this.point.value === 1) {
                return `Experiment <b>${this.series.xAxis.categories[this.point.x]}</b> has Protein
                <b>${this.series.yAxis.categories[this.point.y]}</b> in it <b>`;
            } else {
                return `Experiment <b>${this.series.xAxis.categories[this.point.x]}</b> does <b>NOT</b> have
                <b>${this.series.yAxis.categories[this.point.y]}</b> Protein in it <b>`;
            }
        }
    };
    highChartsHeatMapConfigObj['plotOptions'] = {
        series: {
            events: {
                click: function(e) {
                    console.log('event', e);
                    let tmpList = [];
                    tableData.forEach(protein => protein.values[e.point.x] === 1 ? tmpList.push(protein.name) : '');
                    saveExperimentToLocalStorage(experiments[e.point.x], tmpList);
                }
            }
        }
    };
    $('#heatmap').attr({'style':'height:500px'});
    Highcharts.chart('heatmap', highChartsHeatMapConfigObj);
}

const addClickHandlerToProteinExperimentTable = (columnCellIdentifier, data, experiments) => {
    const list = document.getElementsByClassName(columnCellIdentifier);
    for(let i = 0; i<list.length; i++) {
        list[i].addEventListener('click', function(e) {
            // console.log('this', this);
            console.log('this', this.getAttribute('data-experiment')); // experimentId
            // console.log('this', this.getAttribute('data-exp-id')); // experimentId
            let arrId = this.getAttribute('data-exp-id');
            let tmpList = [];
            data.forEach(protein => protein.values[arrId] === 1 ? tmpList.push(protein.name) : '');
            saveExperimentToLocalStorage(this.getAttribute('data-experiment'), tmpList);
        })
    }
}

const saveExperimentToLocalStorage = (experiment, proteinList) => {
    // if the localStorage hasn't been deleted yet and there are some proteins in it
    if(!localStorageDeleted && StorageManager.get().length > 0) {
        if(confirm("There are Proteins still in the local storage. Do you want to overwrite them?")) {
            StorageManager.clear();
            console.log('store cleared');
            localStorageDeleted = true;
            proteinList.forEach(protein => {
                console.log('adding', {uniprotId: protein, experiment: experiment});
                StorageManager.toggle({uniprotId: protein, experiment: experiment}, () => {});
            });
        }
    // else just add the protein/experiment pair
    } else {
        proteinList.forEach(protein => {
            console.log('adding', {uniprotId: protein, experiment: experiment});
            StorageManager.toggle({uniprotId: protein, experiment: experiment}, () => {});
        });
    }
}
