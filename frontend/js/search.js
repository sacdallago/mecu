$.fn.api.settings.api = {
    'get from proteins': '/api/proteins/search/{query}'
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

const modal = function(protein){
    var html = '<div class="ui modal">';
    // '<i class="close icon"></i>';
    html += '<div class="header">' + protein.uniprotId + '</div>';
    html += '<div class="content">';
    html += '<p><strong>Primary gene:</strong> ' + protein.geneName + '</p>';
    if(protein.proteinName){
        html += '<p><strong>Protein name:</strong> ' + protein.proteinName + '</p>';
    }
    if(protein.localizations && protein.localizations.localizations && protein.localizations.localizations.length > 0){
        html += '<p><strong>Localizations:</strong> ' + protein.localizations.localizations.map(function(element){return element + " "}) + '</p>';
    }
    if(protein.interactions && protein.interactions.partners && protein.interactions.partners.length > 0){
        html += '<p><strong>Interaction partners:</strong> ' + protein.interactions.partners.map(function(element){return element.interactor + " "}) + '</p>';
    }
    html += '</div>';
    html += '<div class="actions"><a href="/protein/' + protein.uniprotId + '" class="ui approve button">Go to protein page</a></div>';
    html += '</div>';
    $(html).modal('show');
}

grid.on('click', '.grid-item', function() {
    modal($(this).data('protein'));
});

grid.on('click', '.cube', function(event) {
    // Will avoid opening the modal!
    event.stopPropagation();

    // Filter only by selected localization type
    grid.isotope({ filter: "." + $(this).data('localization') })

    // Change button color, text
    $('.locButton').text("Viewing: " + $(this).data('localization') + ", click to view all");
});

$('.locButton').on('click', function(){
    grid.isotope({ filter: "*"});
    $(this).text("");
});

// Get the searchInput element: used to read the value of it later and reset the URI with the right query
const searchInput = $('.prompt.inline');

// Set val of searchInput equal to query element, if any
(function(){
    const currentUri = URI(window.location.href);
    const query = currentUri.search(true);
    if(query && query.q){
        searchInput.val(query.q);
    }
})();

// If I have get proteins from the backend after sending the request, add them to grid
var queryProteins = queryProteins || undefined;
(function(){
    if(queryProteins !== undefined){        
        // Grid
        grid.empty();

        var items = [];

        queryProteins.forEach(function(protein){
            var html = '';

            if(protein.localizations && protein.localizations.localizations && protein.localizations.localizations.length > 0){
                if(!(protein.localizations.localizations.length > 1)){
                    html += '<div class="grid-item ' + protein.localizations.localizations[0].replace(/\s|\//g, "_") + '" style="border-color:' + localizations[protein.localizations.localizations[0]].color + '"><p>' + protein.uniprotId + '</p><div class="cubescontainer">';
                } else {
                    html += '<div class="grid-item ' + protein.localizations.localizations.map(function(localization){
                        return localization.replace(/\s|\//g, "_")
                    }).join(' ') + '"><p>' + protein.uniprotId + '</p><div class="cubescontainer">';
                }

                protein.localizations.localizations.forEach(function(localization){
                    html += '<div class="cube" data-localization="' + localization.replace(/\s|\//g, "_") + '" style="background-color:' + localizations[localization].color + ';"></div>';
                });

                html += '</div>';
            } else {
                html += '<div class="grid-item"><p>' + protein.uniprotId + '</p>'
            }

            if(protein.interactions && protein.interactions.partners && protein.interactions.partners.length > 0){
                html += '<div class="interactionCount">' + protein.interactions.partners.length + '</div>'
            }

            html += '</div>';

            var element = $(html);
            element.data("protein", protein);
            items.push(element[0]);
        });

        grid.isotope('insert', items);
    }
})();


$('.ui.search').search({
    apiSettings: {
        action: 'get from proteins',

    },
    minCharacters : 2,
    onResultsAdd: function(response) {
        // Don't add HTML
        return false;
    },
    onResults: function(response) {

        // Update URL query
        var currentUri = URI(window.location.href);
        currentUri.search({'q': searchInput.val()});

        window.history.replaceState({'q': searchInput.val()}, "CellMap", currentUri.resource());

        // Grid
        grid.empty();

        var items = [];

        response.forEach(function(protein){
            var html = '';

            if(protein.localizations && protein.localizations.localizations && protein.localizations.localizations.length > 0){
                if(!(protein.localizations.localizations.length > 1)){
                    html += '<div class="grid-item ' + protein.localizations.localizations[0].replace(/\s|\//g, "_") + '" style="border-color:' + localizations[protein.localizations.localizations[0]].color + '"><p>' + protein.uniprotId + '</p><div class="cubescontainer">';
                } else {
                    html += '<div class="grid-item ' + protein.localizations.localizations.map(function(localization){
                        return localization.replace(/\s|\//g, "_")
                    }).join(' ') + '"><p>' + protein.uniprotId + '</p><div class="cubescontainer">';
                }

                protein.localizations.localizations.forEach(function(localization){
                    html += '<div class="cube" data-localization="' + localization.replace(/\s|\//g, "_") + '" style="background-color:' + localizations[localization].color + ';"></div>';
                });

                html += '</div>';
            } else {
                html += '<div class="grid-item"><p>' + protein.uniprotId + '</p>'
            }

            if(protein.interactions && protein.interactions.partners && protein.interactions.partners.length > 0){
                html += '<div class="interactionCount">' + protein.interactions.partners.length + '</div>'
            }

            html += '</div>';

            var element = $(html);
            element.data("protein", protein);
            items.push(element[0]);
        });

        grid.isotope('insert', items);

        return false;
    },
});
