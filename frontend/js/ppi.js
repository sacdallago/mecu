var featuresGeoJSON;
var overlayProteins = {};
var map;
var controlLayers;
var connections = {};
var networkLayer;

var PPINButton = function(map){
    L.easyButton({
        states: [{
            stateName: 'loadPPIN',   // name the state
            icon:      'Circle icon',          // and define its properties
            title:     'Global network', // like its title
            onClick: function(btn, map) {  // and its callback
                renderProgress();
                networkLayer = L.layerGroup();

                for(var proteinEntryName in overlayProteins){
                    if(overlayProteins[proteinEntryName].layer){
                        const interactionPartners = overlayProteins[proteinEntryName].layer.getLayers()[0].interactionPartners;

                        if(connections[proteinEntryName] !== undefined){
                            connections[proteinEntryName].addTo(networkLayer);
                        } else {
                            // Initiaize lines container
                            connections[proteinEntryName] = L.layerGroup();

                            for(var potentialInteractor in overlayProteins){
                                var interactionPartner = _.find(interactionPartners, function(proteinInteractors){
                                    return proteinInteractors.interactor === potentialInteractor;
                                });

                                if(interactionPartner){
                                    var latlngs = Array();

                                    //Get latlng from first marker, that is being displayed on the map!!!
                                    var pt1 = overlayProteins[proteinEntryName].layer.getLayers()[0].getLatLng();

                                    //Get latlng from second marker
                                    if(overlayProteins[interactionPartner.interactor].layer){

                                        var pt2 = overlayProteins[interactionPartner.interactor].layer.getLayers()[0].getLatLng();

                                        // Always display text from left to right
                                        if(pt1.lng < pt2.lng){
                                            latlngs.push(pt1);
                                            latlngs.push(pt2);
                                        } else {
                                            latlngs.push(pt2);
                                            latlngs.push(pt1);
                                        }


                                        // Sometimes, the score can be 0. This can mess up things, so assign 0.01 if score is < 0.00
                                        var score = interactionPartner.score > 0.00 ? interactionPartner.score : 0.01;

                                        //From documentation http://leafletjs.com/reference.html#polyline
                                        // create a red polyline from an arrays of LatLng points
                                        var polyline = L.polyline(latlngs, {
                                            color: 'black',
                                            opacity: .6,
                                            dashArray: (interactionPartner.score*100) + ", 15",
                                            // Minimum line width is 2
                                            weight: Math.log(score*100) > 1 ? Math.log(score*100) : 2
                                        });

                                        // For the text, even if I use 0, it's fine. They can look up what it means in Hippie's data
                                        polyline.setText(JSON.stringify(interactionPartner.score*100), {
                                            center: true,
                                            attributes: {
                                                style: "font-size: 2.5em;",
                                                fill: "white",
                                                stroke: "black",
                                                "stroke-width": "1"
                                            }
                                        });

                                        connections[proteinEntryName].addLayer(polyline);
                                    }
                                }
                            }
                            connections[proteinEntryName].addTo(networkLayer);
                        }
                    } 
                }
                hideProgress();
                networkLayer.addTo(map);
                btn.state('removePPIN'); // change state on click!
            }
        }, {
            stateName: 'removePPIN',   // name the state
            icon:      'Circle Thin icon',          // and define its properties
            title:     'Remove global network', // like its title
            onClick: function(btn, map) {  // and its callback
                map.removeLayer(networkLayer);
                btn.state('loadPPIN'); // change state on click!
            }
        }]
    }).addTo(map);
};

var gotoLocalizationsButton = function(map){
    L.easyButton({
        position: 'topright',
        states: [{
            stateName: 'gotoLocalizations',   // name the state
            icon:      'Map Outline icon',          // and define its properties
            title:     'Go to localizations', // like its title
            onClick: function(btn, map) {  // and its callback
                var currentUri = URI(window.location.href);
                window.location.href = '/map/' + currentUri.filename() + currentUri.search();
            }
        }]
    }).addTo(map);
};

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

var renderMap = function(imageId, callback) {
    renderProgress();
    // Wait till I have the localizations
    $.ajax({
        url: '/api/features/' + imageId,
        type: 'GET',
        success: function(results) {
            featuresGeoJSON = results;

            var img = new Image();
            img.src = '/api/maps/'+imageId;

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
                PPINButton(map);
                gotoLocalizationsButton(map);
                loadFadingButton(map);

                // Add features highlight

                var featuresLayer = L.geoJson(featuresGeoJSON, {
                    pointToLayer: function (feature, latlng) {
                        return L.circle(latlng, {
                            radius: feature.properties.radius || 6,
                            interactive: false
                        });
                    },
                    style: function(feature) {
                        if(feature.geometry.type == "LineString") {
                            return {
                                fillColor: localizations[feature.properties.localization].color,
                                color: localizations[feature.properties.localization].color,
                                weight: 4,
                                opacity: .8,
                                fillOpacity: .8,
                                interactive: false
                            };
                        } else {
                            return {
                                fillColor: localizations[feature.properties.localization].color,
                                color: localizations[feature.properties.localization].color,
                                weight: 0,
                                opacity: .8,
                                fillOpacity: .8,
                                interactive: false
                            };
                        }
                    }
                });

                controlLayers.addOverlay(featuresLayer, "Localizations");

                hideProgress();
                callback();
            }
        }
    });
};

var addToMappingsTable = function(protienMapping, proteinToBeMapped, callback){

    var callback = callback || function(){};

    // If I already have the protein mapping, I don't need to request it another time!
    if(proteinToBeMapped === undefined){
        var container = document.getElementById('proteinMappingList');
        var tr = document.createElement("tr");

        var proteinTd = document.createElement("td");
        proteinTd.appendChild(document.createTextNode(protienMapping.uniprotId));
        tr.appendChild(proteinTd);

        var entryName = document.createElement("td");
        entryName.appendChild(document.createTextNode(protienMapping.entryName));
        tr.appendChild(entryName);

        var proteinName = document.createElement("td");
        proteinName.appendChild(document.createTextNode(protienMapping.proteinName));
        tr.appendChild(proteinName);

        var geneName = document.createElement("td");
        geneName.appendChild(document.createTextNode(protienMapping.geneName));
        tr.appendChild(geneName);

        container.appendChild(tr);

        callback(protienMapping);
    } else {
        $.ajax({
            url: '/api/mappings/uniprot/' + proteinToBeMapped.uniprotId,
            type: 'GET',
            success: function(protienMapping) {

                var container = document.getElementById('proteinMappingList');
                var tr = document.createElement("tr");

                var proteinTd = document.createElement("td");
                proteinTd.appendChild(document.createTextNode(protienMapping.uniprotId));
                tr.appendChild(proteinTd);

                var entryName = document.createElement("td");
                entryName.appendChild(document.createTextNode(protienMapping.entryName));
                tr.appendChild(entryName);

                var proteinName = document.createElement("td");
                proteinName.appendChild(document.createTextNode(protienMapping.proteinName));
                tr.appendChild(proteinName);

                var geneName = document.createElement("td");
                geneName.appendChild(document.createTextNode(protienMapping.geneName));
                tr.appendChild(geneName);

                container.appendChild(tr);

                callback(protienMapping);
            }
        });
    }
}

var addToMapAndLocalizationsTable = function(protein, proteinEntryName){

    // If the protein is already there, don't add it again!
    if(overlayProteins[proteinEntryName] !== undefined){
        return;
    }

    var mapped = [];
    var unmapped = [];

    // Array for the different locations
    var points = [];

    protein.localizations.forEach(function(element){
        var geoLoc = _.find(featuresGeoJSON, function(geoLoc){
            return geoLoc.properties.localization == element;
        });

        if(geoLoc === undefined){
            unmapped.push(element);
        } else {
            mapped.push({
                geoLoc: geoLoc,
                loc: element
            });
        }
    });

    // Free the connecitons variable if there are new proteins in the viz. This will ensure that if the network is displayed again, it will recalculate data.
    if(mapped.length > 0){
        connections = {};
    }

    // Create selection for localizations
    var menu;

    if(mapped.length > 1){
        menu = '<div class="ui dropdown locselecter">';
        menu += '<div class="text">New localization</div>';
        menu += '<i class="dropdown icon"></i>';
        menu += '<div class="menu">';

        mapped.forEach(function(locationObject){
            menu += '<div class="item" data-value="' + proteinEntryName + '">' + locationObject.loc + '</div>';
        });

        menu += '</div></div>';
    }

    // Get interaction partners for protein --> Long request!
    $.ajax({
        url: '/api/interactions/' + proteinEntryName,
        type: 'GET',
        dataType: "json",
        success: function(interactionPartners) {

            for(var i=0; i < mapped.length; i++){

                var location = mapped[i].loc;
                var geoLoc = mapped[i].geoLoc;

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


                    var marker = L.circleMarker([y,x],{
                        radius: 6,
                        fillColor: localizations[location].color,
                        color: localizations[location].color,
                        // Only show first localization, but draw them all
                        opacity: 1, 
                        fillOpacity: 1
                    });

                    // Assign a location to the marker, so to then highlight it if needed:
                    marker.location = location;
                    marker.interactionPartners = interactionPartners;

                    // Bind popup to marker and add overlay of feature when clicked.
                    var popup;

                    if(mapped.length > 1){
                        popup = L.popup().setContent('<p><strong>' + proteinEntryName + " - " + location + "</strong><br>" + menu + '</p>');
                    } else {
                        popup = L.popup().setContent('<p><strong>' + proteinEntryName + " - " + location + "</strong></p>");
                    }



                    popup.locations = protein.localizations;
                    popup.interactionPartners = interactionPartners;
                    marker.bindPopup(popup);

                    marker.on('popupopen', function(e) {
                        // Load dropdown selector
                        // When new location selected, change opacity + interactive
                        $('.ui.dropdown.locselecter').dropdown({
                            onChange: function(value, text, $selectedItem) {
                                var newLocPoint = _.find(overlayProteins[value].points, function(point){
                                    return point.location == text;
                                });
                                overlayProteins[value].layer.clearLayers();
                                overlayProteins[value].layer.addLayer(newLocPoint);

                                // Reset precalculated connections layers for all-points, as one point has changed position, and both in- and out-bound conenctions might be broken
                                connections = {};
                            }
                        });

                        var locs = e.popup.locations;
                        var interactionPartners = e.popup.interactionPartners;

                        if(connections[proteinEntryName] !== undefined){
                            connections[proteinEntryName].addTo(map);
                        } else {
                            // Initiaize lines container
                            connections[proteinEntryName] = L.layerGroup();

                            for(var potentialInteractor in overlayProteins){
                                var interactionPartner = _.find(interactionPartners, function(proteinInteractors){
                                    return proteinInteractors.interactor === potentialInteractor;
                                });

                                if(interactionPartner){
                                    var latlngs = Array();

                                    //Get latlng from first marker, that is being displayed on the map!!!
                                    var pt1 = overlayProteins[proteinEntryName].layer.getLayers()[0].getLatLng();

                                    //Get latlng from second marker
                                    var pt2 = overlayProteins[interactionPartner.interactor].layer.getLayers()[0].getLatLng();

                                    // Always display text from left to right
                                    if(pt1.lng < pt2.lng){
                                        latlngs.push(pt1);
                                        latlngs.push(pt2);
                                    } else {
                                        latlngs.push(pt2);
                                        latlngs.push(pt1);
                                    }


                                    // Sometimes, the score can be 0. This can mess up things, so assign 0.01 if score is < 0.00
                                    var score = interactionPartner.score > 0.00 ? interactionPartner.score : 0.01;

                                    //From documentation http://leafletjs.com/reference.html#polyline
                                    // create a red polyline from an arrays of LatLng points
                                    var polyline = L.polyline(latlngs, {
                                        color: 'black',
                                        opacity: .6,
                                        dashArray: (interactionPartner.score*100) + ", 15",
                                        // Minimum line width is 2
                                        weight: Math.log(score*100) > 1 ? Math.log(score*100) : 2
                                    });

                                    // For the text, even if I use 0, it's fine. They can look up what it means in Hippie's data
                                    polyline.setText(JSON.stringify(interactionPartner.score*100), {
                                        center: true,
                                        attributes: {
                                            style: "font-size: 2.5em;",
                                            fill: "white",
                                            stroke: "black",
                                            "stroke-width": "1"
                                        }
                                    });

                                    connections[proteinEntryName].addLayer(polyline);
                                }
                                connections[proteinEntryName].addTo(map);
                            }
                        }
                    });

                    marker.on('popupclose', function(e) {
                        if(connections[proteinEntryName] !== undefined){
                            map.removeLayer(connections[proteinEntryName]);
                        }
                    });

                    points.push(marker);
                } catch (e) {
                    // Need to make something smarter here: case point calculation exceeedes heap. Very likely with Polygons!
                    console.log(e);
                    console.log("Will reload");
                    window.location.reload();
                }
            }

            // HTML table telling which localizations are mapped for protein and which not
            var container = document.getElementById('proteinLocalizationList');
            var tr = document.createElement("tr");

            var proteinTd = document.createElement("td");
            proteinTd.appendChild(document.createTextNode(protein.uniprotId));
            tr.appendChild(proteinTd);

            var mappedTd = document.createElement("td");
            mappedTd.appendChild(document.createTextNode(mapped.map(function(element){return element.loc})));
            tr.appendChild(mappedTd);

            var unmappedTd = document.createElement("td");
            unmappedTd.appendChild(document.createTextNode(unmapped));
            tr.appendChild(unmappedTd);

            container.appendChild(tr);
            // END of HTML table

            if(points[0] !== undefined){
                overlayProteins[proteinEntryName] = {
                    layer : L.layerGroup(),
                    points: points
                };
                overlayProteins[proteinEntryName].layer.addLayer(points[0]);
            } else {
                overlayProteins[proteinEntryName] = {
                    layer : undefined,
                    points: undefined
                };
            }

            if(overlayProteins[proteinEntryName].layer !== undefined) {
                overlayProteins[proteinEntryName].layer.addTo(map);
                controlLayers.addOverlay(overlayProteins[proteinEntryName].layer, proteinEntryName);
            }

            hideProgress();
        }
    });
}

var addProteins = function(someProteins){
    someProteins.forEach(function(protein){
        addToMappingsTable(null, protein, function(nameMapping){
            addToMapAndLocalizationsTable(protein, nameMapping.entryName);
        });
    });
}

$.fn.api.settings.api = {
    'get from localizations': '/api/localizations/search/{query}',
    'get from mappings': '/api/mappings/search/{query}',
};

$.fn.search.settings.templates.protein = function(response) {
    var html = '';
    $.each(response.results, function(index, result) {
        html += '' + '<div class="result">';
        html += '<span class="name">' + result.entryName + '</span>, ';
        html += '<small> [UniProt ID] ' + result.uniprotId + '</small>';
        html += ( (result.geneId && result.geneId.length > 0) ? ('<small> [Gene ID] ' + result.geneId + '</small>') : "" );
        html += '</div>';
    });
    return html;
}

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
    type: 'mapping',
    apiSettings: {
        action: 'get from mappings',
        onResponse: function(response) {
            return {
                results: response
            };
        }
    },
    minCharacters : 2,
    onSelect: function(result, response) {

        renderProgress();

        for(proteinEntryName in connections){
            map.removeLayer(connections[proteinEntryName]);
        }

        addToMappingsTable(result);

        $.ajax({
            url: '/api/localizations/uniprotId/' + result.uniprotId,
            type: 'GET',
            success: function(uniprotLocProtein) {
                addToMapAndLocalizationsTable(uniprotLocProtein, result.entryName);
            }
        });

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
});