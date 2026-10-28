"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

import { verificarSeEAdmin } from "@/lib/admin";

interface AuthContextType {
  user: User | null;
  userData: any | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  logout: async () => {},
  refreshUserData: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (currentUser: User) => {
    try {
      const docRef = doc(db, "users", currentUser.uid);
      const docSnap = await getDoc(docRef);
      let currentData = docSnap.exists() ? docSnap.data() : {};

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
  };

  const refreshUserData = async () => {
    if (user) {
      await fetchUserData(user);
    }
  };

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (currentUser) {
        try {
          const docRef = doc(db, "users", currentUser.uid);
          unsubscribeSnapshot = onSnapshot(
            docRef,
            async (docSnap) => {
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
              setLoading(false);
            },
            (error) => {
              console.error("Erro no listener em tempo real do usuário:", error);
              setLoading(false);
            }
          );
        } catch (error) {
          console.error("Erro ao iniciar escuta dos dados do usuário:", error);
          setUserData(null);
          setLoading(false);
        }
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
      unsubscribe();
    };
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Erro ao deslogar", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, logout, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
