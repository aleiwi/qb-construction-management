/**
 * API Service (QB-main compatible)
 * Uses current project's axios client for all API calls.
 */
import api from '../../api/axios';

// Auth methods
export const login = async (email, password) => {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
};

export const register = async (name, email, password, passwordConfirm) => {
  const { data } = await api.post('/auth/register', { name, email, password, password_confirm: passwordConfirm });
  return data;
};

export const logout = async () => {
  const { data } = await api.post('/auth/logout');
  return data;
};

export const getProfile = async () => {
  const { data } = await api.get('/auth/me');
  return data;
};

export const updateProfile = async (data) => {
  const { data: result } = await api.patch('/auth/me', data);
  return result;
};

export const forgotPassword = async (email) => {
  const { data } = await api.post('/auth/forgot-password', { email });
  return data;
};

export const resetPassword = async (token, password) => {
  const { data } = await api.post('/auth/reset-password', { token, password });
  return data;
};

export const verifyEmail = async (token) => {
  const { data } = await api.post('/auth/verify-email', { token });
  return data;
};

export default { login, register, logout, getProfile, updateProfile, forgotPassword, resetPassword, verifyEmail };
