"use strict";
import 'jquery';
import '@popperjs/core';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import _ from 'lodash';
import './style.css';
import Chart from 'chart.js';

document.addEventListener("DOMContentLoaded", function (event) {
    const axios = require('axios');
    const API_KEY = process.env.API_KEY;
    const goButton = document.querySelector("#go");
    const getLocationButton = document.querySelector("#get-position");
    const randomButton = document.querySelector("#get-random");
    const latitudeSelector = document.querySelector("#latitude");
    const longitudeSelector = document.querySelector("#longitude");
    const stationSelector = document.querySelector("#station");
    const allButtonsSelector = document.querySelectorAll(".search-call");
    const customButton = document.querySelector("#custom");
    const coordinatesSelector = document.querySelectorAll(".coordinates");
    const mapSection = document.querySelector(".map");
    const searchSection = document.querySelector(".search");
    const scrollButton = document.querySelectorAll(".scroll");
    const switchButton = document.querySelector("#switch-map-chart");

    function makeMap(lat, lon) {
        var L = require('leaflet');
        var mapContainer = L.DomUtil.get('map');
        if (mapContainer != null) {
            mapContainer._leaflet_id = null;
        }
        var map = L.map('map').setView([lat, lon], 12);
        var marker = L.marker([lat, lon]).addTo(map);
        // add the OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
        }).addTo(map);
    }

    function getAirPollution(lat, lon) {
        axios.get(`https://api.waqi.info/feed/geo:
                    ${lat};${lon}/?token=${API_KEY}`)
            .then(function (response) {

                const rawJSON = response.data.data;
                const city = _.get(rawJSON, "city");
                makeMap(city.geo[0], city.geo[1]);
                const forecast = _.get(rawJSON, "forecast.daily.pm10");
                makeChart(forecast);
                stationSelector.value = city.name;
                console.log(rawJSON);
            })
            .catch(function (error) {
                // handle error
                console.log(error);
            })
            .then(function () {
                /*disabling the buttons for 3 seconds after each call
                  to avoid API abuse*/
                allButtonsSelector.forEach(button =>
                    button.classList.add("disabled"));
                setTimeout(() => {
                    allButtonsSelector.forEach(button =>
                        button.classList.remove("disabled"));
                }, 3000);
            });
    };

    customButton.addEventListener("click", function (e) {
        let latitude = latitudeSelector.value;
        let longitude = longitudeSelector.value;
        if (latitude.length !== 0 && longitude.length !== 0) {
            getAirPollution(latitude, longitude);
        } else {
            coordinatesSelector.forEach(e => e.classList.add("blink"));
            setTimeout(() => {
                coordinatesSelector.forEach(e =>
                    e.classList.remove("blink"));
            }, 3000);
        }
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

    //scroll the view between 
    scrollButton.forEach(b => {
        b.addEventListener("click", function () {
            if (this.dataset.direction === "down")
                mapSection.scrollIntoView();
            else
                searchSection.scrollIntoView();
            this.blur();
        })
    })

    window.addEventListener("wheel", e => {
        if (e.deltaY === 100) mapSection.scrollIntoView();
        if (e.deltaY === -100) searchSection.scrollIntoView();
    });

    /*
    window.addEventListener("scroll", e => {
        console.log(e)
        if (e.deltaY === 100) mapSection.scrollIntoView();
        if (e.deltaY === -100) searchSection.scrollIntoView();
    });*/

    //returns the danger level of given pm10 value
    function dangerLevel(pmVal) {
        const ranges = {
            "good": {
                values: [0, 50],
                color: "rgba(128, 255, 128, 0.5)",
                desc: "Air quality is considered satisfactory, and air pollution poses little or no risk."
            },
            "moderate": {
                values: [51, 100],
                color: "rgba(255, 255, 102, 0.5)",
                desc: "Air quality is acceptable; however, for some pollutants there may be a moderate health concern for a very small number of people who are unusually sensitive to air pollution."
            },
            "poor": {
                values: [101, 150],
                color: "rgba(255, 163, 102, 0.5)",
                desc: "Members of sensitive groups may experience health effects. The general public is not likely to be affected."
            },
            "unhealthy": {
                values: [151, 200],
                color: "rgba(255, 26, 26, 0.5)",
                desc: "Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects."
            },
            "very unhealthy": {
                values: [201, 300],
                color: "rgba(102, 0, 77, 0.5)",
                desc: "Health warnings of emergency conditions. The entire population is more likely to be affected."
            },
            "hazardous": {
                values: [301, 500],
                color: "rgb(77, 0, 0, 0.5)",
                desc: "Health alert: everyone may experience more serious health effects."
            },
        }
        const level = _.find(ranges, (e) =>
            pmVal >= e.values[0] && pmVal <= e.values[1]);
        return level;
    }

    function makeChart(forecastData) {
        var ctx = document.getElementById("chart");
        ctx.style.backgroundColor = 'rgba(0,0,0,0.1)';
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: forecastData.map(e => e.day.slice(-5)),
                datasets: [{
                    label: "Average PM10 Level",
                    data: forecastData.map(e => e.avg),
                    backgroundColor: forecastData.map(e => dangerLevel(e.avg).color)
                }]
            },
            options: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        boxWidth: 80,
                        fontColor: 'white'
                    }
                },
                scales: {
                    yAxes: [{
                        ticks: {
                            fontColor: "white",
                            beginAtZero: true
                        }
                    }],
                    xAxes: [{
                        ticks: {
                            fontColor: "white"
                        }
                    }]
                }
            }
        });
    }

    switchButton.addEventListener("click", function () {
        document.querySelectorAll(".map-chart").forEach(e => {
            let classes = e.classList;
            if (classes.contains("visible"))
                classes.replace("visible", "hidden");
            else classes.replace("hidden", "visible");
        })
        this.innerHTML === "Map" ?
            this.innerHTML = "Forecast Chart" : this.innerHTML = "Map";
        this.blur();
    });
});