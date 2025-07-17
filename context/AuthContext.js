// context/AuthContext.js
import { createContext, useState, useEffect } from "react";
import { supabase } from "../supabase/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // ⬇️ Intentar restaurar sesión al iniciar la app
  useEffect(() => {
    const restoreSession = async () => {
      const sessionData = await AsyncStorage.getItem("userSession");
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        setUser(parsed);
      }
    };

    restoreSession();
  }, []);

  const login = async (email, password, onError) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      setUser(data.user);

      // ⬇️ Guarda sesión en AsyncStorage
      await AsyncStorage.setItem("userSession", JSON.stringify(data.user));
    } catch (err) {
      //console.error("Login failed:", err.message);
      if (onError) {
        onError(err.message);
      }
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    await AsyncStorage.removeItem("userSession");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
