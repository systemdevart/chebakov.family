import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { DivIcon } from 'leaflet';
import { useFamilyStore } from '../../store/familyStore';
import { getShortName, getYearFromDate } from '../../utils/helpers';
import 'leaflet/dist/leaflet.css';
import './MigrationMap.css';

// Location coordinates mapping - comprehensive list
const locationCoords: Record<string, [number, number]> = {
  // Russia
  'Россия': [55.7558, 37.6173],
  'Москва': [55.7558, 37.6173],
  'Санкт-Петербург': [59.9343, 30.3351],
  'Новосибирск': [55.0084, 82.9357],
  'Екатеринбург': [56.8389, 60.6057],
  'Казань': [55.7887, 49.1221],
  'Нижний Новгород': [56.2965, 43.9361],
  'Челябинск': [55.1644, 61.4368],
  'Самара': [53.1959, 50.1002],
  'Омск': [54.9885, 73.3242],
  'Ростов-на-Дону': [47.2357, 39.7015],
  'Уфа': [54.7388, 55.9721],
  'Красноярск': [56.0153, 92.8932],
  'Пермь': [58.0105, 56.2502],
  'Воронеж': [51.6720, 39.1843],
  'Волгоград': [48.7080, 44.5133],
  'Краснодар': [45.0355, 38.9753],
  'Саратов': [51.5330, 46.0344],
  'Тюмень': [57.1522, 65.5272],
  'Тольятти': [53.5078, 49.4204],
  'Ижевск': [56.8498, 53.2045],
  'Барнаул': [53.3548, 83.7698],
  'Иркутск': [52.2978, 104.2964],
  'Хабаровск': [48.4827, 135.0837],
  'Владивосток': [43.1332, 131.9113],
  'Ярославль': [57.6261, 39.8845],
  'Махачкала': [42.9849, 47.5047],
  'Томск': [56.4977, 84.9744],
  'Оренбург': [51.7727, 55.0988],
  'Кемерово': [55.3333, 86.0833],
  'Рязань': [54.6269, 39.6916],
  'Астрахань': [46.3497, 48.0408],
  'Набережные Челны': [55.7436, 52.4144],
  'Пенза': [53.1951, 45.0184],
  'Липецк': [52.6031, 39.5708],
  'Тула': [54.1961, 37.6182],
  'Киров': [58.5966, 49.6601],
  'Сочи': [43.5855, 39.7231],

  // Serbia
  'Сербия': [44.7866, 20.4489],
  'Белград': [44.7866, 20.4489],
  'Belgrade': [44.7866, 20.4489],
  'Serbia': [44.7866, 20.4489],
  'Нови-Сад': [45.2671, 19.8335],
  'Ниш': [43.3209, 21.8954],

  // Ukraine
  'Украина': [50.4501, 30.5234],
  'Киев': [50.4501, 30.5234],
  'Харьков': [49.9935, 36.2304],
  'Одесса': [46.4825, 30.7233],
  'Днепр': [48.4647, 35.0462],
  'Львов': [49.8397, 24.0297],

  // Belarus
  'Беларусь': [53.9045, 27.5615],
  'Минск': [53.9045, 27.5615],

  // Kazakhstan
  'Казахстан': [51.1694, 71.4491],
  'Алматы': [43.2220, 76.8512],
  'Нур-Султан': [51.1694, 71.4491],
  'Астана': [51.1694, 71.4491],

  // Europe
  'Германия': [52.5200, 13.4050],
  'Берлин': [52.5200, 13.4050],
  'Мюнхен': [48.1351, 11.5820],
  'Франция': [48.8566, 2.3522],
  'Париж': [48.8566, 2.3522],
  'Италия': [41.9028, 12.4964],
  'Рим': [41.9028, 12.4964],
  'Милан': [45.4642, 9.1900],
  'Испания': [40.4168, -3.7038],
  'Мадрид': [40.4168, -3.7038],
  'Барселона': [41.3851, 2.1734],
  'Великобритания': [51.5074, -0.1278],
  'Лондон': [51.5074, -0.1278],
  'Польша': [52.2297, 21.0122],
  'Варшава': [52.2297, 21.0122],
  'Чехия': [50.0755, 14.4378],
  'Прага': [50.0755, 14.4378],
  'Австрия': [48.2082, 16.3738],
  'Вена': [48.2082, 16.3738],
  'Нидерланды': [52.3676, 4.9041],
  'Амстердам': [52.3676, 4.9041],
  'Бельгия': [50.8503, 4.3517],
  'Брюссель': [50.8503, 4.3517],
  'Швейцария': [46.9480, 7.4474],
  'Цюрих': [47.3769, 8.5417],
  'Женева': [46.2044, 6.1432],
  'Швеция': [59.3293, 18.0686],
  'Стокгольм': [59.3293, 18.0686],
  'Норвегия': [59.9139, 10.7522],
  'Осло': [59.9139, 10.7522],
  'Финляндия': [60.1699, 24.9384],
  'Хельсинки': [60.1699, 24.9384],
  'Дания': [55.6761, 12.5683],
  'Копенгаген': [55.6761, 12.5683],
  'Греция': [37.9838, 23.7275],
  'Афины': [37.9838, 23.7275],
  'Португалия': [38.7223, -9.1393],
  'Лиссабон': [38.7223, -9.1393],
  'Турция': [41.0082, 28.9784],
  'Стамбул': [41.0082, 28.9784],
  'Анкара': [39.9334, 32.8597],
  'Хорватия': [45.8150, 15.9819],
  'Загреб': [45.8150, 15.9819],
  'Болгария': [42.6977, 23.3219],
  'София': [42.6977, 23.3219],
  'Румыния': [44.4268, 26.1025],
  'Бухарест': [44.4268, 26.1025],
  'Венгрия': [47.4979, 19.0402],
  'Будапешт': [47.4979, 19.0402],
  'Словакия': [48.1486, 17.1077],
  'Братислава': [48.1486, 17.1077],
  'Словения': [46.0569, 14.5058],
  'Любляна': [46.0569, 14.5058],
  'Черногория': [42.4304, 19.2594],
  'Подгорица': [42.4304, 19.2594],
  'Босния': [43.8563, 18.4131],
  'Сараево': [43.8563, 18.4131],
  'Северная Македония': [41.9973, 21.4280],
  'Скопье': [41.9973, 21.4280],
  'Албания': [41.3275, 19.8187],
  'Тирана': [41.3275, 19.8187],
  'Кипр': [35.1856, 33.3823],
  'Никосия': [35.1856, 33.3823],
  'Мальта': [35.8989, 14.5146],
  'Валлетта': [35.8989, 14.5146],
  'Ирландия': [53.3498, -6.2603],
  'Дублин': [53.3498, -6.2603],
  'Исландия': [64.1466, -21.9426],
  'Рейкьявик': [64.1466, -21.9426],

  // Americas
  'США': [40.7128, -74.0060],
  'Нью-Йорк': [40.7128, -74.0060],
  'Лос-Анджелес': [34.0522, -118.2437],
  'Чикаго': [41.8781, -87.6298],
  'Майами': [25.7617, -80.1918],
  'Сан-Франциско': [37.7749, -122.4194],
  'Канада': [43.6532, -79.3832],
  'Торонто': [43.6532, -79.3832],
  'Ванкувер': [49.2827, -123.1207],
  'Монреаль': [45.5017, -73.5673],
  'Бразилия': [-23.5505, -46.6333],
  'Сан-Паулу': [-23.5505, -46.6333],
  'Аргентина': [-34.6037, -58.3816],
  'Буэнос-Айрес': [-34.6037, -58.3816],
  'Мексика': [19.4326, -99.1332],
  'Мехико': [19.4326, -99.1332],

  // Asia
  'Китай': [39.9042, 116.4074],
  'Пекин': [39.9042, 116.4074],
  'Шанхай': [31.2304, 121.4737],
  'Япония': [35.6762, 139.6503],
  'Токио': [35.6762, 139.6503],
  'Корея': [37.5665, 126.9780],
  'Сеул': [37.5665, 126.9780],
  'Индия': [28.6139, 77.2090],
  'Дели': [28.6139, 77.2090],
  'Мумбаи': [19.0760, 72.8777],
  'Таиланд': [13.7563, 100.5018],
  'Бангкок': [13.7563, 100.5018],
  'Вьетнам': [21.0278, 105.8342],
  'Ханой': [21.0278, 105.8342],
  'Сингапур': [1.3521, 103.8198],
  'ОАЭ': [25.2048, 55.2708],
  'Дубай': [25.2048, 55.2708],
  'Израиль': [32.0853, 34.7818],
  'Тель-Авив': [32.0853, 34.7818],
  'Иерусалим': [31.7683, 35.2137],
  'Грузия': [41.7151, 44.8271],
  'Тбилиси': [41.7151, 44.8271],
  'Армения': [40.1792, 44.4991],
  'Ереван': [40.1792, 44.4991],
  'Азербайджан': [40.4093, 49.8671],
  'Баку': [40.4093, 49.8671],
  'Узбекистан': [41.2995, 69.2401],
  'Ташкент': [41.2995, 69.2401],
  'Кыргызстан': [42.8746, 74.5698],
  'Бишкек': [42.8746, 74.5698],
  'Таджикистан': [38.5598, 68.7740],
  'Душанбе': [38.5598, 68.7740],
  'Туркменистан': [37.9601, 58.3261],
  'Ашхабад': [37.9601, 58.3261],
  'Монголия': [47.8864, 106.9057],
  'Улан-Батор': [47.8864, 106.9057],

  // Oceania
  'Австралия': [-33.8688, 151.2093],
  'Сидней': [-33.8688, 151.2093],
  'Мельбурн': [-37.8136, 144.9631],
  'Новая Зеландия': [-36.8509, 174.7645],
  'Окленд': [-36.8509, 174.7645],

  // Africa
  'Египет': [30.0444, 31.2357],
  'Каир': [30.0444, 31.2357],
  'ЮАР': [-33.9249, 18.4241],
  'Кейптаун': [-33.9249, 18.4241],
  'Марокко': [33.9716, -6.8498],
  'Рабат': [33.9716, -6.8498],
};

function getCoords(location?: string): [number, number] | null {
  if (!location) return null;

  const normalizedLocation = location.trim();

  // Check exact match first
  if (locationCoords[normalizedLocation]) {
    return locationCoords[normalizedLocation];
  }

  // Check if any key is contained in location (case-insensitive)
  const lowerLocation = normalizedLocation.toLowerCase();
  for (const [key, coords] of Object.entries(locationCoords)) {
    if (lowerLocation.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerLocation)) {
      return coords;
    }
  }

  // No match found - return null instead of defaulting to Moscow
  return null;
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
