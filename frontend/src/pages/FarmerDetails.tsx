import { useState, useEffect } from 'react';
import api from '../api';
import { PackageOpen, MapPin, Scale, Plus, Loader2, Navigation, CheckCircle2, Sprout, TrendingUp, Minus, Save, Bell, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import VoiceAssistant from '../components/VoiceAssistant';
import { useTranslation } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

// ─── Sub-component: Interactive Listing Row ─────────────────────────────────
interface ListingRowProps {
  crop: any;
  onUpdate: (updated: any) => void;
}

function ListingRow({ crop, onUpdate }: ListingRowProps) {
  const { t } = useTranslation();
  const [qty, setQty] = useState<number>(parseFloat(crop.quantity) || 0);
  const [price, setPrice] = useState<number | ''>(crop.price ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Sync background updates (e.g. deductions from consumer purchases)
  useEffect(() => {
    if (!saving) {
      setQty(parseFloat(crop.quantity) || 0);
      setPrice(crop.price ?? '');
    }
  }, [crop.quantity, crop.price, saving]);

  const saveQuantity = async (newQty: number) => {
    if (!crop.id) return;
    setSaving(true);
    try {
      const res = await api.patch(`/farmer/crop/${crop.id}/quantity`, { quantity: newQty });
      if (res.data.success) {
        onUpdate({ ...crop, quantity: newQty });
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      } else {
        alert(res.data.message);
      }
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const savePrice = async () => {
    if (!crop.id || price === '') return;
    setSaving(true);
    try {
      const res = await api.patch(`/farmer/crop/${crop.id}/price`, { price: Number(price) });
      if (res.data.success) {
        onUpdate({ ...crop, price: Number(price) });
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      } else {
        alert(res.data.message);
      }
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const incQty = () => { const n = qty + 1; setQty(n); saveQuantity(n); };
  const decQty = () => { if (qty <= 0) return; const n = qty - 1; setQty(n); saveQuantity(n); };

  return (
    <div
      className="p-5 transition-all duration-300"
      style={{ borderBottom: '1px solid rgba(34,197,94,0.06)' }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(34,197,94,0.03)'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, rgba(22,163,74,0.2), rgba(5,150,105,0.15))', border: '1px solid rgba(34,197,94,0.2)', color: '#4ade80' }}
          >
            {crop.vegetable.charAt(0)}
          </div>
          <div>
            <h3 className="font-black text-[var(--text-main)]">{t(crop.vegetable)}</h3>
            <p className="text-xs flex items-center gap-1 mt-0.5 text-slate-500 dark:text-slate-400 font-medium">
              <MapPin className="w-3 h-3" /> {t(crop.district)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Quantity +/- */}
          <div className="flex items-center gap-1 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(34,197,94,0.25)', background: 'var(--glass-bg)' }}>
            <button onClick={decQty} disabled={saving} className="w-8 h-8 flex items-center justify-center text-green-400 hover:bg-green-500/10 transition-colors">
              <Minus className="w-3 h-3" />
            </button>
            <span className="px-2 py-1 text-sm font-black text-[var(--text-main)] min-w-[60px] text-center">{qty} kg</span>
            <button onClick={incQty} disabled={saving} className="w-8 h-8 flex items-center justify-center text-green-400 hover:bg-green-500/10 transition-colors">
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* Price editor */}
          <div className="flex items-center gap-1 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(251,191,36,0.25)', background: 'var(--glass-bg)' }}>
            <span className="pl-2 text-yellow-400 font-bold text-sm">₹</span>
            <input
              type="number"
              min="0"
              value={price}
              onChange={e => setPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
              onKeyDown={e => e.key === 'Enter' && savePrice()}
              onBlur={savePrice}
              className="bg-transparent outline-none text-[var(--text-main)] font-bold text-sm w-20 text-center py-1 px-1"
              placeholder="—"
            />
            <button
              onClick={savePrice}
              disabled={saving || price === ''}
              className="w-8 h-8 flex items-center justify-center text-yellow-400 hover:bg-yellow-500/10 transition-colors"
              title="Save price"
            >
              <Save className="w-3 h-3" />
            </button>
          </div>

          <div className={`w-2 h-2 rounded-full animate-pulse ${saved ? 'bg-blue-400' : 'bg-green-400'}`}
            style={{ boxShadow: saved ? '0 0 6px rgba(96,165,250,0.8)' : '0 0 6px rgba(34,197,94,0.8)' }} />
        </div>
      </div>
    </div>
  );
}

export default function FarmerDetails() {
  const [districts, setDistricts] = useState<{ district: string }[]>([]);
  const [vegetables, setVegetables] = useState<string[]>([]);
  const [crops, setCrops] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState({ district: '', vegetable: '', quantity: '', price: '' });
  const [predictedPrice, setPredictedPrice] = useState<number | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [activeVoiceField, setActiveVoiceField] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const navigate = useNavigate();
  const { t, language, setLanguage } = useTranslation();
  const { theme, toggleTheme } = useTheme();

    const farmerId = localStorage.getItem('userId') || '';
    const farmerName = localStorage.getItem('name') || '';
    const farmerMobile = localStorage.getItem('mobile') || '';

  useEffect(() => {
    const loadData = async () => {
      try {
        const [distRes, vegRes, cropsRes] = await Promise.all([
          api.get('/districts'),
          api.get('/vegetables-list'),
          api.get(`/farmer/crops?farmer_id=${farmerId}`),
        ]);
        if (distRes.data.success) setDistricts(distRes.data.districts);
        if (vegRes.data.success) setVegetables(vegRes.data.vegetables);
        if (cropsRes.data.success) setCrops(cropsRes.data.crops);
      } catch (err) { console.error('Error loading data', err); }
      finally { setFetching(false); }
    };
    loadData();

    // Background polling for real-time inventory deductions (Consumer buys -> Farmer sees it instantly)
    const intervalFn = setInterval(async () => {
      try {
        const cropsRes = await api.get(`/farmer/crops?farmer_id=${farmerId}&t=${Date.now()}`);
        if (cropsRes.data.success) {
          setCrops(cropsRes.data.crops);
        }
      } catch (err) { }
    }, 3000);
    
    return () => clearInterval(intervalFn);
  }, [farmerId]);

  useEffect(() => {
    const fetchNotifs = async () => {
      if (!farmerId) return;
      try {
        const res = await api.get(`/farmer/notifications?farmer_id=${farmerId}`);
        if (res.data.success) {
          setNotifications(res.data.notifications);
        }
      } catch (err) { }
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 5000);
    return () => clearInterval(interval);
  }, [farmerId]);

  const markNotifRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.patch(`/farmer/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch {}
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const getPrediction = async () => {
      if (!formData.vegetable || !formData.district) {
        setPredictedPrice(null);
        return;
      }
      setIsPredicting(true);
      try {
        const now = new Date();
        const res = await api.get('/predict-price', {
          params: {
            vegetable: formData.vegetable,
            district: formData.district,
            month: now.getMonth() + 1,
            year: now.getFullYear()
          }
        });
        if (res.data.success) {
          const pred = res.data.predicted_price;
          setPredictedPrice(pred);
          // Auto-set the price to predicted if it's currently empty, or clamp it if it exceeds
          setFormData(prev => {
            const current = parseFloat(prev.price);
            if (!prev.price || (current && current > pred)) {
              return { ...prev, price: pred.toString() };
            }
            return prev;
          });
        }
      } catch (err) {
        console.error('Error fetching prediction', err);
        setPredictedPrice(null);
      } finally {
        setIsPredicting(false);
      }
    };
    getPrediction();
  }, [formData.vegetable, formData.district]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) { alert('Geolocation is not supported by your browser'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({ lat: position.coords.latitude, lon: position.coords.longitude });
        setLocating(false);
      },
      (error) => { console.error('Error getting location', error); alert('Could not get exact location.'); setLocating(false); }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/farmer/details', {
        farmer_id: farmerId,
        name: farmerName,
        mobile: farmerMobile,
        district: formData.district,
        vegetable: formData.vegetable,
        quantity: parseFloat(formData.quantity),
        price: formData.price ? parseFloat(formData.price) : null,
        lat: location?.lat,
        lon: location?.lon,
      });
      if (res.data.success) {
        setCrops([...crops, res.data.entry]);
        setFormData({ ...formData, quantity: '', price: '' });
        setLocation(null);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleVoiceCommand = (res: any) => {
    if (res.intent === 'add_crop') {
      const { vegetable, quantity, district } = res.data;
      
      // Find exact matches from the current lists to ensure the <select> works
      const matchedVeg = vegetables.find(v => v.toLowerCase() === vegetable?.toLowerCase()) || vegetable;
      const matchedDist = districts.find(d => d.district.toLowerCase() === district?.toLowerCase())?.district || district;

      setFormData(prev => ({
        ...prev,
        vegetable: matchedVeg || prev.vegetable,
        quantity: quantity || prev.quantity,
        district: matchedDist || prev.district
      }));
      
      // Visual feedback: glow fields
      setActiveVoiceField('all');
      setTimeout(() => setActiveVoiceField(null), 3000);
    } else if (res.intent === 'navigate') {
      navigate(res.data.path);
    }
  };

  const handlePriceDec = () => {
    const p = parseFloat(formData.price) || 0;
    setFormData({ ...formData, price: Math.max(0, p - 1).toString() });
  };

  const handlePriceInc = () => {
    const p = parseFloat(formData.price) || 0;
    const next = p + 1;
    if (!predictedPrice || next <= predictedPrice) {
      setFormData({ ...formData, price: next.toString() });
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') { setFormData({ ...formData, price: '' }); return; }
    const num = parseFloat(val);
    if (!isNaN(num)) {
      if (predictedPrice && num > predictedPrice) {
        setFormData({ ...formData, price: predictedPrice.toString() });
      } else {
        setFormData({ ...formData, price: val });
      }
    }
  };

  const selectStyle = {
    background: 'var(--card-bg)',
    border: '1px solid rgba(34,197,94,0.2)',
    color: 'var(--text-main)',
    borderRadius: '10px',
    padding: '10px 14px',
    width: '100%',
    outline: 'none',
    appearance: 'none' as const,
    fontFamily: 'inherit',
    fontSize: '0.875rem',
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center mt-20 flex-col gap-4">
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: '#22c55e', filter: 'drop-shadow(0 0 8px rgba(34,197,94,0.6))' }} />
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t('Loading your farm profile...')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-slide-up">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2 relative z-50">
        <div className="flex items-center gap-4">
          <div
            className="p-3 rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(22,163,74,0.3), rgba(5,150,105,0.2))',
              border: '1px solid rgba(34,197,94,0.3)',
              boxShadow: '0 0 20px rgba(34,197,94,0.2)',
            }}
          >
            <Sprout className="w-6 h-6 text-green-400 veg-bounce" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[var(--text-main)]">{t('Farmer Dashboard')}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t('Manage your crops and reach buyers across AP')}</p>
          </div>
        </div>
        
        {/* Allotted Embedded Voice Assistant Slot */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-full border border-green-500/30 backdrop-blur-sm shadow-xl relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="px-2 py-1 relative text-slate-300 hover:text-[var(--text-main)] transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-0 w-4 h-4 bg-red-500 rounded-full text-[10px] flex justify-center items-center font-bold text-[var(--text-main)] shadow-[0_0_8px_rgba(239,68,68,0.8)]">
                  {unreadCount}
                </span>
              )}
            </button>
            <div className="w-px h-6 bg-green-500/30"></div>
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${language === 'en' ? 'bg-green-500 text-[var(--text-main)] shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'text-slate-400 hover:text-[var(--text-main)]'}`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage('te')}
              className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${language === 'te' ? 'bg-green-500 text-[var(--text-main)] shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'text-slate-400 hover:text-[var(--text-main)]'}`}
            >
              తెలుగు
            </button>
            
            <div className="w-px h-4 bg-green-500/30"></div>
            
            <button
              onClick={toggleTheme}
              className="p-1 px-2 rounded-full hover:bg-green-500/10 transition-colors text-slate-300 hover:text-white"
            >
              {theme === 'dark' ? <Moon className="w-4 h-4 text-blue-400" /> : <Sun className="w-4 h-4 text-yellow-500" />}
            </button>
            
            {notificationsOpen && (
              <div className="absolute top-12 right-0 w-80 rounded-2xl overflow-hidden z-[100] animate-scale-in" 
                   style={{ background: 'rgba(10,15,30,0.95)', border: '1px solid rgba(34,197,94,0.3)', backdropFilter: 'blur(24px)', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}>
                <div className="p-4 bg-green-500/10 border-b border-green-500/20 flex justify-between items-center">
                  <h3 className="font-bold text-[var(--text-main)] text-sm">Notifications</h3>
                  {unreadCount > 0 && <span className="text-xs text-green-400 font-bold">{unreadCount} New</span>}
                </div>
                <div className="max-h-80 overflow-y-auto custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-sm">No notifications yet</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className={`p-4 border-b border-green-500/10 transition-colors flex flex-col gap-1 ${n.read ? 'opacity-60' : 'bg-slate-800/60'}`}>
                        <div className="flex justify-between items-start">
                          <span className="font-black text-sm text-[var(--text-main)]">{n.consumer_name} <span className="font-normal text-[10px] text-slate-400 ml-1">({n.consumer_mobile})</span></span>
                          <span className="text-[10px] text-slate-400 font-medium">{new Date(n.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <p className="text-sm text-slate-300 mt-1">
                          Bought <strong className="text-green-400">{n.quantity}kg</strong> of <strong>{t(n.crop_name)}</strong>
                        </p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider" style={{ background: n.delivery_mode === 'Delivery' ? 'rgba(59,130,246,0.2)' : 'rgba(249,115,22,0.2)', color: n.delivery_mode === 'Delivery' ? '#93c5fd' : '#fdba74', border: n.delivery_mode === 'Delivery' ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(249,115,22,0.3)'}}>
                            {n.delivery_mode === 'Delivery' ? '🚚 Delivery' : '🤝 Self-Pick'}
                          </span>
                          {!n.read && (
                            <button onClick={(e) => markNotifRead(n.id, e)} className="text-green-400 hover:text-green-300 bg-green-500/10 p-1 rounded-full border border-green-500/30">
                              <Check className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="bg-slate-900/50 p-2 rounded-3xl border border-green-500/20 shadow-lg">
            <VoiceAssistant onCommand={handleVoiceCommand} contextDistrict={formData.district} />
          </div>
        </div>
      </div>

      {/* Add Crop Form */}
      <div
        className="rounded-3xl overflow-hidden"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid rgba(34,197,94,0.15)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        {/* Card header */}
        <div className="p-6 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(34,197,94,0.1)', background: 'rgba(34,197,94,0.05)' }}>
          <div
            className="p-2 rounded-xl"
            style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.25)' }}
          >
            <Plus className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h2 className="text-lg font-black text-[var(--text-main)]">{t('Add New Crop Availability')}</h2>
            <p className="text-xs mt-0.5 text-slate-500 dark:text-slate-400 font-medium">{t('List your harvest so consumers can find you')}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid md:grid-cols-3 gap-5">
            {/* District */}
            <div className="space-y-2">
              <label className="text-sm font-black flex items-center gap-1.5 text-green-700 dark:text-green-300 uppercase tracking-wider">
                <MapPin className="w-4 h-4" /> {t('District')}
              </label>
              <select required value={formData.district} onChange={e => setFormData({ ...formData, district: e.target.value })} 
                style={selectStyle} className={activeVoiceField === 'all' ? 'input-glow' : ''}>
                <option value="" style={{ background: 'var(--input-bg)' }}>{t('Select District...')}</option>
                {districts.map(d => <option key={d.district} value={d.district} style={{ background: 'var(--input-bg)' }}>{t(d.district)}</option>)}
              </select>
            </div>

            {/* Vegetable */}
            <div className="space-y-2">
              <label className="text-sm font-black flex items-center gap-1.5 text-green-700 dark:text-green-300 uppercase tracking-wider">
                <PackageOpen className="w-4 h-4" /> {t('Vegetable')}
              </label>
              <select required value={formData.vegetable} onChange={e => setFormData({ ...formData, vegetable: e.target.value })} 
                style={selectStyle} className={activeVoiceField === 'all' ? 'input-glow' : ''}>
                <option value="" style={{ background: 'var(--input-bg)' }}>{t('Select Crop...')}</option>
                {vegetables.map(v => <option key={v} value={v} style={{ background: 'var(--input-bg)' }}>{t(v)}</option>)}
              </select>
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <label className="text-sm font-black flex items-center gap-1.5 text-green-700 dark:text-green-300 uppercase tracking-wider">
                <Scale className="w-4 h-4" /> {t('Quantity (kg)')}
              </label>
              <input
                type="number"
                required
                min="1"
                placeholder="e.g. 500"
                value={formData.quantity}
                onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                className={`input-dark ${activeVoiceField === 'all' ? 'input-glow' : ''}`}
              />
            </div>
          </div>

          {/* Market Insight / ML Price Prediction */}
          <div className="grid md:grid-cols-2 gap-5 mt-6">
            {(isPredicting || predictedPrice !== null) && (
              <div 
                className="p-4 rounded-2xl flex items-center justify-between border animate-fade-in h-max"
                style={{
                  background: 'rgba(34,197,94,0.05)',
                  borderColor: 'rgba(34,197,94,0.2)',
                  boxShadow: '0 0 15px rgba(34,197,94,0.1)'
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-green-500/10">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-green-400/70">{t('AI Market Forecast')}</h4>
                    <p className="text-sm font-bold text-[var(--text-main)]">
                      {isPredicting ? t('Calculating...') : t('Max Price:')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {isPredicting ? (
                    <Loader2 className="w-5 h-5 animate-spin text-green-400" />
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-green-400" style={{ textShadow: '0 0 10px rgba(74,222,128,0.5)' }}>
                        ₹{predictedPrice?.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Price Setter */}
            <div className="space-y-2 p-4 rounded-2xl" style={{
                background: 'var(--card-bg)',
                border: '1px solid rgba(34,197,94,0.2)'
              }}>
              <label className="text-sm font-black flex items-center justify-between gap-1.5 text-green-700 dark:text-green-300 uppercase tracking-wider">
                {t('Your Selling Price (₹/kg)')}
                <span className="text-xs opacity-60">{t('Must be ≤ AI Forecast')}</span>
              </label>
              <div className="flex items-center gap-2">
                <button type="button" onClick={handlePriceDec} className="p-2 rounded-xl bg-slate-800 text-green-400 hover:bg-slate-700 transition-colors">
                  -
                </button>
                <input
                  type="number"
                  required
                  min="0"
                  max={predictedPrice || undefined}
                  placeholder={`₹${predictedPrice || '0'}`}
                  value={formData.price}
                  onChange={handlePriceChange}
                  className="flex-1 input-dark text-center font-black text-lg"
                  style={{ height: '40px' }}
                />
                <button type="button" onClick={handlePriceInc} className="p-2 rounded-xl bg-slate-800 text-green-400 hover:bg-slate-700 transition-colors">
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Location bar */}
          <div
            className="mt-5 p-4 rounded-2xl flex items-center justify-between transition-all duration-300"
            style={{
              background: location ? 'rgba(34,197,94,0.08)' : 'var(--glass-bg)',
              border: location ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(34,197,94,0.1)',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-xl transition-all duration-300"
                style={{
                  background: location ? 'rgba(34,197,94,0.2)' : 'rgba(34,197,94,0.1)',
                  border: location ? '1px solid rgba(34,197,94,0.35)' : '1px solid rgba(34,197,94,0.15)',
                  boxShadow: location ? '0 0 12px rgba(34,197,94,0.3)' : 'none',
                }}
              >
                {location
                  ? <CheckCircle2 className="w-5 h-5 text-green-400" />
                  : <Navigation className="w-5 h-5" style={{ color: 'rgba(134,239,172,0.7)' }} />
                }
              </div>
              <div>
                <h4 className="font-bold text-[var(--text-main)] text-sm">{t('GPS Location')}</h4>
                <p className="text-xs" style={{ color: 'rgba(100,116,139,0.7)' }}>
                  {location
                    ? `✅ ${t('Captured:')} ${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}`
                    : t('Help consumers find exactly where your crop is.')
                  }
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGetLocation}
              disabled={locating || location !== null}
              className="px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ripple-effect"
              style={location ? {
                background: 'rgba(34,197,94,0.2)',
                border: '1px solid rgba(34,197,94,0.35)',
                color: '#86efac',
              } : {
                background: 'rgba(34,197,94,0.1)',
                border: '1px solid rgba(34,197,94,0.2)',
                color: '#86efac',
              }}
            >
              {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : location ? `📍 ${t('Fixed')}` : t('Get Location')}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-5 py-3 px-6 rounded-xl font-black text-[var(--text-main)] flex items-center justify-center gap-2 btn-neon ripple-effect disabled:opacity-60 transition-all"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? t('Listing crop...') : `🌾 ${t('List Crop for Sale')}`}
          </button>
        </form>
      </div>

      {/* Active Listings */}
      <div
        className="rounded-3xl overflow-hidden"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid rgba(34,197,94,0.15)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        <div className="p-6 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(34,197,94,0.1)', background: 'rgba(34,197,94,0.05)' }}>
          <h2 className="text-lg font-black text-[var(--text-main)] flex items-center gap-2">
            <PackageOpen className="w-5 h-5 text-green-400" />
            {t('Your Active Listings')}
          </h2>
          {crops.length > 0 && (
            <span
              className="px-3 py-1 rounded-full text-xs font-bold"
              style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#86efac' }}
            >
              {crops.length} {crops.length !== 1 ? t('Crops') : t('Crop')}
            </span>
          )}
        </div>

        {crops.length === 0 ? (
          <div className="p-16 text-center">
            <div className="text-5xl mb-3 opacity-30 animate-float">📦</div>
            <p className="text-sm" style={{ color: 'rgba(100,116,139,0.6)' }}>{t("You haven't listed any crops yet.")}</p>
            <p className="text-xs mt-1" style={{ color: 'rgba(100,116,139,0.4)' }}>{t("Add your first crop using the form above.")}</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'rgba(34,197,94,0.06)' }}>
            {crops.map((c, i) => (
              <ListingRow
                key={c.id || i}
                crop={c}
                onUpdate={(updatedCrop) => {
                  setCrops(prev => prev.map(p => (p.id === updatedCrop.id ? updatedCrop : p)));
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
