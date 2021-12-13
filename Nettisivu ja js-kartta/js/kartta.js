'use strict';
/*
Projekti

- aihe vapaa
    - jos ei keksi annetaan aihe
- Vaatimukset
    - Validi HTML + CSS
    - JavaScript
    - Kartta
        - Markkerien lisääminen
        - Reititys?
    - vähintään 1 (avoin) rajapinta, ei kaupallisia
    - Reagoidaan käyttäjän toimintoihin (interaktiivisuus)
    - Media
        - Käyttöliittymän kuvat
        - Sivulle upotettu video äänillä
        - Tekijöiden kuvat
            - kuvat kansio voidaan laittaa salasanan taakse?
    - Julkaistaan palvelimella
 */

/*
Jotkin avoimet rajapinnat aiheuttavat selaimessa CORS-virheitä.
Ne voidaan ohittaa käyttämällä välityspalvelinta kuten esim.
cors anywhere: https://cors-anywhere.herokuapp.com/

Ohje:
Lisää ennen fetch-komentoa muuttuja const proxy
= 'https://cors-anywhere.herokuapp.com/';
Lisää ko. muuttuja haun eteen: `fetch(${proxy}https://open-api.myhelsinki.fi/jne......
 */
const baseURLMyHelsinki = 'https://open-api.myhelsinki.fi/'; //MyHelsinki BaseURL
const baseURLHRI = 'https://www.hel.fi/palvelukarttaws/rest/v4/unit/?search=';
const tagSearch = 'v2/places/?tags_search='; //MyHelsinki tag_search term
const myHelsinkiDefaultSearch = 'sports'; //Default search term for MyHelsinki
const hriDefaultSearch = 'liikunta+helsinki'; //Default search term for HRI
let searchTermMyHelsinki = myHelsinkiDefaultSearch; //By default MyHelsinki search is for sports in general
let searchTermHRI = hriDefaultSearch; //By default HRI search is for sports in general
let userLocation = []; //User location

startSearch(); //Call startSearch function on start


/*--------------------------------------------------------------------------------*/
//Testi, jolla saadaan pelkästään uimapaikat näkyviin ja halutessa kaikki takaisin
//Kommentoikaa, onko tämä edes tarpeellinen ominaisuus.
/*--------------------------------------------------------------------------------*/
//Get urheilu and uimaan buttons from sidenav
const sports = document.querySelector('#sports').addEventListener('click', function(){
    changeSearchTerm('sports', 'liikunta+helsinki')
});

const swim = document.querySelector('#swim').addEventListener('click', function(){
    changeSearchTerm('Swimming', 'uima-allas+helsinki')
});

//Change search term according to a button click on a sidenav
function changeSearchTerm(newSearchMyHelsinki, newSearchHRI){
    searchTermMyHelsinki = newSearchMyHelsinki; //Change MyHelsinki search term
    searchTermHRI = newSearchHRI; //Change HRI search term
    markerGroup.clearLayers(); //Clear all markers
    startSearch(); //Start seach
}
/*--------------------------------------------------------------------------------*/


//Create map
const map = L.map('map',{
    center: [60.22, 24], zoom:12,zoomControl:false
});
//navigaation siirto ala-oikealle
L.control.zoom({ position: 'bottomright' }).addTo(map);

//Create tileLayer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

let circle; //Circle to show bounds
let circleRadius = 2000; //Radius in meters.
let markerGroup = L.layerGroup().addTo(map); //Marker group

//Create routing controls
let routingControl = L.Routing.control({
    waypoints: [
        L.latLng(),
        L.latLng(),
    ],
    lineOptions: {
        addWaypoints: false,
        draggableWaypoints: false
    }
}).addTo(map);

//Update route when a marker is clicked
let updateRoute = function(toPos){
    routingControl.getPlan().setWaypoints([
        L.latLng(userLocation),
        L.latLng(toPos)
    ]);
};


/*--------------------------------------------------------------------------------*/
//Change radius of searchfield

//button version
/*
//Change search area radius according to user input
searchButton.addEventListener('click', function(){
    circleRadius = searchField.value; //Give circle a new radius
    markerGroup.clearLayers(); //Clear all markers
    navigator.geolocation.getCurrentPosition(success, error); //Start search
})
*/

//timer version
let timer;              // Timer identifier
const waitTime = 600;   // Wait time in milliseconds
const input = document.querySelector('#searchField');
input.addEventListener('keyup', (e) => {

    // Clear timer
    clearTimeout(timer);

    // Wait for X ms and then process the request
    timer = setTimeout(() => {
        circleRadius = searchField.value; //Give circle a new radius
        markerGroup.clearLayers(); //Clear all markers
        navigator.geolocation.getCurrentPosition(success, error); //Start search
    }, waitTime);
});


//Start search function called on start
function startSearch(){
    navigator.geolocation.getCurrentPosition(success, error);
}


//If position is found
function success(pos){
    const crd = pos.coords;

    //If circle size if redefined by the user, remove current circle
    if(circle != undefined)
    {
        map.removeLayer(circle);
    }
    //Create a circle to check for places near the current location
    circle = L.circle([crd.latitude, crd.longitude], {radius: circleRadius}).addTo(map);

    //Create marker for current position
    createMarkers(crd.latitude, crd.longitude, 'Olet tässä');
    userLocation = [crd.latitude, crd.longitude]; //Save user location
    getActivities();
    map.setView([crd.latitude, crd.longitude], 12); //Center map to user position

    //Get bounds of the circle if you want to zoom in on the position
    //let bounds = circle.getBounds();
    //map.fitBounds(bounds);

    hriNouto(crd.latitude, crd.longitude);
}

//If position is not found
function error(err){
    console.warn(`Error`);
}



/*--------------------------------------------------------------------------------*/
//Get activity locations (from myHelsinki)
/*--------------------------------------------------------------------------------*/


function getActivities(){
    //Concatenated MyHelsinki address
    const myHelsinkiAddress = baseURLMyHelsinki + tagSearch + searchTermMyHelsinki;
    //Cort proxy query address
    const query = `https://api.allorigins.win/get?url=${encodeURIComponent(myHelsinkiAddress)}`;

    fetch(query)
    .then(response => response.json())
    .then ((locationsData)=> {
        let parsedData = JSON.parse(locationsData.contents); //Parse incoming data
        //console.log(parsedData); //Console log parsed data

        for(let i = 0; i < parsedData.data.length; i++){
            //Get location
            const {lat, lon,} = parsedData.data[i].location;

            //Get name
            const {fi,} = parsedData.data[i].name;

            //Get address
            const {street_address,} = parsedData.data[i].location.address;

            //Osoitetta ei kannattane syöttää lopullisessa versiossa createMarkers-funktioon.
            //Muutetaan datavirtaa sitten sen mukaan, mihin sitä halutaan syöttää.
            createMarkers(lat, lon, fi, street_address);
        }
    });
}

/*--------------------------------------------------------------------------------*/
//Get activity locations from HRI
/*--------------------------------------------------------------------------------*/

function hriNouto() {
    const helfi = baseURLHRI + searchTermHRI;
    const query = `https://api.allorigins.win/get?url=${encodeURIComponent(helfi)}`;
    fetch(query)
    .then(response => response.json())
    .then((hriraw) => {
        let hriPar = JSON.parse(hriraw.contents);
        console.log(hriPar);
        try{
            for (let i=0; i<hriPar.length; i++) {
                if(hriPar[i].latitude != null || hriPar[i].longitude != null){

                    //Make latitude & longitude
                    let latlon = [];
                    latlon.lat = hriPar[i].latitude;
                    latlon.lon = hriPar[i].longitude;

                    let {lat, lon} = latlon;


                    const name = hriPar[i].name_fi;

                    const address = hriPar[i].street_address_fi;

                    createMarkers(lat, lon, name, address);

                }
            }
        }
        catch (err){
            console.log("error with latlong");
        }

    });
}



//Generate markers and current position
function createMarkers (latitude, longitude, title, street_address){
    //Get current marker position
    let markerPos = L.marker([latitude, longitude]).getLatLng();
    //Check if current marker is within the circle
    let distanceFromCircle = map.distance(markerPos, circle.getLatLng());
    //True if within
    let isInside = distanceFromCircle < circle.getRadius();

    if(isInside)
    {
        console.log('Success');
        // noinspection JSVoidFunctionReturnValueUsed
        let mark = L.marker([latitude, longitude])
        .addTo(markerGroup)
        .addTo(map)
        .on('click', function() { updateRoute(markerPos); })
        .bindPopup(`${title} ${"<br>"} ${street_address}`)
        .dragging.disable();



    }

}
