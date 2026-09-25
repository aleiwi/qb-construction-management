import React from 'react';

export const handleNumericInput = (e) => {
  const char = String.fromCharCode(e.which);
  const value = e.target.value;

  if (!/[0-9.]/.test(char) && e.which !== 8 && e.which !== 0) {
    e.preventDefault();
    return;
  }

  if (char === "." && value.includes(".")) {
    e.preventDefault();
    return;
  }
};

const CalculatorInput = ({
  label,
  value,
  onChange,
  placeholder,
  icon,
  error,
  type = "text",
  inputMode = "text",
  darkMode = false,
}) => {
  return (
    <div className="relative group">
      <label
        className={`block text-sm font-medium mb-2 transition-colors group-hover:text-blue-400 ${
          darkMode ? "text-gray-300" : "text-gray-700"
        }`}
      >
        <span className="inline-flex items-center">
          <span className="mr-2">{icon}</span>
          {label}
        </span>
      </label>
      <div className="relative">
        <input
          type={type}
          inputMode={inputMode}
          value={value}
          onChange={onChange}
          onKeyPress={inputMode === "decimal" ? handleNumericInput : undefined}
          className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:outline-none focus:ring-2 ${
            error
              ? "border-red-500 ring-red-500"
              : `focus:ring-blue-500 group-hover:border-blue-400 ${
                  darkMode ? "border-gray-600" : "border-gray-300"
                }`
          } ${
            darkMode ? "bg-gray-700/50 text-white" : "bg-white text-gray-900"
          }`}
          placeholder={placeholder}
        />
        {error && (
          <div className="absolute -bottom-5 right-0 text-xs text-red-500">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default CalculatorInput;
