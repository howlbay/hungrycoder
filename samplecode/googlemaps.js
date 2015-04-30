//this document works with the map on the first page.

//these are global variables and functions


var map;
    function initialize() {
        var coordinates=new google.maps.LatLng(40.71448, -74.00598);
        var mapOptions = {
          center: coordinates,
          zoom: 8
        };
        map = new google.maps.Map(document.getElementById('maps'),
            mapOptions);
        
        //waits for google maps to load knockout.This is not ideal for a website but is fine for a game.
       google.maps.event.addListenerOnce(map, 'idle', function(){
            ko.applyBindings(hungry,$("#maincontainer")[0]);
            alert('cool');
        });
        
        return map;
      }
      
      initialize();
      
      //only for one address. It returns a latlng object.
      function geocode(address,success,error)
      {
        
        var geocoder= new google.maps.Geocoder;
        geocoder.geocode({'address':address},function(response,status){
        if (status==google.maps.GeocoderStatus.OK)
        {
            var coods=response[0].geometry.location;
            success(coods);
        }else{
            error();
        }
        });
      }
      
      //gets distance in meters between two objects. It assumes a flat earth as we are dealing with relatively short distances where arcs are not that important.
      //takes in googlemaps latlng objects.
      function distance(object1,object2){
        var d=Math.sqrt(Math.pow(object2.lat()-object1.lat(),2)+Math.pow(object2.lng()-object1.lng()),2);
        var geotometer=111000;
        return geotometer*d;
      }
      
      //object for google places. This contains functions to search for attractions and cleans them up.
      function gplaces(){
        var self=this;
        //mod this variable to change type of attraction.
        self.attractiontypes=['restaurant'];
        
        //function that makes a call to google maps places
            self.searchplaces=function(searchinfo,fn){
            
                var service= new google.maps.places.PlacesService(map);
               
                service.nearbySearch(searchinfo,function(response,status,pagination){
                    if (status==google.maps.places.PlacesServiceStatus.OK) {
                        //this api returns in the form array(0=>array(details))
                        
                        fn(response);
                        
                    }
                });
          }
        
            //searches for attractions
          self.attractionsearch=function(options,callback){
            var searchinfo={};
            if (options.geocode) {
                searchinfo.location=options.geocode;
                searchinfo.radius=options.radius;
            }
            if (options.bounds) {
                searchinfo.bounds=options.bounds;
            }
            
            searchinfo.types=self.attractiontypes;
            searchinfo.rankBy=google.maps.places.RankBy.PROMINENCE;;
            
            self.searchplaces(searchinfo,function(response){
                response=self.attractionscleanup(response);
                callback(response);
            });
            
          }
        
        //cleans up the google maps response.
            self.attractionscleanup=function(response){
                var ret=[];
                for (var i=0;i<response.length;i++) {
                    ret[i]={};
                    ret[i].address=response[i]['formatted_address'];
                    ret[i].geocode=response[i].geometry.location;
                    ret[i].rating=response[i].rating;
                    ret[i].name=response[i].name;
                    
                }
                return ret;
            }
      }
      
      
      
      
      
      
 