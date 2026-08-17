import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const LogoutButton = ({ compact = false }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  if (compact) {
    return (
      <button
        onClick={handleLogout}
        title="تسجيل الخروج"
        className="p-2 text-slate-400 hover:text-rose-300 hover:bg-slate-800 rounded-xl transition"
      >
        <LogOut className="w-4 h-4" />
      </button>
    );
  }

  return (
    <button
      onClick={handleLogout}
      className="px-3 py-2 text-slate-300 hover:text-rose-300 hover:bg-slate-800 border border-slate-700/60 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold"
    >
      <LogOut className="w-3.5 h-3.5" />
      <span>خروج</span>
    </button>
  );
};

export default LogoutButton;
