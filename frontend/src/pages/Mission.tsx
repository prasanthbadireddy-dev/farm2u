import { motion } from 'framer-motion';
import { Target, Shield, Users, BarChart } from 'lucide-react';
import Footer from '../components/Footer';

export default function Mission() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 bg-white dark:bg-[#051f1c] text-gray-900 dark:text-white transition-colors duration-500 relative overflow-hidden">
        
        {/* Background Grid */}
        <div className="absolute inset-0 grid-pattern opacity-30 dark:opacity-20 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 py-16 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-600 dark:text-green-400 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-6">
              <Target className="w-4 h-4" /> Our Mission
            </div>
            <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">
              Empowering India's <br/> <span className="text-green-600 dark:text-[#4ade80]">Agriculture</span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
              FARM2U is on a mission to revolutionize the agricultural landscape by leveraging advanced technology to ensure fairness, transparency, and prosperity for both farmers and consumers.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div 
              whileHover={{ y: -10 }}
              className="p-8 rounded-[32px] bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 hover:border-green-500/30 transition-all group"
            >
              <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="w-7 h-7 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold mb-4">Eliminating Middlemen</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                We bridge the gap between farm and table, removing predatory wholesalers to ensure farmers keep 100% of their hard-earned profits.
              </p>
            </motion.div>

            <motion.div 
              whileHover={{ y: -10 }}
              className="p-8 rounded-[32px] bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 hover:border-green-500/30 transition-all group"
            >
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BarChart className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-4">AI-Driven Pricing</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                Using Random Forest ML models, we provide real-time, fair market price predictions to prevent exploitation and ensure affordability.
              </p>
            </motion.div>

            <motion.div 
              whileHover={{ y: -10 }}
              className="p-8 rounded-[32px] bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 hover:border-green-500/30 transition-all group"
            >
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-7 h-7 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mb-4">Community Trust</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                Building a transparent ecosystem where every transaction is visible, building long-term trust across all 13 districts.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
