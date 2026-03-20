//WEATHER APP

const weatherForm = document.querySelector('.weatherForm');
const cityInput = document.querySelector('.cityInput');
const resultsDiv = document.querySelector('.weatherResult');
const forecastDiv = document.querySelector('.forecastContainer');
const apiKey = '9b85f2e58dfca8a92b60014d4485d6da';
const geoApiKey = '47762054b9f542af8f08c6840e9bab88'; 


//Initial check for geolocation support (for potential future use of geolocation features)


function initializeGeolocation() {
    // Check if coordinates already stored
    const savedLocation = localStorage.getItem('userLocation');
    
    if (savedLocation) {
        // User allowed before: use saved coordinates
        const {lat, lon} = JSON.parse(savedLocation);
        getWeatherByCoordinates(lat, lon);
    } else {
        // First time: request permission
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const {latitude, longitude}  = position.coords;
                localStorage.setItem('userLocation', JSON.stringify({
                    lat: latitude,
                    lon: longitude
                }));
                getWeatherByCoordinates(latitude, longitude);
            },
            (error) => {
                console.log('User denied geolocation, showing search form');
                // User denied permission: show search form instead
            }
        );
    }
}

function getWeatherByCoordinates(lat, lon) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`;
    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch weather data');
            }
            return response.json();
        })
        .then(data => {
            // Process the weather data
            displayWeather(data);
        })
        .catch(error => {
            console.error('Error fetching weather data:', error);
            displayError('Failed to fetch weather data.');
        });
}


// Get error modal elements
const errorModal = document.querySelector('.errorModal');
const closeErrorBtn = document.querySelector('.CloseError');
const errorMessage = document.querySelector('.errorMessage');

// Initialize event listeners only if elements exist
if (weatherForm && cityInput) {
    // Handle form submission
    try {
        initializeGeolocation(); // Check geolocation on page load
    } catch (error) {
        console.error('Error initializing geolocation:', error);
    }
    const savedSearches = JSON.parse(localStorage.getItem('recentSearchesList')) || [];
    displayRecentSearches(savedSearches); // Display saved recent searches on page load
    weatherForm.addEventListener('submit', async event => {
        event.preventDefault();
        const city = cityInput.value.trim();
        
        if (city) {
            const success = await getWeatherData(city);
            if (success) {
                saveToRecentSearches(city);
            }
        } else {
            displayError('Please enter a city name.');
        }
    });

    // Handle input for search suggestions (separate from submit)
    cityInput.addEventListener('input', () => {
        const searchTerm = cityInput.value.trim();
        if (searchTerm) {
            fetchCitySuggestions(searchTerm);
        } else {
            // Hide dropdown if input is empty
            const dropdown = document.querySelector('.predictionsContainer');
            dropdown.style.display = 'none';
        }
    });

    // Handle dropdown selection
    const dropdown = document.querySelector('.predictionsContainer'); // We can select the dropdown here because we know it exists in the HTML, and we will check for its existence before adding event listeners to avoid errors if it doesn't exist for some reason.
    dropdown.addEventListener('change', async (event) => {
        if (event.target.value) { // Check if a valid option is selected (not the placeholder)
            cityInput.value = event.target.value; // Fill input with selected value
            dropdown.style.display = 'none'; // Hide dropdown
            const success = await getWeatherData(event.target.value); // Auto-fetch weather for selected city
            if (success) {
                saveToRecentSearches(event.target.value); // Save selected city to recent searches only if fetch was successful
            }
        }
    });
}

function saveToRecentSearches(city) {
    let recentSearches = JSON.parse(localStorage.getItem('recentSearchesList')) || [];
    // Remove city if it already exists to avoid duplicates
    recentSearches = recentSearches.filter(item => item.toLowerCase() !== city.toLowerCase());
    recentSearches.unshift(city); // Add new city to the beginning of the list
    recentSearches = recentSearches.slice(0, 5); // Keep only the 5 most recent searches
    localStorage.setItem('recentSearchesList', JSON.stringify(recentSearches));
    displayRecentSearches(recentSearches);
}

function displayRecentSearches(recentSearches) { //Does this work if i put recentSearches as a parameter? Yes, it works because we are passing the recentSearches array as an argument to the displayRecentSearches function when we call it from saveToRecentSearches. This way, we can update the recent searches list in the UI immediately after saving a new search to localStorage, without needing to fetch it again from localStorage inside the displayRecentSearches function. The recentSearches parameter allows us to directly use the updated list of recent searches that we just saved, ensuring that the UI reflects the most current data.
    const recentSearchesContainer = document.querySelector('.recentSearchesContainer');
    const recentSearchesList = document.querySelector('.recentSearchesList');
    recentSearchesList.innerHTML = ''; // Clear existing list
    recentSearches.forEach(city => {
        const cityItem = document.createElement('button');
        cityItem.textContent = city;
        cityItem.className = 'recentSearchItem';
        cityItem.addEventListener('click', () => {
            cityInput.value = city; // Fill input with clicked city
            getWeatherData(city); // Fetch weather for clicked city
        });
        recentSearchesList.appendChild(cityItem);
    });
    recentSearchesContainer.style.display = recentSearches.length > 0 ? 'block' : 'none'; // Show container only if there are recent searches
}

function clearRecentSearches() {
    localStorage.removeItem('recentSearchesList');
    displayRecentSearches([]);
}

if (document.querySelector('.clearHistoryBtn')) {
    document.querySelector('.clearHistoryBtn').addEventListener('click', clearRecentSearches);
}

// Initialize modal event listeners only if modal elements exist
if (errorModal && closeErrorBtn) {
    closeErrorBtn.addEventListener('click', hideErrorModal);
    
    errorModal.addEventListener('click', (event) => {
        if (event.target === errorModal) {   // Click outside the modal content to close (inside click won't close because .errorContent is a child of .errorModal)
            hideErrorModal(); 
        }
    });
    
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && errorModal.style.display === 'flex') {
            hideErrorModal();
        }
    });
}

// Function to show error modal
function showErrorModal(message) {
    if (errorMessage && errorModal) {
        errorMessage.textContent = message;
        errorModal.style.display = 'flex';
    }
}

// Function to hide error modal
function hideErrorModal() {
    if (errorModal) {
        errorModal.style.display = 'none';
    }
}

// Display error using modal (replaces old inline error display)
function displayError(message) {
    showErrorModal(message);
}

// Fetch weather data from API
async function getWeatherData(city) {
    try {
        const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`;
        const response = await fetch(apiUrl);
        
        if (!response.ok) { // Response is ok if error code is < 400. We check for !response.ok to catch all errors.
            if (response.status === 404) {
                displayError(`City "${city}" is not found. Please try again.`);
            } else {
                displayError('Unable to fetch weather data. Please try again later.');
            }
            return false; // Return false on error
        }
        
        const data = await response.json(); // We can safely parse JSON here because we already checked for response.ok. If the response is not ok, we handle it before trying to parse.
        displayWeather(data);
        return true; // Return true on success
    } catch (error) {
        displayError('An error occurred. Please check your connection and try again.'); // Why is there no response code for this error? Because this catch block is for network errors or other unexpected issues that prevent the fetch from completing, so we can't rely on HTTP status codes here. We just show a generic error message.
        console.error('Weather fetch error:', error);
        return false; // Return false on error
    }
}

async function fetchCitySuggestions(searchTerm) {
    const dropdown = document.querySelector('.predictionsContainer');
    try {
        const geoApiUrl = `https://api.geoapify.com/v1/geocode/search?text=${searchTerm}&apiKey=${geoApiKey}`;
        const response = await fetch(geoApiUrl);
        
        if (!response.ok) {
            dropdown.style.display = 'none';
            throw new Error('Failed to fetch city suggestions', { cause: response.status });
        }
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
            dropdown.innerHTML = '<option value="">Click for autocomplete options...</option>';
            data.features.forEach(feature => {
                const option = document.createElement('option');
                option.value = feature.properties.formatted;
                option.textContent = feature.properties.formatted;
                dropdown.append(option);
            });
            dropdown.style.display = 'block'; // Show dropdown when suggestions available
        } else {
            dropdown.style.display = 'none'; // Hide if no suggestions
        }
    } catch (error) {
        dropdown.style.display = 'none';
        console.error('Error fetching city suggestions:', error);
    }
}

// Function to determine if it's currently daytime based on sunrise/sunset times
function isDaytime(sunriseTimestamp, sunsetTimestamp) {
    // Both Date.now() and sunrise/sunset from API are in UTC, so we can compare directly
    const currentTimeInSeconds = Math.floor(Date.now() / 1000);
    console.log("Current UTC time:", currentTimeInSeconds, "Sunrise:", sunriseTimestamp, "Sunset:", sunsetTimestamp);
    return currentTimeInSeconds >= sunriseTimestamp && currentTimeInSeconds < sunsetTimestamp;
}



// Display weather data in the results div
function displayWeather(data) {
    if (!resultsDiv) return;
    
    const { name, main, weather, wind, pressure, sys } = data; 
    const temperature = Math.round(main.temp - 273.15);
    const isDay = isDaytime(sys.sunrise, sys.sunset);
    const emoji = getWeatherEmoji(weather[0].id, isDay);
    const weatherClass = getWeatherClass(weather[0].id, isDay);
    const timeOfDay = isDay ? 'Day' : 'Night';
    const pressureMmHg = Math.round(main.pressure * 0.750062); // Convert hPa to mmHg
    const weatherDescription = `${weather[0].main}, ${timeOfDay}`; // This combines the weather condition with whether it's currently day or night.

    resultsDiv.innerHTML = `
        <p id="cityDisplay"><h1 style="color: #00b1acdf;">${name}</h1>, <h1 style="color: #8c038a;">${sys.country}</h1></p>
        <div class="iconDisplay">${emoji}</div>
        <div class="tempDisplay">${temperature}°C</div>
        <p class="descriptionDisplay">${weatherDescription}</p>
        <p class="humidityDisplay">Humidity: ${main.humidity}%</p>
        <p class="windDisplay">Wind Speed: ${wind.speed} m/s</p>
        <p class="pressureDisplay">Pressure: ${pressureMmHg} mmHg</p>
    `;
    resultsDiv.className = `weatherResult ${weatherClass}`;
    resultsDiv.style.display = 'flex';
    getForecastData(name).then(forecastData => { // We can use the city name from the current weather data to fetch the forecast data, which ensures that we are fetching the forecast for the correct location, especially in cases where there might be multiple cities with the same name. This way, we can display the forecast for the exact city that the user searched for, rather than relying on the input value which might not always match perfectly with the API's expected format for city names.
        displayForecast(forecastData, data.sys.sunrise, data.sys.sunset);
    });
}

// Get weather type class based on weather ID for styling
function getWeatherClass(weatherId, isDay) {
    if (weatherId >= 200 && weatherId <= 299) return 'weather-thunderstorm';
    if (weatherId >= 300 && weatherId <= 399) return 'weather-drizzle';
    if (weatherId >= 500 && weatherId <= 599) return 'weather-rain';
    if (weatherId >= 600 && weatherId <= 699) return 'weather-snow';
    if (weatherId >= 700 && weatherId <= 799) return 'weather-mist';
    if (weatherId === 800) return isDay ? 'weather-clear-day' : 'weather-clear-night';
    if (weatherId >= 801 && weatherId <= 899) return isDay ? 'weather-clouds-day' : 'weather-clouds-night';
    return 'weather-default';
}
// Get emoji based on weather ID from OpenWeather API
function getWeatherEmoji(weatherId, isDay) { //how do we know what weatherId means? Because the OpenWeather API documentation provides a list of weather condition codes (IDs) that correspond to different weather phenomena, so we can use those codes to determine which emoji to display for each weather condition.
    if (weatherId >= 200 && weatherId <= 299) return '⛈️'; // Thunderstorm
    if (weatherId >= 300 && weatherId <= 399) return '🌧️'; // Drizzle
    if (weatherId >= 500 && weatherId <= 599) return '🌧️'; // Rain
    if (weatherId >= 600 && weatherId <= 699) return '❄️'; // Snow
    if (weatherId >= 700 && weatherId <= 799) return '🌫️'; // Atmosphere (mist, etc.)
    if (weatherId === 800) return isDay ? '☀️' : '🌙'; // Clear
    if (weatherId >= 801 && weatherId <= 899) return isDay ? '🌥️' : '☁️🌕'; // Clouds
    return '❔'; // Default
}

// Forecast functions
async function getForecastData(city) { /* This function is used to fetch 5-day weather forecast data from the OpenWeather API. It follows a similar structure to the getWeatherData function, but it calls a different endpoint of the API that provides forecast data instead of current weather data. The function returns the forecast data as a JSON object, which can then be processed and displayed in the UI as needed. */
    try {
        const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}`;
        const response = await fetch(apiUrl);
        const forecastData = await response.json();
        return forecastData;
    } catch (error) {
        console.error('Error fetching forecast data:', error);
        throw error;
    }
}

function isDayInForecast(forecastTimestamp) {
    const date = new Date(forecastTimestamp * 1000);
    const hour = date.getUTCHours(); // We use getUTCHours() because the forecast timestamps are in UTC, so we need to get the hour in UTC to determine if it's day or night for that forecast entry. This way, we can show the appropriate emoji for each forecast entry based on whether it will be day or night at that time.
    console.log("Forecast UTC time:", forecastTimestamp, "Hour:", hour);
    return hour >= 6 && hour < 18; // 6 AM to 6 PM = day, rest = night
}

function displayForecast(forecastData, sunriseTimestamp, sunsetTimestamp) { /* This function is used to display the 5-day weather forecast data that is fetched by the getForecastData function. It takes the forecast data as input and processes it to extract relevant information such as temperature, weather conditions, and timestamps for each forecast entry. The function then generates HTML content to display this information in a user-friendly format, such as a list or grid of forecast cards, and inserts it into the appropriate section of the UI. */
    if (!forecastDiv || !forecastData) return;
    try {
        forecastDiv.innerHTML = '<h2><b>Next 24 Hours</b></h2>';
        const nextForecasts = forecastData.list.slice(0, 8); // Show only next 24 hours (8 x 3-hour intervals)
        nextForecasts.forEach(forecast => {
            const date = new Date(forecast.dt * 1000); // Convert Unix timestamp to JavaScript Date
            const temperature = Math.round(forecast.main.temp - 273.15);
            const weatherId = forecast.weather[0].id;
            const emoji = getWeatherEmoji(weatherId, isDayInForecast(forecast.dt)); // We can determine if it's day or night for the forecast time by comparing the forecast timestamp with the sunrise and sunset timestamps for that day, which we can get from the current weather data. This way, we can show the appropriate emoji for each forecast entry based on whether it will be day or night at that time.
            const forecastCard = document.createElement('div');
            forecastCard.className = 'forecastCard';
            forecastCard.innerHTML = `
                <p>${date.toLocaleString()}</p>
                <div class="iconDisplay-forecast">${emoji}</div>
                <p>${temperature}°C</p>
            `;
            forecastDiv.appendChild(forecastCard);
            forecastDiv.style.display = 'flex';
        });
    } catch (error) {
        console.error('Error displaying forecast data:', error);
        throw error;
    }
}



// Questions:
// 1. What is the 0000 point of the clock used for sunrise/sunset comparison? The 0000 point of the clock, also known as the Unix epoch, is January 1, 1970, at 00:00:00 UTC. The OpenWeather API provides sunrise and sunset times as Unix timestamps, which represent the number of seconds that have elapsed since this epoch time. By comparing the current time (also converted to a Unix timestamp) with the sunrise and sunset timestamps, we can determine if it's currently day or night in the city.
// Follow-up: Won't there be a lot of seconds? Yes, there will be a large number of seconds since the epoch, but that's perfectly normal for Unix timestamps. For example, as of June 2024, the current Unix timestamp is around 1.7 billion seconds. The important thing is that all timestamps (current time, sunrise, and sunset) are in the same format (seconds since the epoch), so we can directly compare them to determine if it's day or night without worrying about the actual number of seconds.

// 2. Do we need to handle for timezones when comparing sunrise/sunset with current time? No, we do not need to handle timezones separately in this case because the OpenWeather API provides sunrise and sunset times in UTC as Unix timestamps. When we get the current time using `Date.now()`, it also gives us the time in UTC as a Unix timestamp. Since both the sunrise/sunset times and the current time are in the same format and timezone (UTC), we can directly compare them without needing to convert for timezones.