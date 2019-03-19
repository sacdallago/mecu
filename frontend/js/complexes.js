const lAComplexesList = new LoadingAnimation(`#complex-list-container`, {
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
const UNIPROT_SPLIT = /(,|\s)/g;
const ITEM_PER_PAGE_COUNT = 12;
const complexesQuery = {
    search: ``,
    limit: ITEM_PER_PAGE_COUNT,
    offset: 0,
    sortBy: `id`,
    order: `ASC`
};

// search input field
const searchInputComplexName = $(`#complex-search`);
const searchInputProteinList = $(`#protein-list-search`);



searchInputComplexName.keydown(function() {
    HelperFunctions.delay(() => handleInput(0, true), DELAY_REQUEST_UNTIL_NO_KEY_PRESSED_FOR_THIS_AMOUNT_OF_TIME);
});
searchInputProteinList.keydown(function() {
    HelperFunctions.delay(() => handleInput(0, true), DELAY_REQUEST_UNTIL_NO_KEY_PRESSED_FOR_THIS_AMOUNT_OF_TIME);
});

const handleInput = (page, resetOffset) => {

    emptyTable();
    lAComplexesList.start();

    if(resetOffset) complexesQuery.offset = 0;
    const complexNameInputValue = searchInputComplexName.val().trim();
    const proteinListInputValue = searchInputProteinList
        .val().trim().split(UNIPROT_SPLIT).filter(a => a.length > 0) || [];

    complexesQuery.search = {name: complexNameInputValue, proteinList: proteinListInputValue};

    ComplexService.findComplex(complexesQuery)
        .then(response => {
            console.log(`response`, response);
            lAComplexesList.stop();
            drawComplexTable(response);
            drawPaginationComponent(page+1, response.length > 0 ? response[0].total : 0 );
        });

};

const emptyTable = () => {
    const t = document.querySelector(`#complex-list-container`);
    while(t.firstChild) {
        t.removeChild(t.firstChild);
    }
};

const drawComplexTable = (data) => {

    emptyTable();

    let table = $(`#complex-list-container`);
    let tr = $(`<tr />`).addClass(`table-row`);
    let td = $(`<td />`);

    data.forEach(complex => {
        let row = tr.clone();

        row.append(
            td.clone().text(complex.name),
            td.clone().text(complex.proteins.join(`, `))
        );

        row.data(`row-data`, complex);
        row.click(function() {
            const data = $(this).data(`row-data`);
            console.log(`row-data`, data);
            document.location.href = `/complex?id=${data.id}`;
        });

        table.append(row);
    });
};

const drawPaginationComponent = (actualPage, totalPages) => {
    new PaginationComponent(
        `#pagination-component`,
        totalPages,
        complexesQuery.limit,
        actualPage,
        (newPage) => {
            complexesQuery.offset = (newPage-1)*ITEM_PER_PAGE_COUNT;
            handleInput(newPage-1);
        }
    );
};


$(document).ready(() => {
    searchInputComplexName.trigger(`focus`);
    searchInputComplexName.trigger($.Event(`keydown`));
});
