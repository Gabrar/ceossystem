"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  MapPin,
  Clock,
  Plus,
  ArrowRight,
  SlidersHorizontal,
  ExternalLink,
  ShieldAlert,
  Loader2,
  Tag,
  Users,
  Pencil,
  Trash2,
  AlertTriangle,
  X
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { collection, getDocs, query, where, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getEventRegistrationStatus, getStatusBadgeConfig } from "@/lib/eventStatus";

export default function MeusEventosPage() {
  const { user, userData } = useAuth();
  const [eventos, setEventos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState("Todos");

  // Estado para modal de exclusão
  const [eventoParaExcluir, setEventoParaExcluir] = useState<any | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const isPromotor =
    userData?.tipoUsuario === "promotor" ||
    userData?.tipo_usuario === "promotor" ||
    userData?.role === "promotor";

  const carregarEventos = async () => {
    if (!user) return;
    try {
      setLoading(true);

        const normalizarEvento = (d: any) => {
          const data = d.data();
          const statusCalculado = getEventRegistrationStatus({
            dataInscricaoInicio: data.dataInscricaoInicio,
            dataInscricaoFim: data.dataInscricaoFim,
            horaInscricaoInicio: data.horaInscricaoInicio,
            horaInscricaoFim: data.horaInscricaoFim,
            dateInicio: data.dateInicio,
            dateFim: data.dateFim,
            status: data.status,
          });
          return {
            id: d.id,
            ...data,
            status: statusCalculado,
          };
        };

        if (isPromotor) {
          // Busca eventos criados pelo promotor logado
          const q = query(
            collection(db, "events"),
            where("userId", "==", user.uid)
          );
          const snap = await getDocs(q);
          let lista = snap.docs.map(normalizarEvento);

          // Se não achou por userId, tenta por promotorEmail
          if (lista.length === 0 && user.email) {
            const qEmail = query(
              collection(db, "events"),
              where("promotorEmail", "==", user.email)
            );
            const snapEmail = await getDocs(qEmail);
            lista = snapEmail.docs.map(normalizarEvento);
          }

          setEventos(lista);
        } else {
          // Para participantes, traz eventos onde há interesse ou inscrições
          const q = query(collection(db, "events"));
          const snap = await getDocs(q);
          const lista = snap.docs.slice(0, 2).map(normalizarEvento);
          setEventos(lista);
        }
    } catch (error) {
      console.error("Erro ao carregar meus eventos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarEventos();
  }, [user, isPromotor]);

  const handleConfirmarExclusao = async () => {
    if (!eventoParaExcluir) return;
    try {
      setExcluindo(true);
      await deleteDoc(doc(db, "events", eventoParaExcluir.id));
      setEventos((prev) => prev.filter((e) => e.id !== eventoParaExcluir.id));
      setEventoParaExcluir(null);
      alert("Evento excluído com sucesso!");
    } catch (err) {
      console.error("Erro ao excluir evento:", err);
      alert("Erro ao excluir o evento. Tente novamente.");
    } finally {
      setExcluindo(false);
    }
  };

  const eventosFiltrados = eventos.filter((ev) => {
    if (filtroStatus === "Todos") return true;
    return (ev.status || "Em Breve") === filtroStatus;
  });

  return (
    <div className="space-y-6">
      
      {/* Cabeçalho da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-montserrat text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {isPromotor ? "Gestão de Meus Eventos" : "Meus Eventos"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isPromotor
              ? "Gerencie todas as informações, edite programações ou exclua os eventos de sua responsabilidade."
              : "Consulte os congressos científicos em que você está participando."}
          </p>
        </div>

        {isPromotor && (
          <Link
            href="/eventos/createEvent"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-blue-600/20 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Novo Evento</span>
          </Link>
        )}
      </div>

      {/* Barra de Filtros */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-blue-900/40 pb-3 overflow-x-auto">
        {["Todos", "Em Breve", "Inscrições Abertas", "Inscrições Encerradas"].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setFiltroStatus(st)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors shrink-0 ${
              filtroStatus === st
                ? "bg-blue-600 text-white"
                : "bg-slate-100 dark:bg-[#071321] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-blue-950/60"
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Listagem */}
      {loading ? (
        <div className="py-16 text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-xs sm:text-sm text-slate-500">Carregando seus eventos no banco de dados...</p>
        </div>
      ) : eventosFiltrados.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {eventosFiltrados.map((evento) => (
            <div
              key={evento.id}
              className="group flex flex-col bg-white dark:bg-[#0c1e33] rounded-2xl overflow-hidden border border-slate-200/90 dark:border-blue-900/40 shadow-xs hover:shadow-lg transition-all"
            >
              <div className="relative w-full aspect-[16/9] bg-slate-100 dark:bg-slate-800">
                <Image
                  src={evento.img || "/assets/logos/teste-anatomia.png"}
                  alt={evento.title || "Evento"}
                  fill
                  className="object-cover"
                />
                {(() => {
                  const badge = getStatusBadgeConfig(evento.status || "Em Breve");
                  return (
                    <div className={`absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badge.badgeClass}`}>
                      {evento.status || "Em Breve"}
                    </div>
                  );
                })()}
                <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-900/80 text-white backdrop-blur-md">
                  {evento.category || "Geral"}
                </div>
              </div>

              <div className="p-5 flex flex-col flex-1 justify-between gap-4">
                <div className="space-y-2">
                  <h3 className="font-montserrat font-bold text-sm sm:text-base text-slate-900 dark:text-white line-clamp-2">
                    {evento.title || "Evento Científico"}
                  </h3>

                  <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>{evento.dateInicio ? evento.dateInicio.split("-").reverse().join("/") : evento.date || "Data a confirmar"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="truncate">{evento.local?.nomeLocal || evento.localization || "Local informado no evento"}</span>
                    </div>
                  </div>
                </div>

                {/* Ações do Card de Evento */}
                <div className="pt-3 border-t border-slate-100 dark:border-blue-900/30 flex flex-wrap items-center gap-2">
                  <Link
                    href={`/eventos/${evento.id}`}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#071321] dark:hover:bg-blue-950/60 text-slate-700 dark:text-slate-300 text-xs font-semibold text-center transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Ver</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>

                  {isPromotor && (
                    <>
                      <Link
                        href={`/eventos/createEvent?id=${evento.id}`}
                        className="py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Editar todas as informações do evento"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => setEventoParaExcluir(evento)}
                        className="p-2 rounded-xl border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                        title="Excluir evento definitivamente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-white dark:bg-[#0c1e33] rounded-3xl border border-dashed border-slate-200 dark:border-blue-900/40 space-y-4 max-w-lg mx-auto">
          <Calendar className="w-10 h-10 text-slate-400 mx-auto" />
          <div>
            <h3 className="font-montserrat font-bold text-slate-900 dark:text-white text-base">
              Nenhum evento encontrado
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {isPromotor
                ? "Você ainda não publicou nenhum evento científico na plataforma."
                : "Você ainda não se inscreveu em nenhum evento."}
            </p>
          </div>
          {isPromotor ? (
            <Link
              href="/eventos/createEvent"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Publicar Primeiro Evento</span>
            </Link>
          ) : (
            <Link
              href="/eventos"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
            >
              <span>Explorar Eventos Disponíveis</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {eventoParaExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#0c1e33] border border-slate-200 dark:border-blue-900/40 rounded-3xl p-6 sm:p-7 space-y-4 shadow-2xl animate-in fade-in">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-montserrat font-bold text-base text-slate-900 dark:text-white">
                  Excluir Evento
                </h3>
                <p className="text-xs text-slate-500">Ação irreversível</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Você tem certeza de que deseja excluir permanentemente o evento{" "}
              <strong>&ldquo;{eventoParaExcluir.title}&rdquo;</strong>? Todas as informações, dados de ingressos, palestrantes e minicursos serão removidos do banco de dados.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={excluindo}
                onClick={() => setEventoParaExcluir(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-blue-900/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={excluindo}
                onClick={handleConfirmarExclusao}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {excluindo ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Sim, Excluir Evento</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
