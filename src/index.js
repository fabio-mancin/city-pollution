"use strict";
import 'jquery';
import '@popperjs/core';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import _ from 'lodash';
import './style.css';

document.addEventListener("DOMContentLoaded", function (event) {
    const goButton = document.querySelector("#go");
    const getLocationButton = document.querySelector("#get-position");
    const randomButton = document.querySelector("#get-random");
    const latitudeSelector = document.querySelector("#latitude");
    const longitudeSelector = document.querySelector("#longitude");

    function getAirPollution(lat, lon) {
        axios.get(`https://api.waqi.info/feed/geo:${lat};${lon}/?token=${API_KEY}`)
            .then(function (response) {
                // handle success
                const rawJSON = response.data.data;
                const city = _.get(rawJSON, "city.name");
                console.log(rawJSON);
            })
            .catch(function (error) {
                // handle error
                console.log(error);
            })
            .then(function () {
                // always executed
            });
    };  

    goButton.addEventListener("click", function (e) {
        let latitude = latitudeSelector.value;
        let longitude = longitudeSelector.value;
        getAirPollution(latitude, longitude);
        this.blur();
    })

    getLocationButton.addEventListener("click", function (e) {
        navigator.geolocation.getCurrentPosition((position) => {
            latitudeSelector.value = position.coords.latitude;
            longitudeSelector.value = position.coords.longitude;
            getAirPollution(position.coords.latitude, position.coords.longitude);
        });
        this.blur();
    })

    randomButton.addEventListener("click", function (e) {
        function randomPlace() {
            let latitude = Math.random() * 91;
            let longitude = Math.random() * 181;
            latitudeSelector.value = latitude;
            longitudeSelector.value = longitude;
            getAirPollution(latitude, longitude);
        }
        randomPlace();
        this.blur();
    })
});