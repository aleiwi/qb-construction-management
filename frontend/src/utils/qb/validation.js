/**
 * Validation utilities for authentication forms
 */

// Email regex validation
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Phone regex validation (International format starting with +)
export const isValidPhone = (phone) => {
  // Allows + followed by 10 to 15 digits
  const phoneRegex = /^\+\d{10,15}$/;
  return phoneRegex.test(phone);
};

// Password validation (min 6 chars, can be extended for complexity)
export const isValidPassword = (password) => {
  return password && password.length >= 6;
};

// Check if string is empty or just whitespace
export const isEmpty = (str) => {
  return !str || str.trim().length === 0;
};

// OTP validation (must be exactly 6 digits)
export const isValidOTP = (otp) => {
  const otpRegex = /^\d{6}$/;
  return otpRegex.test(otp);
};
