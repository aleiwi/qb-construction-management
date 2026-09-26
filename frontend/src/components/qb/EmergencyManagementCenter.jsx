import React, { useState, useEffect } from 'react';
import { useLazyImage } from "../../hooks/qb/usePerformance";
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaShieldAlt,
  FaExclamationTriangle,
  FaPhone,
  FaUsers,
  FaTools,
  FaMapMarkedAlt,
  FaClock,
  FaBell,
  FaFire,
  FaWind,
  FaCloudRain,
  FaThermometerHalf,
  FaVirus,
  FaGasPump,
  FaRadiationAlt,
  FaPowerOff,
  FaWrench,
  FaCar,
  FaHospital,
  FaAmbulance,
  FaVideo,
  FaMicrophone,
  FaLocationArrow,
  FaStopCircle,
  FaPlayCircle,
  FaPauseCircle
} from 'react-icons/fa';

const EmergencyManagementCenter = ({ projects, onEmergencyAction }) => {
  const [emergencyLevel, setEmergencyLevel] = useState('آمن'); // آمن، حذر، طوارئ
  const [activeEmergencies, setActiveEmergencies] = useState([]);
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [weatherAlert, setWeatherAlert] = useState(null);
  const [isPanicMode, setIsPanicMode] = useState(false);

  // محاكاة بيانات الطوارئ
  useEffect(() => {
    const sampleEmergencies = [
      {
        id: 1,
        type: 'تحذير طقس',
        title: 'رياح قوية متوقعة',
        description: 'رياح بسرعة 65 كم/ساعة متوقعة اليوم',
        level: 'متوسط',
        affectedProjects: ['برج الأعمال التجاري', 'فيلا سكنية - الرياض'],
        actions: ['تأجيل العمل في الارتفاعات', 'تأمين المعدات'],
        icon: FaWind,
        color: 'orange',
        time: '10:30',
        status: 'نشط'
      },
      {
        id: 2,
        type: 'حادث سلامة',
        title: 'إصابة عامل',
        description: 'إصابة طفيفة في موقع برج سكني',
        level: 'عالي',
        affectedProjects: ['برج سكني - الدمام'],
        actions: ['إيقاف فوري للعمل', 'استدعاء الإسعاف', 'إبلاغ الجهات المختصة'],
        icon: FaExclamationTriangle,
        color: 'red',
        time: '14:15',
        status: 'قيد المعالجة'
      }
    ];

    const sampleContacts = [
      { id: 1, name: 'الإسعاف', number: '997', icon: FaAmbulance, color: 'red' },
      { id: 2, name: 'الشرطة', number: '999', icon: FaShieldAlt, color: 'blue' },
      { id: 3, name: 'الدفاع المدني', number: '998', icon: FaFire, color: 'orange' },
      { id: 4, name: 'فريق الطوارئ', number: '055-123-4567', icon: FaUsers, color: 'green' },
      { id: 5, name: 'مقاول السلامة', number: '055-987-6543', icon: FaShieldAlt, color: 'purple' }
    ];

    const sampleWeather = {
      condition: 'رياح قوية',
      temperature: '38°',
      humidity: '25%',
      windSpeed: '65 كم/ساعة',
      warnings: ['رياح قوية', 'عواصف رملية', 'حرارة مرتفعة']
    };

    setActiveEmergencies(sampleEmergencies);
    setEmergencyContacts(sampleContacts);
    setWeatherAlert(sampleWeather);
  }, []);

  const triggerEmergency = (type) => {
    setIsPanicMode(true);
    // محاكاة إرسال تنبيهات الطوارئ
    setTimeout(() => {
      setIsPanicMode(false);
    }, 3000);
  };

  const getEmergencyLevelColor = (level) => {
    const levels = {
      'آمن': 'text-green-600 bg-green-100',
      'حذر': 'text-yellow-600 bg-yellow-100', 
      'طوارئ': 'text-red-600 bg-red-100'
    };
    return levels[level] || levels['آمن'];
  };

  const getEmergencyTypeColor = (color) => {
    const colors = {
      red: 'from-red-500 to-red-600',
      orange: 'from-orange-500 to-orange-600',
      yellow: 'from-yellow-500 to-yellow-600',
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      purple: 'from-purple-500 to-purple-600'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
      {/* Emergency Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className={`p-3 rounded-xl ${getEmergencyLevelColor(emergencyLevel).includes('green') ? 'bg-green-100' : 
            emergencyLevel === 'حذر' ? 'bg-yellow-100' : 'bg-red-100'}`}>
            <FaShieldAlt className={`text-2xl ${emergencyLevel === 'آمن' ? 'text-green-600' : 
              emergencyLevel === 'حذر' ? 'text-yellow-600' : 'text-red-600'}`} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">مركز إدارة الطوارئ</h2>
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="text-gray-600">مستوى الطوارئ:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${getEmergencyLevelColor(emergencyLevel)}`}>
                {emergencyLevel}
              </span>
            </div>
          </div>
        </div>

        {/* Panic Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => triggerEmergency('panic')}
          disabled={isPanicMode}
          className={`flex items-center space-x-3 space-x-reverse px-6 py-3 rounded-xl font-bold text-white transition-all ${
            isPanicMode ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 animate-pulse'
          }`}
        >
          <FaExclamationTriangle />
          <span>{isPanicMode ? 'جاري الإرسال...' : 'طوارئ فوري'}</span>
        </motion.button>
      </div>

      {/* Weather Alert */}
      {weatherAlert && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-4 mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 space-x-reverse">
              <FaWind className="text-orange-500 text-2xl" />
              <div>
                <h3 className="font-semibold text-orange-900">تحذير طقس</h3>
                <p className="text-orange-700">{weatherAlert.condition} - {weatherAlert.windSpeed}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-orange-800 font-bold">{weatherAlert.temperature}</p>
              <p className="text-orange-600 text-sm">الرطوبة: {weatherAlert.humidity}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {weatherAlert.warnings.map((warning, index) => (
              <span key={index} className="px-2 py-1 bg-orange-200 text-orange-800 rounded-lg text-xs">
                {warning}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { name: 'إيقاف العمل', icon: FaPauseCircle, color: 'red', action: 'stop_work' },
          { name: 'إخلاء الموقع', icon: FaUsers, color: 'orange', action: 'evacuate' },
          { name: 'استدعاء المساعدة', icon: FaPhone, color: 'blue', action: 'call_help' },
          { name: 'توثيق الحالة', icon: FaVideo, color: 'green', action: 'document' }
        ].map((action, index) => (
          <motion.button
            key={index}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onEmergencyAction(action.action)}
            className={`bg-gradient-to-r ${getEmergencyTypeColor(action.color)} text-white p-4 rounded-xl font-medium hover:shadow-lg transition-all`}
          >
            <action.icon className="text-2xl mx-auto mb-2" />
            <span className="text-sm">{action.name}</span>
          </motion.button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Active Emergencies */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">الطوارئ النشطة</h3>
          <div className="space-y-3">
            <AnimatePresence>
              {activeEmergencies.map((emergency, index) => (
                <motion.div
                  key={emergency.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-white border-2 border-${emergency.color === 'red' ? 'red' : 'orange'}-200 rounded-xl p-4 hover:shadow-lg transition-all`}
                >
                  <div className="flex items-start space-x-3 space-x-reverse">
                    <div className={`bg-gradient-to-r ${getEmergencyTypeColor(emergency.color)} p-2 rounded-lg`}>
                      <emergency.icon className="text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{emergency.title}</h4>
                        <span className="text-xs text-gray-500">{emergency.time}</span>
                      </div>
                      <p className="text-gray-600 text-sm mb-2">{emergency.description}</p>
                      <div className="flex items-center space-x-2 space-x-reverse mb-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          emergency.level === 'عالي' ? 'bg-red-100 text-red-800' :
                          emergency.level === 'متوسط' ? 'bg-orange-100 text-orange-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {emergency.level}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          emergency.status === 'نشط' ? 'bg-green-100 text-green-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {emergency.status}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">الإجراءات المطلوبة:</p>
                        {emergency.actions.map((action, actionIndex) => (
                          <p key={actionIndex} className="text-xs text-gray-700">• {action}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Emergency Contacts */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">جهات الاتصال الطارئة</h3>
          <div className="space-y-3">
            {emergencyContacts.map((contact, index) => (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className={`bg-gradient-to-r ${getEmergencyTypeColor(contact.color)} p-2 rounded-lg`}>
                      <contact.icon className="text-white text-sm" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{contact.name}</p>
                      <p className="text-gray-600 text-sm">{contact.number}</p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => window.open(`tel:${contact.number}`)}
                    className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <FaPhone />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Live Monitoring */}
          <div className="mt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">المراقبة المباشرة</h3>
            <div className="space-y-3">
              {[
                { name: 'المراقبة الأمنية', status: 'نشط', count: '12 كاميرا', icon: FaVideo },
                { name: 'إشارات السلامة', status: 'طبيعي', count: '8 أجهزة', icon: FaBell },
                { name: 'الطقس المباشر', status: 'تحذير', count: 'حالة طقس', icon: FaCloudRain },
                { name: 'المراقبة البيئية', status: 'طبيعي', count: '6 أجهزة', icon: FaThermometerHalf }
              ].map((monitor, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <monitor.icon className="text-gray-600" />
                      <span className="text-sm font-medium text-gray-900">{monitor.name}</span>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-medium ${
                        monitor.status === 'نشط' || monitor.status === 'طبيعي' ? 'text-green-600' :
                        monitor.status === 'تحذير' ? 'text-orange-600' : 'text-red-600'
                      }`}>
                        {monitor.status}
                      </p>
                      <p className="text-xs text-gray-500">{monitor.count}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyManagementCenter;