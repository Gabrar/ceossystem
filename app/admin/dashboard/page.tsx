"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  buscarMetricasDashboardAdmin,
  buscarEventosAdmin,
  buscarDadosGraficoVisitas,
  AdminDashboardMetrics,
  AdminEventItem,
  VisitaDataPoint,
  atualizarTaxaCeosEvento,
} from "@/lib/admin";
import {
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
  Ticket,
  Percent,
  Crown,
  ArrowUpRight,
  Eye,
  BarChart3,
  Loader2,
  ChevronRight,
  Filter,
  CheckCircle2,
  AlertCircle,
  Pencil,
  X,
  ShieldCheck,
  Globe,
  Laptop,
  Smartphone,
  Activity,
  Layers,
  Sparkles,
  RefreshCw,
  Flame,
  Share2,
  Compass,
  MousePointerClick,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [metricas, setMetricas] = useState<AdminDashboardMetrics | null>(null);
  const [eventos, setEventos] = useState<AdminEventItem[]>([]);

  // Estado da integração com Vercel Web Analytics
  const [vercelData, setVercelData] = useState<any | null>(null);
  const [loadingVercel, setLoadingVercel] = useState(false);
  const [abaVisitas, setAbaVisitas] = useState<"grafico" | "paginas" | "origens" | "dispositivos">("grafico");
  const [modoMetricaGrafico, setModoMetricaGrafico] = useState<"ambos" | "pageviews" | "visitantes">("ambos");

  // Estado do gráfico de visitas
  const [periodoVisitas, setPeriodoVisitas] = useState<"dia" | "mes" | "ano">("dia");
  const [dadosGrafico, setDadosGrafico] = useState<{
    pontos: VisitaDataPoint[];
    totalVisitas: number;
    totalConversoes: number;
  }>({
    pontos: [],
    totalVisitas: 0,
    totalConversoes: 0,
  });
  const [loadingGrafico, setLoadingGrafico] = useState(false);
  const [pontoAtivo, setPontoAtivo] = useState<any | null>(null);

  // Modal para ajuste rápido da taxa Céos de um evento
  const [eventoAjustarTaxa, setEventoAjustarTaxa] = useState<AdminEventItem | null>(null);
  const [novaTaxaInput, setNovaTaxaInput] = useState<number>(8);
  const [salvandoTaxa, setSalvandoTaxa] = useState(false);
  const [sucessoTaxa, setSucessoTaxa] = useState(false);

  // 1. Carrega métricas e eventos iniciais
  useEffect(() => {
    const carregarTudo = async () => {
      setLoading(true);
      try {
        const [met, evs] = await Promise.all([
          buscarMetricasDashboardAdmin(),
          buscarEventosAdmin(),
        ]);
        setMetricas(met);
        setEventos(evs);
      } catch (err) {
        console.error("Erro ao carregar dashboard admin:", err);
      } finally {
        setLoading(false);
      }
    };
    carregarTudo();
  }, []);

  // 2. Carrega dados do gráfico de visitas quando o período muda
  useEffect(() => {
    const carregarVisitas = async () => {
      setLoadingGrafico(true);
      try {
        const res = await buscarDadosGraficoVisitas(periodoVisitas);
        setDadosGrafico(res);
        if (res.pontos.length > 0) {
          setPontoAtivo(res.pontos[res.pontos.length - 1]);
        }
      } catch (err) {
        console.error("Erro ao carregar dados do gráfico de visitas:", err);
      } finally {
        setLoadingGrafico(false);
      }
    };
    carregarVisitas();
  }, [periodoVisitas]);

  // 3. Carrega métricas do Vercel Web Analytics em paralelo
  const carregarVercel = async (forcarAtualizacao = false) => {
    setLoadingVercel(true);
    try {
      const cacheBust = forcarAtualizacao ? `&_t=${Date.now()}` : "";
      const res = await fetch(`/api/admin/analytics?periodo=${periodoVisitas}${cacheBust}`);
      if (res.ok) {
        const json = await res.json();
        if (json.conectado) {
          setVercelData(json);
          if (json.pontosGrafico && json.pontosGrafico.length > 0) {
            const ultimo = json.pontosGrafico[json.pontosGrafico.length - 1];
            setPontoAtivo({
              label: ultimo.label,
              dataCompleta: ultimo.dataCompleta,
              visitas: ultimo.visitors,
              pageviews: ultimo.pageviews,
              conversoes: 0,
              receita: 0,
            });
          }
        }
      }
    } catch (err) {
      console.error("Erro ao carregar Vercel Analytics:", err);
    } finally {
      setLoadingVercel(false);
    }
  };

  useEffect(() => {
    carregarVercel();
  }, [periodoVisitas]);

  // Salvar nova taxa negociada da Céos
  const handleSalvarTaxa = async () => {
    if (!eventoAjustarTaxa) return;
    setSalvandoTaxa(true);
    try {
      await atualizarTaxaCeosEvento(eventoAjustarTaxa.id, novaTaxaInput);

      // Atualiza localmente
      setEventos((prev) =>
        prev.map((ev) =>
          ev.id === eventoAjustarTaxa.id
            ? {
                ...ev,
                taxaCeos: novaTaxaInput,
                comissaoCeos: Number(((ev.receitaBruta * novaTaxaInput) / 100).toFixed(2)),
                repassePromotor: Number((ev.receitaBruta - (ev.receitaBruta * novaTaxaInput) / 100).toFixed(2)),
              }
            : ev
        )
      );

      // Recalcula métricas globais
      const metAtualizadas = await buscarMetricasDashboardAdmin();
      setMetricas(metAtualizadas);

      setSucessoTaxa(true);
      setTimeout(() => {
        setSucessoTaxa(false);
        setEventoAjustarTaxa(null);
      }, 1200);
    } catch (err) {
      console.error("Erro ao salvar taxa:", err);
      alert("Não foi possível salvar a nova taxa.");
    } finally {
      setSalvandoTaxa(false);
    }
  };

  // Combina e prioriza pontos analíticos oficiais do Vercel Analytics se disponíveis
  const pontosGraficoFinal = useMemo(() => {
    if (vercelData?.pontosGrafico && vercelData.pontosGrafico.length > 0) {
      return vercelData.pontosGrafico.map((p: any) => {
        const local = dadosGrafico.pontos.find((lp) => lp.label === p.label);
        return {
          label: p.label,
          dataCompleta: p.dataCompleta,
          visitas: p.visitors,
          pageviews: p.pageviews,
          conversoes: local?.conversoes || 0,
          receita: local?.receita || 0,
        };
      });
    }
    return [];
  }, [vercelData, dadosGrafico.pontos]);

  // Cálculo de altura máxima para normalizar barras do gráfico
  const maxVisitas = useMemo(() => {
    const pontos = pontosGraficoFinal;
    if (pontos.length === 0) return 10;
    const max = Math.max(
      ...pontos.map((p: any) => {
        if (modoMetricaGrafico === "visitantes") return p.visitas || 0;
        if (modoMetricaGrafico === "pageviews") return p.pageviews || 0;
        return Math.max(p.visitas || 0, p.pageviews || 0);
      })
    );
    return max > 0 ? max : 10;
  }, [pontosGraficoFinal, modoMetricaGrafico]);

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <Loader2 className="w-10 h-10 text-amber-400 animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-400">
          Carregando indicadores consolidados da Céos System...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* CABEÇALHO DO DASHBOARD */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-900/40 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-widest">
            <Crown className="w-3.5 h-3.5" />
            <span>Painel Estratégico do Dono</span>
          </div>
          <h1 className="font-montserrat text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Visão Geral da Plataforma
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Métricas de faturamento, comissão Céos, visitas na plataforma e controle de taxas negociadas
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/eventos"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
            <span>Gerenciar Todos os Eventos</span>
          </Link>
        </div>
      </div>

      {/* 1. CARDS DE KPIS PRINCIPAIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Lucro da Céos (Comissão Total Retida) - DESTAQUE MASTER */}
        <div className="relative overflow-hidden p-5 rounded-3xl bg-gradient-to-br from-amber-500/15 via-[#0c1e33] to-[#071321] border border-amber-500/40 shadow-xl space-y-3 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Crown className="w-4 h-4" />
              <span>Comissão Céos System</span>
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/30">
              <DollarSign className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>
          <div>
            <p className="font-montserrat text-2xl sm:text-3xl font-black text-amber-400 tracking-tight">
              R$ {metricas?.comissaoTotalCeos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Taxa Média: {metricas?.taxaMediaCeos}%
              </span>
              <span className="text-[11px] text-slate-400">Lucro líquido da plataforma</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Faturamento Bruto Total (GMV) */}
        <div className="p-5 rounded-3xl bg-[#0c1e33] border border-blue-900/40 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              Volume Total Transacionado
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="font-montserrat text-2xl sm:text-3xl font-extrabold text-white">
              R$ {metricas?.faturamentoTotalBruto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Repasse aos Promotores:{" "}
              <strong className="text-slate-300">
                R$ {metricas?.repasseTotalPromotores.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </strong>
            </p>
          </div>
        </div>

        {/* KPI 3: Ingressos Vendidos */}
        <div className="p-5 rounded-3xl bg-[#0c1e33] border border-blue-900/40 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              Ingressos Confirmados
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="font-montserrat text-2xl sm:text-3xl font-extrabold text-white">
              {metricas?.totalIngressosVendidos.toLocaleString("pt-BR")}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Distribuídos em{" "}
              <strong className="text-slate-300">{metricas?.totalEventos} eventos</strong> cadastrados
            </p>
          </div>
        </div>

        {/* KPI 4: Base de Usuários */}
        <div className="p-5 rounded-3xl bg-[#0c1e33] border border-blue-900/40 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              Usuários Cadastrados
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="font-montserrat text-2xl sm:text-3xl font-extrabold text-white">
              {metricas?.totalUsuarios.toLocaleString("pt-BR")}
            </p>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
              <span className="text-emerald-400 font-semibold">{metricas?.totalPromotores} promotores</span>
              <span>•</span>
              <span className="text-blue-400 font-semibold">{metricas?.totalParticipantes} congressistas / acadêmicos</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. GRÁFICO & ANALYTICS OFICIAL VERCEL & CÉOS */}
      <div className="p-6 sm:p-7 rounded-3xl bg-[#0c1e33] border border-blue-900/40 shadow-lg space-y-6">
        
        {/* Cabeçalho do Bloco Analítico */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h2 className="font-montserrat font-bold text-lg text-white">
                Visitas & Tráfego Oficial
              </h2>
              {/* Badge Vercel Conectado */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Vercel Analytics (Ativo)</span>
              </div>
              {/* Botão de Atualização em Tempo Real */}
              <button
                type="button"
                onClick={() => carregarVercel(true)}
                disabled={loadingVercel}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 hover:text-white text-[11px] font-medium transition-all cursor-pointer disabled:opacity-50"
                title="Buscar telemetria mais recente da Vercel agora"
              >
                <RefreshCw className={`w-3 h-3 ${loadingVercel ? "animate-spin text-amber-400" : ""}`} />
                <span>{loadingVercel ? "Atualizando..." : "Atualizar"}</span>
              </button>
            </div>

            <p className="text-xs text-slate-400 mt-1.5 flex flex-wrap items-center gap-2">
              <span>Métricas auditadas em tempo real via Vercel Web Analytics</span>
              <span>•</span>
              <span className="text-slate-300">
                {vercelData?.totalPageviews
                  ? `${vercelData.totalPageviews.toLocaleString("pt-BR")} visualizações registradas`
                  : "Coleta ativa"}
              </span>
              {vercelData?.updatedAt && (
                <>
                  <span>•</span>
                  <span className="text-slate-500 text-[11px]">
                    Sincronizado às {new Date(vercelData.updatedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                </>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
            {/* Seletor de Período (7 dias / 30 dias / Anual) */}
            <div className="flex items-center bg-[#071321] p-1 rounded-2xl border border-blue-900/50">
              <button
                type="button"
                onClick={() => setPeriodoVisitas("dia")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  periodoVisitas === "dia"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                7 Dias
              </button>
              <button
                type="button"
                onClick={() => setPeriodoVisitas("mes")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  periodoVisitas === "mes"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                30 Dias
              </button>
              <button
                type="button"
                onClick={() => setPeriodoVisitas("ano")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  periodoVisitas === "ano"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Anual
              </button>
            </div>
          </div>
        </div>

        {/* 4 Cards de Resumo Analítico */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-[#071321]/70 border border-blue-900/40 relative overflow-hidden group hover:border-blue-700/50 transition-all">
            <span className="text-[11px] font-medium text-slate-400">Visitantes Únicos (Vercel)</span>
            <p className="text-2xl font-black text-white mt-1">
              {(vercelData?.totalVisitors || 0).toLocaleString("pt-BR")}
            </p>
            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Telemetria verificada
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#071321]/70 border border-blue-900/40 relative overflow-hidden group hover:border-cyan-700/50 transition-all">
            <span className="text-[11px] font-medium text-slate-400">Visualizações de Páginas</span>
            <p className="text-2xl font-black text-cyan-400 mt-1">
              {(vercelData?.totalPageviews || 0).toLocaleString("pt-BR")}
            </p>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Pageviews agregados no período
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#071321]/70 border border-blue-900/40 relative overflow-hidden group hover:border-amber-700/50 transition-all">
            <span className="text-[11px] font-medium text-slate-400">Média Páginas / Visitante</span>
            <p className="text-2xl font-black text-amber-400 mt-1">
              {vercelData?.mediaPorVisitante || "1.0"}
            </p>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Engajamento médio por sessão
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#071321]/70 border border-blue-900/40 relative overflow-hidden group hover:border-emerald-700/50 transition-all">
            <span className="text-[11px] font-medium text-slate-400">Inscrições Céos no Período</span>
            <p className="text-2xl font-black text-emerald-400 mt-1">
              {dadosGrafico.totalConversoes.toLocaleString("pt-BR")}
            </p>
            <span className="text-[10px] text-amber-400 font-semibold mt-0.5 block">
              Conversão:{" "}
              {vercelData?.totalVisitors > 0
                ? `${((dadosGrafico.totalConversoes / vercelData.totalVisitors) * 100).toFixed(1)}%`
                : "0%"}
            </span>
          </div>
        </div>

        {/* Banner de Destaque: Pico de Acessos */}
        {vercelData?.picoDia && (
          <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-[#071321] to-[#071321] border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Flame className="w-4 h-4" />
              </div>
              <div className="text-slate-300">
                <span className="font-bold text-amber-400">Pico de Audiência:</span> Maior movimento registrado em{" "}
                <strong className="text-white capitalize">{vercelData.picoDia.data}</strong> com{" "}
                <strong className="text-cyan-400">{vercelData.picoDia.views} visualizações</strong> e{" "}
                <strong className="text-amber-400">{vercelData.picoDia.visitors} visitantes únicos</strong>.
              </div>
            </div>
            <span className="text-[10px] uppercase font-bold text-amber-400/80 px-2 py-0.5 rounded-md bg-amber-400/10 hidden md:inline-block">
              Recorde do Período
            </span>
          </div>
        )}

        {/* Barra de Navegação das 4 Abas Analíticas */}
        <div className="flex items-center gap-2 border-b border-blue-900/40 pb-3 overflow-x-auto">
          <button
            type="button"
            onClick={() => setAbaVisitas("grafico")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              abaVisitas === "grafico"
                ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20"
                : "bg-[#071321] text-slate-400 hover:text-white border border-blue-900/40"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Gráfico & Linha do Tempo</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaVisitas("paginas")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              abaVisitas === "paginas"
                ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20"
                : "bg-[#071321] text-slate-400 hover:text-white border border-blue-900/40"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Páginas Mais Acessadas</span>
            {vercelData?.topPaginas && vercelData.topPaginas.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${abaVisitas === "paginas" ? "bg-slate-950 text-amber-400" : "bg-blue-900/60 text-slate-300"}`}>
                {vercelData.topPaginas.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setAbaVisitas("origens")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              abaVisitas === "origens"
                ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20"
                : "bg-[#071321] text-slate-400 hover:text-white border border-blue-900/40"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Fontes de Tráfego</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaVisitas("dispositivos")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              abaVisitas === "dispositivos"
                ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20"
                : "bg-[#071321] text-slate-400 hover:text-white border border-blue-900/40"
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Dispositivos & Geografia</span>
          </button>
        </div>

        {/* Visualização de Conteúdo das Abas */}
        {loadingGrafico || loadingVercel ? (
          <div className="h-64 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
            <span className="text-xs text-slate-400 font-semibold">
              Carregando dados em tempo real da Vercel...
            </span>
          </div>
        ) : abaVisitas === "grafico" ? (
          /* ========================================================
             ABA 1: GRÁFICO CRONOLÓGICO INTERATIVO DE ALTA DEFINIÇÃO
             ======================================================== */
          <div className="space-y-4">
            {/* Controles do Gráfico (Legenda e Seletor de Métrica) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400 px-1 pt-1">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-t from-cyan-600 to-cyan-400" />
                  <span className="text-slate-300 font-medium">Visualizações (Pageviews)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-t from-amber-600 to-amber-400" />
                  <span className="text-slate-300 font-medium">Visitantes Únicos</span>
                </span>
              </div>

              {/* Alternador de exibição das barras */}
              <div className="flex items-center bg-[#071321] p-1 rounded-xl border border-blue-900/50 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setModoMetricaGrafico("ambos")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                    modoMetricaGrafico === "ambos"
                      ? "bg-slate-800 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Comparativo
                </button>
                <button
                  type="button"
                  onClick={() => setModoMetricaGrafico("pageviews")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                    modoMetricaGrafico === "pageviews"
                      ? "bg-cyan-600/30 text-cyan-300 border border-cyan-500/40"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Só Pageviews
                </button>
                <button
                  type="button"
                  onClick={() => setModoMetricaGrafico("visitantes")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                    modoMetricaGrafico === "visitantes"
                      ? "bg-amber-600/30 text-amber-300 border border-amber-500/40"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Só Visitantes
                </button>
              </div>
            </div>

            {/* Container do Gráfico com Grid e Barras */}
            <div className="relative h-64 pt-8 px-2 border-b border-blue-900/30">
              {/* Linhas guias horizontais sutis (25%, 50%, 75%, 100%) */}
              <div className="absolute inset-0 top-8 bottom-0 flex flex-col justify-between pointer-events-none opacity-20">
                <div className="border-b border-slate-600 w-full" />
                <div className="border-b border-slate-600 w-full" />
                <div className="border-b border-slate-600 w-full" />
                <div className="border-b border-slate-600 w-full" />
              </div>

              {/* Barras Cronológicas */}
              <div className="relative h-full flex items-end justify-between gap-1.5 sm:gap-2.5 overflow-x-auto z-10 pb-2">
                {pontosGraficoFinal.map((ponto: any, idx: number) => {
                  const views = ponto.pageviews || 0;
                  const visitors = ponto.visitas || 0;
                  const isSelected = pontoAtivo?.label === ponto.label;

                  // Calcula alturas proporcionais
                  const alturaViewsPct = views > 0 ? Math.max(Math.round((views / maxVisitas) * 100), 8) : 0;
                  const alturaVisitorsPct = visitors > 0 ? Math.max(Math.round((visitors / maxVisitas) * 100), 8) : 0;

                  return (
                    <div
                      key={ponto.label + idx}
                      onClick={() => setPontoAtivo(ponto)}
                      className="flex-1 min-w-[30px] max-w-[56px] flex flex-col items-center h-full justify-end group cursor-pointer"
                    >
                      {/* Tooltip / Valor flutuante superior */}
                      <div
                        className={`text-[10px] font-bold mb-1 transition-all ${
                          isSelected
                            ? "text-amber-400 opacity-100 scale-105"
                            : "text-slate-400 opacity-0 group-hover:opacity-100"
                        }`}
                      >
                        {modoMetricaGrafico === "visitantes" ? visitors : views}
                      </div>

                      {/* Visualizador de Barra Conforme o Modo */}
                      {modoMetricaGrafico === "ambos" ? (
                        // Modo Comparativo: Duas barras finas lado a lado
                        <div className="w-full flex items-end justify-center gap-1 h-full">
                          {/* Barra 1: Pageviews (Cyan) */}
                          <div
                            className="w-1/2 max-w-[14px] bg-slate-800/80 rounded-t-md overflow-hidden flex flex-col justify-end group-hover:brightness-125 transition-all"
                            style={{ height: `${alturaViewsPct}%` }}
                          >
                            <div className="w-full h-full bg-gradient-to-t from-cyan-600 via-cyan-500 to-cyan-300 rounded-t-md" />
                          </div>

                          {/* Barra 2: Visitantes Únicos (Amber) */}
                          <div
                            className="w-1/2 max-w-[14px] bg-slate-800/80 rounded-t-md overflow-hidden flex flex-col justify-end group-hover:brightness-125 transition-all"
                            style={{ height: `${alturaVisitorsPct}%` }}
                          >
                            <div className="w-full h-full bg-gradient-to-t from-amber-600 via-amber-500 to-amber-300 rounded-t-md" />
                          </div>
                        </div>
                      ) : (
                        // Modo Individual (Pageviews ou Visitantes)
                        <div className="w-full flex items-end justify-center h-full">
                          <div
                            className="w-full max-w-[24px] bg-slate-800/80 rounded-t-xl overflow-hidden flex flex-col justify-end transition-all group-hover:brightness-125"
                            style={{
                              height: `${modoMetricaGrafico === "visitantes" ? alturaVisitorsPct : alturaViewsPct}%`,
                            }}
                          >
                            <div
                              className={`w-full h-full rounded-t-xl transition-all duration-500 ${
                                modoMetricaGrafico === "visitantes"
                                  ? "bg-gradient-to-t from-amber-600 via-amber-400 to-amber-300"
                                  : "bg-gradient-to-t from-blue-700 via-cyan-500 to-cyan-300"
                              }`}
                            />
                          </div>
                        </div>
                      )}

                      {/* Rótulo no Eixo X */}
                      <span
                        className={`text-[10px] sm:text-[11px] font-semibold mt-2.5 truncate max-w-[50px] text-center ${
                          isSelected
                            ? "text-amber-400 font-extrabold"
                            : "text-slate-400 group-hover:text-white"
                        }`}
                      >
                        {ponto.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Painel de Auditoria do Ponto Selecionado */}
            {pontoAtivo && (
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-[#071321] to-[#071321] border border-amber-500/25 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                  <span className="text-slate-200">
                    Inspeção do dia: <strong className="text-white capitalize">{pontoAtivo.dataCompleta || pontoAtivo.label}</strong>
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-5 text-xs">
                  <div>
                    <span className="text-slate-400">Visitantes Únicos:</span>{" "}
                    <strong className="text-amber-400">{pontoAtivo.visitas || 0}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Visualizações (Views):</span>{" "}
                    <strong className="text-cyan-400">{pontoAtivo.pageviews || 0}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Inscrições Céos:</span>{" "}
                    <strong className="text-emerald-400">{pontoAtivo.conversoes || 0}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Receita do Dia:</span>{" "}
                    <strong className="text-white">
                      R$ {(pontoAtivo.receita || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : abaVisitas === "paginas" ? (
          /* ========================================================
             ABA 2: PÁGINAS MAIS ACESSADAS & CONTEÚDO POPULAR
             ======================================================== */
          <div className="p-4 sm:p-5 rounded-2xl bg-[#071321]/80 border border-blue-900/40 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>Ranking de Páginas Mais Visitadas</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Rotas que mais atraem público e geram visualizações na plataforma
                </p>
              </div>
              <span className="text-xs text-slate-400">
                Total de <strong className="text-white">{vercelData?.totalPageviews || 0}</strong> pageviews
              </span>
            </div>

            {vercelData?.topPaginas && vercelData.topPaginas.length > 0 ? (
              <div className="space-y-3 pt-1">
                {vercelData.topPaginas.map((pag: any, i: number) => {
                  const maiorView = vercelData.topPaginas[0]?.pageviews || 1;
                  const percent = Math.max(Math.round((pag.pageviews / maiorView) * 100), 6);
                  const shareTotal = vercelData.totalPageviews > 0
                    ? ((pag.pageviews / vercelData.totalPageviews) * 100).toFixed(1)
                    : "0";

                  return (
                    <div key={pag.path + i} className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/20 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                        <div className="flex items-center gap-2.5">
                          <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-extrabold ${
                            i === 0
                              ? "bg-amber-400 text-slate-950"
                              : i === 1
                              ? "bg-slate-300 text-slate-950"
                              : i === 2
                              ? "bg-amber-700 text-white"
                              : "bg-slate-800 text-slate-400"
                          }`}>
                            #{i + 1}
                          </span>
                          <div>
                            <span className="font-bold text-white block">
                              {pag.nomeAmigavel}
                            </span>
                            <span className="font-mono text-[11px] text-cyan-400/90 truncate max-w-[280px] sm:max-w-md block">
                              {pag.path}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-right self-end sm:self-center">
                          <div>
                            <span className="text-white font-extrabold text-sm">{pag.pageviews}</span>
                            <span className="text-[10px] text-slate-400 block">views ({shareTotal}%)</span>
                          </div>
                          <div>
                            <span className="text-amber-400 font-bold text-xs">{pag.visitors}</span>
                            <span className="text-[10px] text-slate-400 block">visitantes</span>
                          </div>
                        </div>
                      </div>

                      {/* Barra de Proporção Visual */}
                      <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-10 text-center">
                Aguardando os primeiros registros de páginas visitadas.
              </p>
            )}
          </div>
        ) : abaVisitas === "origens" ? (
          /* ========================================================
             ABA 3: FONTES DE TRÁFEGO & ORIGEM (REFERRERS)
             ======================================================== */
          <div className="p-4 sm:p-5 rounded-2xl bg-[#071321]/80 border border-blue-900/40 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Compass className="w-4 h-4 text-emerald-400" />
                  <span>Origem dos Acessos & Canais de Aquisição</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  De onde vieram os congressistas, médicos e promotores que acessaram a plataforma
                </p>
              </div>
            </div>

            {vercelData?.fontesTrafego && vercelData.fontesTrafego.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {vercelData.fontesTrafego.map((origem: any, i: number) => {
                  const pct = vercelData.totalPageviews > 0
                    ? Math.round((origem.pageviews / vercelData.totalPageviews) * 100)
                    : 100;

                  return (
                    <div
                      key={origem.nome + i}
                      className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/30 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                          {origem.tipo === "search" ? (
                            <Compass className="w-4 h-4" />
                          ) : origem.tipo === "social" ? (
                            <Share2 className="w-4 h-4" />
                          ) : (
                            <MousePointerClick className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block">{origem.nome}</span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {origem.hostname || "Tráfego Direto"}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-base font-black text-white">{pct}%</span>
                        <span className="text-[10px] text-slate-400 block">
                          {origem.pageviews} views ({origem.visitors} ún.)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-10 text-center">
                Aguardando consolidação de fontes de tráfego.
              </p>
            )}
          </div>
        ) : (
          /* ========================================================
             ABA 4: DISPOSITIVOS, SISTEMAS, NAVEGADORES & GEOGRAFIA
             ======================================================== */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Bloco 1: Dispositivos */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#071321]/80 border border-blue-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-amber-400" />
                  <h3 className="font-bold text-sm text-white">Dispositivos</h3>
                </div>
                <span className="text-[11px] text-slate-400">Proporção</span>
              </div>

              {vercelData?.dispositivos && vercelData.dispositivos.length > 0 ? (
                <div className="space-y-3 pt-1">
                  {vercelData.dispositivos.map((d: any, i: number) => {
                    const totalD = vercelData.totalPageviews || 1;
                    const pct = Math.round((d.pageviews / totalD) * 100);
                    const isDesktop = d.device.toLowerCase().includes("desktop");

                    return (
                      <div key={d.device + i} className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/30 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          {isDesktop ? (
                            <Laptop className="w-5 h-5 text-blue-400" />
                          ) : (
                            <Smartphone className="w-5 h-5 text-emerald-400" />
                          )}
                          <div>
                            <span className="text-xs font-bold text-white capitalize">{d.device}</span>
                            <span className="text-[10px] text-slate-400 block">{d.visitors} visitante(s) único(s)</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-white">{pct}%</span>
                          <span className="text-[10px] text-slate-400 block">{d.pageviews} views</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-6 text-center">Nenhum dado de dispositivo coletado.</p>
              )}
            </div>

            {/* Bloco 2: Origem dos Visitantes (Países) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#071321]/80 border border-blue-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-sm text-white">Origem Geográfica</h3>
                </div>
                <span className="text-[11px] text-slate-400">País</span>
              </div>

              {vercelData?.paises && vercelData.paises.length > 0 ? (
                <div className="space-y-2 pt-1">
                  {vercelData.paises.map((c: any, i: number) => (
                    <div key={c.country + i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/30 border border-slate-700/20 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-mono font-bold text-[11px]">
                          {c.country}
                        </span>
                        <span className="text-slate-200 font-semibold">
                          {c.nomePais || c.country}
                        </span>
                      </div>
                      <span className="font-bold text-slate-300">
                        {c.pageviews} <span className="text-[10px] text-slate-500 font-normal">views</span>
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-6 text-center">Aguardando dados de geolocalização.</p>
              )}
            </div>

            {/* Bloco 3: Navegadores */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#071321]/80 border border-blue-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <h3 className="font-bold text-sm text-white">Navegadores Mais Usados</h3>
                </div>
                <span className="text-[11px] text-slate-400">Browser</span>
              </div>

              <div className="space-y-2 pt-1 text-xs">
                {vercelData?.navegadores?.map((b: any, i: number) => (
                  <div key={b.browser + i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/30 border border-slate-700/20">
                    <span className="text-slate-200 font-semibold">{b.browser}</span>
                    <span className="font-bold text-purple-300">{b.pageviews} views</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bloco 4: Sistemas Operacionais */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#071321]/80 border border-blue-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  <h3 className="font-bold text-sm text-white">Sistemas Operacionais</h3>
                </div>
                <span className="text-[11px] text-slate-400">OS</span>
              </div>

              <div className="space-y-2 pt-1 text-xs">
                {vercelData?.sistemas?.map((s: any, i: number) => (
                  <div key={s.os + i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/30 border border-slate-700/20">
                    <span className="text-slate-200 font-semibold">{s.os}</span>
                    <span className="font-bold text-blue-300">{s.pageviews} views</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* 3. TABELA DE RENDIMENTOS POR EVENTO & TAXA CÉOS DISCRITA */}
      <div className="p-6 sm:p-7 rounded-3xl bg-[#0c1e33] border border-blue-900/40 shadow-lg space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              <h2 className="font-montserrat font-bold text-lg text-white">
                Rendimento por Evento & Porcentagem Céos
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Controle da taxa negociada com cada promotor e detalhamento da retenção de cada evento
            </p>
          </div>

          <Link
            href="/admin/eventos"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
          >
            <span>Ver tabela completa com ações de edição e exclusão</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Tabela de Eventos */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-y border-blue-900/40 bg-[#071321]/60 text-slate-400 font-semibold">
                <th className="py-3.5 px-4">Evento & Promotor</th>
                <th className="py-3.5 px-4 text-center">Ingressos</th>
                <th className="py-3.5 px-4 text-right">Volume Bruto</th>
                <th className="py-3.5 px-4 text-center">Taxa Céos (%)</th>
                <th className="py-3.5 px-4 text-right">Lucro Céos (R$)</th>
                <th className="py-3.5 px-4 text-right">Repasse Promotor</th>
                <th className="py-3.5 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-900/20">
              {eventos.slice(0, 8).map((ev) => (
                <tr key={ev.id} className="hover:bg-slate-800/30 transition-colors">
                  {/* Evento & Promotor */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-blue-900/40">
                        <Image
                          src={ev.img || "/assets/logos/teste-anatomia.png"}
                          alt={ev.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-white truncate max-w-[220px]">{ev.title}</p>
                        <p className="text-[11px] text-slate-400 truncate max-w-[220px]">
                          Organizador: {ev.promotorNome}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Ingressos */}
                  <td className="py-3.5 px-4 text-center">
                    <span className="font-bold text-white">{ev.totalInscritos}</span>
                    <span className="text-[10px] text-slate-400 block">
                      <strong className="text-emerald-400">{ev.totalConfirmados}</strong> confirmadas
                      {ev.totalPendentes > 0 && <span className="text-amber-400"> • {ev.totalPendentes} pendentes</span>}
                    </span>
                  </td>

                  {/* Volume Bruto */}
                  <td className="py-3.5 px-4 text-right">
                    <p className="font-extrabold text-white">
                      R$ {ev.receitaBruta.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                    {ev.receitaPendente > 0 && (
                      <p className="text-[10px] text-amber-400/90 font-medium">
                        + R$ {ev.receitaPendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} pendente
                      </p>
                    )}
                  </td>

                  {/* Taxa Céos (%) */}
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black ${
                        ev.taxaCeos === 8
                          ? "bg-blue-500/15 text-blue-300 border border-blue-500/30"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      }`}
                    >
                      <Percent className="w-3 h-3" />
                      <span>{ev.taxaCeos}%</span>
                      {ev.taxaCeos !== 8 && <span className="text-[9px] uppercase tracking-wider font-extrabold">(Especial)</span>}
                    </span>
                  </td>

                  {/* Lucro Céos (R$) */}
                  <td className="py-3.5 px-4 text-right font-black text-amber-400">
                    R$ {ev.comissaoCeos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </td>

                  {/* Repasse Promotor */}
                  <td className="py-3.5 px-4 text-right font-bold text-emerald-400">
                    R$ {ev.repassePromotor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </td>

                  {/* Ação Rápida: Ajustar Taxa */}
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => {
                        setEventoAjustarTaxa(ev);
                        setNovaTaxaInput(ev.taxaCeos);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[11px] font-bold border border-amber-500/30 transition-colors cursor-pointer"
                      title="Negociar e mudar taxa da Céos para este evento"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Mudar %</span>
                    </button>
                  </td>
                </tr>
              ))}

              {eventos.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                    Nenhum evento registrado no sistema até o momento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL PARA AJUSTAR TAXA CÉOS DO EVENTO */}
      {eventoAjustarTaxa && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#0c1e33] border border-amber-500/30 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setEventoAjustarTaxa(null)}
              className="absolute right-5 top-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                <Percent className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="font-montserrat font-bold text-base text-white">
                  Negociar Taxa da Céos System
                </h3>
                <p className="text-xs text-slate-400">Alteração exclusiva do Dono</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#071321] border border-blue-900/40 text-xs space-y-1">
              <p className="text-slate-400">Evento Selecionado:</p>
              <p className="font-bold text-white text-sm truncate">{eventoAjustarTaxa.title}</p>
              <p className="text-slate-400 text-[11px]">
                Organizador: {eventoAjustarTaxa.promotorNome} ({eventoAjustarTaxa.promotorEmail})
              </p>
            </div>

            {sucessoTaxa ? (
              <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-center space-y-1 text-emerald-300">
                <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-400" />
                <p className="font-bold text-xs">Taxa atualizada com sucesso!</p>
                <p className="text-[11px] text-emerald-400">O Asaas Split agora utilizará {novaTaxaInput}%.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <label className="text-slate-300">Nova Porcentagem da Céos (%)</label>
                    <span className="text-amber-400 font-black text-base">{novaTaxaInput}%</span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="0.5"
                    value={novaTaxaInput}
                    onChange={(e) => setNovaTaxaInput(parseFloat(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />

                  {/* Atalhos Rápidos de Porcentagem */}
                  <div className="flex items-center gap-2 pt-1">
                    {[0, 5, 6, 7, 8, 10].map((perc) => (
                      <button
                        key={perc}
                        type="button"
                        onClick={() => setNovaTaxaInput(perc)}
                        className={`flex-1 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                          novaTaxaInput === perc
                            ? "bg-amber-400 text-slate-950 border-amber-400"
                            : "bg-[#071321] text-slate-400 border-blue-900/50 hover:text-white"
                        }`}
                      >
                        {perc}%
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-900/40 text-[11px] text-slate-300 space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-blue-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Como funciona esta taxa?</span>
                  </p>
                  <p className="text-slate-400 leading-relaxed">
                    O padrão do sistema é 8%. Ao alterar este valor para <strong>{novaTaxaInput}%</strong>,
                    todas as novas cobranças deste evento repassarão exatamente {novaTaxaInput}% para a carteira da Céos
                    System e o restante ({100 - novaTaxaInput}%) para a conta do promotor no Asaas.
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEventoAjustarTaxa(null)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSalvarTaxa}
                    disabled={salvandoTaxa}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    {salvandoTaxa ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Salvando...</span>
                      </>
                    ) : (
                      <span>Aplicar Taxa ({novaTaxaInput}%)</span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
