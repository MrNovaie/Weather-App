let map;

const getCoords = () => {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
    });
};

async function initCurrentLocationMap() {
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser');
        return;
    } else {
        try {
            const position = await getCoords();
                const { latitude, longitude } = position.coords;
                const lon = longitude.toFixed(4);
                const lat = latitude.toFixed(4);
                console.log(`Current location: Latitude ${lat}, Longitude ${lon}`); // Debugging log
                my_map = new maplibregl.Map({
                    container: 'map_current',
                    style: 'https://tiles.openfreemap.org/styles/liberty', // Map style URL
                    center: [0, 0], // Set the initial center of the map [longitude, latitude]
                    zoom: 14, // Set the initial zoom level, 1.0 = world view, higher values zoom in
                });
                new maplibregl.Marker()
                    .setLngLat([lon, lat])
                    .addTo(my_map);
                my_map.setCenter([lon, lat]);
            // Add navigation controls to the map (zoom buttons)
            my_map.addControl(new maplibregl.NavigationControl());
        } catch (error) {
            console.error('Error getting geolocation:', error);
            alert('Unable to retrieve your location');
        }
    }
}


function initdestinationMap() {
    map = new maplibregl.Map({
        style: 'https://tiles.openfreemap.org/styles/liberty', // Map style URL
        center: [13.388, 52.517], // Set the initial center of the map [longitude, latitude]
        zoom: 9.5, // Set the initial zoom level, 1.0 = world view, higher values zoom in
        container: 'map',
    });
    // Add navigation controls to the map (zoom buttons)
        map.addControl(new maplibregl.NavigationControl());
    // Add a click event listener to display country name on click
        map.on('click', (click) => { 
            new maplibregl.Popup()
                .setLngLat(click.lngLat)
                .setHTML(`<p>Country: ${click.features[0].properties.name}</p>`)
                .addTo(map);
        });
}


async function updatedestinationMap() {
    try {
        const response = await fetch('/api/get_destination');
        const data = await response.json();
        console.log('Received destination data:', data); // Debugging log
        
        // Destructure lat and lon from your Flask JSON response
        const { destination_lat, destination_lon } = data;

        // MapLibre uses [longitude, latitude]
        map.setCenter([destination_lon, destination_lat]);
        map.setZoom(14); // Adjust zoom level as needed, 12 is roughly  10 to 20 kilometers across

        // Add a marker at the destination location
        new maplibregl.Marker()
            .setLngLat([destination_lon, destination_lat])
            .addTo(map);
    } catch (error) {
        console.error('Error fetching destination data:', error);
    }
}


window.onload = function() {
    initCurrentLocationMap();
    initdestinationMap();
    updatedestinationMap();
}