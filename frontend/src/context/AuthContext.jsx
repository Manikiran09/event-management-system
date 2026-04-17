import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api, { warmupApiBaseUrl } from "../api";

const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    try {
      await warmupApiBaseUrl();
      const response = await api.get("/auth/me");
      setUser(response.data.user);
    } catch (error) {
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchMe();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    await warmupApiBaseUrl();
    const response = await api.post("/auth/login", { email, password });
    localStorage.setItem("token", response.data.token);
    setUser(response.data.user);
    return response.data.user;
  };

  const register = async (payload) => {
    await warmupApiBaseUrl();
    const response = await api.post("/auth/register", payload);
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      setUser(response.data.user);
    }
    return response.data;
  };

  const logout = async () => {
    try {
      if (localStorage.getItem("token")) {
        await api.post("/auth/logout");
      }
    } catch {
      // Continue local logout even if backend call fails.
    } finally {
      localStorage.removeItem("token");
      setUser(null);
    }
  };

  const value = useMemo(
    () => ({ user, loading, login, register, logout, fetchMe }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const useAuth = () => {
  return useContext(AuthContext);
};

export { AuthProvider, useAuth };
