var loadFadingButton = function(map){
    L.easyButton({
        states: [{
            stateName: 'fade',   // name the state
            icon:      'moon icon',          // and define its properties
            title:     'fade', // like its title
            onClick: function(btn, map) {  // and its callback
                $(".leaflet-image-layer").css("opacity",.1);
                btn.state('unfade'); // change state on click!
            }
        }, {
            stateName: 'unfade',   // name the state
            icon:      'sun icon',          // and define its properties
            title:     'unfade', // like its title
            onClick: function(btn, map) {  // and its callback
                $(".leaflet-image-layer").css("opacity",1);
                btn.state('fade'); // change state on click!
            }
        }]
    }).addTo(map);
};

var initializeLocalizations = function(localizationsArray){
    var localizations = {};
    
    var sequentialColor = function(numOfSteps, step) {
        // This function generates vibrant, "evenly spaced" colours (i.e. no clustering). This is ideal for creating easily distinguishable vibrant markers in Google Maps and other apps.
        // Adam Cole, 2011-Sept-14
        // HSV to RBG adapted from: http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
        var r, g, b;
        var h = step / numOfSteps;
        var i = ~~(h * 6);
        var f = h * 6 - i;
        var q = 1 - f;
        switch(i % 6){
            case 0: r = 1; g = f; b = 0; break;
            case 1: r = q; g = 1; b = 0; break;
            case 2: r = 0; g = 1; b = f; break;
            case 3: r = 0; g = q; b = 1; break;
            case 4: r = f; g = 0; b = 1; break;
            case 5: r = 1; g = 0; b = q; break;
        }
        var c = "#" + ("00" + (~ ~(r * 255)).toString(16)).slice(-2) + ("00" + (~ ~(g * 255)).toString(16)).slice(-2) + ("00" + (~ ~(b * 255)).toString(16)).slice(-2);
        return (c);
    };

    var total = localizationsArray.length;

    for(var i = 0; i < total; i++){
        localizations[localizationsArray[i]] = {
            count: 0,
            color: sequentialColor(total, i)
        };
    }

    return localizations;
};

var localizationsTable = function(localizations){
    // HTML table telling which localizations are mapped to which color
    var container = document.getElementById('localizationList');
    for(localization in localizations){
        var tr = document.createElement("tr");

        var color = document.createElement("td");
        color.style.background = localizations[localization].color;
        tr.appendChild(color);

        var locName = document.createElement("td");
        locName.appendChild(document.createTextNode(localization));
        tr.appendChild(locName);

        container.appendChild(tr);
    }
};