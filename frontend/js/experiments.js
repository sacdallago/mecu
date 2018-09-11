const ITEM_PER_PAGE_COUNT = 10;
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
 * draw the experiments data table from the retrieved data
 * @param  [{id: number, description: string, lysate: boolean, uploader:string}] data               [description]
 * @param  string checkboxIdentifier how should the checkboxes be identified
 */
const drawExperimentsTable = (data, checkboxIdentifier) => {
    let table = $('#experiments-list-container');
    let tr = $('<tr />').addClass('table-row');
    let td = $('<td />');
    let div = $('<div />', {'class': 'ui checkbox'});
    let input = $('<input />', {'class':checkboxIdentifier, 'type':'checkbox', 'tabindex':'0'});
    let label = $('<label />');
    let link = $('<a />', {'target':'_blank'});
    table.empty();
    data.forEach(exp => {
        let row = tr.clone();

        let cbAttriutes = {'id':'cbE'+exp.id, 'data-id':exp.id};

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

        row.data('row-data', exp);

        table.append(row);
        row.click(function(e) {
            console.log('this',$(this).data('row-data'));
            const data = $(this).data('row-data');
            document.location.href = `/experiment?id=${data.id}`;
        })
    });
}

$(document)
    .ready(() => pullPaginatedExperiments(experimentsQuery)
        .then(result => drawPaginationComponent(1, result.count))
    );
