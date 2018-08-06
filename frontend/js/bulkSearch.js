const uniprotAccessionRegex = /[OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z][0-9]([A-Z][A-Z0-9]{2}[0-9]){1,2}/g;
const matchCount = $('.stats > span > strong');
const statsTable = $('pre.statistics');
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

const drawProteinXExperimentTable = (experiments, proteins, data) => {

    // create header of table
    let header = [];
    experiments.forEach(d => header.push(d));
    header.forEach(d => $('#result-table thead tr').append($('<th />').text(d)));

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
    })


    tableData.forEach(tr => {
        let row = $('<tr />')
            .attr({'class':'toggle-protein', 'id':tr.name});
        row.append($('<td />').text(tr.name));
        tr.values.forEach(v => {
            row.append($('<td />').text(v));
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
}
