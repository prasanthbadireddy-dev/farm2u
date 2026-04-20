import { Link } from 'react-router-dom';
import { Globe, MessageSquare, Linkedin, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#0b2b20] dark:bg-[#051f1c] border-t border-white/5 py-16 px-10 transition-colors duration-500">
      <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-12 text-white">
        
        <div>
          <h4 className="text-[10px] font-bold text-white uppercase tracking-widest mb-6 py-1 border-b border-white/10 w-max pb-3">Get to know us</h4>
          <ul className="space-y-4 text-sm text-gray-400">
            <li><a href="/#about" className="hover:text-green-400 transition-colors">About This Platform</a></li>
            <li><Link to="/mission" className="hover:text-green-400 transition-colors">Our Mission</Link></li>
            <li><Link to="/vision" className="hover:text-green-400 transition-colors">Our Vision</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-[10px] font-bold text-white uppercase tracking-widest mb-6 py-1 border-b border-white/10 w-max pb-3">Platform Links</h4>
          <ul className="space-y-4 text-sm text-gray-400">
            <li><Link to="/home" className="hover:text-green-400 transition-colors">Live Market Map</Link></li>
            <li><Link to="/farmer/login" className="hover:text-green-400 transition-colors">Farmer Portal</Link></li>
            <li><Link to="/consumer/login" className="hover:text-green-400 transition-colors">Consumer Portal</Link></li>
            <li><a href="#" className="hover:text-green-400 transition-colors">AI Price Predictor</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-[10px] font-bold text-white uppercase tracking-widest mb-6 py-1 border-b border-white/10 w-max pb-3">Coverage & Contact</h4>
           <ul className="space-y-4 text-sm text-gray-400">
            <li className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#16a34a]" /> 13 Districts of Andhra Pradesh
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
          <h4 className="text-[10px] font-bold text-white uppercase tracking-widest mb-6 py-1 border-b border-white/10 w-max pb-3">Engineering Team</h4>
          <ul className="space-y-4 text-sm text-gray-400">
             {[
               { name: 'Devi Prasanth Badireddy', email: 'prasanthbadireddy@gmail.com' },
               { name: 'Jeeshan Agastya', email: 'agastyajeeshan@gmail.com' },
               { name: 'Farhat Yasmin', email: 'mdyasminfarhat@gmail.com' },
               { name: 'Manoj Reddy Baki', email: 'manojreddybaki@gmail.com' },
               { name: 'Dinesh Chitturu', email: 'dineshchitturu2005@gmail.com' }
             ].map(member => (
               <li key={member.name}>
                 <a href={`https://mail.google.com/mail/?view=cm&fs=1&to=${member.email}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition-colors group">
                   <Mail className="w-4 h-4 text-blue-500 group-hover:text-blue-400" /> {member.name}
                 </a>
               </li>
             ))}
          </ul>
        </div>

      </div>
    </footer>
  );
}
