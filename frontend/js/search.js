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
const DELAY_REQUEST_UNTIL_NO_KEY_PRESSED_FOR_THIS_AMOUNT_OF_TIME = 300;
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
    const data = $(this).data('protein');
    document.location.href = `/protein?protein=${data.uniprotId}&experiment=${data.experiment.experiment}`;
});

/**
 * on keyup in the input field, wait some time, before sending the request
 * this delays the sending the request for 300 ms, every time a key is pressed in the field
 * @param  {[type]} e [description]
 * @return {[type]}   [description]
 */
searchInput.keydown(function(e) {
    delay(() => handleInput(), DELAY_REQUEST_UNTIL_NO_KEY_PRESSED_FOR_THIS_AMOUNT_OF_TIME);
});

/**
 * when some string has been input into the seach field
 * either:
 *  - if it might be a uniprotId    -> send request to our server and search for matching curves
 *  - if it's not a uniprotId       -> send request to external server, convert string into array of
 *      uniprotId's and then request matching curves from our server
 */
const handleInput = () => {
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
                drawProteinCurves(response);
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
                drawProteinCurves(response);
            });
    }
}

/**
 * draw protein curves
 * @param  {[type]} data [description]
 * @return {[type]}      [description]
 */
const drawProteinCurves = (data) => {
    // empty grid on draw
    grid.empty();

    const curves = [];
    const items = [];

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

    // draw squares for each curve
    proteinExperimentObject.forEach(obj => {
        obj.experiments.forEach(expRead => {
            let html = '';

            html += '<div class="grid-item"' + [obj.uniprotId,expRead.experiment].join('E').toLowerCase() +
                ' id="' + [obj.uniprotId,expRead.experiment].join('E').toLowerCase() + '">';

            html += '<p style="position: absolute; text-align: center; width: 100%; height: 100%; line-height: 200px; font-size: 1.5rem">' + obj.uniprotId + '</p>';
            html += '<div class="cube"></div>';
            html += '<div class="experimentNumber">Experiment ' + expRead.experiment + '</div>';
            html += '</div>';

            var element = $(html);
            element.data("protein", {
                uniprotId: obj.uniprotId,
                experiment: expRead
            });

            items.push(element[0]);
        });
    });

    grid.isotope('insert', items);

    // draw curves into each square
    proteinExperimentObject.forEach(obj => {
        obj.experiments.forEach(expRead => {
            let curve = new MecuLine({
                element: "#"+[obj.uniprotId,expRead.experiment].join('E').toLowerCase(),
                width:"200",
                height:"200",
                limit: 5,
                minTemp: 41,
                maxTemp: 64,
                minRatio: 0.1,
                //maxRatio: 1
            });

            curve.add({
                uniprotId: obj.uniprotId,
                experiments: [expRead]
            });

            curves.push(curve);
        });
    });
}

(function(){
    searchInput.trigger('focus');
})();
