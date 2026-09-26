
import React, { useRef } from 'react';
import { FaSearch, FaBell, FaRobot } from 'react-icons/fa';


const Header = ({ title, showAssistant, setShowAssistant }) => {
  const logoRef = useRef(null);
    return (
    <header className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
      <div>
        <h1 className="text-3xl font-extrabold text-[#1F2937] tracking-tight">{title}</h1>
        <p className="text-sm text-gray-500 mt-2 font-medium">نظرة شاملة على أداء مشاريعك اليومية</p>
      </div>
      
      <div className="flex items-center gap-4 w-full md:w-auto">
        <div className="relative flex-1 md:w-72 group">
          <FaSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#8B5CF6] transition-colors" />
          <input 
            type="text" 
            placeholder="بحث سريع..." 
            className="w-full pl-4 pr-11 py-3.5 rounded-2xl bg-white border border-transparent focus:border-[#8B5CF6]/30 shadow-sm focus:shadow-lg focus:shadow-purple-100/50 text-sm focus:ring-0 transition-all outline-none"
          />
        </div>
        
        <button className="p-3.5 rounded-2xl bg-white shadow-sm hover:shadow-md text-gray-500 hover:text-[#8B5CF6] transition-all relative group">
          <FaBell className="text-xl group-hover:animate-swing" />
          <span className="absolute top-3 right-3.5 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white"></span>
        </button>

        <button 
          onClick={() => setShowAssistant(!showAssistant)}
          className={`p-3.5 rounded-2xl shadow-sm hover:shadow-md transition-all ${showAssistant ? 'bg-[#8B5CF6] text-white shadow-purple-200' : 'bg-white text-gray-500 hover:text-[#8B5CF6]'}`}
        >
          <FaRobot className="text-xl" />
        </button>
      </div>
    </header>
  );
};

export default Header;
