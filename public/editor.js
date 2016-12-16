var featuresLayer;
var drawnItems;
var mapId;

var renderMap = function(imageId) {
    renderProgress();
    var img = new Image();
    img.src = '/api/maps/'+imageId;

    img.onload = function() {
        var width = this.width;
        var height = this.height;

        while(width > 500 || height > 500){
            width /= 2;
            height /= 2;
        }

        var imageBounds = [[0, width], [height, 0]];

        var map = L.map('map', {
            maxZoom: 4,
            minZoom: 1,
            maxBounds: [[-100, width+100], [height+100, -100]],
            crs: L.CRS.Simple
        }).setView([height/2, width/2], 1);

        L.imageOverlay(this.src, imageBounds).addTo(map);

        // Add draw controls
        // Initialise the FeatureGroup to store drawn layers
        drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);

        // Initialise the draw control and pass it the FeatureGroup of editable layers
        var drawControl = new L.Control.Draw({
            draw: {
                marker: false,
                circle: {
                    metric: false,
                    showRadius: false,
                    shapeOptions: {
                        stroke: false,
                        opacity: 1,
                        color: '#AD0014',
                        fillOpacity: .8,
                    }
                },
                polyline: {
                    showLength: false,
                    shapeOptions: {
                        opacity: 1,
                        color: '#5235DF'
                    }
                },
                rectangle: {
                    shapeOptions: {
                        stroke: false,
                        opacity: 1,
                        color: '#FFD322',
                        fillOpacity: .8,
                    }
                },
                polygon: {
                    shapeOptions: {
                        stroke: true,
                        opacity: .8,
                        color: '#469531',
                        fillOpacity: .8,
                    }
                }
            }
        });

        map.on('draw:created', function (e) {
            var type = e.layerType;
            var layer = e.layer;

            // Allow always only one layer/feature on the drawnItems feature group.
            drawnItems.clearLayers();
            drawnItems.addLayer(layer);
        });

        map.addControl(drawControl);
        // END add draw controls

        featuresLayer = L.geoJson(undefined, {
            onEachFeature: function(feature, layer) {
                if (feature.properties && feature.properties.localization) {
                    // Very much code for just defining the div in the popup + the delete button
                    var content = document.createElement("div");
                    content.className = "ui attached segment";
                    var text = document.createTextNode(feature.properties.localization);
                    content.appendChild(text);

                    var btn = document.createElement("div");
                    // Interesting part: What to do when Delete button is clicked
                    btn.addEventListener('click', function(event){
                        var target = $(event.target)[0];
                        $.ajax({
                            url: '/api/features/' + target.dataset.id,
                            type: 'DELETE',
                            success: function(results) {
                                var object = _.find(featuresLayer._layers,function(object){
                                    return object.feature._id == target.dataset.id;
                                });

                                featuresLayer.removeLayer(object);
                            }
                        });
                    }, false);
                    btn.className = "ui attached delete button red";
                    btn.setAttribute('data-id', feature._id);
                    var btnText = document.createTextNode("Delete");
                    btn.appendChild(btnText);

                    var container = document.createElement("div");
                    container.appendChild(content);
                    container.appendChild(btn);

                    // Bind the text and the button to the popup
                    layer.bindPopup(container);
                }
            },
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
        }).addTo(map);


        // Get all the localizations that are already stored on the db.
        $.ajax({
            url: '/api/features/' + imageId,
            type: 'GET',
            success: function(results) {
                featuresLayer.addData(results);
                hideProgress();
            }
        });

        // Disable drag and zoom handlers.
        // map.dragging.disable();
        map.touchZoom.disable();
        map.doubleClickZoom.disable();
        map.scrollWheelZoom.disable();
        //map.keyboard.disable();

        // Disable tap handler, if present.
        if (map.tap) map.tap.disable();

        // Add fading button
        loadFadingButton(map);

        // Add feature search  + adder
        var featureAdder = L.Control.extend({
            options: {
                position: 'topright'
            },

            onAdd: function (map) {
                // create the control container with a particular class name
                this._div = L.DomUtil.create('form', 'ui form');

                //this._div.style.width = "50px";
                //this._div.style.paddingTop = "50%";
                //this._div.style.paddingLeft = "50%";
                this._div.style.minWidth = "300px";

                var errorMessage = L.DomUtil.create('div', 'ui error message');
                this._div.appendChild(errorMessage);

                var field = L.DomUtil.create('div', 'field');
                var search = L.DomUtil.create('div', ' ui fluid search selection dropdown');
                search.style.zIndex = "999999";
                var input = L.DomUtil.create('input');
                input.name = "loc";
                input.id = "loc";
                input.type = "hidden";
                search.appendChild(input);
                search.appendChild( L.DomUtil.create('i', "dropdown icon"));
                var placeholder = L.DomUtil.create('div', "default text");
                placeholder.innerText = "Select localization";
                search.appendChild(placeholder);
                var menu = L.DomUtil.create('div', "menu");
                for(localization in localizations){
                    var temp = L.DomUtil.create('div', "item");
                    temp.innerText = localization;
                    temp.setAttribute('data-value', localization);
                    menu.appendChild(temp);
                }
                search.appendChild(menu);
                field.appendChild(search);
                this._div.appendChild(field);

                var submitField = L.DomUtil.create('div', 'field');
                var submit = L.DomUtil.create('input', "ui button green");
                submit.type = "submit";
                submitField.appendChild(submit);
                this._div.appendChild(submitField);

                return this._div;
            }
        });

        map.addControl(new featureAdder());

        // Activate dropdowns
        $('.dropdown').dropdown();

        // Form Validation
        $('.ui.form')
            .form({
            fields: {
                loc: {
                    identifier: 'loc',
                    rules: [
                        {
                            type   : 'empty',
                            prompt : 'Please select a localization'
                        },
                        {
                            type   : 'featureDefined',
                            prompt : 'Please first draw a shape'
                        }
                    ]
                }
            },
            onSuccess: function(event, fields){
                event.preventDefault();
                var feature = drawnItems.getLayers()[0];

                if(feature !== undefined){
                    var geoJSON = feature.toGeoJSON();

                    geoJSON.properties = {
                        localization: fields.loc,
                        map: mapId
                    };

                    try{
                        geoJSON.properties.radius = feature.getRadius();
                    } catch(e){
                    }

                    $.ajax({
                        url: '/api/features',
                        type: 'POST',
                        data: JSON.stringify(geoJSON),
                        contentType: "application/json; charset=utf-8",
                        dataType: "json",
                        success: function(result) {
                            var object = _.find(featuresLayer._layers,function(object){
                                return object.feature._id == result._id;
                            });

                            if(object){
                                featuresLayer.removeLayer(object);
                            }
                            drawnItems.clearLayers();
                            featuresLayer.addData(result);
                        }
                    });
                }
            }
        });
    }
};

var writeMapId = function(imageId){
    mapId = imageId;
}

$.fn.form.settings.rules.featureDefined = function() {
    return drawnItems.getLayers()[0] !== undefined;
};