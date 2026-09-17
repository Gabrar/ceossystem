"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Sincroniza o estado inicial
    setTimeout(() => {
      const isDark = document.documentElement.classList.contains("dark");
      setTheme(isDark ? "dark" : "light");
      setMounted(true);
    }, 0);

    // Escuta mudanças de storage entre abas
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "theme") {
        const newTheme = e.newValue === "light" ? "light" : "dark";
        setTheme(newTheme);
        if (newTheme === "dark") {
          document.documentElement.classList.add("dark");
          document.documentElement.classList.remove("light");
        } else {
          document.documentElement.classList.remove("dark");
          document.documentElement.classList.add("light");
        }
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);

    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
      localStorage.setItem("theme", "light");
    }

    // Dispara evento customizado para outros componentes que queiram ouvir
    window.dispatchEvent(new Event("theme-change"));
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={
        !mounted
          ? "Alternar tema"
          : theme === "dark"
          ? "Alternar para Modo Claro"
          : "Alternar para Modo Escuro"
      }
      aria-label={
        !mounted
          ? "Alternar tema"
          : theme === "dark"
          ? "Alternar para Modo Claro"
          : "Alternar para Modo Escuro"
      }
      className="relative p-2 sm:px-3 sm:py-1.5 flex items-center justify-center gap-1.5 rounded-xl border border-blue-400/20 dark:border-blue-400/20 bg-white/10 hover:bg-white/15 dark:bg-slate-800/60 dark:hover:bg-slate-700/80 text-blue-100 transition-all duration-200 cursor-pointer shadow-xs active:scale-95 group"
    >
      <div className="relative w-4 h-4 sm:w-[18px] sm:h-[18px] flex items-center justify-center">
        {/* Ícone Sol (Modo Claro) */}
        <Sun
          className={`w-4 h-4 sm:w-[18px] sm:h-[18px] text-amber-300 transition-all duration-300 ${
            mounted && theme === "light"
              ? "rotate-0 scale-100 opacity-100"
              : "-rotate-90 scale-0 opacity-0 absolute"
          }`}
        />
        {/* Ícone Lua (Modo Escuro) */}
        <Moon
          className={`w-4 h-4 sm:w-[18px] sm:h-[18px] text-blue-300 transition-all duration-300 ${
            !mounted || theme === "dark"
              ? "rotate-0 scale-100 opacity-100"
              : "rotate-90 scale-0 opacity-0 absolute"
          }`}
        />
      </div>

      <span className="hidden md:inline text-xs font-medium text-blue-100/90 group-hover:text-white transition-colors">
        {!mounted ? "Tema" : theme === "dark" ? "Escuro" : "Claro"}
      </span>
    </button>
  );
}
