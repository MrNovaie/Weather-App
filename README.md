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

**Last Updated:** March 2026

---

Copyright 2026 Tan En Tong

Socials: https://www.linkedin.com/in/tan-en-tong-a55a03172/
  
