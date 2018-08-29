// TODO pagination for the grid
/*
this regex is one motherfucker
this is the test-data and how I came up with it:
Match these:
P1, P12, P120, P12004
A0, A0A, A0A0, A0A02, A0A022, A0A022, A0A022Y, A0A022YW, A0A022YWF, A0A022YWF9
A2, A2B, A2BC, A2BC1, A2BC19
Regex =
(
((?:[OPQ]|$)(?:[0-9]|$)(?:[A-Z0-9]{3}|$)[0-9])
|((?:[OPQ]|$)(?:[0-9]|$)(?:[A-Z0-9]{1,3}|$))
|((?:[OPQ]+|$)(?:[0-9]|$))
)
|
(
((?:[A-NR-Z]|$)(?:[0-9]|$)(?:([A-Z][A-Z0-9]{1,2}[0-9])|$)(?:([A-Z][A-Z0-9]{0,2}[0-9]?)|$))
|((?:[A-NR-Z]|$)(?:[0-9]|$)(?:(([A-Z][A-Z0-9]{1,2}[0-9]?))|$))
|((?:[A-NR-Z]+|$)(?:[A-Z0-9]{1,2}|$))
)
 */
const REGEX_CAN_MATCH_UNIPROTID = /(((?:[OPQ]|$)(?:[0-9]|$)(?:[A-Z0-9]{3}|$)[0-9])|((?:[OPQ]|$)(?:[0-9]|$)(?:[A-Z0-9]{1,3}|$))|((?:[OPQ]+|$)(?:[0-9]|$)))|(((?:[A-NR-Z]|$)(?:[0-9]|$)(?:([A-Z][A-Z0-9]{1,2}[0-9])|$)(?:([A-Z][A-Z0-9]{0,2}[0-9]?)|$))|((?:[A-NR-Z]|$)(?:[0-9]|$)(?:(([A-Z][A-Z0-9]{1,2}[0-9]?))|$))|((?:[A-NR-Z]+|$)(?:[A-Z0-9]{1,2}|$)))/g;
const ITEM_PER_PAGE_COUNT = 25;
const DELAY_REQUEST_UNTIL_NO_KEY_PRESSED_FOR_THIS_AMOUNT_OF_TIME = 400;
const proteinsQuery = {
    search: '',
    limit: ITEM_PER_PAGE_COUNT,
    offset: 0,
    sortBy: 'id',
    order: 1
};

// search input field
const searchInput = $('.search-header .search .field');

const grid = $('.grid').isotope({
    // main isotope options
    itemSelector: '.grid-item',
    // set layoutMode
    layoutMode: 'packery',
    packery: {
        gutter: 10
    }
});

/**
 * redirect to the protein page of the clicked protein
 */
grid.on('click', '.grid-item', function(){
    const data = $(this).data('grid-item-contents');
    document.location.href = `/protein?protein=${data.obj.uniprotId}&experiment=${data.experiment.experiment}`;
});

/**
 * on keyup in the input field, wait some time, before sending the request
 * this delays the sending the request for 300 ms, every time a key is pressed in the field
 * @param  {[type]} e [description]
 * @return {[type]}   [description]
 */
searchInput.keydown(function(e) {
    delay(() => handleInput(0, true), DELAY_REQUEST_UNTIL_NO_KEY_PRESSED_FOR_THIS_AMOUNT_OF_TIME);
});

/**
 * when some string has been input into the seach field
 * either:
 *  - if it might be a uniprotId    -> send request to our server and search for matching curves
 *  - if it's not a uniprotId       -> send request to external server, convert string into array of
 *      uniprotId's and then request matching curves from our server
 */
const handleInput = (page, resetOffset) => {
    if(resetOffset) proteinsQuery.offset = 0;
    const inputValue = searchInput.val().trim();

    if(inputValue.length === 0) {
        console.log('not searching for empty string, or listing all proteins...');
        return;
    }

    // IMPROVEMENT: at the moment, only the longest matching string, is searched for
    // HOWTO split input string by space, and match that -> this way multiples Proteins could be
    // searched for at the same time
    let match = inputValue.match(REGEX_CAN_MATCH_UNIPROTID).filter(v => !!v || v != '');

    if(match.length) {
        let searchValue = '';
        match.forEach(v => v && v.length > searchValue.length ? searchValue = v : '');
        proteinsQuery.search = searchValue;
        TemperatureService.queryUniprotIdReceiveTemperatureReads(proteinsQuery)
            .then(response => {
                console.log('response', response);
                drawProteinCurves(response.data);
                drawPaginationComponent(page+1, response.total);
            })
    } else {
        console.log('requesting from external...');
        ExternalService.getUniprotIdsFromText(inputValue)
            .then(list => {
                console.log('external service uniprotId list', list);
                proteinsQuery.search = list;
                return proteinsQuery;
            })
            .then(q => TemperatureService.queryUniprotIdReceiveTemperatureReads(q))
            .then(response => {
                console.log('response', response);
                drawProteinCurves(response.data);
                drawPaginationComponent(page+1, response.total);
            });
    }
}

/**
 * draw protein curves
 * @param  {[type]} data [description]
 * @return {[type]}      [description]
 */
const drawProteinCurves = (data) => {

    // split up protein/experiments pairs into protein/experiment(single) pairs
    const proteinExperimentObject = [];
    data.forEach(d => {
        d.experiments.forEach(e => {
            proteinExperimentObject.push({
                uniprotId: d.uniprotId,
                experiments: [e]
            })
        })
    });

    const toAppend = (obj, exp) => {
        return [
            $('<p />')
                .addClass('grid-item-text')
                .css({
                    'position': 'absolute',
                    'text-align': 'center',
                    'width': '100%',
                    'line-height': '35px',
                    'font-size': '1.2rem',
                    'transition-property': 'opacity',
                    'transition-duration': '1s'
                })
                .text(obj.uniprotId),
            $('<div />')
                .addClass(['experimentNumber', 'grid-item-text'])
                .css({
                    'transition-property': 'opacity',
                    'transition-duration': '1s'
                })
                .text('Experiment '+ exp.experiment)
        ];
    };

    HelperFunctions.drawItemForEveryExperiment('.grid', proteinExperimentObject, toAppend);

}

const drawPaginationComponent = (actualPage, totalPages) => {
    new PaginationComponent(
        '#pagination-component',
        totalPages,
        proteinsQuery.limit,
        actualPage,
        (newPage) => {
            proteinsQuery.offset = (newPage-1)*ITEM_PER_PAGE_COUNT;
            handleInput(newPage-1);
        },
        5
    );
}

(function(){
    searchInput.trigger('focus');
})();
