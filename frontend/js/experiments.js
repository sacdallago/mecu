const ITEM_PER_PAGE_COUNT = 10;
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
            console.log(`result`, result);
            drawExperimentsTable(result.data);

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
 * draw the experiments data table from the retrieved data
 * @param  [{id: number, description: string, lysate: boolean, uploader:string}] data               [description]
 * @param  string checkboxIdentifier how should the checkboxes be identified
 */
const drawExperimentsTable = (data) => {
    let table = $(`#experiments-list-container`);
    let tr = $(`<tr />`).addClass(`table-row`);
    let td = $(`<td />`);
    let link = $(`<a />`, {'target':`_blank`});
    table.empty();
    data.forEach(exp => {
        let row = tr.clone();

        row.append(td.clone().text(exp.id));
        row.append(td.clone().text(exp.name));
        row.append(
            td.clone().append(
                link.clone()
                    .attr({'href':`https://plus.google.com/`+exp.uploader})
                    .text(`Google Plus Profile`)
            )
        );

        row.data(`row-data`, exp);

        table.append(row);
        row.click(function() {
            console.log(`this`,$(this).data(`row-data`));
            const data = $(this).data(`row-data`);
            document.location.href = `/experiment?id=${data.id}`;
        });
    });
};

$(document)
    .ready(() => pullPaginatedExperiments(experimentsQuery)
        .then(result => drawPaginationComponent(1, result.count))
    );
