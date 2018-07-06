/**
 * Created by chdallago on 1/13/17.
 */

 $.fn.api.settings.api = {
     'get list of proteins with experiments and data': '/api/proteins/search/exp/'
 };

const grid = $('.isoGrid').isotope({
    // main isotope options
    itemSelector: '.grid-item',
    // set layoutMode
    layoutMode: 'packery',
    packery: {
        gutter: 10
    }
});

$('.item.proteins').on('click', function(event){
    event.preventDefault();

    var html = '<div class="ui modal">';
    html += '<div class="header">Selected proteins</div>';
    html += '<div class="content">';
    html += '<div class="ui form">';
    html += '<div class="field">';
    html += '<textarea class="">';
    StorageManager.get().forEach(function(protein){
        html += protein.uniprotId + ", ";
    });
    html += '</textarea>';
    html += '</div>';
    html += '<div class="field">';
    html += '<div class="ui submit button">Load proteins</div>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    html += '</div>';

    $(html).modal('show');
});

curves = [];

grid.on('click', '.grid-item', function(){
    let self = this;
    return StorageManager.toggle($(this).data('protein'), function(inStorage, added, removed) {
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

        loadProteins();
    });
});

function loadProteins() {
    let proteins = StorageManager.get();
    console.log('proteins', proteins);
    // proteins = Object.keys(proteins).map(i => ({uniprotId:i, experiment: proteins[i]}))
    // console.log('loadProteins', proteins);

    // Grid
    grid.empty();

    // Curves
    curves = [];

    let items = [];

    proteins.forEach(function(protein) {
        var html = `<div class="grid-item "${protein.experiment.join('E')}
             id="${protein.uniprotId + protein.experiment.join('E')}
             ">`;

        html += '<p style="position: absolute; text-align: center; width: 100%; height: 100%; line-height: 200px; font-size: 1.5rem">' + protein.uniprotId + '</p>';

        if(protein.experiment.length === 1){
            html += '<div class="experimentNumber">' + protein.experiment[0] + '</div>';
        } else {
            // html += '<div class="curvesCount">' + protein.reads.length + '</div>';
        }
        html += '</div>';

        var element = $(html);
        element.data("protein", protein);
        StorageManager.has(protein, function(storage, hasCount) {
            if(hasCount === protein.experiment.length){
                element.addClass('inStore');
            } else if(hasCount > 0) {
                element.addClass('partiallyInStore');
            }
        });
        items.push(element[0]);
    });

    grid.isotope('insert', items);

    proteins.forEach(function(protein) {
        // TODO retrieve data before drawing
        // let curve = new MecuLine({
        //     element: "#"+protein.uniprotId+protein.experiment.join('E'), width:"200", height:"200"
        // });
        //
        // curve.add(protein);
        // curves.push(curve);
    });
};

let globalCurve;
let globalGraph;

function populateGlobalsGraphs(){
    let proteins = StorageManager.splitUpProteins(StorageManager.get());
    console.log('proteins split up', proteins);
    TemperatureService.temperatureReadsToProteinsAndExperimentPairs(proteins)
        .then(data => {
            console.log('data', data);
            globalCurve = new MecuLine({element: "#curvesGraph", minTemp: 37, maxTemp: 65 , axes: true});
            globalCurve.add(data);

            globalGraph = new MecuGraph({element: "#nodesGraph"});
            globalGraph.add(data);
        })
        .catch(error => {
            console.error(error);
            var errorMsg = 'Ajax request failed: ' + xhr.responseText;
            $('#content').html(errorMsg);
        });
}

populateGlobalsGraphs();

loadProteins();

// Change Distance Metrics logic

$('.ui.button.manhattan').on('click', function(event){
    event.preventDefault();

    globalGraph.changeDistanceMetric(Disi.manhattan);
});

$('.ui.button.euclidian').on('click', function(event){
    event.preventDefault();

    globalGraph.changeDistanceMetric(Disi.euclidian);
});

$('.ui.button.supremum').on('click', function(event){
    event.preventDefault();

    globalGraph.changeDistanceMetric(Disi.supremum);
});

$('.ui.button.tanimoto').on('click', function(event){
    event.preventDefault();

    globalGraph.changeDistanceMetric(function(A,B) {
        return 10*(1-Disi.tanimoto(A,B));
    });
});

$('.ui.button.dice').on('click', function(event){
    event.preventDefault();

    globalGraph.changeDistanceMetric(function(A,B) {
        return 10*(1-Disi.dice(A,B));
    });
});

$('.ui.button.cosine').on('click', function(event){
    event.preventDefault();

    globalGraph.changeDistanceMetric(function(A,B) {
        return 20*(1-Disi.cosine(A,B));
    });
});

$('.ui.dropdown.button.minkowski').dropdown({
    action: 'nothing'
});
