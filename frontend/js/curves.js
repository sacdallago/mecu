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

function populateGlobalsGraphs(){
    let proteins = StorageManager.get();
    let curve = new MecuLine({element: "#curvesGraph", axes: true});
    curve.add(proteins);

    let graph = new MecuGraph({element: "#nodesGraph"});
    graph.add(proteins);
}

populateGlobalsGraphs();

loadProteins();