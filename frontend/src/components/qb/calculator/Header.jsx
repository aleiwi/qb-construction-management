import React from 'react';
import { FaAtom, FaLightbulb, FaCompress, FaExpand } from 'react-icons/fa';

const Header = ({ darkMode, setDarkMode, isFullscreen, setIsFullscreen }) => (
  <header
    className={`relative overflow-hidden ${
      darkMode ? "bg-gray-900" : "bg-gradient-to-r from-blue-50 to-purple-50"
    } p-8 shadow-2xl`}
  >
    {/* Background Animation */}
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-2000"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-green-500 to-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-4000"></div>
    </div>

    <div className="relative z-10 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-xl opacity-75 animate-pulse"></div>
            <div className="relative bg-gradient-to-r from-blue-600 to-purple-700 p-4 rounded-full shadow-2xl">
              <FaAtom className="text-white text-3xl" />
            </div>
          </div>
          <div>
            <h1
              className={`text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent ${
                darkMode ? "" : "text-gray-800"
              }`}
            >
              Quantum Build Pro
            </h1>
            <p
              className={`text-lg ${
                darkMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              منصة البناء الذكية المتقدمة
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4 space-x-reverse">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-3 rounded-xl transition-all duration-300 ${
              darkMode
                ? "bg-yellow-400 text-gray-900 hover:bg-yellow-300"
                : "bg-gray-800 text-yellow-400 hover:bg-gray-700"
            }`}
          >
            {darkMode ? <FaLightbulb /> : <FaLightbulb />}
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={`p-3 rounded-xl transition-all duration-300 ${
              darkMode
                ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            {isFullscreen ? <FaCompress /> : <FaExpand />}
          </button>
        </div>
      </div>
    </div>
  </header>
);

export default Header;
