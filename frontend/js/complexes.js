const DELAY_REQUEST_UNTIL_NO_KEY_PRESSED_FOR_THIS_AMOUNT_OF_TIME = 400;
const UNIPROT_REGEX = /[OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z][0-9]([A-Z][A-Z0-9]{2}[0-9]){1,2}/g;
const ITEM_PER_PAGE_COUNT = 12;
const complexesQuery = {
    search: '',
    limit: ITEM_PER_PAGE_COUNT,
    offset: 0,
    sortBy: 'id',
    order: 'ASC'
};

// search input field
const searchInputComplexName = $('#complex-search');
const searchInputProteinList = $('#protein-list-search');



searchInputComplexName.keydown(function(e) {
    HelperFunctions.delay(() => handleInput(0, true), DELAY_REQUEST_UNTIL_NO_KEY_PRESSED_FOR_THIS_AMOUNT_OF_TIME);
});
searchInputProteinList.keydown(function(e) {
    HelperFunctions.delay(() => handleInput(0, true), DELAY_REQUEST_UNTIL_NO_KEY_PRESSED_FOR_THIS_AMOUNT_OF_TIME);
});

const handleInput = (page, resetOffset) => {

    if(resetOffset) complexesQuery.offset = 0;
    const complexNameInputValue = searchInputComplexName.val().trim();
    const proteinListInputValue = searchInputProteinList.val().trim().match(UNIPROT_REGEX) || [];

    complexesQuery.search = {name: complexNameInputValue, proteinList: proteinListInputValue};

    ComplexService.findComplex(complexesQuery)
        .then(response => {
            console.log('response', response);
            drawComplexTable(response);
            drawPaginationComponent(page+1, response.length > 0 ? response[0].total : 0 );
        })

}

const drawComplexTable = (data) => {

    let table = $('#complex-list-container');
    let tr = $('<tr />').addClass('table-row');
    let td = $('<td />');
    table.empty();

    data.forEach(complex => {
        let row = tr.clone();

        row.append(
            td.clone().text(complex.name),
            td.clone().text(complex.proteins.join(', '))
        )

        row.data('row-data', complex);
        row.click(function(e) {
            const data = $(this).data('row-data');
            console.log('row-data', data);
            document.location.href = `/complex?id=${data.id}`;
        })

        table.append(row);
    })
}

const drawPaginationComponent = (actualPage, totalPages) => {
    new PaginationComponent(
        '#pagination-component',
        totalPages,
        complexesQuery.limit,
        actualPage,
        (newPage) => {
            complexesQuery.offset = (newPage-1)*ITEM_PER_PAGE_COUNT;
            handleInput(newPage-1)
        }
    );
}


$(document).ready(() => {
    searchInputComplexName.trigger('focus');
    searchInputComplexName.trigger($.Event('keydown'));
});