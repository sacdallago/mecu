$.fn.api.settings.api = {
    'get from temperature reads': '/api/reads/temperature/search/{query}'
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

curves = [];

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

$('.clearButton').on('click', function(){
    grid.isotope({ filter: "*"});
    $(this).text("");
});

// Get the searchInput element: used to read the value of it later and reset the URI with the right query
const searchInput = $('.prompt.inline');

$('.ui.search').search({
    apiSettings: {
        action: 'get from temperature reads',

    },
    minCharacters : 2,
    onResultsAdd: function(response) {
        // Don't add HTML
        return false;
    },
    onResults: function(response) {
        // StorageManager.clear();
        // TODO rework with new protein structure
        console.log('response', response);

        //renderProgress();

        // Update URL query
        var currentUri = URI(window.location.href);
        let query = {'q': searchInput.val()};
        currentUri.search(query);

        window.history.replaceState(query, "MeCu", currentUri.resource());

        // Grid
        grid.empty();

        // Curves
        curves = [];

        var items = [];

        response.forEach(function(responseProtein){
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

        response.forEach(function(responseProtein){
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
                        maxTemp: 71,
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

        return false;
    },
});

// Set val of searchInput equal to query element, if any
(function(){
    const currentUri = URI(window.location.href);
    const query = currentUri.search(true);
    if(query && query.q){
        searchInput.val(query.q);
        searchInput.trigger('focus');
    }
})();
