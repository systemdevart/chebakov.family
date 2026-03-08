import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { DivIcon } from 'leaflet';
import { useFamilyStore } from '../../store/familyStore';
import { getShortName, getYearFromDate } from '../../utils/helpers';
import 'leaflet/dist/leaflet.css';
import './MigrationMap.css';

// Location coordinates mapping
const locationCoords: Record<string, [number, number]> = {
  'Россия': [55.7558, 37.6173], // Moscow
  'Москва': [55.7558, 37.6173],
  'Санкт-Петербург': [59.9343, 30.3351],
  'Новосибирск': [55.0084, 82.9357],
  'Екатеринбург': [56.8389, 60.6057],
  'Казань': [55.7887, 49.1221],
  'Самара': [53.1959, 50.1002],
  'Ростов-на-Дону': [47.2357, 39.7015],
  'Краснодар': [45.0355, 38.9753],
  'Воронеж': [51.6720, 39.1843],
};

function getCoords(location?: string): [number, number] | null {
  if (!location) return null;

  // Check exact match first
  if (locationCoords[location]) {
    return locationCoords[location];
  }

  // Check if any key is contained in location
  for (const [key, coords] of Object.entries(locationCoords)) {
    if (location.includes(key)) {
      return coords;
    }
  }

  return locationCoords['Россия']; // Default to Moscow
}

export default function MigrationMap() {
  const { data, setSelectedMember, openDrawer } = useFamilyStore();

  const locations = useMemo(() => {
    const locs: {
      id: string;
      name: string;
      coords: [number, number];
      members: { id: string; name: string; year: string; type: 'birth' | 'current' }[];
    }[] = [];

    const locationMap = new Map<string, typeof locs[0]>();

    data.members.forEach((member) => {
      // Birth places
      if (member.birthPlace) {
        const coords = getCoords(member.birthPlace);
        if (coords) {
          const key = coords.join(',');
          if (!locationMap.has(key)) {
            locationMap.set(key, {
              id: key,
              name: member.birthPlace,
              coords,
              members: [],
            });
          }
          locationMap.get(key)!.members.push({
            id: member.id,
            name: getShortName(member),
            year: getYearFromDate(member.birthDate),
            type: 'birth',
          });
        }
      }

      // Current locations
      if (member.currentLocation && member.currentLocation !== member.birthPlace) {
        const coords = getCoords(member.currentLocation);
        if (coords) {
          const key = coords.join(',');
          if (!locationMap.has(key)) {
            locationMap.set(key, {
              id: key,
              name: member.currentLocation,
              coords,
              members: [],
            });
          }
          locationMap.get(key)!.members.push({
            id: member.id,
            name: getShortName(member),
            year: 'н.в.',
            type: 'current',
          });
        }
      }
    });

    return Array.from(locationMap.values());
  }, [data.members]);

  const handleMemberClick = (memberId: string) => {
    setSelectedMember(memberId);
    openDrawer();
  };

  // Calculate center based on all locations
  const center = useMemo<[number, number]>(() => {
    if (locations.length === 0) {
      return [55.7558, 37.6173]; // Moscow default
    }

    const avgLat = locations.reduce((sum, loc) => sum + loc.coords[0], 0) / locations.length;
    const avgLng = locations.reduce((sum, loc) => sum + loc.coords[1], 0) / locations.length;

    return [avgLat, avgLng];
  }, [locations]);

  const createCustomIcon = (count: number) => {
    return new DivIcon({
      className: 'custom-marker',
      html: `<div class="marker-content">${count}</div>`,
      iconSize: [36, 36],
    });
  };

  return (
    <div className="migration-map">
      <div className="map-header">
        <h2>Карта миграции</h2>
        <p>География семьи Чебаковых</p>
      </div>

      <div className="map-container">
        <MapContainer
          center={center}
          zoom={4}
          style={{ width: '100%', height: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {locations.map((location) => (
            <Marker
              key={location.id}
              position={location.coords}
              icon={createCustomIcon(location.members.length)}
            >
              <Popup>
                <div className="map-popup">
                  <h4>{location.name}</h4>
                  <div className="popup-members">
                    {location.members.map((m) => (
                      <button
                        key={`${m.id}-${m.type}`}
                        className="popup-member"
                        onClick={() => handleMemberClick(m.id)}
                      >
                        <span className="member-name">{m.name}</span>
                        <span className={`member-badge ${m.type}`}>
                          {m.type === 'birth' ? `род. ${m.year}` : 'живёт'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="map-legend">
        <div className="legend-item">
          <span className="legend-dot birth"></span>
          <span>Место рождения</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot current"></span>
          <span>Текущее место жительства</span>
        </div>
      </div>
    </div>
  );
}
