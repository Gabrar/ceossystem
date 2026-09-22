"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Ticket,
  Award,
  FileText,
  HelpCircle,
  User as UserIcon,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Sparkles,
  ExternalLink,
  Plus,
  Shield,
  Loader2,
  Settings
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface PainelLayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  {
    name: "Dashboard",
    href: "/usuario/painel/dashboard",
    icon: LayoutDashboard,
    description: "Visão geral e métricas",
  },
  {
    name: "Meus Eventos",
    href: "/usuario/painel/meus-eventos",
    icon: Calendar,
    description: "Eventos criados ou na agenda",
  },
  {
    name: "Inscrições",
    href: "/usuario/painel/inscricoes",
    icon: Ticket,
    description: "Ingressos e comprovantes",
  },
  {
    name: "Certificados",
    href: "/usuario/painel/certificados",
    icon: Award,
    description: "Declarações e autenticações",
  },
  {
    name: "Trabalhos",
    href: "/usuario/painel/trabalhos",
    icon: FileText,
    description: "Submissões e avaliações",
  },
  {
    name: "Ajuda & Suporte",
    href: "/usuario/painel/ajuda",
    icon: HelpCircle,
    description: "Dúvidas frequentes e contato",
  },
];

export default function PainelLayout({ children }: PainelLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, userData, loading, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Fecha o menu mobile quando a rota mudar
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Se não estiver logado após carregar, direciona para o login
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-73px)] bg-[#fafafa] dark:bg-[#0a1929] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Carregando painel do usuário...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isPromotor =
    userData?.tipoUsuario === "promotor" ||
    userData?.tipo_usuario === "promotor" ||
    userData?.role === "promotor";

  const userName = userData?.nome || user.displayName || user.email?.split("@")[0] || "Usuário";
  const userInitial = userName.charAt(0).toUpperCase();

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <div className="min-h-[calc(100vh-73px)] bg-[#fafafa] dark:bg-[#0a1929] text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row transition-colors">
      
      {/* Botão Hambúrguer Mobile */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white dark:bg-[#0c1e33] border-b border-slate-200 dark:border-blue-900/40 sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            {userInitial}
          </div>
          <div>
            <p className="font-semibold text-xs leading-tight">{userName}</p>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
              {isPromotor ? "Promotor" : "Participante"}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-xl bg-slate-100 dark:bg-blue-950/60 text-slate-700 dark:text-slate-200 hover:text-blue-600 transition-colors"
          aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Backdrop para telas móveis */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* BARRA LATERAL (SIDEBAR) */}
      <aside
        className={`
          fixed lg:static top-0 bottom-0 left-0 z-50
          w-72 sm:w-80 lg:w-72 xl:w-80 shrink-0
          bg-white dark:bg-[#0c1e33]
          border-r border-slate-200/90 dark:border-blue-900/40
          flex flex-col justify-between
          transition-transform duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          shadow-xl lg:shadow-none
        `}
      >
        {/* Topo da Sidebar: Perfil do Usuário */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-blue-900/30">
          <div className="flex items-center justify-between lg:justify-start gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-md shrink-0">
                {userInitial}
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0c1e33]" />
              </div>
              <div className="min-w-0">
                <h3 className="font-montserrat font-bold text-sm text-slate-900 dark:text-white truncate">
                  {userName}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {user.email}
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                    isPromotor
                      ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40"
                      : "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40"
                  }`}>
                    <Shield className="w-2.5 h-2.5" />
                    <span>{isPromotor ? "Promotor de Eventos" : "Participante"}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Fechar no mobile */}
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Botão de Criação Rápida para Promotores */}
          {isPromotor && (
            <Link
              href="/eventos/createEvent"
              className="mt-4 w-full py-2.5 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Novo Evento</span>
            </Link>
          )}
        </div>

        {/* Itens de Navegação (Subpastas) */}
        <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto" aria-label="Navegação do Painel">
          <p className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Menu Principal
          </p>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href === "/usuario/painel/dashboard" && pathname === "/usuario/painel");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  group flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer
                  ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400"
                  }
                `}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive
                        ? "text-white"
                        : "text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                    }`}
                  />
                  <span className="truncate">{item.name}</span>
                </div>

                <ChevronRight
                  className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all ${
                    isActive ? "opacity-100 translate-x-0.5" : ""
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        {/* Rodapé da Barra Lateral */}
        <div className="p-4 border-t border-slate-100 dark:border-blue-900/30 space-y-1 bg-slate-50/50 dark:bg-[#071321]/40">
          <Link
            href="/usuario/perfil"
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-[#0c1e33] hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Meu Perfil</span>
          </Link>

          <Link
            href="/eventos"
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-[#0c1e33] hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <ExternalLink className="w-4 h-4 text-slate-400" />
            <span>Explorar Todos os Eventos</span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer text-left"
          >
            <LogOut className="w-4 h-4" />
            <span>Encerrar Sessão</span>
          </button>
        </div>
      </aside>

      {/* ÁREA DE CONTEÚDO PRINCIPAL DO PAINEL */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-200">
          {children}
        </div>
      </main>

    </div>
  );
}
