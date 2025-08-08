import { createContext, useState, useEffect } from "react";
import { supabase } from "../supabase/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const sessionData = await AsyncStorage.getItem("userSession");
        if (sessionData) {
          const parsedSession = JSON.parse(sessionData);

          await supabase.auth.setSession({
            access_token: parsedSession.access_token,
            refresh_token: parsedSession.refresh_token,
          });

          setUser(parsedSession.user);
        }
      } catch (error) {
        console.log("Error restaurando sesión:", error);
        await AsyncStorage.removeItem("userSession");
        setUser(null);
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
      await AsyncStorage.setItem("userSession", JSON.stringify(data.session));
    } catch (err) {
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
