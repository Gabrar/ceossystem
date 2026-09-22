"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { LogIn, UserPlus, User, LayoutDashboard, Calendar, Settings, LogOut, ChevronDown } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";

export default function Navbar() {
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

    return (
        <nav 
            className={`sticky top-0 z-50 bg-[#0c1e33]/95 dark:bg-[#071321]/95 backdrop-blur-md py-3 sm:py-3.5 px-4 sm:px-8 flex justify-between items-center gap-3 sm:gap-6 border-b border-blue-900/30 dark:border-blue-400/10 transition-all duration-300 ease-in-out ${
                isVisible 
                    ? "translate-y-0 opacity-100 shadow-[0_10px_30px_-5px_rgba(7,25,51,0.2)] dark:shadow-[0_12px_35px_-8px_rgba(1,6,15,0.7)]" 
                    : "-translate-y-full opacity-0 pointer-events-none shadow-none"
            }`}
        >
            <Link href="/" className="shrink-0 block relative w-[160px] h-[36px] sm:w-[200px] sm:h-[44px]">
                <Image
                    src="/assets/logo.png"
                    alt="Logo Céos System"
                    fill
                    className="object-contain cursor-pointer hover:opacity-90 transition-opacity"
                    priority
                />
            </Link>
            
            <ul className="flex justify-end items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                <li>
                    <ThemeToggle />
                </li>

                <li aria-hidden="true" className="w-px h-3.5 sm:h-4 bg-blue-300/20 dark:bg-blue-400/20" />

                {!loading && !user && (
                    <>
                        <li>
                            <Link
                                href="/login"
                                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-blue-100/90 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer transition-all duration-200 font-medium"
                            >
                                <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-300" />
                                <span>Login</span>
                            </Link>
                        </li>

                        <li aria-hidden="true" className="w-px h-3.5 sm:h-4 bg-blue-300/20 dark:bg-blue-400/20" />

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
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-blue-100/90 hover:text-white hover:bg-white/10 transition-all duration-200 cursor-pointer"
                        >
                            <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/50 flex items-center justify-center overflow-hidden">
                                {user.photoURL ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={user.photoURL} alt="User Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-4 h-4 text-blue-300" />
                                )}
                            </div>
                            <span className="max-w-[100px] truncate hidden sm:block font-medium">
                                {userData?.nome || user.displayName || "Usuário"}
                            </span>
                            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown Menu */}
                        {dropdownOpen && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#0c1e33] border border-slate-200 dark:border-blue-900/40 rounded-xl shadow-xl overflow-hidden py-1 z-50">
                                <Link 
                                    href="/usuario/painel" 
                                    onClick={() => setDropdownOpen(false)}
                                    className="flex items-center gap-2 px-4 py-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-blue-900/20 transition-colors"
                                >
                                    <LayoutDashboard className="w-4 h-4" />
                                    <span>Painel</span>
                                </Link>
                                <Link 
                                    href="/usuario/painel/meus-eventos" 
                                    onClick={() => setDropdownOpen(false)}
                                    className="flex items-center gap-2 px-4 py-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-blue-900/20 transition-colors"
                                >
                                    <Calendar className="w-4 h-4" />
                                    <span>Meus Eventos</span>
                                </Link>
                                <Link 
                                    href="/usuario/perfil" 
                                    onClick={() => setDropdownOpen(false)}
                                    className="flex items-center gap-2 px-4 py-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-blue-900/20 transition-colors"
                                >
                                    <Settings className="w-4 h-4" />
                                    <span>Meu Perfil</span>
                                </Link>
                                <div className="h-px bg-slate-200 dark:bg-blue-900/40 my-1" />
                                <button
                                    onClick={() => {
                                        setDropdownOpen(false);
                                        logout();
                                    }}
                                    className="w-full flex items-center gap-2 px-4 py-2.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
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
