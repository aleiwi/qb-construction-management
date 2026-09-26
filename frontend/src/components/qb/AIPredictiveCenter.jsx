import React, { useState, useRef, useEffect } from 'react';
import { useLazyImage } from "../../hooks/qb/usePerformance";
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaBrain,
  FaExclamationTriangle,
  FaChartLine,
  FaClock,
  FaDollarSign,
  FaTools,
  FaEye,
  FaCog,
  FaArrowUp,
  FaArrowDown,
  FaMinus,
  FaBell,
  FaRobot,
  FaMagic,
  FaBolt,
  FaShieldAlt,
  FaHeart,
  FaChartBar,
  FaLightbulb
} from 'react-icons/fa';

const AIPredictiveCenter = ({ projects, onPredictiveAction }) => {
  const [predictions, setPredictions] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedPrediction, setSelectedPrediction] = useState(null);

  // محاكاة بيانات التنبؤات الذكية
  const generatePredictions = () => {
    const samplePredictions = [
      {
        id: 1,
        type: "توقع تأخير المشروع",
        project: "برج الأعمال التجاري",
        probability: 75,
        impact: "عالي",
        daysImpact: "3-5 أيام",
        cause: "تأخير في وصول المواد الأساسية",
        recommendation: "طلب مواد إضافية من مورد بديل",
        urgency: "عاجل",
        icon: FaClock,
        color: "red",
        trend: "up",
        confidence: 85
      },
      {
        id: 2,
        type: "تحذير تجاوز الميزانية", 
        project: "فيلا سكنية - الرياض",
        probability: 60,
        impact: "متوسط",
        amountImpact: "8% من الميزانية",
        cause: "ارتفاع أسعار الخرسانة",
        recommendation: "إعادة التفاوض مع الموردين",
        urgency: "متوسط",
        icon: FaDollarSign,
        color: "orange",
        trend: "up",
        confidence: 72
      },
      {
        id: 3,
        type: "تقييم جودة الخرسانة",
        project: "مشروع الجسر الجديد",
        probability: 40,
        impact: "عالي",
        daysImpact: "قد يتطلب إعادة الصب",
        cause: "اختلاف في درجة الحرارة والرطوبة",
        recommendation: "فحص فوري للمواد وإجراءات الحماية",
        urgency: "عاجل جداً",
        icon: FaTools,
        color: "purple",
        trend: "stable",
        confidence: 91
      },
      {
        id: 4,
        type: "توقع زيادة الإنتاجية",
        project: "مجمع المحلات التجارية",
        probability: 80,
        impact: "إيجابي",
        improvement: "15% تحسن في الأداء",
        cause: "تحسين سير العمل والتقنيات الجديدة",
        recommendation: "توسيع الفريق وتحسين العمليات",
        urgency: "فرصة",
        icon: FaChartBar,
        color: "green",
        trend: "up",
        confidence: 88
      },
      {
        id: 5,
        type: "تحذير سلامة المهنيين",
        project: "مشروع برج سكني",
        probability: 30,
        impact: "حرج",
        daysImpact: "إيقاف فوري للعمل",
        cause: "توقع هطول أمطار غزيرة ورياح قوية",
        recommendation: "تطبيق إجراءات السلامة الطارئة",
        urgency: "عاجل جداً",
        icon: FaShieldAlt,
        color: "red",
        trend: "down",
        confidence: 94
      }
    ];
    setPredictions(samplePredictions);
  };

  useEffect(() => {
    generatePredictions();
  }, []);

  const analyzeNew = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      generatePredictions();
      setIsAnalyzing(false);
    }, 2000);
  };

  const getColorClasses = (color, intensity = 'normal') => {
    const colors = {
      red: {
        normal: 'from-red-500 to-red-600',
        light: 'bg-red-100 text-red-800',
        border: 'border-red-200'
      },
      orange: {
        normal: 'from-orange-500 to-orange-600',
        light: 'bg-orange-100 text-orange-800', 
        border: 'border-orange-200'
      },
      purple: {
        normal: 'from-purple-500 to-purple-600',
        light: 'bg-purple-100 text-purple-800',
        border: 'border-purple-200'
      },
      green: {
        normal: 'from-green-500 to-green-600',
        light: 'bg-green-100 text-green-800',
        border: 'border-green-200'
      }
    };
    return colors[color]?.[intensity] || colors.red[intensity];
  };

  const getUrgencyClasses = (urgency) => {
    const urgencies = {
      'عاجل جداً': 'bg-red-100 text-red-800 border-red-300',
      'عاجل': 'bg-orange-100 text-orange-800 border-orange-300',
      'متوسط': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'فرصة': 'bg-green-100 text-green-800 border-green-300'
    };
    return urgencies[urgency] || urgencies['متوسط'];
  };

  const getTrendIcon = (trend) => {
    switch(trend) {
      case 'up': return <FaArrowUp className="text-green-500" />;
      case 'down': return <FaArrowDown className="text-red-500" />;
      case 'stable': return <FaMinus className="text-gray-500" />;
      default: return <FaMinus className="text-gray-500" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl">
            <FaBrain className="text-white text-2xl" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">مركز التنبؤات الذكية</h2>
            <p className="text-gray-600">تحليل ذكي للمخاطر والفرص</p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={analyzeNew}
          disabled={isAnalyzing}
          className={`flex items-center space-x-2 space-x-reverse px-6 py-3 rounded-xl font-medium transition-all ${
            isAnalyzing 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'
          }`}
        >
          <FaRobot className={isAnalyzing ? 'animate-spin' : ''} />
          <span>{isAnalyzing ? 'جاري التحليل...' : 'تحليل جديد'}</span>
        </motion.button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">إجمالي التنبؤات</p>
              <p className="text-2xl font-bold text-blue-900">{predictions.length}</p>
            </div>
            <FaChartLine className="text-blue-500 text-2xl" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-600 text-sm font-medium">تحذيرات عاجلة</p>
              <p className="text-2xl font-bold text-red-900">
                {predictions.filter(p => p.urgency === 'عاجل جداً' || p.urgency === 'عاجل').length}
              </p>
            </div>
            <FaExclamationTriangle className="text-red-500 text-2xl" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">فرص التحسين</p>
              <p className="text-2xl font-bold text-green-900">
                {predictions.filter(p => p.impact === 'إيجابي' || p.type.includes('زيادة')).length}
              </p>
            </div>
            <FaLightbulb className="text-green-500 text-2xl" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">معدل الثقة</p>
              <p className="text-2xl font-bold text-purple-900">
                {Math.round(predictions.reduce((acc, p) => acc + p.confidence, 0) / predictions.length)}%
              </p>
            </div>
            <FaBolt className="text-purple-500 text-2xl" />
          </div>
        </div>
      </div>

      {/* Predictions List */}
      <div className="space-y-4">
        <AnimatePresence>
          {predictions.map((prediction, index) => (
            <motion.div
              key={prediction.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-white border-2 ${getColorClasses(prediction.color, 'border')} rounded-xl p-5 hover:shadow-lg transition-all cursor-pointer`}
              onClick={() => setSelectedPrediction(prediction)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 space-x-reverse">
                  <div className={`bg-gradient-to-r ${getColorClasses(prediction.color, 'normal')} p-3 rounded-xl`}>
                    <prediction.icon className="text-white text-xl" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 space-x-reverse mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{prediction.type}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getUrgencyClasses(prediction.urgency)}`}>
                        {prediction.urgency}
                      </span>
                      {getTrendIcon(prediction.trend)}
                    </div>
                    <p className="text-gray-700 font-medium mb-2">المشروع: {prediction.project}</p>
                    <div className="flex items-center space-x-6 space-x-reverse text-sm">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <FaChartBar className="text-gray-500" />
                        <span>الاحتمالية: <strong>{prediction.probability}%</strong></span>
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <FaHeart className="text-gray-500" />
                        <span>الثقة: <strong>{prediction.confidence}%</strong></span>
                      </div>
                      {prediction.impact && (
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <FaShieldAlt className="text-gray-500" />
                          <span>الأثر: <strong>{prediction.impact}</strong></span>
                        </div>
                      )}
                    </div>
                    <p className="text-gray-600 mt-2 text-sm">السبب: {prediction.cause}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onPredictiveAction(prediction);
                    }}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-600 hover:to-purple-700 transition-all"
                  >
                    <FaCog className="inline ml-1" />
                    تنفيذ التوصية
                  </motion.button>
                  <div className="text-right">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <motion.div 
                        className={`bg-gradient-to-r ${getColorClasses(prediction.color, 'normal')} h-2 rounded-full`}
                        initial={{ width: 0 }}
                        animate={{ width: `${prediction.probability}%` }}
                        transition={{ delay: index * 0.1 + 0.5, duration: 0.8 }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{prediction.probability}%</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Detailed View Modal */}
      <AnimatePresence>
        {selectedPrediction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedPrediction(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className={`bg-gradient-to-r ${getColorClasses(selectedPrediction.color, 'normal')} p-3 rounded-xl`}>
                    <selectedPrediction.icon className="text-white text-2xl" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{selectedPrediction.type}</h3>
                    <p className="text-gray-600">{selectedPrediction.project}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPrediction(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-600">الاحتمالية</p>
                    <p className="text-2xl font-bold text-gray-900">{selectedPrediction.probability}%</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-600">مستوى الثقة</p>
                    <p className="text-2xl font-bold text-gray-900">{selectedPrediction.confidence}%</p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
                  <h4 className="font-semibold text-blue-900 mb-2">السبب التحليلي</h4>
                  <p className="text-blue-800">{selectedPrediction.cause}</p>
                </div>

                <div className="bg-green-50 border border-green-200 p-4 rounded-xl">
                  <h4 className="font-semibold text-green-900 mb-2">التوصية المقترحة</h4>
                  <p className="text-green-800">{selectedPrediction.recommendation}</p>
                </div>

                {selectedPrediction.daysImpact && (
                  <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl">
                    <h4 className="font-semibold text-orange-900 mb-2">التأثير المتوقع</h4>
                    <p className="text-orange-800">{selectedPrediction.daysImpact}</p>
                  </div>
                )}

                <div className="flex space-x-4 space-x-reverse">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      onPredictiveAction(selectedPrediction);
                      setSelectedPrediction(null);
                    }}
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl font-medium hover:from-green-600 hover:to-green-700 transition-all"
                  >
                    <FaCog className="inline ml-2" />
                    تنفيذ التوصية
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedPrediction(null)}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-300 transition-all"
                  >
                    إغلاق
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIPredictiveCenter;