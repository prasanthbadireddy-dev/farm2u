import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Store, Mail, Lock, User, Phone, MapPin, Loader2, ArrowRight, ShoppingCart, KeyRound, ArrowLeft } from 'lucide-react';

const EMOJIS = ['🛒', '🥬', '🍅', '🏪', '💳'];

export default function ConsumerLogin() {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ name: '', email: '', password: '', mobile: '', location: '' });
  const [resetData, setResetData] = useState({ email: '', new_password: '', confirm: '' });

  const isLogin = mode === 'login';
  const isReset = mode === 'reset';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const endpoint = isLogin ? '/consumer/login' : '/consumer/signup';
      const res = await api.post(endpoint, formData);
      if (res.data.success) {
        if (!isLogin) {
          setMode('login');
          setError('Account created! Please sign in.');
        } else {
          localStorage.setItem('token', res.data.token);
          localStorage.setItem('role', 'consumer');
          localStorage.setItem('name', res.data.name || formData.name);
          localStorage.setItem('userId', res.data.consumer_id);
          localStorage.setItem('mobile', res.data.mobile || formData.mobile);
          localStorage.setItem('userLocation', res.data.location || formData.location || 'Guntur');
          navigate('/home');
        }
      } else {
        setError(res.data.message || 'Authentication failed');
      }
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK') {
        setError('Cannot connect to server. Is the backend running?');
      } else {
        setError(err.response?.data?.message || 'Server error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetData.new_password !== resetData.confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/consumer/reset-password', {
        email: resetData.email,
        new_password: resetData.new_password,
      });
      if (res.data.success) {
        setMode('login');
        setError(res.data.message);
        setResetData({ email: '', new_password: '', confirm: '' });
      } else {
        setError(res.data.message || 'Reset failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Server error occurred');
    } finally {
      setLoading(false);
    }
  };

  const blue = 'rgba(96,165,250,0.6)';

  return (
    <div className="flex justify-center items-center min-h-[85vh] relative">
      {EMOJIS.map((v, i) => (
        <div key={i} className="absolute text-3xl select-none pointer-events-none" style={{
          top: `${10 + i * 18}%`,
          left: i % 2 === 0 ? `${5 + i * 3}%` : `${85 - i * 2}%`,
          animation: `float ${3 + i * 0.6}s ease-in-out infinite`,
          animationDelay: `${i * 0.5}s`,
          opacity: 0.22,
          filter: 'drop-shadow(0 0 8px rgba(96,165,250,0.5))',
        }}>{v}</div>
      ))}

      <div className="orb orb-blue w-80 h-80 -top-20 -right-20 animate-float-slow" />
      <div className="orb orb-purple w-64 h-64 -bottom-10 -left-20 animate-float" style={{ animationDelay: '2s' }} />

      <div className="w-full max-w-md relative z-10 animate-scale-in">
        <div className="rounded-3xl overflow-hidden" style={{
          background: 'rgba(10,15,30,0.85)',
          border: '1px solid rgba(96,165,250,0.2)',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(59,130,246,0.05)',
        }}>
          {/* Header */}
          <div className="relative p-8 text-center overflow-hidden" style={{
            background: 'linear-gradient(135deg, rgba(37,99,235,0.25) 0%, rgba(99,102,241,0.2) 100%)',
            borderBottom: '1px solid rgba(96,165,250,0.15)',
          }}>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
              <div className="w-48 h-48 crop-ring" style={{ borderColor: 'rgba(96,165,250,0.4)', animationDuration: '10s' }} />
            </div>
            <div className="relative z-10">
              <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 animate-glow-blue"
                style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)', boxShadow: '0 0 30px rgba(59,130,246,0.5)' }}>
                {isReset ? <KeyRound className="w-8 h-8 text-white" /> : <Store className="w-8 h-8 text-white veg-bounce" />}
              </div>
              <h2 className="text-2xl font-black text-white">{isReset ? 'Reset Password' : 'Consumer Portal'}</h2>
              <p className="text-sm mt-1" style={{ color: 'rgba(147,197,253,0.7)' }}>
                {isReset ? 'Set a new password for your account' : 'Find fresh vegetables near you'}
              </p>
              <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-xs font-semibold" style={{
                background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(96,165,250,0.3)', color: '#93c5fd',
              }}>
                <ShoppingCart className="w-3 h-3" /> Smart Market Discovery
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-8">
            {/* Tabs */}
            {!isReset && (
              <div className="flex p-1 rounded-xl mb-6" style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(96,165,250,0.1)' }}>
                {(['login', 'signup'] as const).map((m, i) => {
                  const active = mode === m;
                  return (
                    <button key={m} className="flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-300"
                      style={active ? { background: 'linear-gradient(135deg, #2563eb, #4f46e5)', color: 'white', boxShadow: '0 4px 15px rgba(59,130,246,0.3)' }
                        : { background: 'transparent', color: 'rgba(148,163,184,0.7)' }}
                      onClick={() => { setMode(m); setError(''); }}>
                      {i === 0 ? 'Sign In' : 'Sign Up'}
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
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: blue }} />
                  <input type="email" placeholder="Email Address" required
                    value={resetData.email} onChange={e => setResetData({ ...resetData, email: e.target.value })}
                    className="input-blue input-with-icon" />
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: blue }} />
                  <input type="password" placeholder="New Password (min 6 characters)" required
                    value={resetData.new_password} onChange={e => setResetData({ ...resetData, new_password: e.target.value })}
                    className="input-blue input-with-icon" />
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: blue }} />
                  <input type="password" placeholder="Confirm New Password" required
                    value={resetData.confirm} onChange={e => setResetData({ ...resetData, confirm: e.target.value })}
                    className="input-blue input-with-icon" />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 mt-1 ripple-effect btn-neon btn-neon-blue disabled:opacity-60">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                  Reset Password
                </button>
                <button type="button" onClick={() => { setMode('login'); setError(''); }}
                  className="flex items-center justify-center gap-1 text-xs font-semibold mt-1 transition-colors"
                  style={{ color: 'rgba(147,197,253,0.7)' }}>
                  <ArrowLeft className="w-3 h-3" /> Back to Sign In
                </button>
              </form>
            ) : (
              /* Login / Signup Form */
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {!isLogin && (
                  <>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: blue }} />
                      <input type="text" placeholder="Full Name" required value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })} className="input-blue input-with-icon" />
                    </div>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: blue }} />
                      <input type="tel" placeholder="Mobile Number" value={formData.mobile}
                        onChange={e => setFormData({ ...formData, mobile: e.target.value })} className="input-blue input-with-icon" />
                    </div>
                    <div className="relative">
                      <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: blue }} />
                      <input type="text" placeholder="Your City / Location" value={formData.location}
                        onChange={e => setFormData({ ...formData, location: e.target.value })} className="input-blue input-with-icon" />
                    </div>
                  </>
                )}
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: blue }} />
                  <input type="email" placeholder="Email Address" required value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })} className="input-blue input-with-icon" />
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: blue }} />
                  <input type="password" placeholder="Password" required value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })} className="input-blue input-with-icon" />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 mt-2 ripple-effect btn-neon btn-neon-blue disabled:opacity-60 transition-all">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  {isLogin ? 'Enter Consumer Portal' : 'Create Account'}
                </button>
                {isLogin && (
                  <button type="button" onClick={() => { setMode('reset'); setError(''); }}
                    className="text-xs font-semibold text-center mt-1 transition-colors hover:opacity-80"
                    style={{ color: 'rgba(96,165,250,0.8)' }}>
                    Forgot Password? Reset it here
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
