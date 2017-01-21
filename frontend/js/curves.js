/**
 * Created by chdallago on 1/13/17.
 */

const grid = $('.isoGrid').isotope({
    // main isotope options
    itemSelector: '.grid-item',
    // set layoutMode
    layoutMode: 'packery',
    packery: {
        gutter: 10
    }
});

const changeDistanceModal = function(){
    var html = '<div class="ui modal">';
    html += '<div class="content">';
    html += '<div class="ui  button">Manhattan</div>';
    html += '<div class="ui  button">Euclidian</div>';
    html += '<div class="ui  button">Minkowski</div>';
    html += '</div>';
    html += '</div>';
    $(html).modal('show');
};

$('.item.changeDistanceMetric').on('click', function(event){
    event.preventDefault();

    changeDistanceModal();
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

    // Grid
    grid.empty();

    // Curves
    curves = [];

    let items = [];

    proteins.forEach(function(protein) {
        var html = '';

        html += '<div class="grid-item"' + protein.reads.map(function(expRead){
                return (expRead.experiment + "").replace(/\s|\//g, "_")
            }).join('E') + ' id="' + protein.uniprotId + protein.reads.map(function(expRead){
                return (expRead.experiment + "").replace(/\s|\//g, "_")
            }).join('E') + '">';

        html += '<p style="position: absolute; text-align: center; width: 100%; height: 100%; line-height: 200px; font-size: 1.5rem">' + protein.uniprotId + '</p>';
        if(protein.reads.length > 1){
            // html += '<div class="curvesCount">' + protein.reads.length + '</div>';
        } else {
            html += '<div class="experimentNumber">' + protein.reads[0].experiment + '</div>';
        }
        html += '</div>';

        var element = $(html);
        element.data("protein", protein);
        StorageManager.has(protein, function(storage, hasCount) {
            if(hasCount === protein.reads.length){
                element.addClass('inStore');
            } else if(hasCount > 0) {
                element.addClass('partiallyInStore');
            }
        });
        items.push(element[0]);
    });

    grid.isotope('insert', items);

    proteins.forEach(function(protein) {
        let curve = new MecuLine({element: "#"+protein.uniprotId+protein.reads.map(function(expRead){
            return (expRead.experiment + "").replace(/\s|\//g, "_")
        }).join('E'), width:"200", height:"200"});

        curve.add(protein);
        curves.push(curve);
    });
};

let globalCurve;
let globalGraph;

function populateGlobalsGraphs(){
    let proteins = StorageManager.get();
    globalCurve = new MecuLine({element: "#curvesGraph", minTemp: 37, maxTemp: 64 , axes: true});
    globalCurve.add(proteins);

    globalGraph = new MecuGraph({element: "#nodesGraph"});
    globalGraph.add(proteins);
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

$('.ui.button.minkowski').on('click', function(event){
    event.preventDefault();

    var html = '<div class="ui modal small">';
    html += '<div class="actions">' +
        '<div class="ui input"><input type="number" placeholder="rank"></div>' +
        '<div class="ui approve button">Apply</div>' +
        '</div>';
    html += '</div>';
    $(html).modal('show');

    globalGraph.changeDistanceMetric(function(A,B) {
        return Disi.minkowski(A,B,3);
    });
});