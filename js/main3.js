
          var map = L.map('map', {
                center: [38.1625228, -96.9633171],
                zoom: 4
            });

          L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
            attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery &copy; <a href="http://mapbox.com">Mapbox</a>',
            id: 'mapbox.light',
            maxzoom: 4,
            minzoom: 4,
            accessToken: 'pk.eyJ1IjoiY3VyZW1hbmdvIiwiYSI6ImNpcTQ4cGFwbDAxbmVmd25vZGNiOTVzeGEifQ.GWZByYkIft6eMRha69C8nw'
          }).addTo(map);

          //change the file name to yours
            $.getJSON("data/map.geojson")  // The getJSON() method is used to get JSON data
            .done(function(data) {
                var info = processData(data);
                createPropSymbols(info.timestamps, data);
                createSliderUI(info.timestamps);
            });

          function processData(data) {
              // First, initialize the variables to hold the timestamps and min/max population values
              var timestamps = [];  // square brackets to define an array of data
                                    // because there are multiple timestamps
              var	min = Infinity; // for the min, begin with the largest possible value - infinity
              var	max = -Infinity;// for the max, begin with the smallest possible value - negative infinity

              // Go through each row/feature of the data table
              // Note data is the variable name in the function definition - processData(data)
              for (var feature in data.features) {
                  var properties = data.features[feature].properties;

                  // At each row, go through the columns/attributes to get the values
                  for (var attribute in properties) {
                      if ( attribute != 'id' &&
                           attribute != 'name' &&
                           attribute != 'latitude' &&
                           attribute != 'longitude' )   // != means NOT EQUAL TO
                                                  // These three columns are NOT recorded
                                                  // Modify this part when mapping your own data
                      {
                          if ( $.inArray(attribute,timestamps) ===  -1) { // JQuery in.Array() method searches for a specified value within an array and return its index (or -1 if not found)
                                                            // here, the new timestamp is only added when it is not already in the array
                                                            // triple equals === compares both type and value

                              timestamps.push(attribute);  // The JS push() method adds new items to the end of an array
                                                           // and returns the new length of the array
                          }
                          if (properties[attribute] < min) {
                              min = properties[attribute]; // record/update the current smaller values as the min
                          }
                          if (properties[attribute] > max) {
                              max = properties[attribute]; // record/update the current larger values as the max
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

          // The function to draw the proportional symbols
            function createPropSymbols(timestamps, data) {

              cities = L.geoJson(data, {

                  // By default, Leaflet draws geojson points as simple markers
                  // To alter this, the pointToLayer function needs to be used
                  pointToLayer: function(feature, latlng) {
                      return L.circleMarker(latlng, { // we use circle marker for the points
                          fillColor: "#501e65",  // fill color of the circles
                          color: '#501e65',      // border color of the circles
                          weight: 2,             // circle line weight in pixels
                          fillOpacity: 0.5       // fill opacity (0-1)
                      }).on({
                          mouseover: function(e) {
                                this.openPopup();
                                this.setStyle({fillColor: 'green'});  // fill color turns green when mouseover
                            },
                            mouseout: function(e) {
                                this.closePopup();
                                this.setStyle({fillColor: '#501e65'});  // fill turns original color when mouseout
                            }
                    });
                  }
              }).addTo(map);

              updatePropSymbols(timestamps[0]); // this function is defined below
                                              // When loaded, the map will first show proportional symbols with the first timestamp's data
            }

            // The function to update/resize each circle marker according to a value in the time series
            function updatePropSymbols(timestamp) {

              cities.eachLayer(function(layer) {  // eachLayer() is an Leaflet function to iterate over the layers/points of the map

                  var props = layer.feature.properties;   // attributes
                  var radius = calcPropRadius(props[timestamp]); // circle radius, calculation function defined below

                  // pop-up information (when mouseover) for each city is also defined here
                  var popupContent = props.name + ' ' + timestamp + ' population: ' + String(props[timestamp]);

                  layer.setRadius(radius);  // Leaflet method for setting the radius of a circle
                  layer.bindPopup(popupContent, { offset: new L.Point(0,-radius) }); // bind the popup content, with an offset
              });
            }

            // calculate the radius of the proportional symbols based on area
            function calcPropRadius(attributeValue) {

              var scaleFactor = 0.001;   // the scale factor is used to scale the values; the units of the radius are in meters
                                         // you may determine the scale factor accordingly based on the range of the values and the mapping scale
              var area = attributeValue * scaleFactor;

              return Math.sqrt(area/Math.PI);  // the function return the radius of the circle to be used in the updatePropSymbols()
            }

          function createSliderUI(timestamps) {
            var sliderControl = L.control({ position: 'bottomleft'} ); // position of the slider
                              // Another use of L.control :)
            sliderControl.onAdd = function(map) {
              //initialize a range slider with mousedown control
                var slider = L.DomUtil.create("input", "range-slider");
                L.DomEvent.addListener(slider, 'mousedown', function(e) {
                    L.DomEvent.stopPropagation(e);
                });

              // Define the labels of the time slider as an array of strings
              // Modify this for your data
              var labels = ["2000", "2002","1970","1980", "1990", "2000","2010"];

              $(slider)
                  .attr({
                    'type':'range',
                    'max': timestamps[timestamps.length-1],
                    'min':timestamps[0],
                    'step': 10, // Change this to match the numeric interval between adjacent timestamps
                    'value': String(timestamps[0])
                  })
                  .on('input change', function() {
                      updatePropSymbols($(this).val().toString()); // update the map for the timestamp
                      var i = $.inArray(this.value,timestamps);
                      $(".temporal-legend").text(labels[i]); // update the label for the timestamp
                  });
              return slider;
            }
            sliderControl.addTo(map);
            createTimeLabel("2000"); //The starting timestamp label
          }


        // Add labels to the time slider when the map first loaded
        function createTimeLabel(startTimestamp) {
          var temporalLegend = L.control({position: 'bottomleft' }); // same position as the slider
                               // One more use of L.control !!
          temporalLegend.onAdd = function(map) {
              var output = L.DomUtil.create("output", "temporal-legend");
              $(output).text(startTimestamp);
              return output;
          }
          temporalLegend.addTo(map);

        }











$(document).ready(function() {
    
        var cities;
        var map = L.map('map', {
                center: [37.8, -96],
                zoom: 4,
                minZoom: 4
        });
    
        L.tileLayer(
            'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png', {
                        attribution: '©OpenStreetMap, ©CartoDB'
            }).addTo(map);
});