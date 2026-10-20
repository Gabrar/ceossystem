"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  buscarEventosAdmin,
  AdminEventItem,
  atualizarTaxaCeosEvento,
  editarEventoAdmin,
  excluirEventoAdmin,
} from "@/lib/admin";
import {
  Calendar,
  Search,
  Percent,
  Pencil,
  Trash2,
  ExternalLink,
  ChevronDown,
  X,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Crown,
  DollarSign,
  Users,
  MapPin,
  ShieldCheck,
  Check,
  Ticket,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";

export default function AdminEventosPage() {
  const [eventos, setEventos] = useState<AdminEventItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");

  // Modais de Ação
  const [modalVerInscricoes, setModalVerInscricoes] = useState<AdminEventItem | null>(null);
  const [modalTaxaEvento, setModalTaxaEvento] = useState<AdminEventItem | null>(null);
  const [novaTaxa, setNovaTaxa] = useState<number>(8);
  const [salvandoTaxa, setSalvandoTaxa] = useState(false);

  const [modalEditarEvento, setModalEditarEvento] = useState<AdminEventItem | null>(null);
  const [formEdicao, setFormEdicao] = useState({
    title: "",
    category: "",
    date: "",
    location: "",
    capacidade: "",
    taxaCeos: 8,
    status: "Ativo",
  });
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  const [modalExcluirEvento, setModalExcluirEvento] = useState<AdminEventItem | null>(null);
  const [excluindoEvento, setExcluindoEvento] = useState(false);

  // Mensagem toast temporária
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Carrega lista de eventos
  const carregarEventos = async () => {
    setLoading(true);
    try {
      const data = await buscarEventosAdmin();
      setEventos(data);
    } catch (err) {
      console.error("Erro ao carregar eventos no admin:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarEventos();
  }, []);

  // Filtragem de eventos
  const eventosFiltrados = useMemo(() => {
    return eventos.filter((ev) => {
      const termo = searchTerm.trim().toLowerCase();
      const matchSearch =
        !termo ||
        ev.title.toLowerCase().includes(termo) ||
        (ev.promotorNome && ev.promotorNome.toLowerCase().includes(termo)) ||
        (ev.promotorEmail && ev.promotorEmail.toLowerCase().includes(termo)) ||
        (ev.category && ev.category.toLowerCase().includes(termo));

      const matchStatus =
        statusFilter === "Todos" ||
        (statusFilter === "Ativo" && ev.status === "Ativo") ||
        (statusFilter === "Em Breve" && ev.status === "Em Breve") ||
        (statusFilter === "Encerrado" && ev.status === "Encerrado");

      return matchSearch && matchStatus;
    });
  }, [eventos, searchTerm, statusFilter]);

  // Totais dos eventos filtrados
  const totais = useMemo(() => {
    const totalEventos = eventosFiltrados.length;
    const receitaTotal = eventosFiltrados.reduce((acc, ev) => acc + ev.receitaBruta, 0);
    const comissaoTotal = eventosFiltrados.reduce((acc, ev) => acc + ev.comissaoCeos, 0);
    const ingressosTotal = eventosFiltrados.reduce((acc, ev) => acc + ev.totalConfirmados, 0);
    return { totalEventos, receitaTotal, comissaoTotal, ingressosTotal };
  }, [eventosFiltrados]);

  // Paginação da lista de eventos
  const [paginaEventos, setPaginaEventos] = useState<number>(1);
  const [itensPorPaginaEventos, setItensPorPaginaEventos] = useState<number>(10);

  useEffect(() => {
    setPaginaEventos(1);
  }, [searchTerm, statusFilter]);

  const totalPaginasEventos = Math.ceil(eventosFiltrados.length / itensPorPaginaEventos) || 1;

  const eventosPaginados = useMemo(() => {
    const inicio = (paginaEventos - 1) * itensPorPaginaEventos;
    return eventosFiltrados.slice(inicio, inicio + itensPorPaginaEventos);
  }, [eventosFiltrados, paginaEventos, itensPorPaginaEventos]);

  // Estados de Paginação e Filtros para o Modal de Inscrições / Participantes
  const [buscaInscricaoModal, setBuscaInscricaoModal] = useState<string>("");
  const [filtroStatusInscricaoModal, setFiltroStatusInscricaoModal] = useState<
    "Todos" | "Confirmada" | "Pendente" | "Cancelada"
  >("Todos");
  const [paginaInscricoesModal, setPaginaInscricoesModal] = useState<number>(1);
  const [itensPorPaginaInscricoesModal, setItensPorPaginaInscricoesModal] = useState<number>(10);

  // Abre modal de inscrições resetando busca e paginação
  const abrirModalInscricoes = (ev: AdminEventItem) => {
    setModalVerInscricoes(ev);
    setBuscaInscricaoModal("");
    setFiltroStatusInscricaoModal("Todos");
    setPaginaInscricoesModal(1);
  };

  // Filtragem de inscrições/participantes do evento selecionado
  const inscricoesModalFiltradas = useMemo(() => {
    if (!modalVerInscricoes?.inscricoes) return [];
    const termo = buscaInscricaoModal.trim().toLowerCase();
    const termoDigitos = termo.replace(/\D/g, "");

    return modalVerInscricoes.inscricoes.filter((insc) => {
      // Filtro status
      if (filtroStatusInscricaoModal === "Confirmada" && insc.statusNormalizado !== "Confirmada") return false;
      if (filtroStatusInscricaoModal === "Pendente" && insc.statusNormalizado !== "Pendente") return false;
      if (
        filtroStatusInscricaoModal === "Cancelada" &&
        (insc.statusNormalizado === "Confirmada" || insc.statusNormalizado === "Pendente")
      )
        return false;

      // Busca por nome, email, CPF, código do ingresso ou lote
      if (!termo) return true;
      const nomeMatch = (insc.nome || "").toLowerCase().includes(termo);
      const emailMatch = (insc.email || "").toLowerCase().includes(termo);
      const codigoMatch = (insc.codigoIngresso || "").toLowerCase().includes(termo);
      const loteMatch = (insc.lote || "").toLowerCase().includes(termo);
      const cpfMatch = termoDigitos.length > 0 && (insc.cpf || "").replace(/\D/g, "").includes(termoDigitos);

      return nomeMatch || emailMatch || codigoMatch || loteMatch || cpfMatch;
    });
  }, [modalVerInscricoes, buscaInscricaoModal, filtroStatusInscricaoModal]);

  // Reseta página das inscrições ao alterar termos de pesquisa ou filtro
  useEffect(() => {
    setPaginaInscricoesModal(1);
  }, [buscaInscricaoModal, filtroStatusInscricaoModal]);

  const totalPaginasInscricoes = Math.ceil(inscricoesModalFiltradas.length / itensPorPaginaInscricoesModal) || 1;

  const inscricoesModalPaginadas = useMemo(() => {
    const inicio = (paginaInscricoesModal - 1) * itensPorPaginaInscricoesModal;
    return inscricoesModalFiltradas.slice(inicio, inicio + itensPorPaginaInscricoesModal);
  }, [inscricoesModalFiltradas, paginaInscricoesModal, itensPorPaginaInscricoesModal]);

  // Ação: Salvar Taxa
  const handleConfirmarTaxa = async () => {
    if (!modalTaxaEvento) return;
    setSalvandoTaxa(true);
    try {
      await atualizarTaxaCeosEvento(modalTaxaEvento.id, novaTaxa);
      showToast(`Taxa Céos do evento atualizada para ${novaTaxa}% com sucesso!`);
      setModalTaxaEvento(null);
      await carregarEventos();
    } catch (err) {
      alert("Erro ao atualizar taxa.");
    } finally {
      setSalvandoTaxa(false);
    }
  };

  // Ação: Abrir modal de edição
  const handleAbrirEdicao = (ev: AdminEventItem) => {
    setModalEditarEvento(ev);
    setFormEdicao({
      title: ev.title || "",
      category: ev.category || "",
      date: ev.date || "",
      location: ev.location || "",
      capacidade: ev.capacidade ? String(ev.capacidade) : "",
      taxaCeos: ev.taxaCeos || 8,
      status: ev.status || "Ativo",
    });
  };

  // Ação: Salvar Edição do Evento
  const handleSalvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalEditarEvento) return;
    setSalvandoEdicao(true);
    try {
      await editarEventoAdmin(modalEditarEvento.id, {
        title: formEdicao.title,
        category: formEdicao.category,
        date: formEdicao.date,
        location: formEdicao.location,
        capacidade: formEdicao.capacidade ? Number(formEdicao.capacidade) : "",
        taxaCeos: Number(formEdicao.taxaCeos),
        status: formEdicao.status,
      });
      showToast("Dados do evento atualizados com sucesso!");
      setModalEditarEvento(null);
      await carregarEventos();
    } catch (err) {
      alert("Erro ao editar dados do evento.");
    } finally {
      setSalvandoEdicao(false);
    }
  };

  // Ação: Excluir Evento
  const handleConfirmarExclusao = async () => {
    if (!modalExcluirEvento) return;
    setExcluindoEvento(true);
    try {
      await excluirEventoAdmin(modalExcluirEvento.id);
      showToast("Evento excluído da plataforma com sucesso!");
      setModalExcluirEvento(null);
      await carregarEventos();
    } catch (err) {
      alert("Erro ao excluir evento.");
    } finally {
      setExcluindoEvento(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast de Notificação */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-2xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-900/40 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-widest">
            <Crown className="w-3.5 h-3.5" />
            <span>Gestão Total de Eventos</span>
          </div>
          <h1 className="font-montserrat text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Controle de Eventos & Taxas Céos
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Edite, exclua e configure porcentagens negociadas para cada promotor
          </p>
        </div>

        <Link
          href="/eventos/createEvent"
          target="_blank"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer self-start sm:self-center"
        >
          <Calendar className="w-4 h-4" />
          <span>Cadastrar Novo Evento</span>
        </Link>
      </div>

      {/* BARRA DE FILTROS E BUSCA */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-[#0c1e33] p-4 rounded-3xl border border-blue-900/40">
        <div className="md:col-span-3 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por título, organizador, e-mail ou categoria..."
            className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-[#071321] border border-blue-900/50 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full appearance-none pl-3.5 pr-8 py-2.5 rounded-xl bg-[#071321] border border-blue-900/50 text-xs font-semibold text-slate-300 focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            <option value="Todos">Todos os Status</option>
            <option value="Ativo">Apenas Ativos</option>
            <option value="Em Breve">Em Breve</option>
            <option value="Encerrado">Encerrados</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* RESUMO DOS EVENTOS FILTRADOS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-[#0c1e33] border border-blue-900/40">
          <span className="text-[11px] text-slate-400">Eventos Listados</span>
          <p className="text-xl font-bold text-white mt-0.5">{totais.totalEventos}</p>
        </div>
        <div className="p-4 rounded-2xl bg-[#0c1e33] border border-blue-900/40">
          <span className="text-[11px] text-slate-400">Ingressos Vendidos</span>
          <p className="text-xl font-bold text-blue-400 mt-0.5">{totais.ingressosTotal}</p>
        </div>
        <div className="p-4 rounded-2xl bg-[#0c1e33] border border-blue-900/40">
          <span className="text-[11px] text-slate-400">Volume Bruto</span>
          <p className="text-xl font-bold text-emerald-400 mt-0.5">
            R$ {totais.receitaTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 via-[#0c1e33] to-[#0c1e33] border border-amber-500/30">
          <span className="text-[11px] text-amber-400 font-bold">Comissão Céos Retida</span>
          <p className="text-xl font-black text-amber-400 mt-0.5">
            R$ {totais.comissaoTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* TABELA DE EVENTOS */}
      <div className="bg-[#0c1e33] rounded-3xl border border-blue-900/40 shadow-xl overflow-hidden">
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Carregando eventos do sistema...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-blue-900/40 bg-[#071321]/80 text-slate-400 font-semibold">
                  <th className="py-3.5 px-5">Evento</th>
                  <th className="py-3.5 px-4">Organizador</th>
                  <th className="py-3.5 px-4 text-center">Ingressos</th>
                  <th className="py-3.5 px-4 text-right">Volume Bruto</th>
                  <th className="py-3.5 px-4 text-center">Taxa Céos</th>
                  <th className="py-3.5 px-4 text-right">Lucro Céos</th>
                  <th className="py-3.5 px-4 text-right">Repasse Promotor</th>
                  <th className="py-3.5 px-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-900/20">
                {eventosPaginados.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-800/30 transition-colors">
                    {/* Evento */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-slate-800 shrink-0 border border-blue-900/40">
                          <Image
                            src={ev.img || "/assets/logos/teste-anatomia.png"}
                            alt={ev.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">
                            {ev.category}
                          </span>
                          <p className="font-extrabold text-white text-sm truncate max-w-[220px]">
                            {ev.title}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                            {ev.date && typeof ev.date === "string" && <span>{ev.date}</span>}
                            {ev.location && typeof ev.location === "string" && (
                              <>
                                <span>•</span>
                                <span className="truncate max-w-[140px]">{ev.location}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Organizador */}
                    <td className="py-4 px-4">
                      <p className="font-bold text-slate-200 truncate max-w-[150px]">
                        {ev.promotorNome}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate max-w-[150px]">
                        {ev.promotorEmail}
                      </p>
                    </td>

                    {/* Ingressos (Puxado de inscricoes) */}
                    <td className="py-4 px-4 text-center">
                      <div className="flex flex-col items-center">
                        <button
                          type="button"
                          onClick={() => abrirModalInscricoes(ev)}
                          className="font-black text-white text-sm hover:text-amber-400 hover:underline cursor-pointer flex items-center gap-1.5 transition-colors"
                          title="Clique para ver os participantes inscritos deste evento"
                        >
                          <Ticket className="w-3.5 h-3.5 text-blue-400" />
                          <span>{ev.totalInscritos} {ev.totalInscritos === 1 ? "inscrito" : "inscritos"}</span>
                        </button>
                        <div className="flex items-center gap-1 text-[10px] mt-0.5">
                          <span className="text-emerald-400 font-bold">{ev.totalConfirmados} confirmados</span>
                          {ev.totalPendentes > 0 && (
                            <span className="text-amber-400 font-semibold">• {ev.totalPendentes} pendentes</span>
                          )}
                        </div>
                        {ev.capacidade ? (
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            de {String(ev.capacidade)} vagas
                          </span>
                        ) : null}
                      </div>
                    </td>

                    {/* Volume Bruto (Puxado de inscricoes) */}
                    <td className="py-4 px-4 text-right">
                      <p className="font-black text-white text-sm">
                        R$ {ev.receitaBruta.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                      {ev.receitaPendente > 0 && (
                        <p className="text-[10px] text-amber-400/90 font-medium mt-0.5">
                          + R$ {ev.receitaPendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} pendente
                        </p>
                      )}
                    </td>

                    {/* Taxa Céos (%) com Botão Rápido */}
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => {
                          setModalTaxaEvento(ev);
                          setNovaTaxa(ev.taxaCeos);
                        }}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                          ev.taxaCeos === 8
                            ? "bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/30"
                            : "bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 shadow-sm"
                        }`}
                        title="Clique para negociar ou mudar a taxa Céos deste evento"
                      >
                        <Percent className="w-3 h-3" />
                        <span>{ev.taxaCeos}%</span>
                        <Pencil className="w-2.5 h-2.5 ml-1 opacity-70" />
                      </button>
                    </td>

                    {/* Lucro Céos (R$) */}
                    <td className="py-4 px-4 text-right font-black text-amber-400">
                      R$ {ev.comissaoCeos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>

                    {/* Repasse Promotor */}
                    <td className="py-4 px-4 text-right font-bold text-emerald-400">
                      R$ {ev.repassePromotor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>

                    {/* Ações */}
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => abrirModalInscricoes(ev)}
                          className="p-2 rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors cursor-pointer"
                          title="Ver participantes inscritos deste evento (Firebase)"
                        >
                          <Ticket className="w-3.5 h-3.5" />
                        </button>

                        <Link
                          href={`/eventos/${ev.id}`}
                          target="_blank"
                          className="p-2 rounded-xl bg-[#071321] text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          title="Abrir página pública"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>

                        <button
                          onClick={() => handleAbrirEdicao(ev)}
                          className="p-2 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors cursor-pointer"
                          title="Editar informações do evento"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setModalExcluirEvento(ev)}
                          className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                          title="Excluir evento da plataforma"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {eventosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                      Nenhum evento encontrado para os filtros selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* BARRA DE PAGINAÇÃO DE EVENTOS */}
            {eventosFiltrados.length > 0 && (
              <div className="p-4 border-t border-blue-900/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-[#071321]/60">
                <div className="flex flex-wrap items-center gap-3 text-slate-400">
                  <span>
                    Mostrando <strong className="text-white">{(paginaEventos - 1) * itensPorPaginaEventos + 1}</strong> a{" "}
                    <strong className="text-white">
                      {Math.min(paginaEventos * itensPorPaginaEventos, eventosFiltrados.length)}
                    </strong>{" "}
                    de <strong className="text-white">{eventosFiltrados.length}</strong> eventos
                  </span>

                  <div className="flex items-center gap-1.5 ml-0 sm:ml-2">
                    <span className="text-[11px] text-slate-500">Por página:</span>
                    <select
                      value={itensPorPaginaEventos}
                      onChange={(e) => {
                        setItensPorPaginaEventos(Number(e.target.value));
                        setPaginaEventos(1);
                      }}
                      className="px-2 py-1 rounded-lg bg-[#0c1e33] border border-blue-900/50 text-slate-200 text-xs font-semibold focus:outline-none focus:border-amber-400 cursor-pointer"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPaginaEventos(1)}
                    disabled={paginaEventos === 1}
                    className="px-2.5 py-1.5 rounded-xl bg-[#0c1e33] border border-blue-900/40 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors cursor-pointer text-xs font-bold"
                    title="Primeira página"
                  >
                    «
                  </button>
                  <button
                    onClick={() => setPaginaEventos((prev) => Math.max(prev - 1, 1))}
                    disabled={paginaEventos === 1}
                    className="px-3 py-1.5 rounded-xl bg-[#0c1e33] border border-blue-900/40 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Anterior</span>
                  </button>

                  <div className="flex items-center gap-1 px-1">
                    {Array.from({ length: totalPaginasEventos }, (_, i) => i + 1)
                      .filter((p) => {
                        if (totalPaginasEventos <= 7) return true;
                        if (p === 1 || p === totalPaginasEventos) return true;
                        return Math.abs(p - paginaEventos) <= 1;
                      })
                      .map((p, idx, arr) => {
                        const prev = arr[idx - 1];
                        return (
                          <React.Fragment key={p}>
                            {prev && p - prev > 1 && (
                              <span className="text-slate-600 px-1">...</span>
                            )}
                            <button
                              onClick={() => setPaginaEventos(p)}
                              className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                paginaEventos === p
                                  ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20"
                                  : "text-slate-400 hover:text-white hover:bg-[#0c1e33]"
                              }`}
                            >
                              {p}
                            </button>
                          </React.Fragment>
                        );
                      })}
                  </div>

                  <button
                    onClick={() => setPaginaEventos((prev) => Math.min(prev + 1, totalPaginasEventos))}
                    disabled={paginaEventos >= totalPaginasEventos}
                    className="px-3 py-1.5 rounded-xl bg-[#0c1e33] border border-blue-900/40 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1"
                  >
                    <span>Próxima</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setPaginaEventos(totalPaginasEventos)}
                    disabled={paginaEventos >= totalPaginasEventos}
                    className="px-2.5 py-1.5 rounded-xl bg-[#0c1e33] border border-blue-900/40 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors cursor-pointer text-xs font-bold"
                    title="Última página"
                  >
                    »
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL 1: MUDAR TAXA CÉOS */}
      {modalTaxaEvento && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#0c1e33] border border-amber-500/30 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setModalTaxaEvento(null)}
              className="absolute right-5 top-5 p-1.5 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                <Percent className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="font-montserrat font-bold text-base text-white">
                  Negociar Taxa Céos System
                </h3>
                <p className="text-xs text-slate-400">Percentual retido pela plataforma</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#071321] border border-blue-900/40 text-xs space-y-1">
              <p className="font-bold text-white text-sm truncate">{modalTaxaEvento.title}</p>
              <p className="text-slate-400 text-[11px]">
                Organizador: {modalTaxaEvento.promotorNome} ({modalTaxaEvento.promotorEmail})
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <label className="text-slate-300">Nova Taxa da Céos</label>
                  <span className="text-amber-400 font-black text-xl">{novaTaxa}%</span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="20"
                  step="0.5"
                  value={novaTaxa}
                  onChange={(e) => setNovaTaxa(parseFloat(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />

                <div className="flex items-center gap-1.5 pt-1">
                  {[0, 4, 5, 6, 7, 8, 10, 12].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setNovaTaxa(p)}
                      className={`flex-1 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                        novaTaxa === p
                          ? "bg-amber-400 text-slate-950 border-amber-400"
                          : "bg-[#071321] text-slate-400 border-blue-900/40 hover:text-white"
                      }`}
                    >
                      {p}%
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-900/40 text-[11px] text-slate-300 space-y-1">
                <p className="font-bold text-blue-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Divisão Automática no Asaas</span>
                </p>
                <p className="text-slate-400 leading-relaxed">
                  Ao definir <strong>{novaTaxa}%</strong>, qualquer nova cobrança (Pix, Cartão, Boleto) deste
                  evento dividirá a receita automaticamente: {novaTaxa}% para a carteira da Céos e{" "}
                  {100 - novaTaxa}% para a subconta do promotor.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalTaxaEvento(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmarTaxa}
                  disabled={salvandoTaxa}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  {salvandoTaxa ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Salvar Taxa ({novaTaxa}%)</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: EDITAR DADOS DO EVENTO */}
      {modalEditarEvento && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-[#0c1e33] border border-blue-900/50 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setModalEditarEvento(null)}
              className="absolute right-5 top-5 p-1.5 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                <Pencil className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-montserrat font-bold text-base text-white">
                  Editar Evento (Acesso Admin)
                </h3>
                <p className="text-xs text-slate-400">Altere informações do evento no sistema</p>
              </div>
            </div>

            <form onSubmit={handleSalvarEdicao} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Título do Evento</label>
                <input
                  type="text"
                  value={formEdicao.title}
                  onChange={(e) => setFormEdicao({ ...formEdicao, title: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#071321] border border-blue-900/50 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Categoria</label>
                  <input
                    type="text"
                    value={formEdicao.category}
                    onChange={(e) => setFormEdicao({ ...formEdicao, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#071321] border border-blue-900/50 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Status</label>
                  <select
                    value={formEdicao.status}
                    onChange={(e) => setFormEdicao({ ...formEdicao, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#071321] border border-blue-900/50 text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Em Breve">Em Breve</option>
                    <option value="Encerrado">Encerrado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Data / Período</label>
                  <input
                    type="text"
                    value={formEdicao.date}
                    onChange={(e) => setFormEdicao({ ...formEdicao, date: e.target.value })}
                    placeholder="Ex: 15 a 18 de Outubro"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#071321] border border-blue-900/50 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Capacidade de Vagas</label>
                  <input
                    type="number"
                    value={formEdicao.capacidade}
                    onChange={(e) => setFormEdicao({ ...formEdicao, capacidade: e.target.value })}
                    placeholder="Ex: 500"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#071321] border border-blue-900/50 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Local / Cidade</label>
                <input
                  type="text"
                  value={formEdicao.location}
                  onChange={(e) => setFormEdicao({ ...formEdicao, location: e.target.value })}
                  placeholder="Ex: Centro de Convenções - São Paulo/SP"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#071321] border border-blue-900/50 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">
                  Taxa Céos System (%) para este evento
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="50"
                  value={formEdicao.taxaCeos}
                  onChange={(e) => setFormEdicao({ ...formEdicao, taxaCeos: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#071321] border border-amber-500/40 text-amber-400 font-bold focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalEditarEvento(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoEdicao}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  {salvandoEdicao ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Salvar Alterações</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EXCLUIR EVENTO */}
      {modalExcluirEvento && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#0c1e33] border border-rose-500/30 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl relative text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-montserrat font-bold text-lg text-white">
                Excluir Evento Permanentemente?
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Você está prestes a remover o evento{" "}
                <strong className="text-white">"{modalExcluirEvento.title}"</strong> da plataforma.
                Esta ação é irreversível e removerá o evento das listagens públicas.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-[#071321] text-xs text-left border border-rose-500/20 text-slate-300 space-y-1">
              <p>
                <strong>Promotor:</strong> {modalExcluirEvento.promotorNome}
              </p>
              <p>
                <strong>Inscrições:</strong> {modalExcluirEvento.totalConfirmados} confirmadas
              </p>
              <p>
                <strong>Receita Gerada:</strong> R${" "}
                {modalExcluirEvento.receitaBruta.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModalExcluirEvento(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
              >
                Voltar / Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarExclusao}
                disabled={excluindoEvento}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                {excluindoEvento ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Confirmar Exclusão</span>}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL 4: VER INSCRIÇÕES DETALHADAS DO FIREBASE COM PAGINAÇÃO */}
      {modalVerInscricoes && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="max-w-4xl w-full bg-[#0c1e33] border border-blue-900/50 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl relative max-h-[92vh] flex flex-col">
            <button
              onClick={() => setModalVerInscricoes(null)}
              className="absolute right-5 top-5 p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Topo do Modal */}
            <div className="flex items-start gap-3.5 pr-8">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                <Ticket className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  Dados da Coleção /inscricoes do Firestore
                </span>
                <h3 className="font-montserrat font-bold text-base sm:text-lg text-white">
                  Participantes & Inscrições: {modalVerInscricoes.title}
                </h3>
                <p className="text-xs text-slate-400">
                  Organizador: {modalVerInscricoes.promotorNome} ({modalVerInscricoes.promotorEmail})
                </p>
              </div>
            </div>

            {/* Cards Rápidos de Síntese */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-2xl bg-[#071321] border border-blue-900/40">
                <span className="text-[10px] text-slate-400">Total de Inscrições</span>
                <p className="text-base font-black text-white">{modalVerInscricoes.totalInscritos}</p>
              </div>
              <div className="p-3 rounded-2xl bg-[#071321] border border-blue-900/40">
                <span className="text-[10px] text-slate-400">Confirmadas / Pagas</span>
                <p className="text-base font-black text-emerald-400">{modalVerInscricoes.totalConfirmados}</p>
              </div>
              <div className="p-3 rounded-2xl bg-[#071321] border border-blue-900/40">
                <span className="text-[10px] text-slate-400">Volume Confirmado</span>
                <p className="text-base font-black text-white">
                  R$ {modalVerInscricoes.receitaBruta.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                <span className="text-[10px] text-amber-400 font-bold">Comissão Céos ({modalVerInscricoes.taxaCeos}%)</span>
                <p className="text-base font-black text-amber-400">
                  R$ {modalVerInscricoes.comissaoCeos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Barra de Busca e Filtro de Status das Inscrições */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por participante, e-mail, CPF, lote ou código..."
                  value={buscaInscricaoModal}
                  onChange={(e) => setBuscaInscricaoModal(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#071321] border border-blue-900/40 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
                {buscaInscricaoModal && (
                  <button
                    type="button"
                    onClick={() => setBuscaInscricaoModal("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto shrink-0">
                {[
                  { key: "Todos", label: "Todos", count: (modalVerInscricoes.inscricoes || []).length },
                  {
                    key: "Confirmada",
                    label: "Confirmados",
                    count: (modalVerInscricoes.inscricoes || []).filter((i) => i.statusNormalizado === "Confirmada").length,
                  },
                  {
                    key: "Pendente",
                    label: "Pendentes",
                    count: (modalVerInscricoes.inscricoes || []).filter((i) => i.statusNormalizado === "Pendente").length,
                  },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setFiltroStatusInscricaoModal(tab.key as any)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer shrink-0 ${
                      filtroStatusInscricaoModal === tab.key
                        ? "bg-amber-400 text-slate-950 border-amber-400 shadow-xs"
                        : "bg-[#071321] text-slate-400 border-blue-900/40 hover:text-white"
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>
            </div>

            {/* Tabela dos Documentos de Inscrição */}
            <div className="flex-1 overflow-y-auto border border-blue-900/30 rounded-2xl min-h-[220px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-[#071321] border-b border-blue-900/40 text-slate-400 font-semibold z-10">
                  <tr>
                    <th className="py-2.5 px-3">Participante</th>
                    <th className="py-2.5 px-3">Lote</th>
                    <th className="py-2.5 px-3 text-right">Valor</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3">Código Ingresso</th>
                    <th className="py-2.5 px-3">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-900/20">
                  {inscricoesModalPaginadas.length > 0 ? (
                    inscricoesModalPaginadas.map((insc) => {
                      const isConf = insc.statusNormalizado === "Confirmada";
                      const isPend = insc.statusNormalizado === "Pendente";

                      return (
                        <tr key={insc.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-2.5 px-3">
                            <p className="font-bold text-white">{insc.nome}</p>
                            <p className="text-[10px] text-slate-400">{insc.email}</p>
                            {insc.cpf && <p className="text-[9px] text-slate-500 font-mono">CPF: {insc.cpf}</p>}
                          </td>
                          <td className="py-2.5 px-3 text-slate-300">{insc.lote}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-white">
                            {insc.valorFormatado}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isConf
                                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                  : isPend
                                  ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                                  : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                              }`}
                            >
                              {insc.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-300">
                            {insc.codigoIngresso}
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                            {insc.createdAt || "—"}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-slate-400 space-y-1">
                        <p className="font-bold text-slate-300">Nenhum participante encontrado</p>
                        <p className="text-[11px] text-slate-500">
                          {buscaInscricaoModal || filtroStatusInscricaoModal !== "Todos"
                            ? "Tente alterar os termos de busca ou filtros aplicados."
                            : "Quando os congressistas comprarem ingressos para este evento, os dados gravados em /inscricoes aparecerão aqui."}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* BARRA DE PAGINAÇÃO DAS INSCRIÇÕES / PARTICIPANTES */}
            {inscricoesModalFiltradas.length > 0 && (
              <div className="p-3 rounded-2xl bg-[#071321] border border-blue-900/40 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
                <div className="flex flex-wrap items-center gap-3 text-slate-400 text-[11px]">
                  <span>
                    Mostrando <strong className="text-white">{(paginaInscricoesModal - 1) * itensPorPaginaInscricoesModal + 1}</strong> a{" "}
                    <strong className="text-white">
                      {Math.min(paginaInscricoesModal * itensPorPaginaInscricoesModal, inscricoesModalFiltradas.length)}
                    </strong>{" "}
                    de <strong className="text-white">{inscricoesModalFiltradas.length}</strong> participantes
                  </span>

                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500">Por página:</span>
                    <select
                      value={itensPorPaginaInscricoesModal}
                      onChange={(e) => {
                        setItensPorPaginaInscricoesModal(Number(e.target.value));
                        setPaginaInscricoesModal(1);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-[#0c1e33] border border-blue-900/50 text-slate-200 text-xs font-semibold focus:outline-none focus:border-amber-400 cursor-pointer"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPaginaInscricoesModal(1)}
                    disabled={paginaInscricoesModal === 1}
                    className="px-2 py-1 rounded-lg bg-[#0c1e33] border border-blue-900/40 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors text-xs font-bold cursor-pointer"
                    title="Primeira página"
                  >
                    «
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaginaInscricoesModal((prev) => Math.max(prev - 1, 1))}
                    disabled={paginaInscricoesModal === 1}
                    className="px-2.5 py-1 rounded-lg bg-[#0c1e33] border border-blue-900/40 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors text-xs font-semibold flex items-center gap-0.5 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Ant</span>
                  </button>

                  <div className="flex items-center gap-1 px-1">
                    {Array.from({ length: totalPaginasInscricoes }, (_, i) => i + 1)
                      .filter((p) => {
                        if (totalPaginasInscricoes <= 5) return true;
                        if (p === 1 || p === totalPaginasInscricoes) return true;
                        return Math.abs(p - paginaInscricoesModal) <= 1;
                      })
                      .map((p, idx, arr) => {
                        const prev = arr[idx - 1];
                        return (
                          <React.Fragment key={p}>
                            {prev && p - prev > 1 && <span className="text-slate-600 px-0.5">...</span>}
                            <button
                              type="button"
                              onClick={() => setPaginaInscricoesModal(p)}
                              className={`w-6 h-6 rounded-md text-xs font-bold transition-all cursor-pointer ${
                                paginaInscricoesModal === p
                                  ? "bg-amber-400 text-slate-950 font-black shadow-xs shadow-amber-500/20"
                                  : "text-slate-400 hover:text-white hover:bg-slate-800"
                              }`}
                            >
                              {p}
                            </button>
                          </React.Fragment>
                        );
                      })}
                  </div>

                  <button
                    type="button"
                    onClick={() => setPaginaInscricoesModal((prev) => Math.min(prev + 1, totalPaginasInscricoes))}
                    disabled={paginaInscricoesModal >= totalPaginasInscricoes}
                    className="px-2.5 py-1 rounded-lg bg-[#0c1e33] border border-blue-900/40 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors text-xs font-semibold flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>Próx</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaginaInscricoesModal(totalPaginasInscricoes)}
                    disabled={paginaInscricoesModal >= totalPaginasInscricoes}
                    className="px-2 py-1 rounded-lg bg-[#0c1e33] border border-blue-900/40 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors text-xs font-bold cursor-pointer"
                    title="Última página"
                  >
                    »
                  </button>
                </div>
              </div>
            )}

            {/* Rodapé do Modal */}
            <div className="pt-2 flex items-center justify-between border-t border-blue-900/30 text-xs">
              <span className="text-slate-500 text-[11px]">
                ID do Evento no Firebase: <code className="text-amber-400">{modalVerInscricoes.id}</code>
              </span>
              <button
                type="button"
                onClick={() => setModalVerInscricoes(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
