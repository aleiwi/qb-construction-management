
import React, { useState } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  parseISO,
  isValid
} from 'date-fns';
import { arSA } from 'date-fns/locale'; // Arabic locale
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronLeft, FaChevronRight, FaCalendarAlt } from 'react-icons/fa';

const CalendarView = ({ projects, onView }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  // Generate calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 6 }); // Saturday start for Arabic
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 6 });

  const dateFormat = "d";
  const days = eachDayOfInterval({
    start: startDate,
    end: endDate
  });

  const weekDays = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

  // Helper to find projects for a day
  const getProjectsForDay = (day) => {
    return projects.filter(p => {
        if (!p.end_date && !p.deadline) return false;
        const dateStr = p.end_date || p.deadline;
        const date = parseISO(dateStr);
        return isValid(date) && isSameDay(date, day);
    });
  };

  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="p-6 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#8B5CF6]/10 flex items-center justify-center text-[#8B5CF6]">
            <FaCalendarAlt size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {format(currentMonth, 'MMMM yyyy', { locale: arSA })}
            </h2>
            <p className="text-gray-400 text-sm">جدول تسليم المشاريع</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl">
          <button onClick={prevMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-gray-600 transition-all">
            <FaChevronRight />
          </button>
          <button onClick={goToToday} className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-white hover:shadow-sm rounded-lg transition-all">
            اليوم
          </button>
          <button onClick={nextMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-gray-600 transition-all">
            <FaChevronLeft />
          </button>
        </div>
      </div>

      {/* Week Days Header */}
      <div className="grid grid-cols-7 bg-gray-50/50 border-b border-gray-100">
        {weekDays.map(day => (
          <div key={day} className="py-4 text-center font-bold text-gray-400 text-sm">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 flex-1 min-h-[600px] overflow-y-auto">
        {days.map((day, dayIdx) => {
            const dayProjects = getProjectsForDay(day);
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isToday = isSameDay(day, new Date());

            return (
                <div 
                    key={day.toString()} 
                    className={`
                        min-h-[120px] border-b border-l border-gray-50 p-2 transition-colors hover:bg-gray-50/30 relative group
                        ${!isCurrentMonth ? 'bg-gray-50/30 text-gray-300' : 'bg-white'}
                    `}
                    onClick={() => setSelectedDate(day)}
                >
                    <div className={`
                        w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold mb-2
                        ${isToday ? 'bg-[#8B5CF6] text-white shadow-md shadow-purple-200' : 'text-gray-500'}
                    `}>
                        {format(day, dateFormat)}
                    </div>

                    <div className="space-y-1">
                        {dayProjects.map((project, idx) => (
                            <motion.div
                                key={project.id}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onView(project.id);
                                }}
                                className={`
                                    text-[10px] px-2 py-1.5 rounded-lg border-r-2 cursor-pointer truncate shadow-sm hover:shadow-md transition-all
                                    ${project.status === 'مكتمل' ? 'bg-green-50 border-green-500 text-green-700' : 
                                      project.status === 'معلق' ? 'bg-orange-50 border-orange-400 text-orange-700' : 
                                      'bg-blue-50 border-blue-500 text-blue-700'}
                                `}
                            >
                                {project.name}
                            </motion.div>
                        ))}
                        {dayProjects.length > 3 && (
                            <div className="text-[10px] text-center text-gray-400 font-medium">
                                +{dayProjects.length - 3} المزيد
                            </div>
                        )}
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
};

export default CalendarView;
