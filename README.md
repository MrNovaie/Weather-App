# 🌤️ Weather App

A real-time weather application that automatically detects your location and displays current weather, forecasts, and search history.

Made during National Service on my laptop computer!

## Features

1. Geolocation 🔍
- Auto-detects user location on first load
- Caches coordinates in localStorage (no repeated permission requests)
- Falls back to search form if permission denied

2. Search & Autocomplete 🌐
- Type city name → dropdown shows 10+ suggestions
- Click suggestion → auto-fills input and fetches weather
- Only saves to history if weather fetch succeeds

3. Weather Display ☁️
- Current: Temp (°C), description, humidity, wind, pressure
- Forecast: Next 8 entries (24 hours) with emoji (there are over 10 emojis) and temp
- Dynamic backgrounds based on weather type + time of day

4. Data Persistence 💾
- Recent searches stored in browser localStorage
- Coordinates cached to avoid repeated geolocation requests
- Clear history button available

5. Time widgets 🕛
- Fixed-position current time display (follows user on scroll)
- Destination time display showing city's local time based on timezone offset
- Real-time updates every second
- Timezone information displayed with sunrise/sunset times
   
6. Timezone error handling and improved UI ⚠️
- Modal error display for network issues, invalid cities, or API failures
- Graceful fallbacks and user-friendly messages
- Console logging for debugging

## Tech Stack

- **Frontend:** HTML5, CSS, Vanilla JavaScript (ES6+)
- **APIs:** 
  - OpenWeatherMap (weather data &  24hr forecast)
  - Geoapify (city geocoding & suggestions)
- **Storage:** Browser LocalStorage (search history persistence)
- **Other:** Browser Geolocation API

## Future Enhancements

- [ ] User authentication & accounts
- [ ] Multiple location bookmarks
- [ ] Weather alerts/notifications
- [ ] Dark mode toggle
- [ ] Mobile app version

## Browser Support

Works on all modern browsers (Chrome, Firefox, Safari, Edge)

---

**Last Updated:** 21 March 2026 (v1.0 complete)

---

Copyright 2026 Tan En Tong

Socials: https://www.linkedin.com/in/tan-en-tong-a55a03172/
  
