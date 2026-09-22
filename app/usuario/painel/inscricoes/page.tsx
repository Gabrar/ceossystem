"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Ticket,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  Download,
  QrCode,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  Loader2,
  ArrowRight
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface InscricaoItem {
  id: string;
  eventoTitulo: string;
  categoria?: string;
  lote?: string;
  valor?: string;
  data?: string;
  local?: string;
  status?: string;
  dataCompra?: string;
  codigoIngresso?: string;
  eventoId?: string;
}

export default function InscricoesPage() {
  const { user, userData } = useAuth();
  const [inscricoes, setInscricoes] = useState<InscricaoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<InscricaoItem | null>(null);

  useEffect(() => {
    async function carregarInscricoes() {
      if (!user) return;
      try {
        setLoading(true);
        setError(null);

        // Busca inscrições reais associadas ao usuário logado no Firestore
        const qByUid = query(
          collection(db, "inscricoes"),
          where("userId", "==", user.uid)
        );
        const snapUid = await getDocs(qByUid);

        let docs = snapUid.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            eventoTitulo: data.eventoTitulo || data.eventTitle || data.title || "Inscrição em Evento",
            categoria: data.categoria || data.category || "Evento Científico",
            lote: data.lote || data.batch || "Inscrição Geral",
            valor: data.valor || data.preco || "",
            data: data.data || data.date || "A definir",
            local: data.local || data.cidade || "Local informado pelo evento",
            status: data.status || "Confirmada",
            dataCompra: data.dataCompra || (data.createdAt ? new Date(data.createdAt).toLocaleDateString("pt-BR") : ""),
            codigoIngresso: data.codigoIngresso || data.ticketCode || d.id,
            eventoId: data.eventoId || data.eventId || "",
          };
        });

        // Caso não encontre por UID, busca por e-mail
        if (docs.length === 0 && user.email) {
          const qByEmail = query(
            collection(db, "inscricoes"),
            where("userEmail", "==", user.email)
          );
          const snapEmail = await getDocs(qByEmail);
          docs = snapEmail.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              eventoTitulo: data.eventoTitulo || data.eventTitle || data.title || "Inscrição em Evento",
              categoria: data.categoria || data.category || "Evento Científico",
              lote: data.lote || data.batch || "Inscrição Geral",
              valor: data.valor || data.preco || "",
              data: data.data || data.date || "A definir",
              local: data.local || data.cidade || "Local informado pelo evento",
              status: data.status || "Confirmada",
              dataCompra: data.dataCompra || (data.createdAt ? new Date(data.createdAt).toLocaleDateString("pt-BR") : ""),
              codigoIngresso: data.codigoIngresso || data.ticketCode || d.id,
              eventoId: data.eventoId || data.eventId || "",
            };
          });
        }

        setInscricoes(docs);
      } catch (err: any) {
        console.error("Erro ao buscar inscrições:", err);
        setError("Não foi possível carregar as inscrições do banco de dados.");
      } finally {
        setLoading(false);
      }
    }

    carregarInscricoes();
  }, [user]);

  return (
    <div className="space-y-6">
      
      {/* Cabeçalho */}
      <div>
        <h1 className="font-montserrat text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          Minhas Inscrições
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Acesse seus ingressos digitais, comprovantes de pagamento e credenciais de acesso aos eventos.
        </p>
      </div>

      {/* Estados de Carregamento, Erro ou Lista */}
      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-xs sm:text-sm text-slate-500">Consultando inscrições no banco de dados...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-white dark:bg-[#0c1e33] rounded-3xl border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p className="text-xs sm:text-sm font-semibold">{error}</p>
        </div>
      ) : inscricoes.length > 0 ? (
        <div className="space-y-4">
          {inscricoes.map((item) => (
            <div
              key={item.id}
              className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#0c1e33] border border-slate-200/90 dark:border-blue-900/40 shadow-xs hover:shadow-md transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
            >
              <div className="space-y-3 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{item.status}</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/30">
                    {item.categoria}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Cód: <strong>{item.codigoIngresso}</strong>
                  </span>
                </div>

                <h3 className="font-montserrat font-bold text-base sm:text-lg text-slate-900 dark:text-white leading-snug">
                  {item.eventoTitulo}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs text-slate-600 dark:text-slate-300 pt-1">
                  <div className="flex items-center gap-2">
                    <Ticket className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="truncate">{item.lote} {item.valor ? `(${item.valor})` : ""}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>{item.data}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="truncate">{item.local}</span>
                  </div>
                </div>
              </div>

              {/* Ações do Ingresso */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full lg:w-auto shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-blue-900/30">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(item)}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Ver Credencial</span>
                </button>

                {item.eventoId && (
                  <Link
                    href={`/eventos/${item.eventoId}`}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-blue-900/50 hover:bg-slate-50 dark:hover:bg-blue-950/60 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <span>Ver Evento</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-white dark:bg-[#0c1e33] rounded-3xl border border-dashed border-slate-200 dark:border-blue-900/40 space-y-4 max-w-lg mx-auto">
          <Ticket className="w-10 h-10 text-slate-400 mx-auto" />
          <div>
            <h3 className="font-montserrat font-bold text-slate-900 dark:text-white text-base">
              Nenhuma inscrição encontrada
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Você ainda não possui inscrições ativas registradas. Explore os eventos disponíveis e garanta sua vaga.
            </p>
          </div>
          <Link
            href="/eventos"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
          >
            <span>Explorar Eventos</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Modal / Visualizador de Credencial & QR Code */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-[#0c1e33] border border-slate-200 dark:border-blue-900/40 rounded-3xl p-6 text-center space-y-4 shadow-2xl animate-in fade-in">
            <div className="inline-flex p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <QrCode className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs uppercase tracking-wider font-bold text-blue-600 dark:text-blue-400">
                Credencial do Congressista
              </span>
              <h3 className="font-montserrat font-bold text-base text-slate-900 dark:text-white mt-1">
                {selectedTicket.eventoTitulo}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Apresente este código no credenciamento presencial
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 w-44 h-44 mx-auto flex items-center justify-center shadow-inner">
              <div className="w-36 h-36 border-4 border-slate-900 border-dashed rounded-xl flex items-center justify-center flex-col gap-1 p-2 text-slate-900">
                <QrCode className="w-16 h-16" />
                <span className="font-mono text-[9px] font-bold">{selectedTicket.codigoIngresso}</span>
              </div>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300">
              Titular: <strong>{userData?.nome || user?.displayName || "Congressista"}</strong>
            </div>

            <button
              type="button"
              onClick={() => setSelectedTicket(null)}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              Fechar Credencial
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
