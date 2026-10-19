"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { registrarVisita } from "@/lib/admin";

export default function VisitaTracker() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    // Não registra acessos internos do admin ou chamadas de api
    if (!pathname || pathname.startsWith("/admin") || pathname.startsWith("/api")) {
      return;
    }

    if (lastPath.current === pathname) return;
    lastPath.current = pathname;

    // Espera 1.5s para garantir que não é um bounce instantâneo
    const timer = setTimeout(() => {
      let tipo: "perfil" | "evento" | "plataforma" = "plataforma";
      let targetId = "home";

      if (pathname.startsWith("/eventos/")) {
        tipo = "evento";
        targetId = pathname.replace("/eventos/", "").split("/")[0] || "evento";
      } else if (pathname.startsWith("/usuario/perfil") || pathname.startsWith("/usuario")) {
        tipo = "perfil";
        targetId = "perfil";
      }

      registrarVisita(tipo, targetId, pathname);
    }, 1500);

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}
