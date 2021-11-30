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

const map = L.map('map').setView([60.22, 24], 12);

//Poista, kun projekti on valmis
//const proxy = 'gobetween.oklabs.org/pipe/';
//const proxy = 'https://api.allorigins.win/raw?url=';
//END

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

//Start search
navigator.geolocation.getCurrentPosition(success, error);

//If position is found
function success(pos){
    const crd = pos.coords;
    getActivities(crd.latitude, crd.longitude);
    map.setView([crd.latitude, crd.longitude], 12); //Center map to user position

    createMarkers(crd.latitude, crd.longitude, 'Olet tässä');
}

//If position is not found
function error(err){
    console.warn(`Error`);
}

//Get activity locations
function getActivities(latitude, longitude){
    const myHelsinkiAddress = baseURLMyHelsinki + tagSearch; //Concatenated MyHelsinki address
    const query = `https://api.allorigins.win/get?url=${encodeURIComponent(myHelsinkiAddress)}`; //Cort proxy query address

    fetch(query)
        .then(response => response.json())
        .then ((locationsData)=> {
           // console.log('locationsData', locationsData.contents); //Nyt tulee dataa, muttei arrayna hmm pitää saada vaan se dataosuus
            let newdata = JSON.parse(locationsData.contents); //Uuuh var :D Joskus sitä on pakko käyttää :D copupastasin vaa koodia jostian 2016 vuodelta
            //koodi vuodelta 2016 saves the day! Nyt on nättinä data.
            console.log(newdata);
            console.log(newdata.data[0].id); //NYT TOIMII

            //Testimarkkeri
            const latitude = newdata.data[0].location.lat;
            const longitude = newdata.data[0].location.lon;

            createMarkers(latitude, longitude, 'Testimarkkeri');
        });
}

//Generate markers and current position
function createMarkers (latitude, longitude, teksti){
    L.marker([latitude, longitude]).
        addTo(map).
        bindPopup(teksti);
}