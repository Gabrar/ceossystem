"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { collection, doc, getDoc, getDocs, limit, query, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { AdminProfile, verificarSeEAdmin } from "@/lib/admin";
import { useRouter, usePathname } from "next/navigation";

interface AdminAuthContextType {
  user: User | null;
  adminProfile: AdminProfile | null;
  isAdmin: boolean;
  loading: boolean;
  totalAdminsCadastrados: number;
  loginAdmin: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logoutAdmin: () => Promise<void>;
  criarPrimeiroAdmin: (nome: string, email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
}

const AdminAuthContext = createContext<AdminAuthContextType>({
  user: null,
  adminProfile: null,
  isAdmin: false,
  loading: true,
  totalAdminsCadastrados: 0,
  loginAdmin: async () => ({ success: false }),
  logoutAdmin: async () => {},
  criarPrimeiroAdmin: async () => ({ success: false }),
});

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<User | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [totalAdminsCadastrados, setTotalAdminsCadastrados] = useState(0);

  // 1. Verifica quantos admins existem cadastrados na pasta /admins
  useEffect(() => {
    const contarAdmins = async () => {
      try {
        const snap = await getDocs(query(collection(db, "admins"), limit(10)));
        setTotalAdminsCadastrados(snap.docs.length);
      } catch (e) {
        console.error("Erro ao verificar admins existentes:", e);
      }
    };
    contarAdmins();
  }, []);

  // 2. Monitora estado de autenticação e valida permissão na pasta /admins
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          const profile = await verificarSeEAdmin(currentUser.uid, currentUser.email);
          if (profile) {
            setAdminProfile(profile);
            setIsAdmin(true);

            // Atualiza timestamp do último acesso na pasta admins
            try {
              await updateDoc(doc(db, "admins", profile.id), {
                ultimoAcesso: new Date().toISOString(),
              });
            } catch {
              // Silencioso
            }
          } else {
            setAdminProfile(null);
            setIsAdmin(false);
          }
        } catch (err) {
          console.error("Erro ao validar credencial de admin:", err);
          setAdminProfile(null);
          setIsAdmin(false);
        }
      } else {
        setAdminProfile(null);
        setIsAdmin(false);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 3. Login exclusivo para administradores
  const loginAdmin = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
      const profile = await verificarSeEAdmin(cred.user.uid, cred.user.email);

      if (!profile) {
        // Se a conta autenticou no Firebase mas NÃO está na pasta /admins, bloqueia
        await signOut(auth);
        return {
          success: false,
          error: "Acesso não autorizado. Esta conta não possui privilégios de Administrador na Céos System.",
        };
      }

      setAdminProfile(profile);
      setIsAdmin(true);
      return { success: true };
    } catch (err: any) {
      console.error("Erro no login de admin:", err);
      let msg = "Credenciais inválidas. Verifique seu e-mail e senha de administrador.";
      if (err?.code === "auth/user-not-found" || err?.code === "auth/wrong-password" || err?.code === "auth/invalid-credential") {
        msg = "E-mail ou senha de administrador incorretos.";
      }
      return { success: false, error: msg };
    }
  };

  // 4. Logout do painel de administração
  const logoutAdmin = async () => {
    try {
      await signOut(auth);
      setAdminProfile(null);
      setIsAdmin(false);
      router.push("/");
    } catch (err) {
      console.error("Erro ao deslogar admin:", err);
    }
  };

  // 5. Cadastro de primeiro admin desativado permanentemente
  const criarPrimeiroAdmin = async (): Promise<{ success: boolean; error?: string }> => {
    return {
      success: false,
      error: "O cadastro de dono inicial está desativado. Novos administradores devem ser cadastrados pelo Dono autenticado dentro do painel.",
    };
  };

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        adminProfile,
        isAdmin,
        loading,
        totalAdminsCadastrados,
        loginAdmin,
        logoutAdmin,
        criarPrimeiroAdmin,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export const useAdminAuth = () => useContext(AdminAuthContext);
