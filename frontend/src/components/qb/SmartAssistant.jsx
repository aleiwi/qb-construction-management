import React, { useState, useEffect, useRef } from 'react';
import { useLazyImage } from '../../hooks/qb/usePerformance';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaRobot,
  FaMicrophone,
  FaPaperPlane,
  FaHistory,
  FaLightbulb,
  FaChartLine,
  FaCalculator,
  FaFileAlt,
  FaPhone,
  FaBell,
  FaSearch,
  FaClock,
  FaUser,
  FaCog,
  FaVolumeUp,
  FaVolumeMute,
  FaPlay,
  FaPause,
  FaStop,
  FaCamera,
  FaKeyboard,
  FaMagic,
  FaBrain,
  FaGlobe,
  FaCode,
  FaBug
} from 'react-icons/fa';

const SmartAssistant = ({ projects, onAssistantAction }) => {
  const chatRef = useRef(null);
  const avatarRef = useRef(null);
  useLazyImage(avatarRef);
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [quickActions, setQuickActions] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // رسالة ترحيب
    setMessages([
      {
        id: 1,
        type: 'assistant',
        content: 'مرحباً! أنا المساعد الذكي لـ Quantum Build. كيف يمكنني مساعدتك اليوم؟',
        timestamp: new Date(),
        icon: FaRobot
      }
    ]);

    // اقتراحات سريعة
    setSuggestions([
      'أرسل تقرير سريع للمشاريع',
      'احسب تكلفة مشروع جديد',
      'أظهر المشاريع المتأخرة',
      'تحقق من حالة الطقس',
      'اتصل بمقاول الخرسانة'
    ]);

    // إجراءات سريعة
    setQuickActions([
      { id: 1, name: 'إنشاء تقرير', icon: FaFileAlt, action: 'create_report' },
      { id: 2, name: 'حاسبة التكاليف', icon: FaCalculator, action: 'cost_calculator' },
      { id: 3, name: 'مراجعة المشاريع', icon: FaChartLine, action: 'review_projects' },
      { id: 4, name: 'اتصال سريع', icon: FaPhone, action: 'quick_call' },
      { id: 5, name: 'تنبيهات', icon: FaBell, action: 'alerts' },
      { id: 6, name: 'إعدادات', icon: FaCog, action: 'settings' }
    ]);
  }, []);

  const handleSendMessage = (message = currentMessage) => {
    if (!message.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      content: message,
      timestamp: new Date(),
      icon: FaUser
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsThinking(true);

    // محاكاة معالجة المساعد
    setTimeout(() => {
      const assistantResponse = generateResponse(message);
      setMessages(prev => [...prev, assistantResponse]);
      setIsThinking(false);
      
      if (voiceEnabled) {
        speak(assistantResponse.content);
      }
    }, 1500);
  };

  const generateResponse = (message) => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('تقرير') || lowerMessage.includes('report')) {
      return {
        id: messages.length + 2,
        type: 'assistant',
        content: 'سأقوم بإنشاء تقرير شامل للمشاريع. التقرير سيتضمن: الحالة العامة، التقدم، التكاليف، والمخاطر المحتملة. هل تريد تقرير يومي أم أسبوعي؟',
        timestamp: new Date(),
        icon: FaFileAlt,
        actions: ['تقرير يومي', 'تقرير أسبوعي', 'تقرير شهري']
      };
    } else if (lowerMessage.includes('حساب') || lowerMessage.includes('تكلفة') || lowerMessage.includes('cost')) {
      return {
        id: messages.length + 2,
        type: 'assistant',
        content: 'سأفتح لك حاسبة التكاليف الذكية. يمكنني مساعدتك في حساب تكلفة أي مشروع بناء مع مراعاة: مساحة البناء، نوع المواد، العمالة، والأمور التنظيمية.',
        timestamp: new Date(),
        icon: FaCalculator,
        actions: ['فتح الحاسبة', 'مثال حساب', 'تكلفة المواد']
      };
    } else if (lowerMessage.includes('مشاريع') || lowerMessage.includes('تأخر') || lowerMessage.includes('projects')) {
      return {
        id: messages.length + 2,
        type: 'assistant',
        content: 'وجدت 3 مشاريع متأخرة: 1) برج الأعمال (متأخر 5 أيام) 2) الفيلا السكنية (متأخر 3 أيام) 3) مشروع الجسر (متأخر يوم واحد). هل تريد تفاصيل أكثر؟',
        timestamp: new Date(),
        icon: FaChartLine,
        actions: ['تفاصيل برج الأعمال', 'تفاصيل الفيلا', 'خطة التسريع']
      };
    } else if (lowerMessage.includes('طقس') || lowerMessage.includes('weather')) {
      return {
        id: messages.length + 2,
        type: 'assistant',
        content: 'حالة الطقس الحالية: 🌤️ صافي، 32°م. تحذير: رياح قوية متوقعة غداً (65 كم/ساعة). أنصح بتأجيل العمل في الارتفاعات.',
        timestamp: new Date(),
        icon: FaGlobe,
        actions: ['تفاصيل الطقس', 'تحذيرات', 'تأجيل العمل']
      };
    } else if (lowerMessage.includes('اتصال') || lowerMessage.includes('هاتف') || lowerMessage.includes('call')) {
      return {
        id: messages.length + 2,
        type: 'assistant',
        content: 'سأعرض عليك قائمة اتصالات سريعة. من تريد الاتصال به؟ مقاولين، موردين، عملاء، أم فريق العمل؟',
        timestamp: new Date(),
        icon: FaPhone,
        actions: ['مقاولين', 'موردين', 'عملاء', 'فريق العمل']
      };
    } else {
      return {
        id: messages.length + 2,
        type: 'assistant',
        content: 'عذراً، لم أفهم طلبك بوضوح. يمكنني مساعدتك في: إنشاء التقارير، حساب التكاليف، مراجعة المشاريع، حالة الطقس، والاتصالات السريعة. ماذا تريد تحديداً؟',
        timestamp: new Date(),
        icon: FaRobot,
        actions: ['إنشاء تقرير', 'حساب التكلفة', 'مراجعة المشاريع']
      };
    }
  };

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-SA';
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  const startListening = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new webkitSpeechRecognition();
      recognition.lang = 'ar-SA';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setCurrentMessage(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    handleSendMessage(suggestion);
  };

  const handleQuickAction = (action) => {
    onAssistantAction(action);
    
    // إضافة رسالة تأكيد
    const actionMessages = {
      create_report: 'سأقوم بإنشاء تقرير شامل للمشاريع...',
      cost_calculator: 'سأفتح حاسبة التكاليف الذكية...',
      review_projects: 'سأعرض لك مراجعة شاملة للمشاريع...',
      quick_call: 'سأعرض قائمة الاتصالات السريعة...',
      alerts: 'سأعرض التنبيهات والإشعارات...',
      settings: 'سأفتح إعدادات النظام...'
    };
    
    setMessages(prev => [...prev, {
      id: messages.length + 1,
      type: 'assistant',
      content: actionMessages[action] || 'جاري تنفيذ الإجراء...',
      timestamp: new Date(),
      icon: FaCog
    }]);
  };

  if (!isOpen) {
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-full shadow-xl hover:shadow-2xl transition-all z-50"
      >
        <FaRobot className="text-2xl" />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="fixed bottom-6 left-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="bg-white bg-opacity-20 p-2 rounded-lg">
            <FaRobot className="text-xl" />
          </div>
          <div>
            <h3 className="font-bold">المساعد الذكي</h3>
            <p className="text-xs opacity-80">{isThinking ? 'يفكر...' : 'جاهز للمساعدة'}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`p-2 rounded-lg ${voiceEnabled ? 'bg-white bg-opacity-20' : 'bg-gray-500 bg-opacity-50'}`}
          >
            {voiceEnabled ? <FaVolumeUp /> : <FaVolumeMute />}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30"
          >
            ×
          </motion.button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                <div className={`flex items-start space-x-2 space-x-reverse ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  {message.type === 'assistant' && (
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
                      <message.icon className="text-white text-sm" />
                    </div>
                  )}
                  <div className={`rounded-2xl p-3 ${
                    message.type === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                    {message.actions && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {message.actions.map((action, index) => (
                          <motion.button
                            key={index}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleSendMessage(action)}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs hover:bg-blue-200 transition-colors"
                          >
                            {action}
                          </motion.button>
                        ))}
                      </div>
                    )}
                  </div>
                  {message.type === 'user' && (
                    <div className="bg-gray-500 p-2 rounded-lg">
                      <message.icon className="text-white text-sm" />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        {isThinking && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="flex items-center space-x-2 space-x-reverse bg-gray-100 rounded-2xl p-3">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
                <FaRobot className="text-white text-sm" />
              </div>
              <div className="flex space-x-1">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                  className="w-2 h-2 bg-gray-400 rounded-full"
                />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                  className="w-2 h-2 bg-gray-400 rounded-full"
                />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                  className="w-2 h-2 bg-gray-400 rounded-full"
                />
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length === 1 && (
        <div className="p-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-2">اقتراحات سريعة:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs hover:bg-gray-200 transition-colors"
              >
                {suggestion}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {messages.length > 3 && (
        <div className="p-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-2">إجراءات سريعة:</p>
          <div className="grid grid-cols-3 gap-2">
            {quickActions.map((action) => (
              <motion.button
                key={action.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleQuickAction(action.action)}
                className="flex flex-col items-center p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <action.icon className="text-gray-600 text-lg mb-1" />
                <span className="text-xs text-gray-700">{action.name}</span>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center space-x-2 space-x-reverse">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startListening}
            disabled={isListening}
            className={`p-2 rounded-lg transition-colors ${
              isListening 
                ? 'bg-red-500 text-white animate-pulse' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <FaMicrophone />
          </motion.button>
          <input
            type="text"
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="اكتب رسالتك هنا..."
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
            disabled={isThinking}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSendMessage()}
            disabled={!currentMessage.trim() || isThinking}
            className={`p-2 rounded-lg transition-colors ${
              currentMessage.trim() && !isThinking
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <FaPaperPlane />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default SmartAssistant;