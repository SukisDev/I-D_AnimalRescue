import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getMe, login as apiLogin } from "../services/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { id, role, ... }
  const [loading, setLoading] = useState(true);

  // Cargar sesión si hay token
  useEffect(() => {
    const token = localStorage.getItem("ar_token");
    if (!token) {
      setLoading(false);
      return;
    }
    getMe()
      .then((data) => {
        // espera { user: { id, role, ... } }
        setUser(data?.user || null);
      })
      .catch(() => {
        localStorage.removeItem("ar_token");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const data = await apiLogin(email, password); // { token, user }
    if (!data?.token || !data?.user) {
      throw new Error("Respuesta de login inválida");
    }
    localStorage.setItem("ar_token", data.token);
    setUser({ ...data.user });
    return data;
  };

  const logout = () => {
    localStorage.removeItem("ar_token");
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuth: !!user,
      login,
      logout,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
