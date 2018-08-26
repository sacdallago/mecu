const REGEX_CAN_MATCH_UNIPROTID = /(((?:[OPQ]|$)(?:[0-9]|$)(?:[A-Z0-9]{3}|$)[0-9])|((?:[OPQ]|$)(?:[0-9]|$)(?:[A-Z0-9]{3}|$))|((?:[OPQ]|$)(?:[0-9]|$)))|(((?:[A-NR-Z]|$)(?:[0-9]|$)(?:(([A-Z][A-Z0-9]{2}[0-9]){1,2})|$))|((?:[A-NR-Z]|$)(?:[0-9]|$)))/;
const ITEM_PER_PAGE_COUNT = 25;
const proteinsQuery = {
    search: '',
    limit: ITEM_PER_PAGE_COUNT,
    offset: 0,
    sortBy: 'id',
    order: 1
};

const grid = $('.grid').isotope({
    // main isotope options
    itemSelector: '.grid-item',
    // set layoutMode
    layoutMode: 'packery',
    packery: {
        gutter: 10
    }
});

grid.on('click', '.grid-item', function(){
    const data = $(this).data('protein');
    document.location.href = `/protein?protein=${data.uniprotId}&experiment=${data.experiment.experiment}`;
});

grid.on('click', '.cube', function(event) {
    // Will avoid opening the modal!
    event.stopPropagation();

    // Filter only by selected localization type
    grid.isotope({ filter: "." + $(this).data('localization') });

    // Change button color, text
    $('.clearButton').text("Viewing: " + $(this).data('localization') + ", click to view all");
});

// search input
const searchInput = $('.search-header .search .field');

searchInput.keyup(function(e) {
    delay(() => handleInput(), 300);
})

const handleInput = () => {
    // const currentUri = URI(window.location.href);
    const inputValue = searchInput.val().trim();

    // currentUri.search(proteinsQuery);
    // console.log('currentUri', currentUri);

    if(inputValue.length === 0) {
        console.log('not searching for empty string, or listing all proteins...');
        return;
    }

    let match = inputValue.match(REGEX_CAN_MATCH_UNIPROTID);
    console.log('match', match);
    // regex also matches empty string
    let matched = false;
    match.forEach(v => {
            if((v || '').length > 0) {
                matched = true;
                return true;
            }
        });
    if(matched) {
        console.log('normal query...');
        proteinsQuery.search = inputValue;
        TemperatureService.queryUniprotIdReceiveTemperatureReads(proteinsQuery)
            .then(response => {
                console.log('response', response);
                drawProteinCurves(response);
            })
    } else {
        console.log('requesting from external...');
        ExternalService.getUniprotIdsFromText(inputValue)
            .then(list => {
                console.log('list', list);
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

const drawProteinCurves = (data) => {
    // empty grid on draw
    grid.empty();

    const curves = [];

    const items = [];

    data.forEach(function(responseProtein){
        let proteins = [];

        responseProtein.experiments.forEach(function(experiment){
            proteins.push({
                uniprotId: responseProtein.uniprotId,
                experiments: [experiment]
            });
        });

        proteins.forEach(function(protein) {
            protein.experiments.forEach(expRead => {
                var html = '';

                html += '<div class="grid-item"' + [protein.uniprotId,expRead.experiment].join('E').toLowerCase() +
                    ' id="' + [protein.uniprotId,expRead.experiment].join('E').toLowerCase() + '">';

                html += '<p style="position: absolute; text-align: center; width: 100%; height: 100%; line-height: 200px; font-size: 1.5rem">' + protein.uniprotId + '</p>';
                html += '<div class="cube"></div>';
                html += '<div class="experimentNumber">E' + expRead.experiment + '</div>';
                html += '</div>';

                var element = $(html);
                element.data("protein", {
                    uniprotId: protein.uniprotId,
                    experiment: expRead
                });

                items.push(element[0]);
            })
        });
    });

    grid.isotope('insert', items);

    data.forEach(function(responseProtein){
        let proteins = [];

        responseProtein.experiments.forEach(function(experiment){
            proteins.push({
                uniprotId: responseProtein.uniprotId,
                experiments: [experiment]
            });
        });

        proteins.forEach(function(protein) {
            protein.experiments.forEach(expRead => {
                let curve = new MecuLine({
                    element: "#"+[protein.uniprotId,expRead.experiment].join('E').toLowerCase(),
                    width:"200",
                    height:"200",
                    limit: 5,
                    minTemp: 41,
                    maxTemp: 64,
                    minRatio: 0.1,
                    //maxRatio: 1
                });

                curve.add({
                    uniprotId: protein.uniprotId,
                    experiments: [expRead]
                });

                curves.push(curve);
            })
        });
    });
}

(function(){
    searchInput.trigger('focus');
})();
