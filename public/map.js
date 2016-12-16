var featuresGeoJSON;
var overlayProteins = {};
var map;
var controlLayers;
var underlayingFeatureLayer;

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

var gotoInteractionsButton = function(map){
    L.easyButton({
        position: 'topright',
        states: [{
            stateName: 'gotoInteractions',   // name the state
            icon:      'asterisk icon',          // and define its properties
            title:     'Go to interactions', // like its title
            onClick: function(btn, map) {  // and its callback
                var currentUri = URI(window.location.href);
                window.location.href = '/ppi/' + currentUri.filename() + currentUri.search();
            }
        }]
    }).addTo(map);
};

var renderMap = function(imageId, callback) {
    renderProgress();
    // Wait till I have the localizations
    $.ajax({
        url: '/api/features/' + imageId,
        type: 'GET',
        success: function(results) {
            featuresGeoJSON = results;

            var img = new Image();
            img.src = '/api/maps/' + imageId;

            // Wait untill I have the image
            img.onload = function() {
                var width = this.width;
                var height = this.height;

                while(width > 500 || height > 500){
                    width /= 2;
                    height /= 2;
                }

                var imageBounds = [[0, width], [height, 0]];

                map = L.map('map', {
                    maxZoom: 4,
                    minZoom: 0,
                    maxBounds: [[-100, width+100], [height+100, -100]],
                    crs: L.CRS.Simple
                }).setView([height/2, width/2], 1);

                L.imageOverlay(this.src, imageBounds).addTo(map);

                // Add controls for the layers
                controlLayers = L.control.layers();
                controlLayers.addTo(map);

                // Disable drag and zoom handlers.
                // map.dragging.disable();
                //map.touchZoom.disable();
                //map.doubleClickZoom.disable();
                map.scrollWheelZoom.disable();
                //map.keyboard.disable();

                // Disable tap handler, if present.
                if (map.tap) map.tap.disable();

                // Add fading button
                loadFadingButton(map);
                gotoInteractionsButton(map);

                // Add features highlight
                var featuresLayer = L.geoJson(featuresGeoJSON, {
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

                controlLayers.addOverlay(featuresLayer, "Localizations");

                underlayingFeatureLayer = L.geoJson(featuresGeoJSON, {
                    pointToLayer: function (feature, latlng) {
                        return L.circle(latlng, {
                            radius: feature.properties.radius || 6
                        });
                    },
                    style: function(feature) {
                        if(feature.geometry.type == "LineString") {
                            return {
                                fillColor: "#a7adba",
                                color: "#a7adba",
                                weight: 4,
                                opacity: 0,
                                fillOpacity: 0
                            };
                        } else {
                            return {
                                fillColor: "#a7adba",
                                color: "#a7adba",
                                weight: 0,
                                opacity: 0,
                                fillOpacity: 0
                            };
                        }
                    }
                });

                underlayingFeatureLayer.addTo(map);

                hideProgress();
                callback();
            }
        }
    });
};

var addToMapAndTable = function(protein){
    
    // If the protein is already there, don't add it again!
    if(overlayProteins[protein.uniprotId] !== undefined){
        return;
    }
    
    var mapped = [];
    var unmapped = [];
    var points = [];

    protein.localizations.forEach(function(location){
        var geoLoc = _.find(featuresGeoJSON, function(geoLoc){
            return geoLoc.properties.localization == location;
        });

        if(geoLoc === undefined){
            unmapped.push(location);
        } else {
            try {
                mapped.push(location);

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


                var marker = L.circleMarker([y,x],{
                    radius: 6,
                    fillColor: localizations[location].color,
                    color: localizations[location].color,
                    opacity: 1,
                    fillOpacity: 1,
                });

                // Bind popup to marker and add overlay of feature when clicked.
                var popup = L.popup().setContent('<p><strong>' + protein.uniprotId + "</strong><br><strong>Localizations:</strong> " + protein.localizations + '</p>');
                popup.locations = protein.localizations;
                marker.bindPopup(popup);

                marker.on('popupopen', function(e) {
                    var locs = e.popup.locations;

                    locs.forEach(function(loc){
                        var object = _.find(underlayingFeatureLayer._layers,function(object){
                            return object.feature.properties.localization == loc;
                        });

                        if(object){
                            object.setStyle({
                                opacity: .8,
                                fillOpacity: .8,
                            });
                        }
                    });
                });

                marker.on('popupclose', function(e) {
                    var locs = e.popup.locations;

                    locs.forEach(function(loc){
                        var object = _.find(underlayingFeatureLayer._layers,function(object){
                            return object.feature.properties.localization == loc;
                        });

                        if(object){
                            object.setStyle({
                                opacity: 0,
                                fillOpacity: 0,
                            });
                        }
                    });
                });

                points.push(marker);
            } catch (e) {
                // Need to make something smarter here: case point calculation exceeedes heap. Very likely with Polygons!
                console.log(e);
                console.log("Will reload");
                window.location.reload();
            }
        }
    });

    // HTML table telling which localizations are mapped for protein and which not
    var container = document.getElementById('proteinLocalizationList');
    var tr = document.createElement("tr");

    var proteinTd = document.createElement("td");
    proteinTd.appendChild(document.createTextNode(protein.uniprotId));
    tr.appendChild(proteinTd);

    var mappedTd = document.createElement("td");
    mappedTd.appendChild(document.createTextNode(mapped));
    tr.appendChild(mappedTd);

    var unmappedTd = document.createElement("td");
    unmappedTd.appendChild(document.createTextNode(unmapped));
    tr.appendChild(unmappedTd);

    container.appendChild(tr);
    // END of HTML table

    // HTML table mapping uniprot ID to other identifiers
    $.ajax({
        url: '/api/mappings/uniprot/' + protein.uniprotId,
        type: 'GET',
        success: function(result) {
            if(result){
                var container = document.getElementById('proteinMappingList');
                var tr = document.createElement("tr");

                var proteinTd = document.createElement("td");
                proteinTd.appendChild(document.createTextNode(result.uniprotId));
                tr.appendChild(proteinTd);

                var entryName = document.createElement("td");
                entryName.appendChild(document.createTextNode(result.entryName));
                tr.appendChild(entryName);

                var proteinName = document.createElement("td");
                proteinName.appendChild(document.createTextNode(result.proteinName));
                tr.appendChild(proteinName);
                
                var geneName = document.createElement("td");
                geneName.appendChild(document.createTextNode(result.geneName));
                tr.appendChild(geneName);

                container.appendChild(tr);
            } else {
                console.log("No mapping information for: ", protein.uniprotId);
            }
        }
    });
    // END of HTML table

    overlayProteins[protein.uniprotId] = L.layerGroup(points);

    overlayProteins[protein.uniprotId].addTo(map);
    controlLayers.addOverlay(overlayProteins[protein.uniprotId], protein.uniprotId);
}

var addProteins = function(someProteins){
    someProteins.forEach(function(protein){
        addToMapAndTable(protein);
    });
}

$.fn.api.settings.api = {
    'get from localizations': '/api/localizations/search/{query}',
    'get from mappings': '/api/mappings/search/{query}',
};

$.fn.search.settings.templates.mapping = function(response) {
    var html = '';
    $.each(response.results, function(index, result) {
        html += '' + '<div class="result">';
        html += '<span class="name">' + result.uniprotId + '</span>, ';
        html += '<small> [Entry] ' + result.entryName + '</small>';
        // html += '<small> [Protein] ' + result.proteinName + '</small><br>';
        html += '<small> [Gene] ' + result.geneName + '</small>';
        html += '</div>';
    });
    return html;
}

$.fn.search.settings.templates.localization = function(response) {
    var html = '';
    $.each(response.results, function(index, result) {
        html += '' + '<div class="result">' +
            '<span class="name">' + result.uniprotId + '</span>, ' +
            '<small> [Gene] ' + result.geneName + '</small>' +
            '</div>';
    });
    return html;
}

$('.ui.search').search({
    type: 'localization',
    apiSettings: {
        action: 'get from localizations',
        onResponse: function(response) {
            return {
                results: response
            };
        }
    },
    minCharacters : 2,
    onSelect: function(result, response) {
        addToMapAndTable(result);

        //Add protein to search query in URL
        var currentUri = URI(window.location.href);
        currentUri.addSearch({'p':result.uniprotId});

        window.history.replaceState({'p':result.uniprotId}, "CellMap", currentUri.resource());

        return true;
    }
});

$('.ui.accordion')
    .accordion({
    selector: {
        trigger: '.title'
    }
})
;