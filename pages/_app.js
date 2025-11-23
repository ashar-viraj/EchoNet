import "@/styles/globals.css";
import { useEffect, useState, createContext, useContext } from "react";
import Chatbot from "@/components/Chatbot";

const AuthContext = createContext({ user: null, loading: true, refresh: () => {} });

export function useAuth() {
  return useContext(AuthContext);
}

export default function App({ Component, pageProps }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/me");
      if (!res.ok) {
        setUser(null);
      } else {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refresh }}>
      <Component {...pageProps} />
      <Chatbot />
    </AuthContext.Provider>
  );
}
