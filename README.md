# Weather & Map App

A full-stack web application built with Flask that combines weather forecasting and interactive mapping. Users can search for weather in any city, view current location on a map, set destinations, and get forecasts. Perfect for travelers, developers, or anyone needing integrated weather and map tools.

## Features
- **Weather Search**: Get current weather and 5-day forecast for any city using OpenWeatherMap API.
- **Interactive Maps**: View maps with MapLibre GL, geolocation for current position, and click to set destinations.
- **Directions & Routing**: Get driving directions between current location and destination using Mapbox API.
- **Geolocation**: Automatically detect and display weather for your current location.
- **Time Zone Display**: Show current time and destination time with proper time zones.
- **Recent Searches**: Save and view up to 5 recent weather searches.
- **Destination Persistence**: Save destination coordinates in SQLite database across sessions.
- **Responsive Design**: Works on desktop and mobile with CSS media queries.
- **API Endpoints**: Backend routes for weather, forecast, directions, and debug info.
- **Responsive Design**: Works on desktop and mobile with CSS media queries.
- **Time Widgets**: Display current and destination times.
- **Recent Searches**: Save and view recent weather searches.

## Tech Stack
- **Backend**: Flask, SQLAlchemy, Python
- **Frontend**: HTML, CSS, JavaScript, MapLibre GL
- **APIs**: OpenWeatherMap, Mapbox (for routing if added), Geocoding API
- **Database**: SQLite
- **Deployment**: Ready for Heroku/Railway

## Installation
1. Clone or download the repository.
2. Install Python 3.8+.
3. Create a virtual environment: `python -m venv venv`
4. Activate: `venv\Scripts\activate` (Windows) or `source venv/bin/activate` (Mac/Linux)
5. Install dependencies: `pip install -r requirements.txt`
6. Set up environment variables: Copy `.env.example` to `.env` and add your API keys:
   - `OPENWEATHER_API_KEY=your_key_here`
   - `GEO_API_KEY=your_key_here`
   - `MAPBOX_ACCESS_TOKEN=your_token_here` (optional for routing)
7. Run: `python app.py`
8. Open `http://localhost:5000` in browser.

## Usage
- Home: About page.
- Weather: Enter city, get weather/forecast.
- Map: View current location, click to set destination.

## Screenshots
(Add screenshots here: home page, weather page, map page)

## Requirements
- Python 3.8+
- API Keys: Get from OpenWeatherMap.org (free), Geocoding API, Mapbox.com (free tier)

## License
Sold as-is. No warranties. Buyer assumes all responsibility.

## Price: $500
Includes full source code, setup guide, and support for basic setup questions.