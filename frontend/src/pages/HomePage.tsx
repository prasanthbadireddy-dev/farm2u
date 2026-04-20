import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../context/LanguageContext';
import { Sun, Moon, Search, MapPin, TrendingDown, Loader2, Sparkles, IndianRupee, ChevronDown, Star, ShoppingCart, X, Trash2, ShoppingBag, Receipt, Navigation, User, Phone, Package, Globe, MessageSquare, Linkedin, Mail, Languages, Zap, ArrowRight } from 'lucide-react';
import api from '../api';
import VegetableMap from '../components/VegetableMap';

interface Recommendation { vegetable: string; district: string; lat: number; lon: number; avg_price: number; predicted_price: number; }
interface SearchResult {
  vegetable: string; district: string; lat: number; lon: number; avg_price: number;
  price?: number; quantity?: number; crop_id?: string;
  type?: 'Market' | 'Farmer' | 'CSV Farmer'; farmer_name?: string; mobile?: string;
}

interface CartItem {
  crop_id: string; vegetable: string; district: string;
  price: number; quantity: number; farmer_name: string;
  cartQty: number;
}

const VEG_EMOJIS: Record<string, string> = {
  Tomato: '🍅', Onion: '🧅', Carrot: '🥕', Brinjal: '🍆', Capsicum: '🫑',
  Cucumber: '🥒', Cabbage: '🥬', Potato: '🥔', Corn: '🌽', Spinach: '🌿',
  Cauliflower: '🥦', Peas: '🫛', Beans: '🫘', Radish: '🔴', Ginger: '🪤',
};
const getEmoji = (name: string) => {
  const key = Object.keys(VEG_EMOJIS).find(k => name.toLowerCase().includes(k.toLowerCase()));
  return key ? VEG_EMOJIS[key] : '🥗';
};

export default function HomePage() {
  const { theme, toggleTheme } = useTheme();
  const { t, language, setLanguage } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDistrict, setSearchDistrict] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [districts, setDistricts] = useState<{ district: string }[]>([]);
  const [vegetables, setVegetables] = useState<string[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingRecs, setLoadingRecs] = useState(true);
  const [predVeg, setPredVeg] = useState('');
  const [predDistrict, setPredDistrict] = useState('');
  const [predPrice, setPredPrice] = useState<number | null>(null);
  const [predLoading, setPredLoading] = useState(false);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [buying, setBuying] = useState(false);
  const [buyResult, setBuyResult] = useState<string | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<{items: CartItem[], total: number, date: string, id: string, deliveryMode: string} | null>(null);
  const [deliveryMode, setDeliveryMode] = useState<'Delivery' | 'Self-Pick'>('Delivery');
  const [showMap, setShowMap] = useState(true);

  const handlePredict = async () => {
    if (!predVeg || !predDistrict) return;
    setPredLoading(true);
    setPredPrice(null);
    try {
      const now = new Date();
      const res = await api.get(`/predict-price?vegetable=${predVeg}&district=${predDistrict}&month=${now.getMonth() + 1}&year=${now.getFullYear()}`);
      if (res.data.success) setPredPrice(res.data.predicted_price);
    } catch (err) { console.error(err); }
    finally { setPredLoading(false); }
  };

  const userLocation = localStorage.getItem('userLocation') || 'Guntur';

  const fetchMapData = useCallback(async (background = false) => {
    if (!background) setLoadingSearch(true);
    try {
      const res = await api.get(`/vegetables?name=${searchQuery}&district=${searchDistrict}&t=${Date.now()}`);
      if (res.data.success) setSearchResults(res.data.results);
    } catch (err) { console.error(err); }
    finally { if (!background) setLoadingSearch(false); }
  }, [searchQuery, searchDistrict]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const res = await api.get(`/recommendations?district=${userLocation}`);
        if (res.data.success) setRecommendations(res.data.recommendations);
      } catch (err) { console.error(err); }
      finally { setLoadingRecs(false); }
    };
    const fetchInitialMapData = async () => {
      try {
        const [res, distRes] = await Promise.all([api.get('/vegetables'), api.get('/districts')]);
        if (res.data.success) setSearchResults(res.data.results);
        if (distRes.data.success) setDistricts(distRes.data.districts);
        const vegRes = await api.get('/vegetables-list');
        if (vegRes.data.success) setVegetables(vegRes.data.vegetables);
      } catch (err) { console.error(err); }
    };
    fetchRecommendations();
    fetchInitialMapData();
  }, [fetchMapData, userLocation]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => fetchMapData(false), 500);
    const intervalFn = setInterval(() => fetchMapData(true), 3000);
    return () => { clearTimeout(delayDebounceFn); clearInterval(intervalFn); };
  }, [searchQuery, searchDistrict, fetchMapData]);

  const addToCart = (item: SearchResult) => {
    if (!item.crop_id || !item.price || !item.quantity) return;
    setCart(prev => {
      const existing = prev.find(c => c.crop_id === item.crop_id);
      if (existing) {
        return prev.map(c => c.crop_id === item.crop_id
          ? { ...c, cartQty: Math.min(c.cartQty + 1, item.quantity!) }
          : c
        );
      }
      return [...prev, {
        crop_id: item.crop_id!,
        vegetable: item.vegetable,
        district: item.district,
        price: item.price!,
        quantity: item.quantity!,
        farmer_name: t(item.farmer_name || 'Farmer'),
        cartQty: 1,
      }];
    });
    setCartOpen(true);
  };

  const removeFromCart = (crop_id: string) => setCart(prev => prev.filter(c => c.crop_id !== crop_id));

  const updateCartQty = (crop_id: string, delta: number) => {
    setCart(prev => prev.map(c => {
      if (c.crop_id !== crop_id) return c;
      const newQty = Math.max(1, Math.min(c.cartQty + delta, c.quantity));
      return { ...c, cartQty: newQty };
    }));
  };

  const handleBuy = async () => {
    if (cart.length === 0) return;
    setBuying(true);
    setBuyResult(null);
    const errors: string[] = [];
    const consumerName = localStorage.getItem('name') || 'Anonymous Consumer';
    const consumerMobile = localStorage.getItem('mobile') || 'N/A';
    
    for (const item of cart) {
      try {
        const res = await api.post(`/farmer/crop/${item.crop_id}/buy`, { 
          quantity: item.cartQty,
          delivery_mode: deliveryMode,
          consumer_name: consumerName,
          consumer_mobile: consumerMobile
        });
        if (!res.data.success) errors.push(`${item.vegetable}: ${res.data.message}`);
      } catch {
        errors.push(`${item.vegetable}: Network error`);
      }
    }
    setBuying(false);
    if (errors.length === 0) {
      setBuyResult('✅ Purchase successful! The farmer has been notified.');
      setReceiptData({ 
        items: [...cart], 
        total: cartTotal, 
        date: new Date().toLocaleString(), 
        id: Math.random().toString(36).substring(2, 10).toUpperCase(),
        deliveryMode: deliveryMode
      });
      setShowReceipt(true);
      setCart([]);
      setCartOpen(false);
      setTimeout(() => fetchMapData(false), 500);
    } else {
      setBuyResult(`⚠️ Some items failed: ${errors.join(', ')}`);
    }
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.cartQty, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.cartQty, 0);

  return (
    <div className="forest-theme -mx-4 -mt-8 sm:-mx-8 p-6 sm:p-8 animate-fade-in relative min-h-screen">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0 opacity-50">
        <div className="absolute top-[10%] left-[5%] w-96 h-96 orb orb-green animate-float-slow" />
        <div className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] orb orb-green animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[40%] right-[15%] w-64 h-64 orb orb-blue animate-float-slow" style={{ animationDelay: '1s', opacity: 0.1 }} />
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-6 px-6 relative z-10 py-2 border-b border-white/5 bg-black/20 backdrop-blur-md rounded-2xl mx-4 mt-2">
        <div className="flex-1" />
        <div className="flex items-center gap-2">
           <div className="p-1.5 bg-green-500/20 rounded-lg">
              <Sparkles className="w-4 h-4 text-green-400" />
           </div>
           <h1 className="text-lg font-black text-white tracking-widest uppercase">AgriSmart</h1>
        </div>
        <div className="flex-1 flex justify-end items-center gap-6">
          <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
            <User className="w-4 h-4 text-green-400" />
            <div className="flex flex-col items-start leading-none">
              <span className="text-[10px] font-black text-white uppercase">{localStorage.getItem('name') || 'Guest User'}</span>
              <span className="text-[8px] font-bold text-green-500 tracking-widest">{localStorage.getItem('role') || 'CONSUMER'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setLanguage(language === 'en' ? 'te' : 'en')} 
              className="p-2 rounded-lg border border-white/10 hover:bg-white/5 transition-colors flex items-center gap-1.5"
            >
              <Languages className="w-4 h-4 text-green-400" />
            </button>

            <button onClick={() => setCartOpen(true)} className="p-2 rounded-lg border border-white/10 hover:bg-white/5 transition-colors relative">
              <ShoppingCart className="w-4 h-4 text-white" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] flex items-center justify-center font-bold">{cartCount}</span>
              )}
            </button>
            
            <button onClick={toggleTheme} className="p-2 rounded-lg border border-white/10 hover:bg-white/5 transition-colors">
              {theme === 'dark' ? <Moon className="w-4 h-4 text-blue-400" /> : <Sun className="w-4 h-4 text-yellow-500" />}
            </button>

            <Link to="/consumer/login" className="p-2 rounded-lg border border-red-500/20 hover:bg-red-500/10 text-red-400 transition-colors">
              <X className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* --- PRICE PREDICTOR (TOP) --- */}
      <div className="mb-6 px-4 relative z-10 animate-slide-up">
        <div className="rounded-[2rem] bg-[#0f3d2e] border border-white/10 shadow-[0_15px_60px_rgba(0,0,0,0.3)] overflow-hidden">
           {/* Card Header Part */}
           <div className="bg-gradient-to-r from-green-600 to-green-900 p-4 flex items-center gap-4">
              <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md shadow-inner">
                 <TrendingDown className="w-5 h-5 text-white" />
              </div>
              <div>
                 <h2 className="text-lg font-black text-white uppercase tracking-wider">{t('AI Price Predictor')}</h2>
                 <p className="text-green-100/60 text-[10px] font-medium leading-none">{t('Get accurate market forecasts for any crop using our ML models.')}</p>
              </div>
           </div>
           
           {/* Card Inputs Part */}
           <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-1.5">
                 <label className="text-[9px] font-black uppercase text-green-400/80 tracking-widest ml-1">{t('Vegetable')}</label>
                 <select value={predVeg} onChange={e => setPredVeg(e.target.value)} className="forest-input py-2 text-xs w-full bg-black/40 border-white/10">
                    <option value="" className="bg-slate-900">{t('Select Crop')}...</option>
                    {vegetables.map(v => <option key={v} value={v} className="bg-slate-900">{t(v)}</option>)}
                 </select>
              </div>
              <div className="space-y-1.5">
                 <label className="text-[9px] font-black uppercase text-green-400/80 tracking-widest ml-1">{t('District')}</label>
                 <select value={predDistrict} onChange={e => setPredDistrict(e.target.value)} className="forest-input py-2 text-xs w-full bg-black/40 border-white/10">
                    <option value="" className="bg-slate-900">{t('Select District')}...</option>
                    {districts.map(d => <option key={d.district} value={d.district} className="bg-slate-900">{t(d.district)}</option>)}
                 </select>
              </div>
              <div className="flex flex-col">
                 <button onClick={handlePredict} disabled={!predVeg || !predDistrict || predLoading} className="w-full py-3 bg-green-500 rounded-xl font-black text-[10px] text-white hover:bg-green-400 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2">
                    {predLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Zap className="w-3.5 h-3.5" /> {t('PREDICT NOW')}</>}
                 </button>
              </div>
              {predPrice !== null && (
                 <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-center animate-scale-in flex flex-col justify-center h-full shadow-inner">
                    <div className="text-[8px] font-black uppercase text-green-300 mb-1 tracking-widest">{t('Estimated')}</div>
                    <div className="text-xl font-black text-white">₹{predPrice} <span className="text-[9px] text-green-500/40">/KG</span></div>
                 </div>
              )}
           </div>
        </div>
      </div>

      {/* MAIN CONTENT SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 px-4 relative z-10">
         
         {/* LEFT COLUMN: FILTERS + LISTINGS (STICKY) */}
         <div className="lg:col-span-4 lg:sticky lg:top-8 h-fit animate-slide-in-left delay-200">
            <div className="p-8 rounded-[3rem] bg-[#0c3127] border border-white/10 shadow-2xl space-y-8 overflow-hidden relative">
               <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 blur-3xl -mr-10 -mt-10" />
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-green-500/20 flex items-center justify-center">
                     <Search className="w-5 h-5 text-green-400" />
                  </div>
                  <h2 className="text-xl font-black text-white tracking-tight">{t('Search Produce')}</h2>
               </div>

               <div className="space-y-5">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-green-400/50 tracking-[0.2em] ml-1">{t('Search Keywords')}</label>
                     <input type="text" placeholder={t('Search for vegetable...')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="forest-input py-3.5 text-xs w-full bg-black/30 border-white/5" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-green-400/50 tracking-[0.2em] ml-1">{t('Region/District')}</label>
                     <div className="relative">
                        <select value={searchDistrict} onChange={e => setSearchDistrict(e.target.value)} className="forest-input py-3.5 text-xs w-full appearance-none bg-black/30 border-white/5 pr-10">
                           <option value="">{t('All Districts')}</option>
                           {districts.map(d => <option key={d.district} value={d.district}>{t(d.district)}</option>)}
                        </select>
                        <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />
                     </div>
                  </div>
               </div>

               {/* Result Count */}
               <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('Results')}</span>
                  <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-[10px] font-black">{searchResults.length} {t('Items')}</span>
               </div>
            </div>

            {/* Scrollable Listings: Small, Square, and Info-Rich */}
            <div className="mt-8 grid grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
               {searchResults.map((res: any, i) => (
                 <div key={i} className="mist-card p-4 aspect-square flex flex-col justify-between border-l-4 border-l-green-500 relative group overflow-hidden shadow-sm hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 w-10 h-10 bg-green-500/5 group-hover:bg-green-500/10 transition-colors -mr-2 -mt-2 rounded-full" />
                    
                    <div className="space-y-1.5 min-w-0">
                       <div className="flex items-center justify-between gap-1">
                          <h3 className="text-[11px] font-black text-slate-900 dark:text-white tracking-tight leading-tight truncate">{t(res.vegetable)}</h3>
                          <span className="shrink-0 px-1 py-0.5 rounded bg-green-100 text-[6px] font-black text-green-600 uppercase border border-green-200">
                             {res.type === 'Market' ? t('M') : t('F')}
                          </span>
                       </div>
                       
                       <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1">
                             <User className="w-2.5 h-2.5 text-green-500 shrink-0" />
                             <span className="text-[9px] font-bold text-slate-500 dark:text-slate-300 truncate">{t(res.farmer_name || "Manoj")}</span>
                          </div>
                          <div className="flex items-center gap-1">
                             <Phone className="w-2.5 h-2.5 text-green-500 shrink-0" />
                             <span className="text-[9px] font-bold text-slate-500 dark:text-slate-300 truncate">{res.mobile || "9988776655"}</span>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-1.5">
                       <div className="flex justify-between items-end border-t border-slate-100 dark:border-white/5 pt-2">
                          <div className="flex flex-col">
                             <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">{t('Price')}</span>
                             <div className="text-[11px] font-black text-green-600">₹{res.price || res.avg_price || 0}/<span className="text-[8px] text-slate-400 font-bold">kg</span></div>
                          </div>
                          <div className="flex flex-col text-right">
                             <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">{t('Qty')}</span>
                             <div className="text-[11px] font-black text-slate-900 dark:text-white">{res.quantity || 50}kg</div>
                          </div>
                       </div>
                       <button onClick={() => addToCart(res)} className="w-full py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-all shadow-md active:scale-95 flex items-center justify-center">
                          <ShoppingBag className="w-3 h-3" />
                       </button>
                    </div>
                 </div>
               ))}
               {searchResults.length === 0 && (
                 <div className="p-10 text-center rounded-3xl bg-black/10 border border-white/5">
                   <Package className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-30" />
                   <p className="text-xs text-slate-500 font-bold">{t('No produce found matching your search.')}</p>
                 </div>
               )}
            </div>
         </div>

         {/* RIGHT COLUMN: MAP AREA (70%) */}
         <div className="lg:col-span-8 animate-slide-in-right delay-300">
            <div className="space-y-6 sticky top-8">
               <div className="rounded-[4rem] overflow-hidden border border-white/10 h-[600px] shadow-[0_20px_80px_rgba(0,0,0,0.5)] relative">
                  <div className="absolute top-6 left-6 z-10 p-4 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 flex items-center gap-3">
                     <Navigation className="w-5 h-5 text-green-400" />
                     <span className="text-xs font-black text-white uppercase tracking-widest">{t('Live Market Map')}</span>
                  </div>
                  <VegetableMap locations={searchResults} onAddToCart={addToCart} />
               </div>
            </div>
         </div>
      </div>

      {/* ─── AI RECOMMENDATIONS (FULL WIDTH BELOW SPLIT) ─── */}
      <div className="mt-20 px-4 relative z-10 animate-slide-up">
         <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center">
               <Sparkles className="w-6 h-6 text-blue-400" />
            </div>
            <div>
               <h2 className="text-2xl font-black text-white tracking-tight uppercase leading-none">{t('Recommended Near You')}</h2>
               <p className="text-slate-500 text-xs font-bold mt-1 tracking-widest">{t('AI-powered picks based on local market trends and harvest peaks').toUpperCase()}</p>
            </div>
         </div>

         <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {recommendations.slice(0, 12).map((rec: any, i) => {
               const firstLetter = rec.vegetable?.charAt(0).toUpperCase();
               const cardColors = [
                 'bg-green-100 text-green-600',
                 'bg-blue-100 text-blue-600',
                 'bg-orange-100 text-orange-600',
                 'bg-purple-100 text-purple-600',
                 'bg-pink-100 text-pink-600'
               ];
               const colorClass = cardColors[i % cardColors.length];

               return (
                 <div key={i} className="mist-card p-4 aspect-square flex flex-col gap-3 group border border-white/40 h-full justify-between hover:scale-105 transition-transform">
                    <div className="flex justify-between items-start">
                       <div className={`w-10 h-10 rounded-xl ${colorClass} flex items-center justify-center text-lg font-black shadow-inner`}>
                          {firstLetter}
                       </div>
                       <div className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-[6px] font-black text-blue-500 uppercase tracking-widest shadow-sm">
                          {t('AI Pick')}
                       </div>
                    </div>

                    <div>
                       <h3 className="text-xs font-black text-slate-900 dark:text-white leading-tight truncate">{t(rec.vegetable)}</h3>
                       <p className="text-[8px] font-bold text-slate-400 flex items-center gap-0.5 uppercase tracking-wider mt-0.5 truncate">
                          <MapPin className="w-2 h-2 text-slate-300" /> {t(rec.district)}
                       </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-white/5">
                       <div className="flex justify-between items-end">
                          <div className="space-y-0">
                             <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">{t('Predicted')}</span>
                             <div className="text-[11px] font-black text-slate-900 dark:text-white">₹{rec.predicted_price}<span className="text-[8px] text-slate-400 font-bold">/kg</span></div>
                          </div>
                          <button onClick={() => { setPredVeg(rec.vegetable); setPredDistrict(rec.district); handlePredict(); }} className="w-7 h-7 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all active:scale-95 shadow-sm">
                             <ArrowRight className="w-3 h-3" />
                          </button>
                       </div>
                    </div>
                 </div>
               );
            })}
         </div>

         {/* Geospatial engine footer placement similar to image */}
         <div className="mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 opacity-40 grayscale pointer-events-none">
            <div className="flex items-center gap-4">
               <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.4em]">FARM2U Geodata Engine v4.0.2</span>
               <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            </div>
            <div className="flex gap-10">
               <span className="text-[8px] font-black text-slate-500">LATENCY: 14ms</span>
               <span className="text-[8px] font-black text-slate-500">LOAD: 0.12%</span>
               <span className="text-[8px] font-black text-slate-500">REGION: AP-SOUTH-1</span>
            </div>
         </div>
      </div>

      {/* Generated Receipt Modal (Legacy) */}
      {showReceipt && receiptData && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowReceipt(false)} />
          <div className="relative w-full max-w-md rounded-2xl overflow-hidden animate-slide-up" style={{ background: '#f8fafc', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <div className="p-6 text-center" style={{ borderBottom: '2px dashed #cbd5e1' }}>
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                <Receipt className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-xl font-black text-slate-800">Purchase Receipt</h2>
              <p className="text-slate-500 text-sm">Order ID: #{receiptData.id}</p>
              <div className="mt-2 mb-1">
                <span className="text-slate-600 text-xs font-bold border border-slate-300 bg-slate-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {receiptData.deliveryMode === 'Delivery' ? '🚚 Delivery' : '🤝 Self-Pick'}
                </span>
              </div>
            </div>
            <div className="p-6 bg-white space-y-4 max-h-[50vh] overflow-y-auto">
              {receiptData.items.map((item, i) => (
                <div key={i} className="flex justify-between items-center text-sm font-bold text-slate-800">
                  <span>{item.vegetable} ({item.cartQty}kg)</span>
                  <span>₹{(item.price * item.cartQty).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="p-6 bg-slate-50 border-t border-dashed border-slate-300">
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-slate-600">Total Paid</span>
                <span className="text-2xl font-black text-green-600">₹{receiptData.total.toFixed(2)}</span>
              </div>
              <button onClick={() => setShowReceipt(false)} className="w-full py-3 rounded-xl font-black text-white bg-green-600 hover:bg-green-700 transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer (Legacy) */}
      {cartOpen && (
        <div className="fixed inset-0 z-[200] flex">
          <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
          <div className="w-full max-w-sm flex flex-col bg-[#061e1b] border-l border-white/10 backdrop-blur-3xl animate-slide-in-right">
            <div className="p-5 flex items-center justify-between border-b border-white/10">
              <h2 className="text-white font-black flex items-center gap-2">🛒 Cart ({cartCount})</h2>
              <button onClick={() => setCartOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.map(item => (
                <div key={item.crop_id} className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex justify-between items-start mb-2 text-white font-black">
                    <span>{item.vegetable}</span>
                    <button onClick={() => removeFromCart(item.crop_id)} className="text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 bg-black/30 rounded-lg p-1">
                      <button onClick={() => updateCartQty(item.crop_id, -1)} className="w-6 h-6 text-green-400">-</button>
                      <span className="text-xs">{item.cartQty}kg</span>
                      <button onClick={() => updateCartQty(item.crop_id, 1)} className="w-6 h-6 text-green-400">+</button>
                    </div>
                    <span className="text-yellow-400 font-black">₹{(item.price * item.cartQty).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div className="p-5 border-t border-white/10 space-y-4">
                <div className="flex justify-between text-white font-black text-xl">
                  <span>Total</span>
                  <span className="text-yellow-400">₹{cartTotal.toFixed(2)}</span>
                </div>
                <button onClick={handleBuy} disabled={buying} className="w-full py-4 bg-green-600 text-white rounded-xl font-black">
                  {buying ? <Loader2 className="animate-spin mx-auto" /> : 'BUY NOW'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* ── Footer Section (Same as LandingPage) ── */}
      <footer className="footer-theme -mx-8 -mb-8 mt-20 border-t border-white/5 py-16 px-10 bg-[#061e1b] relative z-10 transition-colors">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
          <div>
            <h4 className="text-[10px] font-bold text-white uppercase tracking-widest mb-6 py-1 border-b border-white/10 w-max pb-3">{t('Get to know us')}</h4>
            <ul className="space-y-4 text-xs text-gray-400">
              <li><a href="#" className="hover:text-green-400 transition-colors">{t('About Platform')}</a></li>
              <li><a href="#" className="hover:text-green-400 transition-colors">{t('Our Mission')}</a></li>
              <li><a href="#" className="hover:text-green-400 transition-colors">{t('Technical Docs')}</a></li>
            </ul>
          </div>

          <div>
             <h4 className="text-[10px] font-bold text-white uppercase tracking-widest mb-6 py-1 border-b border-white/10 w-max pb-3">{t('Platform Links')}</h4>
             <ul className="space-y-4 text-xs text-gray-400">
               <li><Link to="/home" className="hover:text-green-400 transition-colors">{t('Live Market Map')}</Link></li>
               <li><Link to="/farmer/login" className="hover:text-green-400 transition-colors">{t('Farmer Portal')}</Link></li>
               <li><Link to="/consumer/login" className="hover:text-green-400 transition-colors">{t('Consumer Portal')}</Link></li>
               <li><a href="#" className="hover:text-green-400 transition-colors">{t('AI Price Predictor')}</a></li>
             </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-bold text-white uppercase tracking-widest mb-6 py-1 border-b border-white/10 w-max pb-3">{t('Coverage & Contact')}</h4>
             <ul className="space-y-4 text-xs text-gray-400">
              <li className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#16a34a]" /> {t('13 Districts of AP')}
              </li>
              <li className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-400" /> 1800-AGRI-SMART
              </li>
              <li className="flex items-center gap-2">
                <Linkedin className="w-4 h-4 text-purple-400" /> support@farm2u.in
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-bold text-white uppercase tracking-widest mb-6 py-1 border-b border-white/10 w-max pb-3">{t('Team Credits')}</h4>
            <ul className="grid grid-cols-1 gap-4 text-xs text-gray-400">
               {[
                 { name: 'Devi Prasanth Badireddy', email: 'prasanthbadireddy@gmail.com' },
                 { name: 'Jeeshan Agastya', email: 'agastyajeeshan@gmail.com' },
                 { name: 'Farhat Yasmin', email: 'mdyasminfarhat@gmail.com' },
                 { name: 'Manoj Reddy Baki', email: 'manojreddybaki@gmail.com' },
                 { name: 'Dinesh Chitturu', email: 'dineshchitturu2005@gmail.com' }
               ].map(member => (
                 <li key={member.name}>
                   <a href={`https://mail.google.com/mail/?view=cm&fs=1&to=${member.email}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition-colors group">
                     <Mail className="w-3 h-3 text-blue-500 group-hover:text-blue-400" /> {member.name}
                   </a>
                 </li>
               ))}
            </ul>
          </div>

        </div>
        <p className="text-center text-[8px] font-black uppercase text-slate-500 tracking-[0.4em] mt-16 opacity-30">© FARM2U DIGITAL CORE ENGINE V2.1</p>
      </footer>
    </div>
  );
}
