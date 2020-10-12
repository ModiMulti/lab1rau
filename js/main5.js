$(document).ready(function() {

	var cities;
	var map = L.map('map', {
        center: [39.83, -98.58],
        zoom:5,
        minZoom: 5
    });
    
      var layer = L.esri.basemapLayer('Streets').addTo(map);
      var layerLabels;

      function setBasemap (basemap) {
        if (layer) {
          map.removeLayer(layer);
        }

        layer = L.esri.basemapLayer(basemap);

        map.addLayer(layer);

        if (layerLabels) {
          map.removeLayer(layerLabels);
        }

        if (
          basemap === 'ShadedRelief' ||
          basemap === 'Oceans' ||
          basemap === 'Gray' ||
          basemap === 'DarkGray' ||
          basemap === 'Terrain'
        ) {
          layerLabels = L.esri.basemapLayer(basemap + 'Labels');
          map.addLayer(layerLabels);
        } else if (basemap.includes('Imagery')) {
          layerLabels = L.esri.basemapLayer('ImageryLabels');
          map.addLayer(layerLabels);
        }
      }

      document
        .querySelector('#basemaps')
        .addEventListener('change', function (e) {
          var basemap = e.target.value;
          setBasemap(basemap);
        });

	$.getJSON("data/cityData.geojson")
		.done(function(data) {

			var info = processData(data);
			createPropSymbols(info.timestamps, data);
			createLegend(info.min,info.max);
			createSliderUI(info.timestamps);

		})
		.fail(function() { alert("There has been a problem loading the data.")});
    

	function processData(data) {

		var timestamps = [];
		var	min = Infinity;
		var	max = -Infinity;

		for (var feature in data.features) {

			var properties = data.features[feature].properties;

			for (var attribute in properties) {

				if ( attribute != 'id' &&
					 attribute != 'name' &&
					 attribute != 'latitude' &&
					 attribute != 'longitude' )
				{
					if ( $.inArray(attribute,timestamps) ===  -1) {
						timestamps.push(attribute);
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
	}  // end processData()

	function createPropSymbols(timestamps, data) {

		cities = L.geoJson(data, {

			pointToLayer: function(feature, latlng) {

				return L.circleMarker(latlng, {

				    fillColor: "#708598",
				    color: '#00008B',
				    weight: 4,
				    fillOpacity: 0.4

				}).on({

					mouseover: function(e) {
						this.openPopup();
						this.setStyle({color: '#00BFFF'});
					},
					mouseout: function(e) {
						this.closePopup();
						this.setStyle({color: '#00008B'});

					}
				});
			}
		}).addTo(map);

		updatePropSymbols(timestamps[0]);

	} // end createPropSymbols()

	function updatePropSymbols(timestamp) {

		cities.eachLayer(function(layer) {

			var props = layer.feature.properties;
			var	radius = calcPropRadius(props[timestamp]);
			var	popupContent = "<b>" + String(props[timestamp]) + " Unemployed</b><br>" +
							   "<i>" + props.name +
							   "</i> in Year </i>" + timestamp + "</i>";

			layer.setRadius(radius);
			layer.bindPopup(popupContent, { offset: new L.Point(0,-radius) });

		});
	} // end updatePropSymbols

	function calcPropRadius(attributeValue) {

		var scaleFactor = .1,
			area = attributeValue * scaleFactor;

		return Math.sqrt(area/Math.PI);

	} // end calcPropRadius

	function createLegend(min, max) {

		if (min < 10) {
			min = 10;
		}

		function roundNumber(inNumber) {

       		return (Math.round(inNumber/10) * 10);
		}

		var legend = L.control( { position: 'bottomright' } );

		legend.onAdd = function(map) {

			var legendContainer = L.DomUtil.create("div", "legend");
			var	symbolsContainer = L.DomUtil.create("div", "symbolsContainer");
			var	classes = [roundNumber(min), roundNumber((max-min)/2), roundNumber(max)];
			var	legendCircle;
			var	lastRadius = 0;
			var  currentRadius;
			var  margin;

			L.DomEvent.addListener(legendContainer, 'mousedown', function(e) {
				L.DomEvent.stopPropagation(e);
			});

			$(legendContainer).append("<h2 id='legendTitle'># of people unemployed</h2>");

			for (var i = 0; i <= classes.length-1; i++) {

				legendCircle = L.DomUtil.create("div", "legendCircle");

				currentRadius = calcPropRadius(classes[i]);

				margin = -currentRadius - lastRadius - 2;

				$(legendCircle).attr("style", "width: " + currentRadius*2 +
					"px; height: " + currentRadius*2 +
					"px; margin-left: " + margin + "px" );

				$(legendCircle).append("<span class='legendValue'>"+classes[i]+"<span>");

				$(symbolsContainer).append(legendCircle);

				lastRadius = currentRadius;

			}

			$(legendContainer).append(symbolsContainer);

			return legendContainer;

		};

		legend.addTo(map);
	} // end createLegend()
	
	function createSliderUI(timestamps) {

		var sliderControl = L.control({ position: 'bottomleft'} );

		sliderControl.onAdd = function(map) {

			var slider = L.DomUtil.create("input", "range-slider");
            
            $(slider).mousedown(function () {
                map.dragging.disable();
            });
            
            $(document).mouseup(function () {
                map.dragging.enable();
            });

			L.DomEvent.addListener(slider, 'mousedown', function(e) {

				L.DomEvent.stopPropagation(e);

			});

			$(slider)
				.attr({'type':'range', 'max': 10, 'min': 0, 'step': 1,'value': 0})
		        .on('input change', function() {
		        	updatePropSymbols(timestamps[$(this).val()]);
		            $(".temporal-legend").text("Unemployment in "+timestamps[this.value]);
		        });

			return slider;
		}

		sliderControl.addTo(map);
		createTemporalLegend("Unemployment in "+timestamps[0]);
	} // end createSliderUI()

	function createTemporalLegend(startTimestamp) {

		var temporalLegend = L.control({ position: 'bottomleft' });

		temporalLegend.onAdd = function(map) {

			var output = L.DomUtil.create("output", "temporal-legend");

			return output;
		}

		temporalLegend.addTo(map);
		$(".temporal-legend").text(startTimestamp);
	}	// end createTemporalLegend()
    L.Control.textbox = L.Control.extend({
		onAdd: function(map) {
			
		var text = L.DomUtil.create('div');
		text.id = "info_text";
		text.innerHTML = "<strong><b><u>Metropolitan Area Unemployment in the United States</u></b> <br><br> Data for <i>cities</i> was held for the month of June of each year <br><br> Data Source: U.S. Department of Labor - Bureau of Labor Statistics </strong>"
		return text;
		},

		onRemove: function(map) {
			// end createTextbox
		}
	});
	L.control.textbox = function(opts) { return new L.Control.textbox(opts);}
	
    L.control.textbox({ position: 'bottomleft' }).addTo(map);
        L.Control.textbox = L.Control.extend({
		onAdd: function(map) {
			
		var text = L.DomUtil.create('div');
		text.id = "info_text2";
		text.innerHTML = "<strong>Basemap Gallery</strong>"
		return text;
		},

		onRemove: function(map) {
			// end createTextbox
		}
	});
	L.control.textbox = function(opts) { return new L.Control.textbox(opts);}
	L.control.textbox({ position: 'topright' }).addTo(map);
});