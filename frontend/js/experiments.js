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

const DELAY_REQUEST_UNTIL_NO_KEY_PRESSED_FOR_THIS_AMOUNT_OF_TIME = 400;
const ITEM_PER_PAGE_COUNT = 8;
let experimentsQuery = {
    search: undefined,
    limit: ITEM_PER_PAGE_COUNT,
    offset: 0,
    sortBy: `id`,
    order: 1
};

// search input field
const searchExperiment = $(`#experiment-search`);

searchExperiment.keydown(function() {
    HelperFunctions.delay(() => handleInput(0, true), DELAY_REQUEST_UNTIL_NO_KEY_PRESSED_FOR_THIS_AMOUNT_OF_TIME);
});

const handleInput = (page, resetOffset) => {
    emptyTable();
    lAExperimentsList.start();

    if(resetOffset) experimentsQuery.offset = 0;
    experimentsQuery.search = searchExperiment.val().trim();
    console.log('experimentsQuery', experimentsQuery);

    return ExperimentService.paginatedExperiments(experimentsQuery)
        .then(response => {
            // draw the data retrieved onto the experiments table
            console.log(`response`, response);
            lAExperimentsList.stop();
            drawExperimentsTable(response.data);
            drawPaginationComponent(page+1, response.count > 0 ? response.count : 0 );
            return response;
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
            handleInput(newPage-1);
        }
    );
};

const emptyTable = () => {
    const t = document.querySelector(`#experiments-list-container`);
    while(t.firstChild) {
        t.removeChild(t.firstChild);
    }
};

/**
 * draw the experiments data table from the retrieved data
 * @param  [{id: number, description: string, lysate: boolean, uploader:string}] data               [description]
 * @param  string checkboxIdentifier how should the checkboxes be identified
 */
const drawExperimentsTable = (data) => {
    emptyTable();
    let table = $(`#experiments-list-container`);
    let tr = $(`<tr />`).addClass(`table-row`);
    let td = $(`<td />`);
    let link = $(`<a />`, {'target':`_blank`});

    const addExperimentRedirectListener = (element) => {
        element.click(function() {
            console.log(`this`,$(this).parent().data(`row-data`));
            const data = $(this).parent().data(`row-data`);
            document.location.href = `/experiment?id=${data.id}`;
        });
    };

    data.forEach(exp => {
        let row = tr.clone();

        const idElement = td.clone().text(exp.id);
        addExperimentRedirectListener(idElement);
        row.append(idElement);

        const nameElement = td.clone().text(exp.name)
        addExperimentRedirectListener(nameElement);
        row.append(nameElement);

        const userElement = td.clone().append(
                link.clone()
                    .attr({'href':`https://plus.google.com/`+exp.uploader})
                    .text(`Google Plus Profile`)
            );
        row.append(userElement);

        row.data(`row-data`, exp);

        table.append(row);
    });

};

$(document).ready(() => {
    searchExperiment.trigger(`focus`);
    searchExperiment.trigger($.Event(`keydown`));
});
