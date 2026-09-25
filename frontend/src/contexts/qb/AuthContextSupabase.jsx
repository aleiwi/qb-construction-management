/**
 * AuthContext (QB-main legacy reference)
 * This file was originally from QB-main using Supabase Auth.
 * The current project uses the main AuthContext at ../AuthContext.jsx
 * which is backed by FastAPI JWT tokens.
 * 
 * DO NOT USE THIS FILE - it references Supabase which is not used in this project.
 */
import React from 'react';

export const AuthContext = React.createContext(null);
export const AuthProvider = ({ children }) => {
  return <>{children}</>;
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export default AuthContext;
