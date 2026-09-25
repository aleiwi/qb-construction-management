
import React from 'react';

const StatRow = ({ icon: Icon, color, label, value, total }) => {
    const percentage = total ? Math.round((value / total) * 100) : 0;
    const colorClasses = {
        blue: 'bg-blue-100 text-blue-600',
        emerald: 'bg-emerald-100 text-emerald-600',
        orange: 'bg-orange-100 text-orange-600'
    };
    const textColors = {
        blue: 'text-blue-600',
        emerald: 'text-emerald-600',
        orange: 'text-orange-600'
    };

    return (
        <div className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-gray-50 transition-colors cursor-default group">
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${colorClasses[color]} group-hover:scale-110 transition-transform`}>
                    <Icon />
                </div>
                <div>
                    <p className="font-bold text-gray-800 text-lg">{value}</p>
                    <p className="text-xs text-gray-400 font-medium">{label}</p>
                </div>
            </div>
            <div className="text-right">
                 <span className={`${textColors[color]} font-bold text-lg`}>{percentage}%</span>
            </div>
        </div>
    );
};

export default StatRow;
