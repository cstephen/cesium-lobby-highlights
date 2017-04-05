var viewer;
var highlightMoment;
var monthOffset = 0;
var highlights;

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
  highlightMoment = moment().subtract(monthOffset, 'months').startOf('month');
  var month = highlightMoment.format('YYYY-MM');

  jQuery.getJSON({
    dataType: 'json',
    url: '/climate-highlights/' + month + '/' + month,
    success: function(data) {
      if(data.highlights.length > 0) {
        $('#highlight-month').html(highlightMoment.format('MMMM YYYY'));
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
    dataSource.entities.add({
      position: new Cesium.Cartesian3.fromDegrees(highlight.lon, highlight.lat),
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

  function fly () {
    index = (index + 1) % highlights.length;
    var pointAbove = Cesium.Cartesian3.fromDegrees(highlights[index].lon, highlights[index].lat, 250000);

    viewer.camera.flyTo({
      destination: pointAbove,
      duration: 8,
      complete: function() {
        viewer.selectedEntity = dataSource.entities.values[index];
      }
    });

    setTimeout(fly, 10000);
  }
}

initialize();
