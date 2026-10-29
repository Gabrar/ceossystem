"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LogIn, UserPlus, User, LayoutDashboard, Calendar, Settings, LogOut, ChevronDown, Shield } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";

export default function Navbar() {
    const pathname = usePathname();
    const [isVisible, setIsVisible] = useState(true);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const lastScrollY = useRef(0);
    const { user, userData, loading, logout } = useAuth();
    const dropdownRef = useRef<HTMLLIElement>(null);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            if (currentScrollY <= 50) {
                setIsVisible(true);
            } else if (currentScrollY > lastScrollY.current + 5) {
                setIsVisible(false);
                setDropdownOpen(false); // fecha o dropdown ao scrollar para baixo
            } else if (currentScrollY < lastScrollY.current - 5) {
                setIsVisible(true);
            }

            lastScrollY.current = currentScrollY;
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Fechar dropdown ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };

        if (dropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownOpen]);

    // Oculta a Navbar pública nas rotas de administração (/admin)
    if (pathname?.startsWith("/admin")) {
        return null;
    }

    return (
        <nav 
            className={`sticky top-0 z-50 bg-white/95 dark:bg-[#071321]/95 backdrop-blur-md py-3 sm:py-3.5 px-4 sm:px-8 flex justify-between items-center gap-3 sm:gap-6 border-b border-slate-200/90 dark:border-blue-400/10 transition-all duration-300 ease-in-out ${
                isVisible 
                    ? "translate-y-0 opacity-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_35px_-8px_rgba(1,6,15,0.7)]" 
                    : "-translate-y-full opacity-0 pointer-events-none shadow-none"
            }`}
        >
            <Link href="/" className="shrink-0 block relative w-[160px] h-[36px] sm:w-[200px] sm:h-[44px]">
                {/* Logo Escura para Tema Claro */}
                <Image
                    src="/assets/logo-black.png"
                    alt="Logo Céos System"
                    fill
                    className="object-contain cursor-pointer hover:opacity-90 transition-opacity dark:hidden"
                    priority
                />
                {/* Logo Clara para Tema Escuro */}
                <Image
                    src="/assets/logo.png"
                    alt="Logo Céos System"
                    fill
                    className="object-contain cursor-pointer hover:opacity-90 transition-opacity hidden dark:block"
                    priority
                />
            </Link>
            
            <ul className="flex justify-end items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                <li>
                    <ThemeToggle />
                </li>

                <li aria-hidden="true" className="w-px h-3.5 sm:h-4 bg-slate-300 dark:bg-blue-400/20" />

                {!loading && !user && (
                    <>
                        <li>
                            <Link
                                href="/login"
                                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-slate-700 hover:text-blue-600 hover:bg-slate-100 dark:text-blue-100/90 dark:hover:text-white dark:hover:bg-white/10 rounded-lg cursor-pointer transition-all duration-200 font-medium"
                            >
                                <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-300" />
                                <span>Login</span>
                            </Link>
                        </li>

                        <li aria-hidden="true" className="w-px h-3.5 sm:h-4 bg-slate-300 dark:bg-blue-400/20" />

                        <li>
                            <Link
                                href="/registro"
                                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-lg shadow-sm hover:shadow-md hover:shadow-blue-500/25 cursor-pointer transition-all duration-200 font-medium"
                            >
                                <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                <span>Registro</span>
                            </Link>
                        </li>
                    </>
                )}

                {!loading && user && (
                    <li className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-blue-100/90 dark:hover:text-white dark:hover:bg-white/10 transition-all duration-200 cursor-pointer border border-transparent hover:border-slate-200/80 dark:hover:border-blue-400/20"
                        >
                            <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-600/30 border border-blue-200 dark:border-blue-500/50 flex items-center justify-center overflow-hidden">
                                {user.photoURL ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={user.photoURL} alt="User Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                                )}
                            </div>
                            <span className="max-w-[100px] truncate hidden sm:block font-medium">
                                {userData?.nome || user.displayName || "Usuário"}
                            </span>
                            <ChevronDown className={`w-4 h-4 text-slate-400 dark:text-blue-300 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown Menu */}
                        {dropdownOpen && (
                            <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-[#0c1e33] border border-slate-200/90 dark:border-blue-900/40 rounded-2xl shadow-xl overflow-hidden py-1.5 z-50">
                                <Link 
                                    href="/usuario/painel" 
                                    onClick={() => setDropdownOpen(false)}
                                    className="flex items-center gap-2 px-4 py-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-white transition-colors"
                                >
                                    <LayoutDashboard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    <span>Painel</span>
                                </Link>
                                <Link 
                                    href="/usuario/painel/meus-eventos" 
                                    onClick={() => setDropdownOpen(false)}
                                    className="flex items-center gap-2 px-4 py-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-white transition-colors"
                                >
                                    <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    <span>Meus Eventos</span>
                                </Link>
                                <Link 
                                    href="/usuario/perfil" 
                                    onClick={() => setDropdownOpen(false)}
                                    className="flex items-center gap-2 px-4 py-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-white transition-colors"
                                >
                                    <Settings className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    <span>Meu Perfil</span>
                                </Link>
                                {(userData?.isAdmin || userData?.role === "admin" || userData?.role === "dono") && (
                                    <Link 
                                        href="/admin/dashboard" 
                                        onClick={() => setDropdownOpen(false)}
                                        className="flex items-center gap-2 px-4 py-2.5 text-blue-600 dark:text-blue-400 font-semibold hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                                    >
                                        <Shield className="w-4 h-4" />
                                        <span>Painel do Administrador</span>
                                    </Link>
                                )}
                                <div className="h-px bg-slate-200/90 dark:bg-blue-900/40 my-1" />
                                <button
                                    onClick={() => {
                                        setDropdownOpen(false);
                                        logout();
                                    }}
                                    className="w-full flex items-center gap-2 px-4 py-2.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer text-left font-medium"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span>Sair</span>
                                </button>
                            </div>
                        )}
                    </li>
                )}
            </ul>
        </nav>
    );
}
