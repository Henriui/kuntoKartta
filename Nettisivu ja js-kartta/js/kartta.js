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

const description = document.querySelector('#description'); //Get description section from kartta.html

//Create a custom marker
//Koodi tänne

startSearch(); //Call startSearch function on start

/*--------------------------------------------------------------------------------*/
//Get filter buttons from sidenav and change search term
/*--------------------------------------------------------------------------------*/
const sports = document.querySelector('#sports').addEventListener('click', function(){
    changeSearchTerm('sports', 'liikunta+helsinki')
});

const swim = document.querySelector('#swim').addEventListener('click', function(){
    changeSearchTerm('Swimming', 'uima-allas+helsinki')
});

const gym = document.querySelector('#gym').addEventListener('click', function(){
    changeSearchTerm('Gym', 'kuntosali+helsinki')
});

const sauna = document.querySelector('#sauna').addEventListener('click', function(){
    changeSearchTerm('Sauna', 'sauna+helsinki')
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
    center: [60.22, 24], zoom:12,zoomControl:false, closePopupOnClick:true
});
//navigaation siirto ala-oikealle
L.control.zoom({ position: 'bottomright' }).addTo(map);

//Close navigation and description bars on null click
map.on('popupclose', function(){
    //console.log('Null click on map')
    description.style.width = null; //Clear style on description element
    description.style.padding = null; //Clear style on description element
    description.innerHTML = ""; //Clear all child elements of description field
    updateRoute(null); //Update route with a null value
});

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

//Create description field in kartta.html sidenav
function createDescription(title, address, desc, web){
    description.innerHTML = ""; //Clear all child elements of description field
    let nameField = document.createElement('p');
    let addressField = document.createElement('p');
    let descField = document.createElement('p');
    let webField = document.createElement('a');

    if (title != null){nameField.innerHTML = title;}
    else{nameField.innerHTML = "";}

    if (address != null){addressField.innerHTML = address;}
    else{addressField.innerHTML = "";}

    if (desc != null){addressField.innerHTML = desc;}
    else{descField.innerHTML = "";}

    if (web != null){
        webField.href = web;
        webField.innerText = "Nettisivuille";}
    else{webField.innerText = "Ei nettisivuja";
    webField.style = "color:black";}

    //Add elements as child

    description.appendChild(nameField);
    description.appendChild(addressField);
    description.appendChild(descField);
    description.appendChild(webField);
}


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
        console.log(parsedData); //Console log parsed data

        for(let i = 0; i < parsedData.data.length; i++){
            //Get location
            const {lat, lon,} = parsedData.data[i].location;

            //Get name
            const {name,} = parsedData.data[i].name;

            //Get address
            const {street_address,} = parsedData.data[i].location.address;

            //Web address and description to marker.
            const desc =  parsedData.data[i].description.body;
            const web =  parsedData.data[i].info_url;

            createMarkers(lat, lon, name, street_address, desc, web);
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
        //console.log(hriPar);
        try{
            for (let i=0; i<hriPar.length; i++) {
                if(hriPar[i].latitude != null || hriPar[i].longitude != null){

                    //Make latitude & longitude
                    let latlon = [];
                    latlon.lat = hriPar[i].latitude;
                    latlon.lon = hriPar[i].longitude;
                    let {lat, lon} = latlon;
                    //Get name and address
                    const name = hriPar[i].name_fi;
                    const address = hriPar[i].street_address_fi;

                    //Web address and description to marker.
                    const desc = hriPar[i].desc_fi;
                    const web = hriPar[i].www_fi;
                    createMarkers(lat, lon, name, address, desc, web);

                }
            }
        }
        catch (err){
            console.log("error with latlong");
        }
    });
}


//Generate markers and current position
function createMarkers (latitude, longitude, title, street_address, desc, web){
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
        .on('click', function() { updateRoute(markerPos);
            createDescription(title, street_address, desc, web);
            openSide();})
        .bindPopup(`${title} ${"<br>"} ${street_address}`)
        .dragging.disable();
    }






}

//-----------sivupalkkien funktiot-----------------
let sideopen = false;
let wasopen = false;

let navopen = false;

// Description palkki
function openSide(){
    document.getElementById("description").style.width = "255px";
    document.getElementById("description").style.padding = "20px";
    document.getElementById("description").style.visibility = "visible";
    if (navopen === true){
        closeNav();
    }
    if (sideopen === false){
        sideopen = true;
    }
}
function closeSide(){
    sideopen = false;
    wasopen = true;
    document.getElementById("description").style.width = "0px";
    document.getElementById("description").style.padding = "0px";
    document.getElementById("description").style.visibility = "hidden";
}

//Päämenu avaus ja sulku
function openNav() {
    navopen = true;
    document.getElementById("mySidenav").style.width = "275px";
    document.getElementById("myOpen").style.visibility="hidden";
    if (sideopen === true){
        closeSide();
    }
}

function closeNav() {
    document.getElementById("mySidenav").style.width = "0";
    document.getElementById("myOpen").style.visibility="visible";
    if (wasopen === true){
        navopen = false;
        openSide();
    }
}