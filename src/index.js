"use strict";
import 'jquery';
import '@popperjs/core';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import _ from 'lodash';
import tippy from 'tippy.js';
import Chart from 'chart.js';
import L from 'leaflet';
import axios from 'axios';
//fixing an issue with leaflet
//https://github.com/Leaflet/Leaflet/issues/4968#issuecomment-264311098
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow
});
L.Marker.prototype.options.icon = DefaultIcon;

import 'tippy.js/themes/light-border.css';
import 'leaflet/dist/leaflet.css';
import './style.css';

document.addEventListener("DOMContentLoaded", function (event) {

    //set up the map with Leaflet
    function makeMap(lat, lon) {
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

    //call the various functions to use the received data
    function handleReceivedJSON(json) {
        const stationSelector = document.querySelector("#station");
        const todayParagraphSelector = document.querySelector("#today");
        //getting the city the station is in..
        const city = _.get(json, "city");
        //..the forecast for the coming days..
        const forecast = _.get(json, "forecast.daily");
        //..and today's value
        const pmVal = _.get(json, "aqi");

        //sending the coordinates to the map function
        makeMap(city.geo[0], city.geo[1]);
        //initializing the chart with forecast data
        makeChart(forecast);

        //showing the station name on the page
        stationSelector.value = city.name;

        //showing today's data in the second section
        const todayParagraph = `The average Air Quality Index detected in ${city.name} 
                                today is <strong>${pmVal}</strong>. 
                                This is considered <strong>${dangerLevel(pmVal)[1]}</strong>: ${dangerLevel(pmVal)[0].desc}`;
        todayParagraphSelector.innerHTML = todayParagraph;
    }

    //actual API call
    function getAirPollution(lat, lon) {
        const searchSelector = document.querySelectorAll(".search-call");
        //retrieving the API KEY from the environment
        const API_KEY = process.env.API_KEY;
        axios.get(`https://api.waqi.info/feed/geo:
                    ${lat};${lon}/?token=${API_KEY}`)
            .then(function (response) {
                //handle successful request
                handleReceivedJSON(response.data.data);
                console.info(`Data received correctly.`)
            })
            .catch(function (error) {
                // handle error
                console.error(`An error occurred when fetching data from remote server: ${error}`);
            })
            .then(function () {
                /*disabling the buttons for 3 seconds after each call
                  to avoid API abuse*/
                searchSelector.forEach(button =>
                    button.classList.add("disabled"));
                setTimeout(() => {
                    searchSelector.forEach(button =>
                        button.classList.remove("disabled"));
                }, 3000);
            });
    };

    //loading custom coordinates
    const latitudeSelector = document.querySelector("#latitude");
    const longitudeSelector = document.querySelector("#longitude");
    const customButtonSelector = document.querySelector("#custom");
    customButtonSelector.addEventListener("click", function (e) {
        const coordinatesSelector = document.querySelectorAll(".coordinates");
        let latitude = latitudeSelector.value;
        let longitude = longitudeSelector.value;
        //making sure the inputs are both filled before calling the api
        if (latitude.length !== 0 && longitude.length !== 0) {
            getAirPollution(latitude, longitude);
        } else {
            //if they aren't, relative inputs blink red
            coordinatesSelector.forEach(e => e.classList.add("blink"));
            setTimeout(() => {
                coordinatesSelector.forEach(e =>
                    e.classList.remove("blink"));
            }, 3000);
        }
        this.blur();
    })

    //geolocalizing the user and using the coordinates
    const getLocationButton = document.querySelector("#get-position");
    getLocationButton.addEventListener("click", function (e) {
        navigator.geolocation.getCurrentPosition((position) => {
            latitudeSelector.value = position.coords.latitude;
            longitudeSelector.value = position.coords.longitude;
            getAirPollution(position.coords.latitude, position.coords.longitude);
        });
        this.blur();
    })

    //generating random coordinates
    const randomButtonSelector = document.querySelector("#get-random");
    randomButtonSelector.addEventListener("click", function (e) {
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
    const mapSectionSelector = document.querySelector(".map");
    const searchSectionSelector = document.querySelector(".search");
    const scrollButtonSelector = document.querySelectorAll(".scroll");
    scrollButtonSelector.forEach(b => {
        b.addEventListener("click", function () {
            if (this.dataset.direction === "down")
                mapSectionSelector.scrollIntoView();
            else
                searchSectionSelector.scrollIntoView();
            this.blur();
        })
    })

    //overflow is hidden, this makes mousewheel work
    window.addEventListener("wheel", e => {
        if (e.deltaY > 0) mapSectionSelector.scrollIntoView();
        if (e.deltaY < 0) searchSectionSelector.scrollIntoView();
    });

    //for mobile compatibility, untested
    window.addEventListener("scroll", e => {
        if (e.deltaY > 0) mapSectionSelector.scrollIntoView();
        if (e.deltaY < 0) searchSectionSelector.scrollIntoView();
    });

    //returns the danger level of given pm10 value
    function dangerLevel(pmVal) {
        const ranges = {
            "good": {
                values: [0, 50],
                color: "rgba(128, 255, 128, 0.5)",
                desc: "air quality is considered satisfactory, and air pollution poses little or no risk."
            },
            "moderate": {
                values: [51, 100],
                color: "rgba(255, 255, 102, 0.5)",
                desc: "air quality is acceptable; however, for some pollutants there may be a moderate health concern for a very small number of people who are unusually sensitive to air pollution."
            },
            "poor": {
                values: [101, 150],
                color: "rgba(255, 163, 102, 0.5)",
                desc: "members of sensitive groups may experience health effects. The general public is not likely to be affected."
            },
            "unhealthy": {
                values: [151, 200],
                color: "rgba(255, 26, 26, 0.5)",
                desc: "everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects."
            },
            "very unhealthy": {
                values: [201, 300],
                color: "rgba(102, 0, 77, 0.5)",
                desc: "health warnings of emergency conditions. The entire population is more likely to be affected."
            },
            "hazardous": {
                values: [301, 500],
                color: "rgb(77, 0, 0, 0.5)",
                desc: "health alert: everyone may experience more serious health effects."
            },
        }
        const level = _.find(ranges, e => pmVal >= e.values[0] && pmVal <= e.values[1]);
        const rating = _.findKey(ranges, e => pmVal >= e.values[0] && pmVal <= e.values[1])
        return [level, rating];
    }

    //I need this on the outer scope because it needs to be set to handle subsequent chart initializations
    let chart;
    //creates the forecast chart from received data
    function makeChart(forecastData) {
        //utility function to get the average from an array of values
        const arrayAverage = array => array.reduce((a, b) => a + b, 0) / array.length;

        //data is returned as object, making it an array for easy parsing
        const iterableForecastData = Object.entries(forecastData).map(e=>e[1]);
        //forecast data isn't always consistent in terms of how many days are predicted, getting the shortest value to avoid errors in future parsing
        const shortestForecast = Math.min(...iterableForecastData.map(e=>e.length));
        //and returning consistent data
        const consistentForecastData = iterableForecastData.map(e=>e.slice(0,shortestForecast));

        //getting an array of days from the first array
        const days = consistentForecastData[0].map(e=>e.day.slice(5));

        //getting the average of each relevation type for each day..
        const averageParticles = consistentForecastData.map(a=>a.map(e=>e.avg));
        //..and compressing those values so I get an array of values per day that gets averaged via the utility function
        const totalAveragePerDay = _.zip(...averageParticles).map(e=>arrayAverage(e));
       
        //if a new chart is drawn on top of an existing one the graphics glitch
        //so I just destroy it if it exists
        if (chart !== undefined) {
            chart.destroy();
        }

        //calling ChartJS to create the chart
        const ctxSelector = document.querySelector("#chart");
        chart = new Chart(ctxSelector, {
            type: 'bar',
            data: {
                labels: days,
                datasets: [{
                    label: "Average AQI Forecast",
                    data: totalAveragePerDay,
                    backgroundColor: totalAveragePerDay.map(e => dangerLevel(e)[0].color)
                }]
            },
            options: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        boxWidth: 40,
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

    //handles the switch between visualization of map and chart
    const switchButtonSelector = document.querySelector("#switch-map-chart");
    switchButtonSelector.addEventListener("click", function () {
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

    //tooltips
    function setTooltips() {
        tippy.setDefaultProps({
            delay: 600,
            theme: 'light-border'
        });
    
        tippy('#custom', {
            content: 'Load the provided coordinates.',
        });
        tippy('#get-random', {
            content: 'Load random coordinates.',
        });
        tippy('#get-position', {
            content: 'Geolocalize this computer.',
        });
        tippy('.scroll[data-direction="down"]', {
            content: "Let's see the data!",
        });
        tippy('.scroll[data-direction="up"]', {
            content: "Go back to search!",
        });
        tippy('#switch-map-chart', {
            content: "Switch between map and forecast chart.",
        });
    }
    setTooltips();
});