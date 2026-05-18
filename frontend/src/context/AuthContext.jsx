import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const token = localStorage.getItem("doubtbridge_token");
      if (!token) {
        setLoading(false);
        return;
      }
      const { data } = await api.get("/auth/me");
      setUser(data.user);
    } catch (_error) {
      localStorage.removeItem("doubtbridge_token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  const login = async (payload) => {
    const { data } = await api.post("/auth/login", payload);
    localStorage.setItem("doubtbridge_token", data.token);
    setUser(data.user);
    return data;
  };

  const loginWithGoogle = async (payload) => {
    const { data } = await api.post("/auth/google", payload);
    localStorage.setItem("doubtbridge_token", data.token);
    setUser(data.user);
    return data;
  };

  const signup = async (payload) => {
    const { data } = await api.post("/auth/signup", payload);
    localStorage.setItem("doubtbridge_token", data.token);
    setUser(data.user);
    return data;
  };

  const forgotPassword = async (payload) => {
    const { data } = await api.post("/auth/forgot-password", payload);
    return data;
  };

  const updateProfile = async (payload) => {
    const { data } = await api.patch("/auth/profile", payload);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("doubtbridge_token");
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      loginWithGoogle,
      signup,
      forgotPassword,
      updateProfile,
      logout,
      refreshProfile: fetchMe
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};
