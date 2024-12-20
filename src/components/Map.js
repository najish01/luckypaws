// components/Map.js
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png')
});

const Map = () => {
    const clinicPosition = [25.23934, 73.23521];
    const clinicInfo = {
        name: "VetCare Plus",
        address: "123 Pet Care Lane",
        city: "Veterinary City",
        phone: "(555) 123-4567"
    };

    return (
        <div className="map-container">
            <div className="map-wrapper" style={{ height: '400px', width: '100%' }}>
                <MapContainer 
                    center={clinicPosition} 
                    zoom={15}
                    scrollWheelZoom={false}
                    style={{ height: '100%', width: '100%', borderRadius: '10px' }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={clinicPosition}>
                        <Popup>
                            <div className="map-popup">
                                <h3>{clinicInfo.name}</h3>
                                <p>{clinicInfo.address}</p>
                                <p>{clinicInfo.city}</p>
                                <p>{clinicInfo.phone}</p>
                            </div>
                        </Popup>
                    </Marker>
                </MapContainer>
                <div className="directions-container">
                    <a 
                        href={`https://www.google.com/maps/dir/?api=1&destination=${clinicPosition[0]},${clinicPosition[1]}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="directions-button"
                    >
                        <i className="fas fa-directions"></i>
                        Get Directions
                    </a>
                </div>
            </div>
        </div>
    );
};

export default Map;
