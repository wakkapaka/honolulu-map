// App.jsx (Map Dashboard with Pulsing Red Dot Icons)
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './App.css'; // Add CSS here

export default function App() {
  const [incidents, setIncidents] = useState([]);
  const [geoCache, setGeoCache] = useState({});

  useEffect(() => {
    fetch('https://data.honolulu.gov/resource/ykb6-n5th.json?$limit=100&$order=date DESC')
      .then((res) => res.json())
      .then((data) => setIncidents(data))
      .catch((err) => console.error('Fetch error:', err));
  }, []);

  const inferType = (item) => {
    const desc = (item.description || '').toLowerCase();
    if (desc.includes('mvc') && desc.includes('tow')) return 'MVC Veh Towed';
    if (desc.includes('mvc') || desc.includes('collision')) return 'MVC';
    if (desc.includes('hazardous driver')) return 'Hazardous Driver';
    if (desc.includes('stalled') || desc.includes('disabled') || desc.includes('hazard')) return 'Stalled/Hazard Veh';
    if (desc.includes('traffic control') || desc.includes('signal')) return 'Traffic Control Devi';
    if (desc.includes('complaint')) return 'Traffic Complaint';
    if (desc.includes('incident')) return 'Traffic Incident';
    return 'Unclassified';
  };

  const getLatLng = async (address) => {
    if (geoCache[address]) return geoCache[address];
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address + ', Honolulu HI')}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data[0]) {
      const coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      setGeoCache((prev) => ({ ...prev, [address]: coords }));
      return coords;
    }
    return null;
  };

  const thStyle = {
    padding: '8px', textAlign: 'left', borderBottom: '2px solid #000', fontWeight: 'bold', minWidth: 90,
  };
  const tdStyle = {
    padding: '6px', textAlign: 'left', verticalAlign: 'top', minWidth: 90,
  };

  const redPulseIcon = L.divIcon({
    className: 'custom-pulse-marker',
    iconSize: [20, 20]
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'row', height: '100vh', padding: 20, gap: 20, boxSizing: 'border-box' }}>
      <div style={{ flexGrow: 1, overflowY: 'auto' }}>
        <h2 style={{ marginBottom: 10 }}>Honolulu Traffic Incidents</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead style={{ backgroundColor: '#f2f2f2' }}>
            <tr>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Time</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Address</th>
              <th style={thStyle}>Location</th>
              <th style={thStyle}>Area</th>
            </tr>
          </thead>
          <tbody>
            {incidents.map((item, i) => {
              const rawDate = item.date ? new Date(item.date) : null;
              const date = rawDate ? rawDate.toLocaleDateString() : 'N/A';
              const time = rawDate ? rawDate.toLocaleTimeString('en-US', { timeZone: 'Pacific/Honolulu', hour: '2-digit', minute: '2-digit' }) : 'N/A';
              const type = item.type || inferType(item);
              return (
                <tr key={i} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={tdStyle}>{date}</td>
                  <td style={tdStyle}>{time}</td>
                  <td style={tdStyle}>{type}</td>
                  <td style={tdStyle}>{item.address || 'N/A'}</td>
                  <td style={tdStyle}>{item.location || 'N/A'}</td>
                  <td style={tdStyle}>{item.area || 'N/A'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ width: '35vw', minWidth: 350, height: 'calc(100vh - 40px)' }}>
        <MapContainer center={[21.3045, -157.8557]} zoom={12} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {incidents.map((item, i) => {
            const address = item.address + ', ' + (item.area || 'Honolulu');
            const coords = geoCache[address];
            if (!coords) {
              getLatLng(address);
              return null;
            }
            return (
              <Marker key={i} position={coords} icon={redPulseIcon}>
                <Popup>
                  <b>{item.type || inferType(item)}</b><br />
                  {item.address}<br />
                  {item.area}
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
