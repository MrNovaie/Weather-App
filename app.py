from flask import Flask, render_template, request, jsonify
import os
import requests
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
from sqlalchemy.exc import SQLAlchemyError


basedir = os.path.abspath(os.path.dirname(__file__))

load_dotenv(dotenv_path=os.path.join(basedir, '.env'))


def get_sqlalchemy_database_uri():
    """SQLite locally; Heroku Postgres via DATABASE_URL (normalize scheme + SSL)."""
    instance_dir = os.path.join(basedir, 'instance')
    os.makedirs(instance_dir, exist_ok=True)
    default_db = 'sqlite:///' + os.path.join(instance_dir, 'project.db')
    url = os.getenv('DATABASE_URL', default_db)
    if url.startswith('sqlite'):
        return url
    # Heroku historically used postgres://; SQLAlchemy expects postgresql://
    if url.startswith('postgres://'):
        url = url.replace('postgres://', 'postgresql://', 1)
    # Heroku Postgres requires SSL from dynos
    if os.getenv('DYNO') and 'sslmode=' not in url:
        url += '&sslmode=require' if '?' in url else '?sslmode=require'
    return url


app = Flask(__name__, instance_relative_config=True, static_folder=os.path.join(basedir, 'static'), template_folder=os.path.join(basedir, 'templates'))

app.config['SQLALCHEMY_DATABASE_URI'] = get_sqlalchemy_database_uri()
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False  # Disable track modifications to save resources
db = SQLAlchemy(app)

#Define model
class AppState(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    destination_lat = db.Column(db.Float, nullable=False)
    destination_lon = db.Column(db.Float, nullable=False)


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

@app.route('/update_destination', methods=['GET', 'POST', 'OPTIONS'], strict_slashes=False)
@app.route('/api/update_destination', methods=['GET', 'POST', 'OPTIONS'], strict_slashes=False)
def update_destination():
    """POST JSON {lat, lon}. GET/OPTIONS return JSON (not HTML) so clients never parse <!doctype> errors."""
    if request.method == 'OPTIONS':
        r = jsonify({})
        r.status_code = 204
        r.headers['Allow'] = 'POST, OPTIONS'
        return r
    if request.method == 'GET':
        return jsonify({
            'error': 'Method not allowed: use POST with Content-Type: application/json',
            'body': {'lat': 'number', 'lon': 'number'},
        }), 405
    data = request.get_json(silent=True)
    if data is None or not isinstance(data, dict):
        return jsonify({'error': 'Send JSON: {"lat": number, "lon": number}'}), 400
    lat = data.get('lat', 1.3521)
    lon = data.get('lon', 103.8198)
    try:
        state = AppState.query.first()
        if state:
            state.destination_lat = lat
            state.destination_lon = lon
        else:
            db.session.add(AppState(destination_lat=lat, destination_lon=lon))
        db.session.commit()
    except SQLAlchemyError:
        db.session.rollback()
        return jsonify({'error': 'Could not save destination (database error)'}), 500
    return jsonify({
        'message': 'Destination updated successfully',
        'destination_lat': lat,
        'destination_lon': lon,
    })


@app.route('/get_destination', methods=['GET', 'POST', 'OPTIONS'], strict_slashes=False)
@app.route('/api/get_destination', methods=['GET', 'POST', 'OPTIONS'], strict_slashes=False)
def get_destination():
    if request.method == 'OPTIONS':
        r = jsonify({})
        r.status_code = 204
        r.headers['Allow'] = 'GET, OPTIONS'
        return r
    if request.method == 'POST':
        return jsonify({'error': 'Method not allowed: use GET for current destination'}), 405
    try:
        state = AppState.query.first()
    except SQLAlchemyError:
        app.logger.exception('get_destination failed')
        return jsonify({
            'error': 'Database error reading destination',
            'hint': 'Attach Heroku Postgres, set DATABASE_URL, redeploy, or check release logs for db.create_all failures.',
            'destination_lat': 1.3521,
            'destination_lon': 103.8198,
        }), 503
    if state:
        return jsonify({'destination_lat': state.destination_lat, 'destination_lon': state.destination_lon})
    return jsonify({'destination_lat': 1.3521, 'destination_lon': 103.8198})

@app.route('/api/geo', methods=['GET'])
def geocode():
    query = request.args.get('query')
    geo_api_key = os.getenv('GEO_API_KEY')
    if query:
        url = f'https://api.geoapify.com/v1/geocode/search?text={query}&apiKey={geo_api_key}'
    else:
        return jsonify({'error': 'Search term required'}), 400
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
    if not api_key:
        return jsonify({'error': 'OPENWEATHER_API_KEY is not set'}), 503

    if city:
        url = f'https://api.openweathermap.org/data/2.5/weather?q={city}&appid={api_key}&units=metric'
    elif lat and lon:
        url = f'https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}&units=metric'
    else:
        return jsonify({'error': 'City or lat/lon required'}), 400

    response = requests.get(url)
    if response.status_code != 200:
        return jsonify({
            'error': 'Weather data fetch failed',
            'upstream_status': response.status_code,
            'upstream_body': response.text[:500],
        }), response.status_code
    return jsonify(response.json())


@app.route('/api/forecast', methods=['GET'])
def get_forecast():
    city = request.args.get('city')
    lat = request.args.get('lat')
    lon = request.args.get('lon')
    api_key = os.getenv('OPENWEATHER_API_KEY')
    if not api_key:
        return jsonify({'error': 'OPENWEATHER_API_KEY is not set'}), 503

    if city:
        url = f'https://api.openweathermap.org/data/2.5/forecast?q={city}&appid={api_key}&units=metric'
    elif lat and lon:
        url = f'https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={api_key}&units=metric'
    else:
        return jsonify({'error': 'City or lat/lon required'}), 400

    response = requests.get(url)
    if response.status_code != 200:
        return jsonify({
            'error': 'Forecast data fetch failed',
            'upstream_status': response.status_code,
            'upstream_body': response.text[:500],
        }), response.status_code
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
        'GEO_API_KEY': bool(os.getenv('GEO_API_KEY')),
        'MAPBOX_ACCESS_TOKEN': bool(os.getenv('MAPBOX_ACCESS_TOKEN')),
    })


def init_db():
    """Create tables if they do not exist (local dev, release phase, or Gunicorn import)."""
    with app.app_context():
        db.create_all()


# Gunicorn imports this module without running __main__; ensure tables exist on Heroku web dynos too.
try:
    init_db()
except SQLAlchemyError:
    app.logger.exception('init_db failed at import (DB may be misconfigured until fixed)')


# Run the application
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5000)), debug=os.getenv('FLASK_DEBUG', 'true').lower() in ('1', 'true', 'yes'))
