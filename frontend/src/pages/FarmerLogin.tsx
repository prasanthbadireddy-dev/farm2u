import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Sprout, Mail, Lock, User, Phone, Loader2, ArrowRight, Leaf, KeyRound, ArrowLeft, Mic, Sun, Moon } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import VoiceLoginAssistant from '../components/VoiceLoginAssistant';

const VEGGIES = ['🌾', '🥦', '🍅', '🌽', '🌱'];

export default function FarmerLogin() {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showVoice, setShowVoice] = useState(false);
  const navigate = useNavigate();
  const { t, language, setLanguage } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  const [formData, setFormData] = useState({ name: '', email: '', password: '', mobile: '' });
  const [resetData, setResetData] = useState({ email: '', new_password: '', confirm: '' });

  const performLogin = async (emailOrMobile: string, pass: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/farmer/login', { email: emailOrMobile, password: pass });
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('role', 'farmer');
        localStorage.setItem('name', res.data.name || formData.name);
        localStorage.setItem('userId', res.data.farmer_id);
        localStorage.setItem('mobile', res.data.mobile || formData.mobile);
        navigate('/farmer/details');
      } else {
        setError(res.data.message || t('Authentication failed'));
      }
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK') setError(t('Cannot connect to server. Is the backend running?'));
      else setError(err.response?.data?.message || t('Authentication failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') {
      return performLogin(formData.email, formData.password);
    }
    
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/farmer/signup', formData);
      if (res.data.success) {
        setMode('login');
        setError(t('Account created! Please sign in.'));
      } else {
        setError(res.data.message || t('Authentication failed'));
      }
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK') setError(t('Cannot connect to server. Is the backend running?'));
      else setError(err.response?.data?.message || t('Authentication failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetData.new_password !== resetData.confirm) {
      setError(t('Passwords do not match'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/farmer/reset-password', {
        email: resetData.email,
        new_password: resetData.new_password,
      });
      if (res.data.success) {
        setMode('login');
        setError(res.data.message);
        setResetData({ email: '', new_password: '', confirm: '' });
      } else {
        setError(res.data.message || t('Authentication failed'));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || t('Authentication failed'));
    } finally {
      setLoading(false);
    }
  };

  const isLogin = mode === 'login';
  const isReset = mode === 'reset';

  return (
    <div className="flex flex-col justify-center items-center min-h-[85vh] relative">
      {/* Voice Assistant Overlay */}
      {showVoice && (
        <VoiceLoginAssistant
          onClose={() => setShowVoice(false)}
          onFill={(m, p) => {
            // Fill the visual form
            setFormData(prev => ({ ...prev, email: m, password: p }));
            // Execute the login instantly bypassing DOM event propagation issues
            performLogin(m, p);
          }}
        />
      )}

      {/* Language Toggle */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-nav-bg p-1.5 rounded-full border border-glass-border backdrop-blur-sm shadow-xl transition-colors duration-500">
        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${language === 'en' ? 'bg-green-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'text-slate-400 hover:text-white'}`}
        >
          English
        </button>
        <button
          type="button"
          onClick={() => setLanguage('te')}
          className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${language === 'te' ? 'bg-green-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'text-slate-400 hover:text-white'}`}
        >
          తెలుగు
        </button>
        
        <div className="w-px h-4 bg-white/10 mx-1" />
        
        <button
          type="button"
          onClick={toggleTheme}
          className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-white"
        >
          {theme === 'dark' ? <Moon className="w-4 h-4 text-blue-400" /> : <Sun className="w-4 h-4 text-yellow-500" />}
        </button>
      </div>

      {/* AI Assistant Toggle */}
      {!isReset && (
        <button
          type="button"
          onClick={() => setShowVoice(true)}
          className="fixed bottom-6 left-6 md:bottom-10 md:left-10 z-50 px-5 py-3 inline-flex items-center gap-2 rounded-full font-black text-white shadow-[0_0_25px_rgba(34,197,94,0.5)] animate-pulse hover:animate-none hover:scale-110 transition-all border border-white/20 backdrop-blur-md"
          style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.9), rgba(6,182,212,0.9))' }}
        >
          <Mic className="w-5 h-5" />
          {t('AI Assistant')}
        </button>
      )}

      {VEGGIES.map((v, i) => (
        <div key={i} className="absolute text-3xl select-none pointer-events-none" style={{
          top: `${10 + i * 18}%`,
          left: i % 2 === 0 ? `${5 + i * 3}%` : `${85 - i * 2}%`,
          animation: `float ${3 + i * 0.6}s ease-in-out infinite`,
          animationDelay: `${i * 0.5}s`,
          opacity: 0.25,
          filter: 'drop-shadow(0 0 8px rgba(34,197,94,0.5))',
        }}>{v}</div>
      ))}

      <div className="orb orb-green w-80 h-80 -top-20 -left-20 animate-float-slow" />
      <div className="orb orb-blue w-64 h-64 -bottom-10 -right-20 animate-float" style={{ animationDelay: '2s' }} />

      <div className="w-full max-w-md relative z-10 animate-scale-in">
        <div className="rounded-3xl overflow-hidden" style={{
          background: 'rgba(10,15,30,0.85)',
          border: '1px solid rgba(34,197,94,0.2)',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(34,197,94,0.05)',
        }}>
          {/* Header */}
          <div className="relative p-8 text-center overflow-hidden" style={{
            background: 'linear-gradient(135deg, rgba(22,163,74,0.25) 0%, rgba(5,150,105,0.2) 100%)',
            borderBottom: '1px solid rgba(34,197,94,0.15)',
          }}>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
              <div className="w-48 h-48 crop-ring" />
            </div>
            <div className="relative z-10">
              <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 animate-glow"
                style={{ background: 'linear-gradient(135deg, #16a34a, #059669)', boxShadow: '0 0 30px rgba(34,197,94,0.5)' }}>
                {isReset ? <KeyRound className="w-8 h-8 text-white" /> : <Sprout className="w-8 h-8 text-white veg-bounce" />}
              </div>
              <h2 className="text-2xl font-black text-white">{isReset ? t('Reset Password') : t('Farmer Portal')}</h2>
              <p className="text-sm mt-1 text-green-700 dark:text-green-300 font-medium">
                {isReset ? t('Set a new password for your account') : t('Manage your harvest and reach buyers')}
              </p>
              
              <div className="flex items-center justify-center gap-1.5 mt-4 px-3 py-1 rounded-full text-xs font-semibold mx-auto w-max" style={{
                background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#86efac',
              }}>
                <Leaf className="w-3 h-3" /> {t('AI-Powered Agriculture')}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-8">
            {/* Tabs */}
            {!isReset && (
              <div className="flex p-1 rounded-xl mb-6" style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(34,197,94,0.1)' }}>
                {(['login', 'signup'] as const).map((m, i) => {
                  const active = mode === m;
                  return (
                    <button type="button" key={m} className="flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-300"
                      style={active ? { background: 'linear-gradient(135deg, #16a34a, #059669)', color: 'white', boxShadow: '0 4px 15px rgba(34,197,94,0.3)' }
                        : { background: 'transparent', color: 'rgba(148,163,184,0.7)' }}
                      onClick={() => { setMode(m); setError(''); }}>
                      {i === 0 ? t('Sign In') : t('Sign Up')}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Banner */}
            {error && (
              <div className="p-3 text-sm rounded-xl mb-4 animate-slide-in-left font-medium"
                style={error.includes('created') || error.includes('successfully') ? {
                  background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#86efac',
                } : {
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5',
                }}>
                {error}
              </div>
            )}

            {/* Reset Form */}
            {isReset ? (
              <form onSubmit={handleReset} className="flex flex-col gap-4">
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(134,239,172,0.6)' }} />
                  <input type="text" placeholder={t('Email Address or Mobile Number')} required
                    value={resetData.email} onChange={e => setResetData({ ...resetData, email: e.target.value })}
                    className="input-dark input-with-icon" />
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(134,239,172,0.6)' }} />
                  <input type="password" placeholder={t('New Password (min 6 characters)')} required
                    value={resetData.new_password} onChange={e => setResetData({ ...resetData, new_password: e.target.value })}
                    className="input-dark input-with-icon" />
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(134,239,172,0.6)' }} />
                  <input type="password" placeholder={t('Confirm New Password')} required
                    value={resetData.confirm} onChange={e => setResetData({ ...resetData, confirm: e.target.value })}
                    className="input-dark input-with-icon" />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 mt-1 ripple-effect btn-neon disabled:opacity-60">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                  {t('Reset Password')}
                </button>
                <button type="button" onClick={() => { setMode('login'); setError(''); }}
                  className="flex items-center justify-center gap-1 text-xs font-semibold mt-1 transition-colors"
                  style={{ color: 'rgba(134,239,172,0.7)' }}>
                  <ArrowLeft className="w-3 h-3" /> {t('Back to Sign In')}
                </button>
              </form>
            ) : (
              /* Login / Signup Form */
              <form id="login-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
                {mode === 'signup' && (
                  <>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(134,239,172,0.6)' }} />
                      <input type="text" placeholder={t('Full Name')} required value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })} className="input-dark input-with-icon" />
                    </div>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(134,239,172,0.6)' }} />
                      <input type="tel" placeholder={t('Mobile Number')} required value={formData.mobile}
                        onChange={e => setFormData({ ...formData, mobile: e.target.value })} className="input-dark input-with-icon" />
                    </div>
                  </>
                )}
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(134,239,172,0.6)' }} />
                  <input type="text" placeholder={isLogin ? t('Email Address or Mobile Number') : t('Email Address')}
                    required value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })} className="input-dark input-with-icon" />
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(134,239,172,0.6)' }} />
                  <input type="password" placeholder={t('Password')} required value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })} className="input-dark input-with-icon" />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 mt-2 ripple-effect btn-neon disabled:opacity-60 transition-all">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  {isLogin ? t('Enter Farmer Portal') : t('Create Account')}
                </button>
                {isLogin && (
                  <button type="button" onClick={() => { setMode('reset'); setError(''); }}
                    className="text-xs font-semibold text-center mt-1 transition-colors hover:opacity-80"
                    style={{ color: 'rgba(96,165,250,0.8)' }}>
                    {t('Forgot Password? Reset it here')}
                  </button>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
