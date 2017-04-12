var viewer;
var highlightsStart;
var highlightsEnd;
var highlights;
var monthOffset = 0;
var maxRandomHeight = 10000;

function start() {
  if(highlights === undefined) {
    setTimeout(start, 1000);
  } else {
    displayHighlights();
  }
}

function initialize() {
  Cesium.BingMapsApi.defaultKey = '...';

  viewer = new Cesium.Viewer('cesiumContainer', {
    animation: false,
    baseLayerPicker: false,
    fullscreenButton: false,
    geocoder: false,
    homeButton: false,
    navigationHelpButton: false,
    sceneModePicker: false,
    timeline: false,
    vrButtin: false
  });

  var frame = viewer.infoBox.frame;

  frame.addEventListener('load', function () {
    var cssLink = frame.contentDocument.createElement('link');
    cssLink.href = Cesium.buildModuleUrl('../../../css/infobox.css');
    cssLink.rel = 'stylesheet';
    cssLink.type = 'text/css';
    frame.contentDocument.head.appendChild(cssLink);
  }, false);

  getHighlights();
  start();
}

function getHighlights() {
  highlightsStart = moment().subtract(monthOffset, 'months').startOf('year');
  highlightsEnd = moment().subtract(monthOffset, 'months').endOf('month');

  var formattedStart = highlightsStart.format('YYYY-MM');
  var formattedEnd = highlightsEnd.format('YYYY-MM');

  jQuery.getJSON({
    dataType: 'json',
    url: '/climate-highlights/' + formattedStart + '/' + formattedEnd,
    success: function(data) {
      if(data.highlights.length > 0) {
        var dateLabel = highlightsStart.format('MMMM YYYY') + ' - ' + highlightsEnd.format('MMMM YYYY');
        $('#highlight-month').html(dateLabel);
        highlights = data.highlights;
        monthOffset = 0;
        setTimeout(getHighlights, 10000);
      } else {
        monthOffset++;
        getHighlights();
      }
    }
  })
}

function displayHighlights() {
  var index = 0;
  var dataSource = new Cesium.CustomDataSource("my data")

  highlights.forEach(function (highlight) {
    var randomHeight = Math.floor(Math.random() * maxRandomHeight);
    dataSource.entities.add({
      position: new Cesium.Cartesian3.fromDegrees(highlight.lon, highlight.lat, randomHeight),
      name: highlight.summary,
      description: highlight.description,
      billboard: {
        image: 'images/' + highlight.kind + '.png',
        scale: 0.5
      }
    });
  });

  viewer.dataSources.add(dataSource);

  fly();

  function fly (oldIndex) {
    index = (index + 1) % highlights.length;
    var pointAbove = Cesium.Cartesian3.fromDegrees(highlights[index].lon, highlights[index].lat, 250000);

    viewer.camera.flyTo({
      destination: pointAbove,
      duration: 8,
      complete: function() {
        if (oldIndex !== undefined) {
          var randomHeight = Math.floor(Math.random() * maxRandomHeight);
          var randomHeightPosition = new Cesium.Cartesian3.fromDegrees(highlights[oldIndex].lon, highlights[oldIndex].lat, randomHeight);
          dataSource.entities.values[oldIndex].position = randomHeightPosition;
        }

        var topHeightPosition = new Cesium.Cartesian3.fromDegrees(highlights[index].lon, highlights[index].lat, maxRandomHeight + 1);
        dataSource.entities.values[index].position = topHeightPosition;
        viewer.selectedEntity = dataSource.entities.values[index];
      }
    });

    setTimeout(function() {
      fly(oldIndex);
    }, 10000);
  }
}

initialize();
