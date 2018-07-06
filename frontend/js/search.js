$.fn.api.settings.api = {
    'get from proteins': '/api/proteins/search/{query}',
    'get from temperature reads': '/api/reads/temperature/search/{query}'
};

let aggregate = true;
let showMean = true;

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
    // console.log('store content', StorageManager.get());
    // console.log('this', $(this).data('protein'));
    let self = this;
    return StorageManager.toggle($(this).data('protein'), function(inStorage, added, removed) {
        // console.log('click', inStorage, added, removed);
        // console.log('localStorage', localStorage);
        console.log('Storage', StorageManager.get(), added, removed);
        if(added === 0){
            $(self).removeClass('inStore');
        } else if(removed === 0) {
            $(self).addClass('inStore');
        } else {
            if ($(self).hasClass('inStore')){
                $(self).removeClass('inStore');
            }
            if (!$(self).hasClass('partiallyInStore')){
                $(self).addClass('partiallyInStore');
            }
        }
    });
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
        if(aggregate === false){
            query.a = false;
        }
        if(showMean === false){
            query.m = false;
        }
        currentUri.search(query);

        window.history.replaceState(query, "MeCu", currentUri.resource());

        // Grid
        grid.empty();

        // Curves
        curves = [];

        var items = [];

        response.forEach(function(responseProtein){
            let proteins = [];

            if(aggregate){
                proteins.push(responseProtein);
            } else {
                responseProtein.experiments.forEach(function(experiment){
                    proteins.push({
                        uniprotId: responseProtein.uniprotId,
                        experiments: [experiment]
                    });
                });
            }


            proteins.forEach(function(protein) {
                var html = '';

                html += '<div class="grid-item"' + protein.experiments.map(function(expRead){
                        return (expRead.experiment + "").replace(/\s|\//g, "_")
                    }).join('E') + ' id="' + protein.uniprotId + protein.experiments.map(function(expRead){
                        return (expRead.experiment + "").replace(/\s|\//g, "_")
                    }).join('E') + '">';

                html += '<p style="position: absolute; text-align: center; width: 100%; height: 100%; line-height: 200px; font-size: 1.5rem">' + protein.uniprotId + '</p>';
                html += '<div class="cube"></div>';
                if(protein.experiments.length == 1){
                    html += '<div class="experimentNumber">E' + protein.experiments[0].experiment + '</div>';
                } else if(protein.experiments.length > 5) {
                    let notShowing = protein.experiments.length - 5;
                    html += '<div class="experimentNumber">+' + notShowing + '</div>';
                }
                html += '</div>';

                var element = $(html);
                element.data("protein", {
                    uniprotId: protein.uniprotId,
                    experiment: protein.experiments.map(e => e.experiment)
                });// protein);

                // TODO change this when migrating to new structure
                let tmpProt = {
                    uniprotId: protein.uniprotId,
                    experiment: protein.experiments.map(e => e.experiment)
                };
                StorageManager.has(tmpProt, function(storage, hasCount) {
                    if(hasCount === protein.experiments.length){
                        element.addClass('inStore');
                    } else if(hasCount > 0) {
                        element.addClass('partiallyInStore');
                    }
                });
                items.push(element[0]);
            });
        });

        grid.isotope('insert', items);

        response.forEach(function(responseProtein){
            let proteins = [];

            if(aggregate){
                proteins.push(responseProtein);
            } else {
                responseProtein.experiments.forEach(function(experiment){
                    proteins.push({
                        uniprotId: responseProtein.uniprotId,
                        experiments: [experiment]
                    });
                });
            }

            proteins.forEach(function(protein) {
                let curve = new MecuLine({
                    element: "#"+protein.uniprotId+protein.experiments.map(function(expRead){
                        return (expRead.experiment + "").replace(/\s|\//g, "_")
                    }).join('E'), width:"200", height:"200",
                    limit: 5,
                    minTemp: 41,
                    maxTemp: 71,
                    minRatio: 0.1,
                    //maxRatio: 1
                });

                curve.add(protein);

                // If not aggregated: not more then one curve per box; if no show mean --> no show mean. If only one curve, no mean needed
                if(aggregate === true && showMean === true && protein.experiments.length > 1){
                    curve.toggleAverage();
                }
                curves.push(curve);
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
        if(query.a){
            aggregate = false;
        }
        if(query.m){
            showMean = false;
        }
        searchInput.trigger('focus');
    }
})();

// Aggregate or de-aggregate curves
$('.item.filterExperiments').on('click', function(event){
    event.preventDefault();

    // Update URL query
    var currentUri = URI(window.location.href);
    let query = currentUri.search(true);
    if(aggregate === false){
        query.a = false;
        aggregate = true;
    } else {
        delete query.a;
        aggregate = false;
    }
    currentUri.search(query);

    window.history.replaceState(query, "MeCu", currentUri.resource());

    searchInput.trigger('focus');
});

// Draw or don't draw means
$('.item.showMean').on('click', function(event){
    event.preventDefault();

    // Update URL query
    var currentUri = URI(window.location.href);
    let query = currentUri.search(true);

    if(showMean === false){
        showMean = true;
        delete query.m;
    } else {
        query.m = false;
        showMean = false;
    }

    window.history.replaceState(query, "MeCu", currentUri.resource());

    searchInput.trigger('focus');
});
