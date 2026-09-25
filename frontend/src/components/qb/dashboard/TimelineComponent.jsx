
import React from 'react';
import { motion } from 'framer-motion';
import { FaFlagCheckered, FaHardHat, FaLayerGroup, FaPaintRoller } from 'react-icons/fa';

const PHASES = [
  { id: 1, title: 'التخطيط والأساسات', icon: FaLayerGroup, color: 'bg-blue-500', date: 'شهر 1-2' },
  { id: 2, title: 'الهيكل العظمي', icon: FaHardHat, color: 'bg-orange-500', date: 'شهر 3-5' },
  { id: 3, title: 'التشطيبات', icon: FaPaintRoller, color: 'bg-purple-500', date: 'شهر 6-8' },
  { id: 4, title: 'التسليم', icon: FaFlagCheckered, color: 'bg-emerald-500', date: 'شهر 9' },
];

const TimelineComponent = ({ currentPhase = 1, onPhaseChange, phases }) => {
  const activePhases = phases || PHASES;

  return (
    <div className="w-full py-8 px-6" dir="rtl">
      {/* Container with horizontal scroll but hidden scrollbar */}
      <div className="overflow-x-auto pb-4 hide-scrollbar">
        <div className="flex items-center justify-between relative min-w-[600px] px-10">
            
            {/* Background Line */}
            <div className="absolute top-6 left-10 right-10 h-1 bg-gray-100 rounded-full -z-10" />
            
            {/* Active Progress Line */}
            <div 
                className="absolute top-6 right-10 h-1 bg-gradient-to-l from-blue-600 to-purple-600 rounded-full -z-10 transition-all duration-1000 ease-out"
                style={{ 
                    width: `calc(${((currentPhase - 1) / (activePhases.length - 1)) * 100}% - 2.5rem)` 
                }}
            />

            {activePhases.map((phase, index) => {
            const isActive = phase.id === currentPhase;
            const isCompleted = phase.id < currentPhase;

            return (
                <div 
                    key={phase.id} 
                    onClick={() => onPhaseChange && onPhaseChange(phase.id)}
                    className={`flex flex-col items-center relative group ${onPhaseChange ? 'cursor-pointer' : 'cursor-default'}`}
                >
                {/* Icon Circle */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.15 }}
                    className={`
                        w-14 h-14 rounded-full flex items-center justify-center text-xl shadow-lg border-4 transition-all duration-500 z-10
                        ${isCompleted 
                            ? 'bg-emerald-500 border-white text-white shadow-emerald-200' 
                            : isActive 
                                ? 'bg-blue-600 border-blue-100 text-white shadow-blue-200 scale-110' 
                                : 'bg-white border-gray-100 text-gray-300 group-hover:border-blue-200'}
                    `}
                >
                    <phase.icon />
                </motion.div>

                {/* Text Label */}
                <div className={`mt-4 text-center transition-colors duration-300 ${isActive ? 'opacity-100 transform translate-y-0' : 'opacity-70 group-hover:opacity-100'}`}>
                    <h4 className={`font-bold text-sm mb-1 whitespace-nowrap ${isActive ? 'text-blue-700' : 'text-gray-500 group-hover:text-blue-500'}`}>
                        {phase.title}
                    </h4>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${isActive ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400'}`}>
                        {phase.date}
                    </span>
                </div>
                </div>
            );
            })}
        </div>
      </div>
      
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default TimelineComponent;
