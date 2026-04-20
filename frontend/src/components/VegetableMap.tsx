import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { MapPin, ShoppingCart } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom green marker for farmers, blue for markets
const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface LocationItem {
  lat: number;
  lon: number;
  vegetable: string;
  district: string;
  avg_price: number;
  price?: number;
  quantity?: number;
  crop_id?: string;
  type?: 'Market' | 'Farmer' | 'CSV Farmer';
  farmer_name?: string;
  mobile?: string;
}

interface MapProps {
  locations: LocationItem[];
  onAddToCart?: (item: LocationItem) => void;
}

function MapUpdater({ locations }: { locations: MapProps['locations'] }) {
  const map = useMap();
  
  // Create a hash based purely on spatial coordinates so map doesn't rebound if only quantities change
  const geoHash = locations.map(l => `${l.lat},${l.lon}`).join('|');

  useEffect(() => {
    if (locations.length > 0) {
      const validLocs = locations.filter(l => !isNaN(Number(l.lat)) && !isNaN(Number(l.lon)));
      if (validLocs.length > 0) {
        const bounds = L.latLngBounds(validLocs.map(l => [Number(l.lat), Number(l.lon)]));
        if (bounds.isValid()) {
           map.fitBounds(bounds, { padding: [50, 50], maxZoom: locations.length === 1 ? 14 : 10 });
        }
      } else {
        map.setView([15.9129, 79.7400], 6);
      }
    } else {
      map.setView([15.9129, 79.7400], 6);
    }
    // Force a redraw when locations update
    setTimeout(() => {
       map.invalidateSize();
    }, 100);
  }, [geoHash, map]); // ONLY trigger on spatial change
  return null;
}

// Additional fixer for initial load rendering issues
function MapResizeFixer() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

export default function VegetableMap({ locations, onAddToCart }: MapProps) {
  const center: [number, number] = [15.9129, 79.7400];
  const { t } = useTranslation();

  return (
    <div className="h-full w-full rounded-2xl overflow-hidden border border-white/5 shadow-inner relative">
      <MapContainer center={center} zoom={6} style={{ height: '100%', width: '100%', zIndex: 1 }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {locations.map((loc, i) => (
          <Marker
            key={`${loc.district}-${loc.vegetable}-${loc.price || 0}-${loc.quantity || 0}-${i}`}
            position={[loc.lat, loc.lon]}
            icon={loc.type === 'Market' ? blueIcon : greenIcon}
          >
            <Popup className="rounded-lg">
              <div className="font-sans min-w-[180px]">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-lg text-agri-900 leading-tight">{t(loc.vegetable)}</h3>
                  {(loc.type === 'Farmer' || loc.type === 'CSV Farmer') && (
                    <span className="bg-green-100 text-green-700 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">{t('Farmer')}</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 flex items-center gap-1 mb-2">
                  <MapPin className="w-3 h-3" /> {t(loc.district)}
                </p>

                {(loc.type === 'Farmer' || loc.type === 'CSV Farmer') ? (
                  <div className="border-t border-gray-100 pt-2 space-y-1">
                    {loc.farmer_name && <p className="text-[11px] text-gray-600 font-medium">Seller: {loc.farmer_name}</p>}
                    {loc.mobile && loc.mobile !== 'N/A' && <p className="text-[11px] text-green-600 font-bold">📞 {loc.mobile}</p>}
                    {loc.quantity != null && loc.quantity > 0 && (
                      <p className="text-[11px] text-gray-700 font-semibold">📦 Stock: {loc.quantity} kg</p>
                    )}
                    {loc.price != null && (
                      <p className="text-[12px] text-orange-600 font-black">💰 ₹{loc.price}/kg</p>
                    )}
                    {onAddToCart && loc.price && loc.quantity && loc.quantity > 0 && (
                      <button
                        onClick={() => onAddToCart(loc)}
                        className="mt-2 w-full py-1.5 rounded-lg text-xs font-black flex items-center justify-center gap-1"
                        style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.35)', color: '#16a34a' }}
                      >
                        <ShoppingCart className="w-3 h-3" /> Add to Cart
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between border-t border-gray-100 pt-2">
                    <span className="text-[10px] text-gray-400 uppercase font-semibold">Market Avg</span>
                    <span className="text-base font-bold text-agri-600">₹{loc.avg_price}/kg</span>
                  </div>
                )}

                <div className="mt-2 text-[9px] text-gray-300 font-mono">
                  {loc.lat.toFixed(3)}, {loc.lon.toFixed(3)}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        <MapUpdater locations={locations} />
        <MapResizeFixer />
      </MapContainer>
    </div>
  );
}
