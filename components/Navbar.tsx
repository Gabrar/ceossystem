"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { LogIn, UserPlus } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

export default function Navbar() {
    const [isVisible, setIsVisible] = useState(true);
    const lastScrollY = useRef(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            // Se estiver perto do topo (menos de 50px), sempre mostra a navbar
            if (currentScrollY <= 50) {
                setIsVisible(true);
            } 
            // Se rolou mais de 50px e está rolando para baixo, esconde
            else if (currentScrollY > lastScrollY.current + 5) {
                setIsVisible(false);
            } 
            // Se rolar para cima, mostra novamente
            else if (currentScrollY < lastScrollY.current - 5) {
                setIsVisible(true);
            }

            lastScrollY.current = currentScrollY;
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <nav 
            className={`sticky top-0 z-50 bg-[#0c1e33]/95 dark:bg-[#071321]/95 backdrop-blur-md py-3 sm:py-3.5 px-4 sm:px-8 flex justify-between items-center gap-3 sm:gap-6 border-b border-blue-900/30 dark:border-blue-400/10 transition-all duration-300 ease-in-out ${
                isVisible 
                    ? "translate-y-0 opacity-100 shadow-[0_10px_30px_-5px_rgba(7,25,51,0.2)] dark:shadow-[0_12px_35px_-8px_rgba(1,6,15,0.7)]" 
                    : "-translate-y-full opacity-0 pointer-events-none shadow-none"
            }`}
        >
            <Link href="/" className="shrink-0">
                <img
                    src="/assets/logo.png"
                    alt="Logo"
                    width={200}
                    height={200}
                    className="max-h-9 sm:max-h-11 w-auto object-contain cursor-pointer hover:opacity-90 transition-opacity"
                />
            </Link>
            
            <ul className="flex justify-end items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                <li>
                    <ThemeToggle />
                </li>

                <li aria-hidden="true" className="w-px h-3.5 sm:h-4 bg-blue-300/20 dark:bg-blue-400/20" />

                <li>
                    <button className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-blue-100/90 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer transition-all duration-200 font-medium">
                        <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-300" />
                        <span>Login</span>
                    </button>
                </li>

                <li aria-hidden="true" className="w-px h-3.5 sm:h-4 bg-blue-300/20 dark:bg-blue-400/20" />

                <li>
                    <button className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-lg shadow-sm hover:shadow-md hover:shadow-blue-500/25 cursor-pointer transition-all duration-200 font-medium">
                        <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>Registro</span>
                    </button>
                </li>
            </ul>
        </nav>
    );
}

