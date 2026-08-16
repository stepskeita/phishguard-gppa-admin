import React, { createContext, useState, useContext, useEffect } from "react";
import api from "@/api/axios";

const TOKEN_KEY = "jambarr360-token";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setIsLoadingAuth(false);
      return;
    }
    api
      .get("/auth/me")
      .then((res) => {
        setUser(res.data);
        setIsAuthenticated(true);
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
      })
      .finally(() => setIsLoadingAuth(false));
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    const { token, admin } = res.data;
    localStorage.setItem(TOKEN_KEY, JSON.stringify(token));
    setUser(admin);
    setIsAuthenticated(true);
    return admin;
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (_) {
      // Ignore — token may already be invalid
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // `user.roleId` arrives populated from the API (an object with a
  // `permissions` array of "module:Action" strings, e.g. "campaigns:View")
  // rather than a bare id — see backend authController's `.populate('roleId')`.
  // A missing/unassigned role means zero permissions, not a crash.
  const hasPermission = (permission) => {
    if (!permission) return true;
    return user?.roleId?.permissions?.includes(permission) ?? false;
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, isLoadingAuth, login, logout, hasPermission }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
