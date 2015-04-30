//this code use the google maps api to geocode an input location, map it, find 10 prominent restaurants near it and find the shortest route to each sequential restaurant.
//each visit to a restaurant bears a probability equal to its rating that you will get sick and will exit the game. Find the best location to be in while hungry.

//knockout model. Knockout is great for callback functions and would make life easier for google maps api.
function HungryModel() {
    var self=this;
    
    //observables. These are subscribed to changes in html elements or call certain functions whenever their value changes.
    self.userlocation=ko.observable();
    self.usergeocode=ko.observable(null);
    self.errors=ko.observable(null);
    self.attractions=ko.observable(null);
    self.gplaces= new gplaces();
    
    
    //creates an autocomplete feature to make it easy for the user to enter a location.
     self.autocomplete= new google.maps.places.Autocomplete($("#findmefood")[0]);
     
     //this is an important hack to keep knockout and googlemaps autofill synchronized
     google.maps.event.addListener(self.autocomplete, 'place_changed', function() {
                      var place = self.autocomplete.getPlace();
                      self.userlocation(place.formatted_address);
        });
     
     //called on click of submit button
     self.SearchSubmit=function(){
        //checks if userlocation has been filled in. Else returns an error.
        if (self.userlocation()) {
            self.usergeocode(null);
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
     //this finds restaurants nearby a 20 mile radius based on the usergeocode whenever the usergeocode changes.
     self.getmefood=ko.computed(function(){
        if (self.usergeocode()) {
            self.gplaces.attractionsearch({
                radius:20*1609,
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
            var distances=self.attractions();
            //get distances of each object from user.
            for(var i=0; i<self.attractions().length;i++){
                distances[i]={distance:distance(self.usergeocode(),self.attractions()[i].geocode), index: i};
            }
            distances.sort(function(a,b){
                return parseFloat(a.distance)-parseFloat(b.distance);
            });
            
            order[0]=distances[0].index;
            distances.splice(0,1);
            var orderindex=0;
            
            
            //this finds the shortest point from each point while destroying the used up points.
            while(distances.length>0){
                var shortest=-1;
                var tmp;
                
                for(var i=0; i<distances.length; i++){
                    var dist=distance(self.attractions()[order[orderindex]].geocode,self.attractions()[distances[i].index].geocode)
                    if (shortest==-1 || parseFloat(dist)<parseFloat(shortest)) {
                        shortest=dist;
                        tmp=i;
                    }
                }
                order[Number(orderindex)+1]=distances[tmp].index;
                distances.splice(tmp,1);
                orderindex++;
            }
            alert(JSON.stringify(order));
        }
     });
     
     
}

//hungry is defined as a global variable. googlemaps.js loads hungry when maps gets loaded. This creates for better visuals.
//Only one viewmodel is usually required in knockout as the rest can be loaded asynchronously using require.js and its component/template feature so this does no harm.
var hungry=new HungryModel();