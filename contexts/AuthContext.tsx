"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

import { verificarSeEAdmin } from "@/lib/admin";

interface AuthContextType {
  user: User | null;
  userData: any | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);
          let currentData = docSnap.exists() ? docSnap.data() : {};

          // Valida se o usuário é Administrador na pasta /admins
          try {
            const adminProfile = await verificarSeEAdmin(currentUser.uid, currentUser.email);
            if (adminProfile) {
              currentData = {
                ...currentData,
                ...adminProfile,
                isAdmin: true,
                role: adminProfile.role || "dono",
              };
            }
          } catch (e) {
            console.error("Erro ao checar admin na pasta /admins:", e);
          }

          setUserData(Object.keys(currentData).length > 0 ? currentData : null);
        } catch (error) {
          console.error("Erro ao buscar dados do usuário:", error);
          setUserData(null);
        }
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Erro ao deslogar", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
