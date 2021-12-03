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
const tagSearch = 'v2/places/?tags_search=sports'; //MyHelsinki tag_search term

//luodaan kartta.
const map = L.map('map',{
    center: [60.22, 24], zoom:12,zoomControl:false
});
//navigaation siirto ala-oikealle
L.control.zoom({ position: 'bottomright' }).addTo(map);

//Poista, kun projekti on valmis
//const proxy = 'gobetween.oklabs.org/pipe/';
//const proxy = 'https://api.allorigins.win/raw?url=';
//END

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

let circle; //Circle to show bounds
let circleRadius = 2000; //Radius in meters.


//Start search
navigator.geolocation.getCurrentPosition(success, error);

//If position is found
function success(pos){
    const crd = pos.coords;
    //Create a circle to check for places near the current location
    circle = L.circle([crd.latitude, crd.longitude], {radius: circleRadius}).addTo(map);
    //Create marker for current position
    createMarkers(crd.latitude, crd.longitude, 'Olet tässä');
    getActivities(crd.latitude, crd.longitude);
    map.setView([crd.latitude, crd.longitude], 12); //Center map to user position

    //Get bounds of the circle if you want to zoom in on the position
    //let bounds = circle.getBounds();
    //map.fitBounds(bounds);
}

//If position is not found
function error(err){
    console.warn(`Error`);
}

//Get activity locations
function getActivities(latitude, longitude){
    //Concatenated MyHelsinki address
    const myHelsinkiAddress = baseURLMyHelsinki + tagSearch;
    //Cort proxy query address
    const query = `https://api.allorigins.win/get?url=${encodeURIComponent(myHelsinkiAddress)}`;

    fetch(query)
        .then(response => response.json())
        .then ((locationsData)=> {
            let parsedData = JSON.parse(locationsData.contents); //Parse incoming data
            console.log(parsedData); //Console log parsed data

            for(let i = 0; i < parsedData.data.length; i++){
                //Get location
                const {
                    lat,
                    lon,
                } = parsedData.data[i].location;

                //Get name
                const {
                    fi,
                } = parsedData.data[i].name;

                //Get address
                const {
                    street_address,
                } = parsedData.data[i].location.address;

                //Osoitetta ei kannattane syöttää lopullisessa versiossa createMarkers-funktioon.
                //Muutetaan datavirtaa sitten sen mukaan, mihin sitä halutaan syöttää.
                createMarkers(lat, lon, fi, street_address);
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
        let mark = L.marker([latitude, longitude]).
            addTo(map).
            bindPopup(`${title} ${street_address}`);
    }
}
