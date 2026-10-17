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
  ArrowRight,
  CreditCard,
  Lock,
  RefreshCw
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { buscarInscricoesDoUsuario } from "@/lib/inscricoes";

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
  asaasInvoiceUrl?: string;
}

export default function InscricoesPage() {
  const { user, userData } = useAuth();
  const [inscricoes, setInscricoes] = useState<InscricaoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<InscricaoItem | null>(null);
  const [verificandoId, setVerificandoId] = useState<string | null>(null);

  const carregarInscricoes = async () => {
    if (!user) return;
      try {
        setLoading(true);
        setError(null);

        // Busca inscrições reais com tolerância a dados legados e auto-vínculo
        const inscricoesBrutas = await buscarInscricoesDoUsuario(user);

        // Enriquece com dados atualizados do evento na coleção 'events'
        const docsEnriquecidos: InscricaoItem[] = await Promise.all(
          inscricoesBrutas.map(async (item) => {
            let titulo = item.eventoTitulo;
            let dataEvento = "Data a confirmar";
            let localEvento = "Local informado pelo evento";
            let categoriaEvento = item.lote || "Evento Científico";

            if (item.eventoId) {
              try {
                const evSnap = await getDoc(doc(db, "events", item.eventoId));
                if (evSnap.exists()) {
                  const evData = evSnap.data();
                  if (!titulo) titulo = evData.title;
                  categoriaEvento = evData.category || categoriaEvento;
                  if (evData.dateInicio) {
                    dataEvento = evData.dateInicio.split("-").reverse().join("/");
                    if (evData.dateFim) {
                      dataEvento += ` a ${evData.dateFim.split("-").reverse().join("/")}`;
                    }
                  } else if (evData.date) {
                    dataEvento = evData.date;
                  }
                  if (evData.local?.cidade) {
                    localEvento = `${evData.local?.nomeLocal ? evData.local.nomeLocal + " - " : ""}${evData.local.cidade}`;
                  } else if (evData["city-state"]) {
                    localEvento = evData["city-state"];
                  }
                }
              } catch (e) {
                console.log("Erro ao enriquecer evento da inscrição:", e);
              }
            }

            const valorFormatado = item.valor
              ? item.valor.includes("R$")
                ? item.valor
                : isNaN(Number(item.valor))
                  ? item.valor
                  : `R$ ${Number(item.valor).toFixed(2).replace(".", ",")}`
              : "Gratuito";

            const stLower = item.status?.toLowerCase() || "";
            const isPago =
              stLower === "confirmada" ||
              stLower === "confirmado" ||
              stLower === "pago" ||
              stLower === "received" ||
              stLower === "confirmed" ||
              stLower === "aprovado";

            const statusNorm = isPago
              ? "Confirmada"
              : stLower === "cancelada" || stLower === "cancelado"
              ? "Cancelada"
              : "Pendente";

            const invoiceUrl =
              item.asaasInvoiceUrl ||
              item.raw?.asaasInvoiceUrl ||
              item.raw?.checkoutUrl ||
              item.raw?.invoiceUrl ||
              item.raw?.bankInvoiceUrl ||
              "";

            return {
              id: item.id,
              eventoTitulo: titulo || "Evento Científico",
              categoria: categoriaEvento,
              lote: item.lote || "Inscrição Geral",
              valor: valorFormatado,
              data: dataEvento,
              local: localEvento,
              status: statusNorm,
              dataCompra: item.dataCompra || "Recente",
              codigoIngresso: item.codigoIngresso || item.ticketId || item.id,
              eventoId: item.eventoId,
              asaasInvoiceUrl: invoiceUrl,
            };
          })
        );

        setInscricoes(docsEnriquecidos);

        // Se houver qualquer inscrição pendente, dispara checagem assíncrona com o Asaas
        const pendentes = docsEnriquecidos.filter((d) => d.status === "Pendente");
        if (pendentes.length > 0) {
          fetch("/api/asaas/verificar-pagamento")
            .then((r) => r.json())
            .then((resSync) => {
              if (resSync.atualizadas && resSync.atualizadas > 0) {
                buscarInscricoesDoUsuario(user).then((novas) => {
                  setInscricoes((prev) =>
                    prev.map((item) => {
                      const updated = novas.find((n) => n.id === item.id);
                      if (updated && (updated.status === "Confirmada" || updated.status === "confirmado")) {
                        return { ...item, status: "Confirmada" };
                      }
                      return item;
                    })
                  );
                });
              }
            })
            .catch(() => {});
        }
      } catch (err: any) {
        console.error("Erro ao buscar inscrições:", err);
        setError("Não foi possível carregar as inscrições do banco de dados.");
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    carregarInscricoes();
  }, [user]);

  const handleVerificarPagamento = async (inscricaoId: string) => {
    try {
      setVerificandoId(inscricaoId);
      const res = await fetch(`/api/asaas/verificar-pagamento?inscricaoId=${inscricaoId}`);
      const data = await res.json();
      if (data.status === "Confirmada") {
        alert("🎉 Pagamento confirmado com sucesso no Asaas! Sua inscrição e credencial estão liberadas.");
        await carregarInscricoes();
      } else {
        alert("O Asaas ainda não identificou a compensação deste pagamento. Se você pagou recentemente, aguarde alguns instantes e tente novamente.");
      }
    } catch (err) {
      console.error("Erro ao verificar pagamento:", err);
      alert("Não foi possível consultar o Asaas no momento. Tente novamente em instantes.");
    } finally {
      setVerificandoId(null);
    }
  };

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
                  {item.status === "Confirmada" ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Confirmada</span>
                    </span>
                  ) : item.status === "Cancelada" ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/40">
                      <AlertCircle className="w-3 h-3" />
                      <span>Cancelada</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40">
                      <Clock className="w-3 h-3 text-amber-500" />
                      <span>Aguardando Pagamento</span>
                    </span>
                  )}
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
                {item.status === "Pendente" ? (
                  <>
                    {item.asaasInvoiceUrl && (
                      <a
                        href={item.asaasInvoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Pagar Inscrição</span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => handleVerificarPagamento(item.id)}
                      disabled={verificandoId === item.id}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-semibold transition-all cursor-pointer"
                      title="Clique para checar a compensação no Asaas agora"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${verificandoId === item.id ? "animate-spin" : ""}`} />
                      <span>{verificandoId === item.id ? "Verificando..." : "Já Paguei"}</span>
                    </button>

                    <button
                      type="button"
                      disabled
                      title="Disponível após a confirmação do pagamento"
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/70 text-slate-400 dark:text-slate-500 text-xs font-semibold cursor-not-allowed border border-slate-200/50 dark:border-slate-700/50"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Credencial Bloqueada</span>
                    </button>
                  </>
                ) : item.status === "Confirmada" ? (
                  <button
                    type="button"
                    onClick={() => setSelectedTicket(item)}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Ver Credencial</span>
                  </button>
                ) : null}

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
