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

  const register = async (name, email, password, passwordConfirm) => {
    try {
      const res = await api.post('/auth/register', {
        name,
        email,
        password,
        password_confirm: passwordConfirm,
      });
      if (res.data.success) {
        return { success: true };
      }
      return { success: false, message: res.data.message || 'فشل إنشاء الحساب' };
    } catch (err) {
      if (!err.response) {
        return { success: false, message: 'تعذر الاتصال بالخادم. يرجى المحاولة لاحقاً' };
      }
      const message = err.response?.data?.error?.message || err.response?.data?.message || 'فشل إنشاء الحساب';
      return { success: false, message };
    }
  };

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
      if (err && err.__qbNoBackend) {
        return { success: false, message: "الواجهة الأمامية منشورة على GitHub Pages لكن الخادم (Backend) لم يُنشر بعد. راجع koyeb.yaml و DEPLOYMENT.md لإنشاء Neon Postgres + Koyeb backend مجاناً، ثم اضبط VITE_API_URL في إعدادات المستودع." };
      }
      if (!err.response) {
        const isGhPages = typeof window !== 'undefined' && window.location.hostname.includes('github.io');
        if (isGhPages) {
          return { success: false, message: "تعذر الاتصال بالخادم. الخادم غير مُكوّن بعد على GitHub Pages. راجع دليل النشر المجاني: koyeb.yaml (Koyeb) أو render.yaml (Render) مع Neon Postgres." };
        }
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
    <AuthContext.Provider value={{ user, userContext, loading, login, register, logout, setUser, fetchContext }}>
      {children}
    </AuthContext.Provider>
  );
};
