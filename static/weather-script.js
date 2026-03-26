//WEATHER APP

const weatherForm = document.querySelector('.weatherForm');
const cityInput = document.querySelector('.cityInput');
const resultsDiv = document.querySelector('.weatherResult');
const forecastDiv = document.querySelector('.forecastContainer');

// The weather API calls are now handled by Flask backend routes /api/weather and /api/forecast.
// We keep geoApiKey if you want to keep client-side autocomplete, or remove if you move it backend too.
const geoApiKey = '47762054b9f542af8f08c6840e9bab88';

// User timezone detection
const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Singapore';
let destinationTimeZone = 'UTC'; // Initialize with default
let timezoneString = 'UTC'; // Initialize with default
let timezoneOffsetHours = 0; // Initialize with default

// Go to map button
const mapButton = document.querySelector('.mapButton');
if (mapButton) {
    mapButton.addEventListener('click', () => {
        window.location.href = '/map'; // Navigate to the map page when button is clicked
    });
}
const aboutButton = document.querySelector('.aboutButton');
if (aboutButton) {
    aboutButton.addEventListener('click', () => {
        window.location.href = '/'; // Navigate to the about page when button is clicked
    });
}
// Current time widget for user's time
const usertimeWidget = document.createElement('div');
usertimeWidget.id = 'timeWidget';
usertimeWidget.style.cssText = 'position: fixed; top: 10px; right: 10px; font-size: 16px; color: #333; background: rgba(203, 255, 194, 0.8); padding: 5px; border-radius: 5px; z-index: 1000;';
document.body.appendChild(usertimeWidget);

//Destination time widget for destination time
const destinationTimeWidget = document.createElement('div');
destinationTimeWidget.id = 'destinationTimeWidget';
destinationTimeWidget.style.cssText = 'position: fixed; top: 60px; right: 10px; font-size: 16px; color: #333; background: rgba(255, 190, 190, 0.8); padding: 5px; border-radius: 5px; z-index: 1000;';
document.body.appendChild(destinationTimeWidget);

//Function to update time widgets
async function updateTimeWidget() {
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to ensure destinationTimeZone is updated before first display
    usertimeWidget.textContent = `Your Current Time: ${new Date().toLocaleString()}`;
    destinationTimeWidget.textContent = `Destination Time: ${new Date().toLocaleString(undefined, { timeZone: destinationTimeZone })}`;

}

setInterval(updateTimeWidget, 1000);
updateTimeWidget();



// Geolocation functions
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

//Function to get weather at user location
async function getWeatherByCoordinates(lat, lon) {
    try {
        const apiUrl = `/api/weather?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`;
        const response = await fetch(apiUrl);
        if (!response.ok) {
            const err = await response.json();
            displayError(err.error || 'Unable to fetch weather for your location.');
            return;
        }
        const data = await response.json();
        console.log('Weather data received from API for geolocation:', data); // Debugging log to check the structure of the weather data received from the API for geolocation
        displayWeather(data);
    } catch (error) {
        displayError('An error occurred. Please check your connection.');
        console.error('Geolocation weather fetch error:', error);
    }
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
        event.preventDefault(); // Prevent form from submitting and refreshing the page
        const city = cityInput.value.trim();
        if (city) {
            resultsDiv.classList.remove('animate');
            forecastDiv.classList.remove('animate--slow');
            const success = await getWeatherData(city);
            if (success) {
                void resultsDiv.offsetWidth; // Force reflow to reset animation
                void forecastDiv.offsetWidth; // Force reflow to reset animation
                resultsDiv.classList.add('animate'); // Re-add animation class to trigger animation
                forecastDiv.classList.add('animate--slow'); // Re-add animation class to trigger animation
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
            resultsDiv.classList.remove('animate'); // Remove animation class to allow re-triggering
            forecastDiv.classList.remove('animate--slow'); // Remove animation class to allow re-triggering
            const success = await getWeatherData(event.target.value); // Auto-fetch weather for selected city
            if (success) {
                void resultsDiv.offsetWidth; // Force reflow to reset animation
                void forecastDiv.offsetWidth; // Force reflow to reset animation
                resultsDiv.classList.add('animate'); // Re-add animation class to trigger animation
                forecastDiv.classList.add('animate--slow'); // Re-add animation class to trigger animation
                saveToRecentSearches(event.target.value); // Save selected city to recent searches only if fetch was successful
            }
        }
    });
}

// Recent searches functions
function saveToRecentSearches(city) {
    let recentSearches = JSON.parse(localStorage.getItem('recentSearchesList')) || [];
    // Remove city if it already exists to avoid duplicates
    recentSearches = recentSearches.filter(item => item.toLowerCase() !== city.toLowerCase());
    recentSearches.unshift(city); // Add new city to the beginning of the list
    recentSearches = recentSearches.slice(0, 5); // Keep only the 5 most recent searches
    localStorage.setItem('recentSearchesList', JSON.stringify(recentSearches));
    displayRecentSearches(recentSearches);
}

function displayRecentSearches(recentSearches) {
    const recentSearchesContainer = document.querySelector('.recentSearchesContainer');
    const recentSearchesList = document.querySelector('.recentSearchesList');
    recentSearchesList.innerHTML = ''; // Clear existing list
    recentSearches.forEach(city => {
        const cityItem = document.createElement('button');
        cityItem.textContent = city;
        cityItem.className = 'recentSearchItem';
        cityItem.addEventListener('click', () => {
            cityInput.value = city; // Fill input with clicked city
            resultsDiv.classList.remove('animate'); // Remove animation class to allow re-triggering
            forecastDiv.classList.remove('animate--slow'); // Remove animation class to allow re-triggering
            getWeatherData(city); // Fetch weather for clicked city
            resultsDiv.classList.add('animate'); // Re-add animation class to trigger animation
            forecastDiv.classList.add('animate--slow'); // Re-add animation class to trigger animation

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

// Error modal functions
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


function showErrorModal(message) {
    if (errorMessage && errorModal) {
        errorMessage.textContent = message;
        errorModal.style.display = 'flex';
    }
}


function hideErrorModal() {
    if (errorModal) {
        errorModal.style.display = 'none';
    }
}


function displayError(message) {
    showErrorModal(message);
}

// Fetch weather data from API
async function getWeatherData(city) {
    try {
        const apiUrl = `/api/weather?city=${encodeURIComponent(city)}`;
        const response = await fetch(apiUrl);

        if (!response.ok) {
            const err = await response.json();
            if (response.status === 404) {
                displayError(err.error || `City "${city}" is not found. Please try again.`);
            } else if (response.status === 400) {
                displayError(err.error || 'Please provide a valid city.');
            } else {
                displayError(err.error || 'Unable to fetch weather data. Please try again later.');
            }
            return false;
        }

        const data = await response.json();
        displayWeather(data);
        return true;
    } catch (error) {
        displayError('An error occurred. Please check your connection and try again.'); // Why is there no response code for this error? Because this catch block is for network errors or other unexpected issues that prevent the fetch from completing, so we can't rely on HTTP status codes here. We just show a generic error message.
        console.error('Weather fetch error:', error);
        return false; // Return false on error
    }
}

// Fetch city suggestions from Geoapify API for autocomplete
async function fetchCitySuggestions(searchTerm) {
    const dropdown = document.querySelector('.predictionsContainer');
    try {
        const geoApiUrl = `/api/geo?query=${encodeURIComponent(searchTerm)}`;
        const response = await fetch(geoApiUrl);
        console.log(response);
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
    // Both Date.now() and sunrise/sunset from API are in UTC time, so we can compare directly
    const currentTimeInSeconds = Math.floor(Date.now() / 1000);
    return currentTimeInSeconds >= sunriseTimestamp && currentTimeInSeconds < sunsetTimestamp;
}

//Function to convert UTC timestamp to local time using timezone offset
function timezoneConvert(utcTimestamp, timezoneOffset) {
    const localTimestamp = utcTimestamp + timezoneOffset;
    return new Date(localTimestamp * 1000); // Convert to milliseconds
}

//Function to convert the timeZones to valid IANA formatting (to be passed into .toLocaleTimeString)
function toValidIANA(utcStr) {
  // Reverses the sign for Etc/GMT format
  const offset = parseInt(utcStr.replace('UTC', ''));
  const sign = offset >= 0 ? '-' : '+';
  return `Etc/GMT${sign}${Math.abs(offset)}`;
}

// Function to display weather data in the results div
function displayWeather(data) {
    if (!resultsDiv) return;
    
    const { name, main, weather, wind, sys, coord } = data; 
    const temperature = Math.round(main.temp);
    const emoji = getWeatherEmoji(weather[0].id, isDaytime(sys.sunrise, sys.sunset));
    const weatherClass = getWeatherClass(weather[0].id, isDaytime(sys.sunrise, sys.sunset));
    const timeOfDay = isDaytime(sys.sunrise, sys.sunset) ? 'Day' : 'Night';
    const pressureMmHg = Math.round(main.pressure * 0.750062); // Convert hPa to mmHg
    const weatherDescription = `${weather[0].main}, ${timeOfDay}`; // This combines the weather condition with whether it's currently day or night.
    const dateRetrieved = new Date(data.dt * 1000); // Convert Unix timestamp to JavaScript Date object
    timezoneOffsetHours = data.timezone / 3600;
    timezoneString = `UTC${timezoneOffsetHours >= 0 ? '+' : ''}${timezoneOffsetHours}`;
    destinationTimeZone = toValidIANA(timezoneString); // Convert to "valid" (it's a simplification which does not account for DST) IANA timezone format for display and time conversion
    resultsDiv.innerHTML = `
        <p id="cityDisplay"><h1 style="color: #00b1ac;">${name}</h1> <h1 style="color: #8c038a;">${sys.country}</h1></p>
        <div class="iconDisplay">${emoji}</div>
        <div class="tempDisplay">${temperature}°C</div>
        <p class="descriptionDisplay">${weatherDescription}</p>
        <p class="humidityDisplay">Humidity: ${main.humidity}%</p>
        <p class="windDisplay">Wind Speed: ${wind.speed} m/s</p>
        <p class="pressureDisplay">Pressure: ${pressureMmHg} mmHg</p>
        <p class="sunriseDisplay">Sunrise: ${new Date(sys.sunrise * 1000).toLocaleTimeString('en-US', { timeZone: destinationTimeZone })} ${timezoneString}</p>
        <p class="sunsetDisplay">Sunset: ${new Date(sys.sunset * 1000).toLocaleTimeString('en-US', { timeZone: destinationTimeZone })} ${timezoneString}</p>
        <p class="updateTimeDisplay">Weather data last updated on: ${dateRetrieved.toLocaleString()} (Local Time)</p>
    `;
    resultsDiv.className = `weatherResult ${weatherClass}`;
    resultsDiv.style.display = 'flex';
    resultsDiv.classList.add('animate');
    getForecastData(name).then(forecastData => { // We can use the city name from the current weather data to fetch the forecast data, which ensures that we are fetching the forecast for the correct location, especially in cases where there might be multiple cities with the same name. This way, we can display the forecast for the exact city that the user searched for, rather than relying on the input value which might not always match perfectly with the API's expected format for city names.
        displayForecast(forecastData, data.sys.sunrise, data.sys.sunset);
    });
    console.log('JSON.stringify({ lat: coord.lat, lon: coord.lon }):', JSON.stringify({ lat: coord.lat, lon: coord.lon })); // Debugging log to check the coordinates being sent to the backend
    fetch('/update_destination', {
        method: 'POST',
        headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ lat: coord.lat, lon: coord.lon }) // Send the coordinates to the backend to update the map,
        })
        .then(response => response.json())
        .then(data => {
            console.log('Destination set on backend:', data);
        })
        .catch(error => {
            console.error('Error setting destination on backend:', error);
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
function getWeatherEmoji(weatherId, isDay) { //The OpenWeather API documentation provides a list of weather condition codes (IDs) that correspond to different weather phenomena, so we can use those codes to determine which emoji to display for each weather condition.
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
async function getForecastData(city, lat = null, lon = null) {
    try {
        let apiUrl;
        if (city) {
            apiUrl = `/api/forecast?city=${encodeURIComponent(city)}`;
        } else if (lat != null && lon != null) {
            apiUrl = `/api/forecast?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`;
        } else {
            throw new Error('City or lat/lon required for forecast');
        }
        const response = await fetch(apiUrl);

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Unable to fetch forecast data');
        }

        const forecastData = await response.json();
        return forecastData;
    } catch (error) {
        console.error('Error fetching forecast data:', error);
        throw error;
    }
}

// Function to determine if a forecast entry is during the day or night based on its timestamp (using UTC time for simplicity)
function isDayInForecast(forecastTimestamp) {
    const date = new Date(forecastTimestamp * 1000);
    const hour = date.getUTCHours() + timezoneOffsetHours; // We use getUTCHours() because the forecast timestamps are in UTC, so we need to get the hour in UTC to determine if it's day or night for that forecast entry. This way, we can show the appropriate emoji for each forecast entry based on whether it will be day or night at that time.
    console.log("Forecast UTC time:", forecastTimestamp, "Hour:", hour);
    return hour >= 6 && hour < 18; // 6 AM to 6 PM = day, rest = night
}

// Function to display forecast data in the forecast div
function displayForecast(forecastData, sunriseTimestamp, sunsetTimestamp) { /* This function is used to display the 5-day weather forecast data that is fetched by the getForecastData function. It takes the forecast data as input and processes it to extract relevant information such as temperature, weather conditions, and timestamps for each forecast entry. The function then generates HTML content to display this information in a user-friendly format, such as a list or grid of forecast cards, and inserts it into the appropriate section of the UI. */
    if (!forecastDiv || !forecastData) return;
    try {
        forecastDiv.innerHTML = '<h2><b>Next 24 Hours</b></h2>';
        const nextForecasts = forecastData.list.slice(0, 8); // Show only next 24 hours (8 x 3-hour intervals)
        nextForecasts.forEach(forecast => {
            const date = new Date(forecast.dt * 1000); // UTC timestamp
            const temperature = Math.round(forecast.main.temp);
            const weatherId = forecast.weather[0].id;
            const emoji = getWeatherEmoji(weatherId, isDayInForecast(forecast.dt)); // Keep UTC-based day/night for simplicity
            const forecastCard = document.createElement('div');
            forecastCard.className = 'forecastCard';
            forecastCard.innerHTML = `
                <p class="forecastTime">${date.toLocaleString('en-US', { timeZone: destinationTimeZone })} ${timezoneString}</p>
                <div class="iconDisplay-forecast">${emoji}</div>
                ${temperature > 20 ? `<p style="color: #e02900; font-weight: bold;">${temperature}°C</p>` : `<p style="color: #003ec5; font-weight: bold;">${temperature}°C</p>`}
            `;
            forecastDiv.appendChild(forecastCard);
            forecastDiv.style.display = 'flex';
        });
    } catch (error) {
        console.error('Error displaying forecast data:', error);
        throw error;
    }
}

//END CODE.