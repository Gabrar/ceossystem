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
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [metricas, setMetricas] = useState<AdminDashboardMetrics | null>(null);
  const [eventos, setEventos] = useState<AdminEventItem[]>([]);

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
  const [pontoAtivo, setPontoAtivo] = useState<VisitaDataPoint | null>(null);

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

  // Cálculo de altura máxima para normalizar barras do gráfico
  const maxVisitas = useMemo(() => {
    if (dadosGrafico.pontos.length === 0) return 100;
    const max = Math.max(...dadosGrafico.pontos.map((p) => p.visitas));
    return max > 0 ? max : 100;
  }, [dadosGrafico.pontos]);

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

      {/* 2. GRÁFICO INTERATIVO DE VISITAS & ACESSOS (DIA / MÊS / ANO) */}
      <div className="p-6 sm:p-7 rounded-3xl bg-[#0c1e33] border border-blue-900/40 shadow-lg space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h2 className="font-montserrat font-bold text-lg text-white">
                Visitas & Tráfego na Plataforma
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Acompanhamento cronológico de acessos, conversões em ingressos e receita gerada
            </p>
          </div>

          {/* Seletor de Período (Dia, Mês, Ano) */}
          <div className="flex items-center bg-[#071321] p-1 rounded-2xl border border-blue-900/50 self-start sm:self-center">
            <button
              onClick={() => setPeriodoVisitas("dia")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                periodoVisitas === "dia"
                  ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Últimos 7 Dias
            </button>
            <button
              onClick={() => setPeriodoVisitas("mes")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                periodoVisitas === "mes"
                  ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Por Mês (Ano Atual)
            </button>
            <button
              onClick={() => setPeriodoVisitas("ano")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                periodoVisitas === "ano"
                  ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Visão Anual
            </button>
          </div>
        </div>

        {/* Resumo do período selecionado */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-[#071321]/70 border border-blue-900/40">
          <div>
            <span className="text-[11px] text-slate-400">Total de Visitas no Período</span>
            <p className="text-xl font-black text-white mt-0.5">
              {dadosGrafico.totalVisitas.toLocaleString("pt-BR")}
            </p>
          </div>
          <div>
            <span className="text-[11px] text-slate-400">Inscrições / Vendas no Período</span>
            <p className="text-xl font-black text-emerald-400 mt-0.5">
              {dadosGrafico.totalConversoes.toLocaleString("pt-BR")}
            </p>
          </div>
          <div>
            <span className="text-[11px] text-slate-400">Taxa Média de Conversão</span>
            <p className="text-xl font-black text-amber-400 mt-0.5">
              {dadosGrafico.totalVisitas > 0
                ? `${((dadosGrafico.totalConversoes / dadosGrafico.totalVisitas) * 100).toFixed(1)}%`
                : "0%"}
            </p>
          </div>
        </div>

        {/* Visualização de Gráfico em Barras estilizadas */}
        {loadingGrafico ? (
          <div className="h-60 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="h-64 flex items-end justify-between gap-2 sm:gap-4 pt-8 px-2 border-b border-blue-900/30">
              {dadosGrafico.pontos.map((ponto, idx) => {
                const alturaPercentual = Math.max(Math.round((ponto.visitas / maxVisitas) * 100), 8);
                const isSelected = pontoAtivo?.label === ponto.label;

                return (
                  <div
                    key={ponto.label + idx}
                    onClick={() => setPontoAtivo(ponto)}
                    className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                  >
                    {/* Tooltip / Valor acima da barra */}
                    <div
                      className={`text-[10px] font-bold mb-1.5 transition-opacity ${
                        isSelected ? "text-amber-400 opacity-100" : "text-slate-400 opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      {ponto.visitas}
                    </div>

                    {/* Barra de Visitas */}
                    <div className="w-full max-w-[48px] bg-slate-800/80 rounded-t-xl overflow-hidden relative flex flex-col justify-end transition-all group-hover:brightness-125">
                      <div
                        className={`w-full rounded-t-xl transition-all duration-500 ${
                          isSelected
                            ? "bg-gradient-to-t from-amber-600 via-amber-400 to-amber-300"
                            : "bg-gradient-to-t from-blue-700 to-cyan-500"
                        }`}
                        style={{ height: `${alturaPercentual}%` }}
                      />
                    </div>

                    {/* Rótulo no Eixo X */}
                    <span
                      className={`text-[11px] font-semibold mt-2.5 truncate max-w-[60px] text-center ${
                        isSelected ? "text-amber-400 font-extrabold" : "text-slate-400 group-hover:text-white"
                      }`}
                    >
                      {ponto.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Painel do ponto selecionado no gráfico */}
            {pontoAtivo && (
              <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-[#071321] to-[#071321] border border-amber-500/25 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="text-slate-300">
                    Detalhes de <strong>{pontoAtivo.label}</strong>:
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <div>
                    <span className="text-slate-400">Visitas:</span>{" "}
                    <strong className="text-white">{pontoAtivo.visitas} acessos</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Inscrições:</span>{" "}
                    <strong className="text-emerald-400">{pontoAtivo.conversoes} vendidas</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Receita do Dia:</span>{" "}
                    <strong className="text-amber-400">
                      R$ {pontoAtivo.receita.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </strong>
                  </div>
                </div>
              </div>
            )}
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
