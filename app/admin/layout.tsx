"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { AdminAuthProvider, useAdminAuth } from "@/contexts/AdminAuthContext";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Shield,
  ShieldAlert,
  Percent,
  TrendingUp,
  LogOut,
  ChevronRight,
  Menu,
  X,
  ExternalLink,
  Loader2,
  Crown,
  Lock,
  Wallet,
  Building2,
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const adminNavItems = [
  {
    name: "Dashboard & Visitas",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
    description: "Métricas globais, rendimentos e gráficos",
  },
  {
    name: "Eventos & Taxas Céos",
    href: "/admin/eventos",
    icon: Calendar,
    description: "Editar eventos, excluir e negociar % Céos",
  },
  {
    name: "Usuários & Roles",
    href: "/admin/usuarios",
    icon: Users,
    description: "Lista de promotores, participantes e status",
  },
  {
    name: "Administradores",
    href: "/admin/admins",
    icon: Crown,
    description: "Controle de acessos da pasta /admins",
  },
];

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, adminProfile, isAdmin, loading, logoutAdmin } = useAdminAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Se tentar acessar /admin/login ou não for admin autenticado, redireciona imediatamente para a home
  useEffect(() => {
    if (!loading && (!user || !isAdmin || pathname === "/admin/login")) {
      router.replace("/");
    }
  }, [loading, user, isAdmin, pathname, router]);

  if (pathname === "/admin/login") {
    return null;
  }

  // Carregando estado de autenticação
  if (loading) {
    return (
      <div className="min-h-screen bg-[#071321] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <Crown className="w-8 h-8 text-amber-400 animate-pulse" />
          </div>
          <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
          <p className="text-xs sm:text-sm font-semibold text-slate-400">
            Carregando painel do Dono...
          </p>
        </div>
      </div>
    );
  }

  // Se não for admin autenticado em /admins, não renderiza nada (já está sendo redirecionado para /)
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#071321] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#071321] text-slate-100 flex flex-col lg:flex-row antialiased">
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden lg:flex w-72 flex-col shrink-0 bg-[#0c1e33]/90 border-r border-blue-900/40 backdrop-blur-md sticky top-0 h-screen z-40">
        {/* Brand / Logo Top */}
        <div className="p-6 border-b border-blue-900/40 flex items-center justify-between">
          <Link href="/admin/dashboard" className="flex items-center gap-3 group">
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md shadow-amber-500/20">
              <Crown className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-montserrat font-extrabold text-base tracking-tight text-white block group-hover:text-amber-400 transition-colors">
                Céos System
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                <span>Painel do Dono</span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              </span>
            </div>
          </Link>
        </div>

        {/* Perfil Rápido do Dono */}
        <div className="px-6 py-4 border-b border-blue-900/30 bg-[#071321]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 border border-amber-400/30 flex items-center justify-center text-amber-300 font-bold text-sm shrink-0">
              {adminProfile?.nome ? adminProfile.nome.slice(0, 2).toUpperCase() : "AD"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">
                {adminProfile?.nome || "Administrador"}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                {adminProfile?.email || user?.email}
              </p>
              <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase px-2 py-0.5 mt-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Crown className="w-2.5 h-2.5" />
                <span>{adminProfile?.role === "dono" ? "Proprietário" : "Admin"}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-2">
            Gestão & Controle
          </p>
          {adminNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-amber-500/15 to-amber-500/5 text-amber-300 border border-amber-500/30 shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/50 border border-transparent"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                    isActive
                      ? "bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                      : "bg-[#071321] text-slate-400 group-hover:text-amber-400 border border-blue-900/40"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="truncate">{item.name}</span>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-amber-400" />}
                  </div>
                </div>
              </Link>
            );
          })}

          <div className="pt-4 mt-4 border-t border-blue-900/30 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-2">
              Atalhos Externos
            </p>
            <Link
              href="/"
              target="_blank"
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/40 transition-colors"
            >
              <span className="flex items-center gap-2">
                <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                <span>Ver Site Público</span>
              </span>
            </Link>
            <Link
              href="/usuario/painel"
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/40 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Painel do Promotor</span>
              </span>
            </Link>
          </div>
        </nav>

        {/* Rodapé Logout */}
        <div className="p-4 border-t border-blue-900/40">
          <button
            onClick={logoutAdmin}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold border border-rose-500/20 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair do Painel Admin</span>
          </button>
        </div>
      </aside>

      {/* ÁREA DE CONTEÚDO PRINCIPAL */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOPBAR MOBILE & DESKTOP */}
        <header className="sticky top-0 z-30 bg-[#0c1e33]/90 border-b border-blue-900/40 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Botão Mobile */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white focus:outline-none"
              aria-label="Abrir menu lateral"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <Crown className="w-3 h-3" />
                <span>ADMINISTRAÇÃO CÉOS</span>
              </span>
              <span className="text-slate-500 hidden sm:inline">•</span>
              <span className="text-xs text-slate-400 hidden md:inline">
                Visão Master do Dono
              </span>
            </div>
          </div>

          {/* Badges de Status do Sistema no Header */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#071321] border border-blue-900/50 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-400 font-medium">Asaas Split Gateway:</span>
              <span className="text-emerald-400 font-bold">Ativo (8% Base)</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-extrabold text-xs">
                {adminProfile?.nome ? adminProfile.nome[0].toUpperCase() : "A"}
              </div>
              <button
                onClick={logoutAdmin}
                className="hidden sm:inline-flex p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Encerrar Sessão"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* MENU MOBILE DRAWER */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex">
            <div className="w-72 bg-[#0c1e33] h-full p-5 flex flex-col border-r border-blue-900/40">
              <div className="flex items-center justify-between pb-4 border-b border-blue-900/40">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-400" />
                  <span className="font-montserrat font-bold text-white text-sm">
                    Painel do Dono
                  </span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-4 space-y-1">
                {adminNavItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                        isActive
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>

              <div className="mt-auto pt-4 border-t border-blue-900/40">
                <button
                  onClick={logoutAdmin}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-500/10 text-rose-400 text-xs font-semibold"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sair</span>
                </button>
              </div>
            </div>
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
          </div>
        )}

        {/* CORPO DO CONTEÚDO */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AdminAuthProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AdminAuthProvider>
  );
}
