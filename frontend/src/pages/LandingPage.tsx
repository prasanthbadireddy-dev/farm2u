import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sprout, TrendingUp, Zap, Globe, ArrowRight, Leaf, ShoppingCart } from 'lucide-react';
import Footer from '../components/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen transition-colors duration-500 bg-white dark:bg-[#051f1c]">
      
      {/* ── Hero Section ── */}
      <section id="home" className="relative min-h-[80vh] flex flex-col items-center justify-center overflow-hidden border-b border-gray-100 dark:border-white/5 pb-16 pt-8">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 grid-pattern opacity-40 dark:opacity-20 transition-opacity" />
        
        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-2 bg-green-500/10 backdrop-blur-md rounded-full px-6 py-2 border border-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.1)]">
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Leaf className="w-5 h-5 text-green-600 dark:text-green-400" />
              </motion.div>
              <span className="text-xs font-black text-green-900 dark:text-green-300 uppercase tracking-widest">Andhra Pradesh's #1 AI Agri Platform</span>
            </div>
          </motion.div>

          {/* Floating Logo/Icon Box */}
          <motion.div
            animate={{ y: [0, -25, 0], rotate: [0, 10, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="w-28 h-28 mx-auto mb-10 rounded-3xl bg-green-600 flex items-center justify-center shadow-[0_0_50px_rgba(22,163,74,0.6)] relative cursor-pointer hover:scale-110"
          >
            <Leaf className="w-14 h-14 text-white" />
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }} className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full shadow-[0_0_20px_rgba(251,191,36,1)] flex items-center justify-center">
              <Zap className="w-3 h-3 text-yellow-900" />
            </motion.div>
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity, delay: 1 }} className="absolute -bottom-2 -left-2 w-5 h-5 bg-blue-400 rounded-full shadow-[0_0_15px_rgba(96,165,250,1)]" />
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-black mb-5 tracking-tight leading-tight text-gray-900 dark:text-white">
            Smart <span className="text-green-600 dark:text-[#4ade80]">Vegetable</span><br/>
            Market Platform
          </h1>
          
          <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto leading-relaxed mb-10 font-medium">
            Connecting <span className="text-green-600 dark:text-green-400 font-bold">farmers</span> & <span className="text-blue-600 dark:text-blue-400 font-bold">consumers</span> across Andhra Pradesh with AI-driven price predictions and real-time availability.
          </p>

          {/* Hero Badges */}
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.2 }
              }
            }}
            className="flex flex-wrap justify-center gap-4 mb-16"
          >
            {[
              { icon: Sprout, text: "200+ Farmers", sub: "Registered", color: "text-green-500" },
              { icon: Zap, text: "AI Predictions", sub: "Real-time ML", color: "text-yellow-500" },
              { icon: Globe, text: "13 Districts", sub: "Covered AP", color: "text-blue-500" }
            ].map((badge, idx) => (
              <motion.div 
                key={idx}
                variants={{
                  hidden: { y: 20, opacity: 0 },
                  visible: { y: 0, opacity: 1 }
                }}
                whileHover={{ y: -5, scale: 1.05 }}
                className="px-5 py-2.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow"
              >
                <badge.icon className={`w-5 h-5 ${badge.color}`} />
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{badge.text} <span className="text-[10px] opacity-50 ml-1 uppercase">{badge.sub}</span></span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Floating Vegetables (Decorative) */}
        <motion.div animate={{ y: [0, -30, 0], x: [0, 10, 0], rotate: [0, 20, 0] }} transition={{ duration: 8, repeat: Infinity }} className="absolute top-[20%] left-[10%] opacity-20 dark:opacity-40 hidden lg:block">
          <div className="p-4 rounded-3xl bg-red-500/20 blur-[1px]"><Leaf className="w-16 h-16 text-red-500" /></div>
        </motion.div>
        <motion.div animate={{ y: [0, 40, 0], x: [0, -15, 0], rotate: [0, -20, 0] }} transition={{ duration: 10, repeat: Infinity }} className="absolute bottom-[25%] right-[10%] opacity-20 dark:opacity-40 hidden lg:block">
          <div className="p-4 rounded-3xl bg-purple-500/20 blur-[1px] font-black text-4xl text-purple-500">🍆</div>
        </motion.div>
        <motion.div animate={{ y: [0, -25, 0], x: [0, 20, 0] }} transition={{ duration: 7, repeat: Infinity }} className="absolute top-[60%] left-[15%] opacity-20 dark:opacity-40 hidden lg:block">
          <div className="p-4 rounded-3xl bg-orange-500/20 blur-[1px] font-black text-4xl text-orange-500">🥕</div>
        </motion.div>
      </section>

      {/* ── Portals Section ── */}
      <section id="portals" className="py-32 max-w-7xl mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-12"
        >
          
          {/* Farmer Card */}
          <motion.div
            whileHover={{ y: -10, transition: { duration: 0.3 } }}
            className="group relative p-10 rounded-[40px] bg-gradient-to-br from-green-900/40 to-[#051f1c] border border-white/10 overflow-hidden shadow-2xl transition-all"
          >
            <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-3xl bg-green-500 flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(34,197,94,0.4)]">
                <Sprout className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-3xl font-black text-white mb-4">I am a Farmer</h3>
              <p className="text-gray-400 text-lg leading-relaxed mb-10 max-w-sm">
                List your crops, reach bulk buyers, and get fair prices.
              </p>
              <Link to="/farmer/login" className="inline-flex items-center gap-3 text-green-400 font-bold text-xl hover:translate-x-2 transition-transform">
                Start Selling <ArrowRight className="w-6 h-6" />
              </Link>
            </div>
            {/* Visual Decoration */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
              className="absolute -bottom-10 -left-10"
            >
              <Leaf className="w-40 h-40 text-green-500/10" />
            </motion.div>
          </motion.div>

          {/* Consumer Card */}
          <motion.div
            whileHover={{ y: -10, transition: { duration: 0.3 } }}
            className="group relative p-10 rounded-[40px] bg-gradient-to-br from-[#0c234a] to-[#041026] border border-white/10 overflow-hidden shadow-2xl transition-all"
          >
            <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-3xl bg-blue-600 flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(37,99,235,0.4)]">
                <ShoppingCart className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-3xl font-black text-white uppercase tracking-tight mb-4">Consumer</h3>
              <p className="text-gray-400 text-lg leading-relaxed mb-10 max-w-sm">
                Buy fresh from farms, track price trends, and get fast delivery.
              </p>
              <Link to="/consumer/login" className="inline-flex items-center gap-3 text-blue-400 font-bold text-xl hover:translate-x-2 transition-transform">
                Start Shopping <ArrowRight className="w-6 h-6" />
              </Link>
            </div>
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
              className="absolute -bottom-10 -right-10"
            >
              <ShoppingCart className="w-40 h-40 text-blue-500/10" />
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Features Section ── */}
      <section id="features" className="py-24 bg-gray-50/50 dark:bg-black/20 border-y border-gray-100 dark:border-white/5 transition-colors">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-black mb-4 text-gray-900 dark:text-white">Why Choose FARM2U?</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto font-medium">A complete agricultural transparency initiative designed for efficiency.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: TrendingUp, title: "Direct Trade", iconBg: "bg-green-500/10", color: "text-green-500", desc: "Connect directly with buyers across the state without middlemen." },
              { icon: Zap, title: "AI Predictions", iconBg: "bg-yellow-500/10", color: "text-yellow-500", desc: "Leverage Random Forest models for accurate market price trends." },
              { icon: Globe, title: "Live Map", iconBg: "bg-blue-500/10", color: "text-blue-500", desc: "Visual location tracking for farm fresh availability in real-time." },
              { icon: Leaf, title: "Zero Waste", iconBg: "bg-orange-500/10", color: "text-orange-500", desc: "Optimized logistics and supply chain to minimize crop spoilage." }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.5, delay: idx * 0.12 }}
                whileHover={{ y: -10, transition: { duration: 0.2 } }}
                className="p-10 rounded-[40px] bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-xl transition-shadow cursor-default"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${feature.iconBg}`}>
                  <feature.icon className={`w-7 h-7 ${feature.color}`} />
                </div>
                <h4 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">{feature.title}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
