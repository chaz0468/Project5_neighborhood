// Create GoogleMaps object
var Map = function (element, opts) {
    this.gMap = new google.maps.Map(element, opts);
    this.zoom = function (level) {
        if (level) {
            this.gMap.setZoom(level);
        } else {
            return this.gMap.getZoom();
        }
    };
};

// Map Options
var mapOptions = {
    center: {
    	lat: 41.8737748, lng: -87.6465868 // On Hotel Hermitage41.9038422,-87.7085712
    },
    zoom: 10,
    mapTypeId: google.maps.MapTypeId.ROADMAP
};

var element = document.getElementById('map-canvas'),
    iconSelected = './images/gMapPin.png';
var map = new Map(element, mapOptions);
map.zoom(10);

// Create infoBubble library. Adds tabs to the info bubbles on the markers
var infoBubble = new InfoBubble({
    maxWidth: 300
});
// Message in case there is no data
infoBubble.addTab('Wikipedia','Sorry! Content is not available.');
infoBubble.addTab('Street View','Sorry! Content is not available.');

// Model  Place around chicago I like to visit for education or sports
var places = [
     { id:  1, name: 'Museum of Science and Industry' ,map: map.gMap, position: { lat: 41.818826, lng: -87.6308772 }, icon: null, animation: google.maps.Animation.DROP, selected: 0 }
    ,{ id:  2, name: 'Shedd Aquarium' ,map: map.gMap, position: { lat: 41.8662169, lng: -87.6227902 }, icon: null, animation: google.maps.Animation.DROP, selected: 0 }
    ,{ id:  3, name: 'Lincoln Park Zoo' ,map: map.gMap, position: { lat: 41.8737488, lng: -87.6465868 }, icon: null, animation: google.maps.Animation.DROP, selected: 0 }
    ,{ id:  4, name: 'United Center' ,map: map.gMap, position: { lat: 41.8725348, lng: -87.6804015 }, icon: null, animation: google.maps.Animation.DROP, selected: 0 }
    ,{ id:  5, name: 'Brookfield Zoo' ,map: map.gMap, position: { lat: 41.8497141, lng: -87.8397891 }, icon: null, animation: google.maps.Animation.DROP, selected: 0 }
    ,{ id:  6, name: 'Soldier Field' ,map: map.gMap, position: { lat: 41.8717838, lng: -87.623882 }, icon: null, animation: google.maps.Animation.DROP, selected: 0 }
    ,{ id:  7, name: 'The Field Museum' ,map: map.gMap, position: { lat: 41.8695246, lng: -87.6238417 }, icon: null, animation: google.maps.Animation.DROP, selected: 0 }
    ,{ id:  8, name: 'Willis Tower'	,map: map.gMap, position: { lat: 41.8737748, lng: -87.6465868  }, icon: null, animation: google.maps.Animation.DROP, selected: 0 }
    ,{ id:  9, name: 'Buckingham Fountain'	,map: map.gMap, position: { lat: 41.8695246, lng: -87.6238417 }, icon: null, animation: google.maps.Animation.DROP, selected: 0 }
    ,{ id: 10, name: 'Millennium Park' ,map: map.gMap, position: { lat: 41.8825523, lng: -87.6225516 }, icon: null, animation: google.maps.Animation.DROP, selected: 0 }
];

// Marker creation
var Place = function(place) {
    place.name = ko.observable(place.name);
    place.selected = ko.observable(place.selected);
    var marker = new google.maps.Marker(place);
    if (map.markerCluster) {
        map.markerCluster.addMarker(marker);
    }
    return marker;
};

// ViewModel
var ViewModel = function(){
    var self = this;
    self.list = ko.observableArray([]);

    // Create and bind markers using the "places" array
    places.forEach(function(place){
        var marker = new Place(place);
        // Add an event listener using a closure
        google.maps.event.addListener(marker, 'click', (function(Copy) {
            return function() {
                self.setCurrentPlace(Copy);
            };
        })(marker));
        self.list().push(marker);
    });
    // Ajax call to Wikipedia
    self.wikiCall = function(data){
        var wikiTimeOut = setTimeout(function(){
            infoBubble.updateTab(0, '<div class="infoBubble">Wikipedia</div>', "So sorry, the request to Wikipedia has failed");
            infoBubble.updateContent_();
        }, 8000);
        $.ajax({
            url: "http://en.wikipedia.org/w/api.php?action=opensearch&format=json&callback=wikiCallback&limit=10&search="+data.name(),
            type: 'POST',
            dataType: "jsonp",
            success: function( response ) {
                var articleTitle = response[1];
                var articleLink = response[3];
                var result = [];
                for (var i = 0; i < articleTitle.length; i++){
                    var title = articleTitle[i];
                    var link = articleLink[i];
                    result.push('<li><a href="'+link+'"target="_blank">'+title+'</a></li>');
                }
                var contentString = result.join('');
                clearTimeout(wikiTimeOut);
                infoBubble.updateTab(0,'<div class="infoBubble">Wikipedia</div>',contentString);
                infoBubble.updateContent_();
            }
        });
    };
    // Google Maps Street View
    self.streetView = function(data){
        var img = data.position.A + "," + data.position.F;
        var contentString = '<img class="bgimg" alt="Sorry, the image failed to load." src="https://maps.googleapis.com/maps/api/streetview?size=600x300&location='+img+'">';
        infoBubble.updateTab(1,'<div class="infoBubble">Street View</div>',contentString);
        infoBubble.updateContent_();
    };
    // Set the pin on the "currently" selected option
    self.setCurrentPlace = function(data){
        self.list().forEach(function(data){
            data.setIcon(null);
            data.selected(null);
        });
        data.setIcon(iconSelected);
        data.selected(1);
        self.currentPlace(data);
        self.wikiCall(data);
        self.streetView(data);
        infoBubble.open(map.gMap, data);
        return true;
    };
    self.currentPlace = ko.observable( this.list()[0] );
    self.searchBox = ko.observable("");
    self.searchPlaces = ko.computed(function() {
            if(self.searchBox() === "") {
                return self.list();
            } else {
                return ko.utils.arrayFilter(self.list(), function(item) {
                    return item.name().toLowerCase().indexOf(self.searchBox().toLowerCase())>-1;
                });
            }
        });
};
ko.applyBindings(new ViewModel());
