$(document).ready(function() {
    
    var cities;
    var map = L.map('map', {
        center: [37.8, -96],
        zoom: 4,
        minZoom: 4
    });
    
    L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}.png', {
                attribution: '©CartoDB'
        }).addTo(map);
    
$.getJSON("data/map.geojson")
    .done(function(data) {
        var info = processData(data);
        createPropSymbols(info.timestamps,data);
    })
.fail(function() { alert("There has been a problem loading the data.")});

function processData(data) {
    var timestamps = [];
    var min = Infinity;
    var max = -Infinity;
    
    for (var feature in data.features) {
        var properties = data.features[feature].properties;
        
        for (var attribute in properties) {
            if (attribute != 'id' &&
               attribute != 'name' &&
               attribute != 'latitude' &&
               attribute != 'longitude' ) {
                if ($.inArray(attribute,timestamps) === -1) {
                }
                if (properties[attribute] < min) {
                    min = properties[attribute];
                }
                if (properties[attribute] > max) {
                    max = properties[attribute];
                }
            }
        }
    }
    return {
        timestamps : timestamps,
        min : min,
        max : max
    }
}
    
});
