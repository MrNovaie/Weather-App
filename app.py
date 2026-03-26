from flask import Flask, render_template, request, jsonify
import os
import requests
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv


basedir = os.path.abspath(os.path.dirname(__file__))

load_dotenv(dotenv_path=os.path.join(basedir, '.env'))

app = Flask(__name__, instance_relative_config=True, static_folder=os.path.join(basedir, 'static'), template_folder=os.path.join(basedir, 'templates'))

# Check if a URL exists in .env; if not, fall back to your local SQLite path
db_url = os.getenv('DATABASE_URL')
if db_url and db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

app.config['SQLALCHEMY_DATABASE_URI'] = db_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False  # Disable track modifications to save resources
db = SQLAlchemy(app)

#Define model
class AppState(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    destination_lat = db.Column(db.Float(50), nullable=False) #Must be less than 54 bits as per Render request
    destination_lon = db.Column(db.Float(50), nullable=False)


# Define routes

@app.route('/')
def about():
    return render_template('about.html')

@app.route('/weather')
def weather():
    return render_template('weather-site.html')

@app.route('/map')
def map():
    return render_template('map.html')

@app.route('/update_destination', methods=['POST'])
def update_destination():
    data = request.get_json() # Get the new destination from the request data
    new_destination = f"{data.get('lat', 1.3521)}, {data.get('lon', 103.8198)}" # Get lat and lon from the request data, default to Singapore coordinates if not provided
    state = AppState.query.first() # Check if there's an existing state in the database
    if state:
        state.destination_lat = data.get('lat', 1.3521)
        state.destination_lon = data.get('lon', 103.8198) 
    else:
        state = AppState(destination_lat=data.get('lat', 1.3521), destination_lon=data.get('lon', 103.8198)) # Create a new state if it doesn't exist
        db.session.add(state) #add the new state to the database
    db.session.commit() # Commit the changes to the database
    return jsonify({'message': 'Destination updated successfully', 'destination_lat': data.get('lat', 1.3521), 'destination_lon': data.get('lon', 103.8198)})


@app.route('/get_destination', methods=['GET'])
def get_destination():
    state = AppState.query.first()
    if state:
        return jsonify({'destination_lat': state.destination_lat, 'destination_lon': state.destination_lon})
    return jsonify({'destination_lat': 1.3521, 'destination_lon': 103.8198})  # Return default coordinates if no state is found

@app.route('/api/geo', methods=['GET'])
def geocode():
    searchTerm = request.args.get('searchTerm')
    geo_api_key = os.getenv('GEO_API_KEY')
    url = f'https://api.geoapify.com/v1/geocode/search?text={searchTerm}&apiKey={geo_api_key}'
    response = requests.get(url)
    if response.status_code != 200:
        return jsonify({'error': 'Geocoding failed'}), response.status_code
    return jsonify(response.json())

@app.route('/api/weather', methods=['GET'])
def get_weather():
    city = request.args.get('city')
    lat = request.args.get('lat')
    lon = request.args.get('lon')
    api_key = os.getenv('OPENWEATHER_API_KEY')

    if city:
        url = f'http://api.openweathermap.org/data/2.5/weather?q={city}&appid={api_key}&units=metric'
    elif lat and lon:
        url = f'http://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}&units=metric'
    else:
        return jsonify({'error': 'City or lat/lon required'}), 400

    response = requests.get(url)
    if response.status_code != 200:
        return jsonify({'error': 'Weather data fetch failed'}), response.status_code
    return jsonify(response.json())


@app.route('/api/forecast', methods=['GET'])
def get_forecast():
    city = request.args.get('city')
    lat = request.args.get('lat')
    lon = request.args.get('lon')
    api_key = os.getenv('OPENWEATHER_API_KEY')

    if city:
        url = f'http://api.openweathermap.org/data/2.5/forecast?q={city}&appid={api_key}&units=metric'
    elif lat and lon:
        url = f'http://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={api_key}&units=metric'
    else:
        return jsonify({'error': 'City or lat/lon required'}), 400

    response = requests.get(url)
    if response.status_code != 200:
        return jsonify({'error': 'Forecast data fetch failed'}), response.status_code
    return jsonify(response.json())


@app.route('/api/directions', methods=['GET'])
def get_directions():
    start_lat = request.args.get('start_lat')
    start_lon = request.args.get('start_lon')
    end_lat = request.args.get('end_lat')
    end_lon = request.args.get('end_lon')
    if not all([start_lat, start_lon, end_lat, end_lon]):
        return jsonify({'error': 'All coordinates required'}), 400
    access_token = os.getenv('MAPBOX_ACCESS_TOKEN')
    url = f'https://api.mapbox.com/directions/v5/mapbox/driving/{start_lon},{start_lat};{end_lon},{end_lat}?geometries=geojson&access_token={access_token}'
    response = requests.get(url)
    if response.status_code != 200:
        return jsonify({'error': 'Directions not found'}), 404
    return jsonify(response.json())

@app.route('/api/debug', methods=['GET'])
def api_debug():
    return jsonify({
        'OPENWEATHER_API_KEY': bool(os.getenv('OPENWEATHER_API_KEY')),
        'GEO_API_KEY': bool(os.getenv('GEO_API_KEY'))
    })


# Run the application

with app.app_context():  # Ensure the application context is available for database operations
    db.create_all()
app.run(host='0.0.0.0')
