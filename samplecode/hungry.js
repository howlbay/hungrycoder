//this code use the google maps api to geocode an input location, map it, find 10 prominent restaurants near it and find the shortest route to each sequential restaurant.
//The objective is to find an address where you can sequentially hit as many 3.5 star and greater restaurants as possible.
//Only high rated restaurants are used.

//knockout model. Knockout is great for callback functions and would make life easier for google maps api.
function HungryModel() {
    var self=this;
    
    //observables. These are subscribed to changes in html elements or call certain functions whenever their value changes.
    self.userlocation=ko.observable();
    self.usergeocode=ko.observable(null);
    self.errors=ko.observable(null);
    self.attractions=ko.observable(null);
    self.gplaces= new gplaces();
    self.sickorder=ko.observable(null);
    self.markers=[];
    self.loading=false;
    
    
    
    //creates an autocomplete feature to make it easy for the user to enter a location.
     self.autocomplete= new google.maps.places.Autocomplete($("#findmefood")[0]);
     
     //this is an important hack to keep knockout and googlemaps autofill synchronized
     google.maps.event.addListener(self.autocomplete, 'place_changed', function() {
                      var place = self.autocomplete.getPlace();
                      self.userlocation(place.formatted_address);
        });
     
     //called on click of submit button
     self.SearchSubmit=function(){
        self.errors(null);
        //checks if userlocation has been filled in. Else returns an error.
        if (self.userlocation()) {
            self.usergeocode(null);
            self.sickorder(null);
            self.attractions(null);
            geocode(self.userlocation(),function(coods){
                self.usergeocode(coods);
            },function(){
                self.errors('Location could not be interpreted. Use your instincts.');
            });
        }else{
            self.errors('No Location Entered.');
        }
     }
     
     //behavoirs based on usergeocode
     //this finds restaurants nearby a 2.5 mile radius based on the usergeocode whenever the usergeocode changes.
     //saves them in self.attractions() which is used later by multiple functions
     self.getmefood=ko.computed(function(){
        if (self.usergeocode()) {
            self.gplaces.attractionsearch({
                radius:2.5*1609,
                geocode: self.usergeocode()
            },function(response){
                self.attractions(response);
            });
        }
     });
     
     //finds the order of attractions to visit in whenever self.attractions changes
     self.findattractionorder=ko.computed(function(){
        if (self.attractions() && self.usergeocode()) {
            //order keeps a list of indices for self.attractions in the order they are to be visited.
            var order=[];
            var distances=[];
            //distances is a copy of the indices of the array.
            for(var i=0; i<self.attractions().length; i++){
                distances[i]=i;
            }
            
            //this finds the shortest point from each point while destroying the used up points.
            // It breaks when one of the restaurant returns sick.
            var orderindex=-1;
            while(distances.length>0){
                var shortest=-1;
                var highestindex;
                //geocode of current comparer
                var refgeocode;
                if (orderindex==-1) {
                    refgeocode=self.usergeocode();
                }else{
                    refgeocode=self.attractions()[order[orderindex]].geocode;
                }
                //finds the shortest distance.
                for(var i=0; i<distances.length; i++){
                    var dist=distance(refgeocode,self.attractions()[distances[i]].geocode);
                    if (shortest==-1 || parseFloat(dist)<parseFloat(shortest)) {
                        shortest=dist;
                        highestindex=i;
                    }
                }
                order[Number(orderindex)+1]=distances[highestindex];
                orderindex++;
                if (self.makemesick(distances[highestindex])) {
                    break;
                }
                distances.splice(highestindex,1);
            }
            self.sickorder(order);
            
            
        }
     });
     
     //this function makes the user sick if rating is below 3.5
     //it is its own function to make it easier for someone else to change the probabilities.
     self.makemesick=function(index){
        if (self.attractions()) {
            var threshold=3.5;
            if (threshold>parseFloat(self.attractions()[index].rating)) {
                return true;
            }else return false;
            
        }else return true;
     }
     
     //detects if usergeocode has changed. Then points the center marker and centers the map.
     self.centermarker=new google.maps.Marker({icon:{url:'house109.svg',scaledSize:{width:48,height:48}},zIndex:15,draggable:true});
     
     //this listener listens to any changes in dragging of the marker and changes the usergeocode. So the user can just drag the marker around.
     google.maps.event.addListener(self.centermarker,'dragend',function(e){
                      self.usergeocode(e.latLng);
                    });
     
     //centers map on usergeocode.
     self.googlestabilize=ko.computed(function(){
        if (self.usergeocode()) {
            map.setCenter(self.usergeocode());
            self.centermarker.setPosition(self.usergeocode());
            self.centermarker.setTitle(self.userlocation());
        }
     });
     
     
      self.centermarker.setMap(map);
     
     //google maps the points.
     self.mappoints=ko.computed(function(){
        if (self.attractions() && self.sickorder()) {
            //destroys any previous markers. self.markers holds all markers previously.
            for(var i=0; i<self.markers.length; i++){
                    self.markers[i].setMap(null);
            }
            self.markers=[];
            //bounds fixes the zoom level to all the points plotted.
            var bounds=new google.maps.LatLngBounds();
            
            //creates the markers now.
                for(var i=0; i<self.sickorder().length; i++){
                    var icon;
                    //the last icon is green as it represents the restaurant the person got sick at.
                    if (i==self.sickorder().length-1) {
                        icon='http://maps.google.com/mapfiles/ms/icons/green-dot.png';
                    }else{
                        icon='http://maps.google.com/mapfiles/ms/icons/red-dot.png';
                    }
                    self.markers[i] = new google.maps.Marker({
                        position: self.attractions()[self.sickorder()[i]].geocode,
                        title: self.attractions()[self.sickorder()[i]].name,
                        icon:icon
                    });
                    self.markers[i].setMap(map);
                    bounds.extend(self.attractions()[self.sickorder()[i]].geocode);
                }
            map.fitBounds(bounds);
        }
        
        
     });
     
     
     
     
}

//hungry is defined as a global variable. googlemaps.js loads hungry when maps gets loaded. This creates for better visuals.
//Only one viewmodel is usually required in knockout as the rest can be loaded asynchronously using require.js and its component/template feature so this does no harm.
var hungry=new HungryModel();