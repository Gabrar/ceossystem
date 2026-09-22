"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  Ticket,
  Award,
  FileText,
  ArrowRight,
  Sparkles,
  Plus,
  Clock,
  MapPin,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  BookOpen
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function DashboardPage() {
  const { user, userData } = useAuth();
  const [eventosRecentes, setEventosRecentes] = useState<any[]>([]);
  const [loadingEventos, setLoadingEventos] = useState(true);

  // Métricas dinâmicas puxadas do banco de dados
  const [meusEventosCount, setMeusEventosCount] = useState<number>(0);
  const [inscricoesCount, setInscricoesCount] = useState<number>(0);
  const [certificadosCount, setCertificadosCount] = useState<number>(0);
  const [trabalhosCount, setTrabalhosCount] = useState<number>(0);

  const isPromotor =
    userData?.tipoUsuario === "promotor" ||
    userData?.tipo_usuario === "promotor" ||
    userData?.role === "promotor";

  const userName = userData?.nome || user?.displayName || "Congressista";

  useEffect(() => {
    async function carregarDadosReais() {
      if (!user) return;
      try {
        setLoadingEventos(true);

        // 1. Eventos (se promotor, conta os eventos que ele criou)
        if (isPromotor) {
          try {
            const qPromotor = query(
              collection(db, "events"),
              where("userId", "==", user.uid)
            );
            const snapPromotor = await getDocs(qPromotor);
            setMeusEventosCount(snapPromotor.size);
          } catch (e) {
            console.log("Erro contagem eventos promotor:", e);
          }
        }

        // 2. Inscrições Reais do Usuário no Firestore
        try {
          const qInscricoes = query(
            collection(db, "inscricoes"),
            where("userId", "==", user.uid)
          );
          const snapInsc = await getDocs(qInscricoes);
          let totalInsc = snapInsc.size;

          if (totalInsc === 0 && user.email) {
            const qInscEmail = query(
              collection(db, "inscricoes"),
              where("userEmail", "==", user.email)
            );
            const snapInscEmail = await getDocs(qInscEmail);
            totalInsc = snapInscEmail.size;
          }

          setInscricoesCount(totalInsc);
          if (!isPromotor) {
            setMeusEventosCount(totalInsc);
          }
        } catch (e) {
          console.log("Erro contagem inscrições:", e);
        }

        // 3. Certificados Reais do Usuário no Firestore
        try {
          const qCertificados = query(
            collection(db, "certificados"),
            where("userId", "==", user.uid)
          );
          const snapCert = await getDocs(qCertificados);
          let totalCert = snapCert.size;

          if (totalCert === 0 && user.email) {
            const qCertEmail = query(
              collection(db, "certificados"),
              where("userEmail", "==", user.email)
            );
            const snapCertEmail = await getDocs(qCertEmail);
            totalCert = snapCertEmail.size;
          }

          setCertificadosCount(totalCert);
        } catch (e) {
          console.log("Erro contagem certificados:", e);
        }

        // 4. Trabalhos Científicos Reais do Usuário no Firestore
        try {
          const qTrabalhos = query(
            collection(db, "trabalhos"),
            where("userId", "==", user.uid)
          );
          const snapTrab = await getDocs(qTrabalhos);
          let totalTrab = snapTrab.size;

          if (totalTrab === 0 && user.email) {
            const qTrabEmail = query(
              collection(db, "trabalhos"),
              where("userEmail", "==", user.email)
            );
            const snapTrabEmail = await getDocs(qTrabEmail);
            totalTrab = snapTrabEmail.size;
          }

          setTrabalhosCount(totalTrab);
        } catch (e) {
          console.log("Erro contagem trabalhos:", e);
        }

        // 5. Carrega eventos gerais recentes
        const qRecent = query(collection(db, "events"), limit(3));
        const snapRecent = await getDocs(qRecent);
        const docs = snapRecent.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setEventosRecentes(docs);
      } catch (error) {
        console.error("Erro ao carregar métricas reais do dashboard:", error);
      } finally {
        setLoadingEventos(false);
      }
    }

    carregarDadosReais();
  }, [user, isPromotor]);

  const cardsMetricas = [
    {
      title: isPromotor ? "Eventos Criados" : "Eventos na Agenda",
      value: meusEventosCount,
      icon: Calendar,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/60",
      href: "/usuario/painel/meus-eventos",
    },
    {
      title: "Inscrições Ativas",
      value: inscricoesCount,
      icon: Ticket,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/60",
      href: "/usuario/painel/inscricoes",
    },
    {
      title: "Certificados",
      value: certificadosCount,
      icon: Award,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/60",
      href: "/usuario/painel/certificados",
    },
    {
      title: "Trabalhos Enviados",
      value: trabalhosCount,
      icon: FileText,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-950/60",
      href: "/usuario/painel/trabalhos",
    },
  ];

  return (
    <div className="space-y-8">
      
      {/* Banner de Boas-Vindas */}
      <section className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white shadow-lg">
        <div
          aria-hidden="true"
          className="absolute -right-12 -top-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"
        />

        <div className="relative z-10 max-w-2xl space-y-3">
          

          <h1 className="font-montserrat text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-snug">
            Olá, {userName}!
          </h1>

          <p className="text-sm sm:text-base text-blue-100/90 leading-relaxed">
            Bem-vindo à sua central científica. Aqui você acompanha seus eventos, gerencia inscrições, valida certificados e confere o status de seus trabalhos.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            {isPromotor && (
              <Link
                href="/eventos/createEvent"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Criar Novo Evento</span>
              </Link>
            )}

            <Link
              href="/eventos"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs sm:text-sm border border-white/20 backdrop-blur-md transition-all cursor-pointer"
            >
              <span>Explorar Eventos</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Grid de Cards de Métricas Reais */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {cardsMetricas.map((metrica, idx) => {
          const Icon = metrica.icon;
          return (
            <Link
              key={idx}
              href={metrica.href}
              className="group p-5 rounded-3xl bg-white dark:bg-[#0c1e33] border border-slate-200/90 dark:border-blue-900/40 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {metrica.title}
                </span>
                <div className={`w-10 h-10 rounded-xl ${metrica.bg} ${metrica.color} flex items-center justify-center shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <div className="pt-4 flex items-baseline justify-between">
                <span className="font-montserrat text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                  {metrica.value}
                </span>
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                  Ver detalhes
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          );
        })}
      </section>

      {/* Atalhos e Próximos Eventos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Coluna 1: Eventos em Destaque (8 colunas) */}
        <div className="lg:col-span-8 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-montserrat text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                Eventos em Destaque na Plataforma
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Congressos e jornadas científicas com inscrições ativas
              </p>
            </div>
            <Link
              href="/eventos"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>Ver todos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loadingEventos ? (
            <div className="p-8 text-center bg-white dark:bg-[#0c1e33] rounded-3xl border border-slate-200/90 dark:border-blue-900/40">
              <div className="w-6 h-6 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">Buscando eventos no banco de dados...</p>
            </div>
          ) : eventosRecentes.length > 0 ? (
            <div className="space-y-3">
              {eventosRecentes.map((ev) => (
                <div
                  key={ev.id}
                  className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0c1e33] border border-slate-200/90 dark:border-blue-900/40 shadow-xs hover:border-blue-400 dark:hover:border-blue-500 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-blue-900/30">
                      <Image
                        src={ev.img || "/assets/logos/teste-anatomia.png"}
                        alt={ev.title || "Evento"}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                        {ev.category || "Geral"}
                      </span>
                      <h3 className="font-montserrat font-bold text-sm text-slate-900 dark:text-white truncate">
                        {ev.title || "Evento Científico"}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-blue-500" />
                          {ev.dateInicio ? ev.dateInicio.split("-").reverse().join("/") : ev.date || "Em Breve"}
                        </span>
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-blue-500" />
                          {ev.local?.cidade || ev["city-state"] || "Brasil"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/eventos/${ev.id}`}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-600 dark:bg-blue-950/60 dark:hover:bg-blue-600 text-blue-600 hover:text-white dark:text-blue-300 dark:hover:text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <span>Acessar Evento</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-white dark:bg-[#0c1e33] rounded-3xl border border-slate-200/90 dark:border-blue-900/40">
              <p className="text-xs sm:text-sm text-slate-500">Nenhum evento registrado no momento.</p>
            </div>
          )}
        </div>

        {/* Coluna 2: Ações Rápidas (4 colunas) */}
        <div className="lg:col-span-4 space-y-5">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0c1e33] border border-slate-200/90 dark:border-blue-900/40 shadow-xs space-y-4">
            <h3 className="font-montserrat font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Ações Rápidas
            </h3>

            <div className="space-y-2 text-xs">
              <Link
                href="/usuario/painel/inscricoes"
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#071321]/70 border border-slate-200/70 dark:border-blue-900/30 text-slate-700 dark:text-slate-300 hover:text-blue-600 flex items-center justify-between font-medium transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Ticket className="w-4 h-4 text-blue-500" />
                  <span>Ver Minhas Inscrições</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>

              <Link
                href="/usuario/painel/certificados"
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#071321]/70 border border-slate-200/70 dark:border-blue-900/30 text-slate-700 dark:text-slate-300 hover:text-blue-600 flex items-center justify-between font-medium transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Baixar Certificados</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>

              <Link
                href="/usuario/painel/trabalhos"
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#071321]/70 border border-slate-200/70 dark:border-blue-900/30 text-slate-700 dark:text-slate-300 hover:text-blue-600 flex items-center justify-between font-medium transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-purple-500" />
                  <span>Submeter Artigo/Resumo</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>

              <Link
                href="/usuario/painel/ajuda"
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#071321]/70 border border-slate-200/70 dark:border-blue-900/30 text-slate-700 dark:text-slate-300 hover:text-blue-600 flex items-center justify-between font-medium transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4 text-emerald-500" />
                  <span>Central de Ajuda & FAQ</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          
        </div>

      </div>

    </div>
  );
}
