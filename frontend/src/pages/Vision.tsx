import { motion } from 'framer-motion';
import { Eye, Globe, Zap, Leaf } from 'lucide-react';
import Footer from '../components/Footer';

export default function Vision() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 bg-white dark:bg-[#051f1c] text-gray-900 dark:text-white transition-colors duration-500 relative overflow-hidden">
        
        {/* Background Grid */}
        <div className="absolute inset-0 grid-pattern opacity-30 dark:opacity-20 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 py-16 relative z-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-6">
              <Eye className="w-4 h-4" /> Our Vision
            </div>
            <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">
              A Future of <br/> <span className="text-blue-600 dark:text-[#60a5fa]">Direct Market</span> Access
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
              We envision a world where technology completely decentralizes the food supply chain, making fresh, healthy produce accessible to all while securing the future of our farmers.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="relative p-10 rounded-[32px] bg-gradient-to-br from-green-500/5 to-blue-500/5 border border-white/10 overflow-hidden group"
            >
              <Globe className="absolute -bottom-10 -right-10 w-48 h-48 text-green-500/10 transition-transform group-hover:scale-110" />
              <Zap className="w-12 h-12 text-yellow-500 mb-8" />
              <h3 className="text-3xl font-black mb-6">Digital Transparency</h3>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-lg">
                Imagine a market where you know exactly where your food comes from, when it was harvested, and the exact price the farmer received. That is the transparency we are building.
              </p>
            </motion.div>

            <motion.div 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="relative p-10 rounded-[32px] bg-gradient-to-br from-purple-500/5 to-pink-500/5 border border-white/10 overflow-hidden group"
            >
              <Leaf className="absolute -bottom-10 -right-10 w-48 h-48 text-purple-500/10 transition-transform group-hover:scale-110" />
              <div className="w-12 h-12 bg-white dark:bg-white/10 rounded-2xl flex items-center justify-center mb-8">
                <Leaf className="w-7 h-7 text-green-500" />
              </div>
              <h3 className="text-3xl font-black mb-6">Zero Local Spoilage</h3>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-lg">
                Our vision is to eliminate crop spoilage through hyper-local logistics, ensuring that no harvest goes to waste and every farmer is rewarded for their labor.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
