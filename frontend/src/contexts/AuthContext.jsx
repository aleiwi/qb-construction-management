import React, { createContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [userContext, setUserContext] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchContext = useCallback(async () => {
    try {
      const res = await api.get('/auth/me/context');
      if (res?.data?.success) {
        setUserContext(res.data.data);
      }
    } catch {
      setUserContext(null);
    }
  }, []);

  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res?.data?.success) {
            setUser(res.data.data);
            localStorage.setItem('user', JSON.stringify(res.data.data));
            await fetchContext();
          } else {
            logout();
          }
        } catch (err) {
          console.error("Session verification failed:", err);
          logout();
        } finally {
          setLoading(false);
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, [fetchContext]);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        const { access_token, refresh_token, user: userData } = res.data.data;
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        await fetchContext();
        return { success: true, role: userData.role };
      }
      return { success: false, message: res.data.message || "فشل تسجيل الدخول" };
    } catch (err) {
      if (!err.response) {
        return { success: false, message: "تعذر الاتصال بالخادم. يرجى التأكد من تشغيل خادم FastAPI على المنفذ 8000" };
      }
      const message = err.response?.data?.error?.message || "البريد الإلكتروني أو كلمة المرور غير صحيحة";
      return { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
    setUserContext(null);
  };

  return (
    <AuthContext.Provider value={{ user, userContext, loading, login, logout, setUser, fetchContext }}>
      {children}
    </AuthContext.Provider>
  );
};
