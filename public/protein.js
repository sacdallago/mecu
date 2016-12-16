// Build the grid
if(partners.length > 0){
    const grid = $('.grid').isotope({
        // main isotope options
        itemSelector: '.grid-item',
        // set layoutMode
        layoutMode: 'packery',
        packery: {
            gutter: 10
        },
        getSortData: {
            interactionsStrength: '.interactionStrength parseFloat'
        },
        // sort by color then number
        sortBy: 'interactionsStrength',
        sortAscending: false
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

    grid.on( 'click', '.grid-item', function() {
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


    (function(){
        var items = [];

        var originalProtein = protein;

        partners.forEach(function(protein){

            var thisProteinInOriginalProteinInteractionPartners = originalProtein.interactions.partners.find(function(partner){
                return partner.interactor == protein.uniprotId;
            });

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

            html += '<div class="interactionStrength">' + thisProteinInOriginalProteinInteractionPartners.score + '</div>'

            html += '</div>';

            var element = $(html);
            element.data("protein", protein);
            items.push(element[0]);
        });

        grid.isotope('insert', items);
    })();
}

var locMap;
var interMap;
var featuresGeoJSON;


//Interactions helpers

var randomPointInPoly = function(polygon, vs) {
    var bounds = polygon.getBounds(); 
    var x_min  = bounds.getEast();
    var x_max  = bounds.getWest();
    var y_min  = bounds.getSouth();
    var y_max  = bounds.getNorth();

    var x = y_min + (Math.random() * (y_max - y_min));
    var y = x_min + (Math.random() * (x_max - x_min));

    var inside = false;
    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        var xi = vs[i][0], yi = vs[i][1];
        var xj = vs[j][0], yj = vs[j][1];

        var intersect = ((yi > y) != (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }

    if (inside) {
        return [y, x];
    } else {
        return randomPointInPoly(polygon, vs);
    }
};

var addToInteractionMap = function(protein, color){
    var geoLoc = undefined;
    for(var i=0; i < protein.localizations.localizations.length && geoLoc === undefined; i++){
        geoLoc = featuresGeoJSON.find(function(geoLoc){
            return geoLoc.properties.localization == protein.localizations.localizations[i];
        });
    }

    if(geoLoc === undefined){
        // Do nothing!
    } else {
        try {

            var x = 0;
            var y = 0;

            switch(geoLoc.geometry.type){
                case "Polygon":
                    var coords = randomPointInPoly(L.polygon(geoLoc.geometry.coordinates), geoLoc.geometry.coordinates[0]);
                    x = coords[1];
                    y = coords[0];
                    break;
                case "Point":
                    // http://stackoverflow.com/questions/481144/equation-for-testing-if-a-point-is-inside-a-circle
                    var center = geoLoc.geometry.coordinates;
                    var radius = geoLoc.properties.radius;
                    var x_max = center[0]+radius;
                    var x_min = center[0]-radius;

                    var y_max = center[1]+radius;
                    var y_min = center[1]-radius;

                    x = x_min + (Math.random() * (x_max - x_min));
                    y = y_min + (Math.random() * (y_max - y_min));

                    x = x_max;
                    y = y_max;

                    while(Math.pow(x - center[0],2) + Math.pow(y - center[1], 2) > Math.pow(radius, 2)){
                        x = x_min + (Math.random() * (x_max - x_min));
                        y = y_min + (Math.random() * (y_max - y_min));
                    }
                    break;
                case "LineString":
                    var position = Math.floor(Math.random() * geoLoc.geometry.coordinates.length);
                    var a = geoLoc.geometry.coordinates[position];
                    var b = geoLoc.geometry.coordinates[position+1];
                    var reg = regression('linear',[a,b]);

                    var x_max = a[0];
                    var x_min = b[0];

                    if(x_max < b[0]) {
                        x_max = b[0];
                        x_min = a[0];
                    }

                    x = x_min + (Math.random() * (x_max - x_min));

                    y = reg.equation[0]*x + reg.equation[1];

                    break;
            }


            return L.circleMarker([y,x],{
                radius: 6,
                fillColor: color || "gray",
                color: color || "gray",
                opacity: 1,
                fillOpacity: 1,
            });

        } catch (e) {
            // Need to make something smarter here: case point calculation exceeedes heap. Very likely with Polygons!
            console.log(e);
            console.log("Will reload");
            window.location.reload();
        }
    }
};

// Build maps
(function() {
    renderProgress();
    // Wait till I have the localizations
    $.ajax({
        url: '/api/features',
        type: 'GET',
        success: function(results) {
            featuresGeoJSON = results;

            var img = new Image();
            img.src = '/api/maps';

            // Wait untill I have the image
            img.onload = function() {
                var width = this.width;
                var height = this.height;

                while(width > 500 || height > 500){
                    width /= 2;
                    height /= 2;
                }

                var imageBounds = [[0, width], [height, 0]];

                // LOCALIZATIONS MAP
                locMap = L.map('locMap', {
                    maxZoom: 4,
                    minZoom: 0,
                    maxBounds: [[-100, width+100], [height+100, -100]],
                    crs: L.CRS.Simple,
                    zoomControl: false 
                }).setView([height/2, width/2], 1);

                L.imageOverlay(this.src, imageBounds).addTo(locMap);

                // Disable drag and zoom handlers.
                //map.dragging.disable();
                locMap.touchZoom.disable();
                locMap.doubleClickZoom.disable();
                locMap.scrollWheelZoom.disable();
                locMap.keyboard.disable();

                // Disable tap handler, if present.
                if (locMap.tap) locMap.tap.disable();

                // Add features highlight to LocMap
                var featuresLayer = L.geoJson(featuresGeoJSON.filter(function(feature){
                    return protein.localizations.localizations.find(function(loc){
                        return loc == feature.properties.localization;
                    });
                }), {
                    pointToLayer: function (feature, latlng) {
                        return L.circle(latlng, {
                            radius: feature.properties.radius || 6
                        });
                    },
                    style: function(feature) {
                        if(feature.geometry.type == "LineString") {
                            return {
                                fillColor: localizations[feature.properties.localization].color,
                                color: localizations[feature.properties.localization].color,
                                weight: 4,
                                opacity: .8,
                                fillOpacity: .8
                            };
                        } else {
                            return {
                                fillColor: localizations[feature.properties.localization].color,
                                color: localizations[feature.properties.localization].color,
                                weight: 0,
                                opacity: .8,
                                fillOpacity: .8
                            };
                        }
                    }
                });

                featuresLayer.addTo(locMap);

                if(partners.length > 0){
                    // INTERACTIONS MAP
                    interMap = L.map('interMap', {
                        maxZoom: 4,
                        minZoom: 0,
                        maxBounds: [[-100, width+100], [height+100, -100]],
                        crs: L.CRS.Simple,
                        zoomControl: false 
                    }).setView([height/2, width/2], 1);

                    L.imageOverlay(this.src, imageBounds).addTo(interMap);

                    // Disable drag and zoom handlers.
                    //map.dragging.disable();
                    interMap.touchZoom.disable();
                    interMap.doubleClickZoom.disable();
                    interMap.scrollWheelZoom.disable();
                    interMap.keyboard.disable();

                    // Disable tap handler, if present.
                    if (interMap.tap) interMap.tap.disable();

                    var root = addToInteractionMap(protein, "blue");

                    if(root !== undefined){
                        // SET BOTH MAPS TO BE CENTERED IN FIRST LOC
                        interMap.setView(root.getLatLng());
                        locMap.setView(root.getLatLng());

                        partners.forEach(function(partner){
                            var p = addToInteractionMap(partner);
                            if(p !== undefined){
                                p.addTo(interMap);
                                var polyline = L.polyline([root.getLatLng(),p.getLatLng()], {
                                    color: 'gray',
                                    opacity: .5,
                                    dashArray: "1, 15",
                                    weight: 2
                                });

                                polyline.addTo(interMap);
                            }
                        });

                        // Add as last, so it's above everything else
                        root.addTo(interMap);
                    }
                }

                // Fade
                $(".leaflet-image-layer").css("opacity",.1);
                hideProgress();
            }
        }
    });
})();