"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  buscarUsuariosAdmin,
  buscarAdminsCadastrados,
  atualizarTaxaCeosPromotor,
  formatarInfoTipoUsuario,
  alterarTipoUsuarioAdmin,
  AdminUserItem,
  AdminProfile,
} from "@/lib/admin";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Users,
  Search,
  Filter,
  Crown,
  Building2,
  Ticket,
  Wallet,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronDown,
  X,
  Loader2,
  ShieldCheck,
  Calendar,
  ExternalLink,
  Shield,
  Phone,
  Mail,
  Percent,
  Mic,
  GraduationCap,
  BookOpen,
  User,
  SlidersHorizontal,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState<AdminUserItem[]>([]);
  const [adminsList, setAdminsList] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [activeTab, setActiveTab] = useState<
    "Todos" | "promotor" | "congressista" | "palestrante" | "aluno" | "admins"
  >("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [perfilFilter, setPerfilFilter] = useState("Todos");
  const [asaasFilter, setAsaasFilter] = useState("Todos");

  // Estado para alterar role/tipo de usuário
  const [alterandoRoleUid, setAlterandoRoleUid] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Estado para modal de alterar perfil/tipo de usuário
  const [modalEditarPerfilUsuario, setModalEditarPerfilUsuario] = useState<AdminUserItem | null>(null);
  const [novoTipoSelecionado, setNovoTipoSelecionado] = useState<string>("congressista");
  const [salvandoTipoUsuario, setSalvandoTipoUsuario] = useState<boolean>(false);

  // Estado para ajustar taxa Céos do promotor (split Asaas)
  const [modalTaxaPromotor, setModalTaxaPromotor] = useState<AdminUserItem | null>(null);
  const [novaTaxaPromotor, setNovaTaxaPromotor] = useState<number>(8);
  const [aplicarAosEventosExistentes, setAplicarAosEventosExistentes] = useState<boolean>(true);
  const [salvandoTaxaPromotor, setSalvandoTaxaPromotor] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const carregarUsuarios = async () => {
    setLoading(true);
    try {
      const [users, admins] = await Promise.all([
        buscarUsuariosAdmin(),
        buscarAdminsCadastrados(),
      ]);
      setUsuarios(users);
      setAdminsList(admins);
    } catch (err) {
      console.error("Erro ao carregar usuários:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarUsuarios();
  }, []);

  // Filtragem de usuários considerando os tipos específicos (Congressista, Palestrante, Aluno, etc.)
  const usuariosFiltrados = useMemo(() => {
    const termo = searchTerm.trim().toLowerCase();
    const termoDigitos = termo.replace(/\D/g, "");

    return usuarios.filter((u) => {
      const tipoLower = (u.tipoUsuario || "").toLowerCase();

      // Filtro da aba
      if (activeTab === "promotor" && tipoLower !== "promotor" && u.role !== "promotor") return false;
      if (activeTab === "congressista" && tipoLower !== "congressista") return false;
      if (activeTab === "palestrante" && tipoLower !== "palestrante") return false;
      if (
        activeTab === "aluno" &&
        tipoLower !== "aluno" &&
        !tipoLower.includes("pos_graduacao") &&
        !tipoLower.includes("pos")
      )
        return false;

      // Filtro Dropdown de Perfil
      if (perfilFilter !== "Todos") {
        if (perfilFilter === "aluno_pos_graduacao") {
          if (!tipoLower.includes("pos_graduacao") && !tipoLower.includes("pos")) return false;
        } else if (perfilFilter === "outros") {
          const conhecidos = ["promotor", "congressista", "palestrante", "aluno", "aluno_pos_graduacao"];
          if (conhecidos.includes(tipoLower) || tipoLower.includes("pos")) return false;
        } else if (tipoLower !== perfilFilter && !(perfilFilter === "promotor" && u.role === "promotor")) {
          return false;
        }
      }

      // Filtro Asaas
      if (asaasFilter === "com_subconta" && !u.asaasAccountId) return false;
      if (asaasFilter === "sem_subconta" && u.asaasAccountId) return false;

      // Busca texto
      const userCpfDigitos = (u.cpf || "").replace(/\D/g, "");
      const matchSearch =
        !termo ||
        u.nome.toLowerCase().includes(termo) ||
        u.email.toLowerCase().includes(termo) ||
        (termoDigitos.length > 0 && userCpfDigitos.includes(termoDigitos));

      return matchSearch;
    });
  }, [usuarios, activeTab, perfilFilter, asaasFilter, searchTerm]);

  // Paginação da lista de participantes / usuários
  const [paginaAtual, setPaginaAtual] = useState<number>(1);
  const [itensPorPagina, setItensPorPagina] = useState<number>(10);

  // Reseta para a primeira página sempre que os filtros mudarem
  useEffect(() => {
    setPaginaAtual(1);
  }, [activeTab, perfilFilter, asaasFilter, searchTerm]);

  const totalPaginas = Math.ceil(usuariosFiltrados.length / itensPorPagina) || 1;

  const usuariosPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    return usuariosFiltrados.slice(inicio, inicio + itensPorPagina);
  }, [usuariosFiltrados, paginaAtual, itensPorPagina]);

  // Contadores para as abas
  const counts = useMemo(() => {
    const total = usuarios.length;
    const promotores = usuarios.filter((u) => (u.tipoUsuario || "").toLowerCase() === "promotor" || u.role === "promotor").length;
    const congressistas = usuarios.filter((u) => (u.tipoUsuario || "").toLowerCase() === "congressista").length;
    const palestrantes = usuarios.filter((u) => (u.tipoUsuario || "").toLowerCase() === "palestrante").length;
    const alunos = usuarios.filter((u) => {
      const t = (u.tipoUsuario || "").toLowerCase();
      return t === "aluno" || t.includes("pos_graduacao") || t.includes("pos");
    }).length;
    const admins = adminsList.length;
    return { total, promotores, congressistas, palestrantes, alunos, admins };
  }, [usuarios, adminsList]);

  // Abre modal para editar tipo de usuário
  const abrirModalEditarPerfil = (u: AdminUserItem) => {
    setModalEditarPerfilUsuario(u);
    setNovoTipoSelecionado(u.tipoUsuario?.toLowerCase() || "congressista");
  };

  // Salva alteração de perfil do usuário
  const handleConfirmarTipoUsuario = async () => {
    if (!modalEditarPerfilUsuario) return;
    setSalvandoTipoUsuario(true);
    try {
      await alterarTipoUsuarioAdmin(modalEditarPerfilUsuario.uid, novoTipoSelecionado);
      const info = formatarInfoTipoUsuario(novoTipoSelecionado);
      showToast(`Perfil de ${modalEditarPerfilUsuario.nome} alterado para "${info.label}"!`);
      setModalEditarPerfilUsuario(null);
      await carregarUsuarios();
    } catch (err) {
      console.error("Erro ao alterar tipo do usuário:", err);
      alert("Não foi possível alterar o perfil do usuário.");
    } finally {
      setSalvandoTipoUsuario(false);
    }
  };

  // Abre modal para ajustar taxa Céos negociada do promotor
  const abrirModalTaxa = (u: AdminUserItem) => {
    setModalTaxaPromotor(u);
    setNovaTaxaPromotor(u.taxaCeos !== undefined ? u.taxaCeos : 8);
    setAplicarAosEventosExistentes(true);
  };

  // Salva nova taxa Céos negociada e propaga para os eventos se solicitado
  const handleConfirmarTaxaPromotor = async () => {
    if (!modalTaxaPromotor) return;
    setSalvandoTaxaPromotor(true);
    try {
      await atualizarTaxaCeosPromotor(
        modalTaxaPromotor.uid,
        novaTaxaPromotor,
        aplicarAosEventosExistentes
      );
      showToast(
        `Taxa de ${modalTaxaPromotor.nome} atualizada para ${novaTaxaPromotor}% (Split Asaas)!`
      );
      setModalTaxaPromotor(null);
      await carregarUsuarios();
    } catch (err) {
      console.error("Erro ao salvar taxa do promotor:", err);
      alert("Não foi possível salvar a nova taxa. Verifique sua conexão.");
    } finally {
      setSalvandoTaxaPromotor(false);
    }
  };

  // Renderiza ícone específico para cada perfil
  const renderIconTipo = (tipoKey: string) => {
    switch (tipoKey) {
      case "promotor":
        return <Building2 className="w-3 h-3 text-emerald-400" />;
      case "congressista":
        return <Ticket className="w-3 h-3 text-blue-400" />;
      case "palestrante":
        return <Mic className="w-3 h-3 text-purple-300" />;
      case "aluno":
        return <GraduationCap className="w-3 h-3 text-sky-400" />;
      case "aluno_pos_graduacao":
        return <BookOpen className="w-3 h-3 text-indigo-300" />;
      case "admin":
        return <Crown className="w-3 h-3 text-amber-300" />;
      default:
        return <User className="w-3 h-3 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-2xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-900/40 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-widest">
            <Users className="w-3.5 h-3.5" />
            <span>Base Geral de Usuários</span>
          </div>
          <h1 className="font-montserrat text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Gestão de Usuários & Perfis
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Visualize os tipos reais (Promotor, Congressista, Palestrante, Aluno, Pós-Graduação) e gerencie permissões
          </p>
        </div>

        <Link
          href="/admin/admins"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0c1e33] hover:bg-slate-800 text-amber-400 font-bold text-xs border border-amber-500/30 transition-colors self-start sm:self-center"
        >
          <Crown className="w-4 h-4" />
          <span>Ver Pasta /admins ({counts.admins})</span>
        </Link>
      </div>

      {/* ABAS DE ROLE (TODOS, PROMOTORES, CONGRESSISTAS, PALESTRANTES, ALUNOS, ADMINS) */}
      <div className="flex flex-wrap items-center gap-2 border-b border-blue-900/40 pb-3">
        <button
          onClick={() => setActiveTab("Todos")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "Todos"
              ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20"
              : "bg-[#0c1e33] text-slate-400 hover:text-white border border-blue-900/40"
          }`}
        >
          <span>Todos</span>
          <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-slate-950/20 font-black">
            {counts.total}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("promotor")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "promotor"
              ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
              : "bg-[#0c1e33] text-slate-400 hover:text-white border border-blue-900/40"
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Promotores</span>
          <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-slate-950/20 font-black">
            {counts.promotores}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("congressista")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "congressista"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
              : "bg-[#0c1e33] text-slate-400 hover:text-white border border-blue-900/40"
          }`}
        >
          <Ticket className="w-3.5 h-3.5" />
          <span>Congressistas</span>
          <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-white/20 font-black">
            {counts.congressistas}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("palestrante")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "palestrante"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
              : "bg-[#0c1e33] text-slate-400 hover:text-white border border-blue-900/40"
          }`}
        >
          <Mic className="w-3.5 h-3.5" />
          <span>Palestrantes</span>
          <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-white/20 font-black">
            {counts.palestrantes}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("aluno")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "aluno"
              ? "bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20"
              : "bg-[#0c1e33] text-slate-400 hover:text-white border border-blue-900/40"
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Alunos & Pós</span>
          <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-slate-950/20 font-black">
            {counts.alunos}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("admins")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "admins"
              ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
              : "bg-[#0c1e33] text-amber-400 hover:bg-slate-800 border border-amber-500/30"
          }`}
        >
          <Crown className="w-3.5 h-3.5" />
          <span>Administradores (/admins)</span>
          <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-slate-950/20 font-black">
            {counts.admins}
          </span>
        </button>
      </div>

      {/* FILTROS E BUSCA */}
      {activeTab !== "admins" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-[#0c1e33] p-4 rounded-3xl border border-blue-900/40">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, e-mail ou CPF..."
              className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-[#071321] border border-blue-900/50 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="relative">
            <select
              value={perfilFilter}
              onChange={(e) => setPerfilFilter(e.target.value)}
              className="w-full appearance-none pl-3.5 pr-8 py-2.5 rounded-xl bg-[#071321] border border-blue-900/50 text-xs font-semibold text-slate-300 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="Todos">Todos os Perfis</option>
              <option value="promotor">Promotor de Eventos</option>
              <option value="congressista">Congressista</option>
              <option value="palestrante">Palestrante</option>
              <option value="aluno">Aluno (Graduação)</option>
              <option value="aluno_pos_graduacao">Aluno (Pós-Graduação)</option>
              <option value="outros">Outros / Participantes Gerais</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={asaasFilter}
              onChange={(e) => setAsaasFilter(e.target.value)}
              className="w-full appearance-none pl-3.5 pr-8 py-2.5 rounded-xl bg-[#071321] border border-blue-900/50 text-xs font-semibold text-slate-300 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="Todos">Todas as Contas Asaas</option>
              <option value="com_subconta">Com Subconta Vinculada</option>
              <option value="sem_subconta">Sem Subconta Asaas</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      )}

      {/* CONTEÚDO PRINCIPAL: TABELA DE USUÁRIOS OU TABELA DE ADMINS */}
      {activeTab === "admins" ? (
        /* TABELA DE ADMINISTRADORES DA PASTA /admins */
        <div className="bg-[#0c1e33] rounded-3xl border border-amber-500/30 shadow-xl overflow-hidden space-y-4 p-5">
          <div className="flex items-center justify-between pb-3 border-b border-blue-900/30">
            <div>
              <h3 className="font-montserrat font-bold text-white text-base flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>Administradores Cadastrados na pasta /admins</span>
              </h3>
              <p className="text-xs text-slate-400">
                Estes registros ficam isolados da pasta /users para segurança máxima
              </p>
            </div>
            <Link
              href="/admin/admins"
              className="px-3.5 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs"
            >
              + Adicionar Novo Admin
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-blue-900/40 bg-[#071321]/60 text-slate-400 font-semibold">
                  <th className="py-3 px-4">Administrador</th>
                  <th className="py-3 px-4">E-mail</th>
                  <th className="py-3 px-4 text-center">Nível / Role</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Último Acesso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-900/20">
                {adminsList.map((adm) => (
                  <tr key={adm.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-bold text-xs">
                          {adm.nome.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-bold text-white">{adm.nome}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">{adm.email}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                        {adm.role === "dono" ? "Proprietário Dono" : "Administrador"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        Ativo
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {adm.ultimoAcesso ? new Date(adm.ultimoAcesso).toLocaleString("pt-BR") : "Nunca"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* TABELA GERAL DE USUÁRIOS */
        <div className="bg-[#0c1e33] rounded-3xl border border-blue-900/40 shadow-xl overflow-hidden">
          {loading ? (
            <div className="py-24 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
              <p className="text-xs text-slate-400">Carregando usuários do sistema...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-blue-900/40 bg-[#071321]/80 text-slate-400 font-semibold">
                    <th className="py-3.5 px-5">Usuário</th>
                    <th className="py-3.5 px-4">Contato / CPF</th>
                    <th className="py-3.5 px-4 text-center">Perfil / Tipo</th>
                    <th className="py-3.5 px-4 text-center">Subconta Asaas</th>
                    <th className="py-3.5 px-4 text-center">Taxa Céos (Split)</th>
                    <th className="py-3.5 px-4 text-center">Eventos Criados</th>
                    <th className="py-3.5 px-4 text-center">Inscrições</th>
                    <th className="py-3.5 px-5 text-right">Ação / Gerenciar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-900/20">
                  {usuariosPaginados.map((u) => {
                    const isPromotor = u.role === "promotor" || (u.tipoUsuario || "").toLowerCase() === "promotor";
                    const infoTipo = formatarInfoTipoUsuario(u.tipoUsuario);

                    return (
                      <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                        {/* Usuário */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-700 to-blue-900 text-blue-200 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-500/20">
                              {u.nome.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-white truncate max-w-[200px]">{u.nome}</p>
                              <p className="text-[11px] text-slate-400 truncate max-w-[200px]">{u.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Contato & CPF */}
                        <td className="py-3.5 px-4 text-slate-300">
                          <p className="font-mono text-[11px]">{u.cpf || "CPF não informado"}</p>
                          {u.telefone && (
                            <p className="text-[10px] text-slate-400 mt-0.5">{u.telefone}</p>
                          )}
                        </td>

                        {/* Perfil / Tipo de Usuário Real */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => abrirModalEditarPerfil(u)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border transition-transform hover:scale-105 cursor-pointer uppercase ${infoTipo.badgeClass}`}
                            title={`Clique para alterar o perfil de ${u.nome} (Atual: ${infoTipo.label})`}
                          >
                            {renderIconTipo(infoTipo.key)}
                            <span>{infoTipo.label}</span>
                          </button>
                        </td>

                        {/* Subconta Asaas */}
                        <td className="py-3.5 px-4 text-center">
                          {u.asaasAccountId ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>Subconta Ativa</span>
                            </span>
                          ) : isPromotor ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                              <Clock className="w-3 h-3 text-amber-400" />
                              <span>Pendente</span>
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">—</span>
                          )}
                        </td>

                        {/* Taxa Céos Negociada (Split Asaas) */}
                        <td className="py-3.5 px-4 text-center">
                          {isPromotor ? (
                            <div className="inline-flex items-center justify-center gap-1.5">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  u.taxaCeos && u.taxaCeos !== 8
                                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                    : "bg-slate-800 text-slate-300 border border-blue-900/40"
                                }`}
                              >
                                {u.taxaCeos ?? 8}% {u.taxaCeos && u.taxaCeos !== 8 ? "Negociada" : "Padrão"}
                              </span>
                              <button
                                type="button"
                                onClick={() => abrirModalTaxa(u)}
                                className="p-1 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors cursor-pointer"
                                title={`Ajustar taxa negociada Céos (${u.taxaCeos ?? 8}%)`}
                              >
                                <Percent className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-500 text-[11px]">—</span>
                          )}
                        </td>

                        {/* Eventos Criados */}
                        <td className="py-3.5 px-4 text-center font-bold text-white">
                          {u.totalEventosCriados || 0}
                        </td>

                        {/* Inscrições */}
                        <td className="py-3.5 px-4 text-center font-bold text-slate-300">
                          {u.totalInscricoes || 0}
                        </td>

                        {/* Ação / Gerenciar */}
                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isPromotor && (
                              <button
                                type="button"
                                onClick={() => abrirModalTaxa(u)}
                                className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-all flex items-center gap-1 cursor-pointer"
                                title="Ajustar taxa Céos para este promotor"
                              >
                                <Percent className="w-3 h-3" />
                                <span>Taxa ({u.taxaCeos ?? 8}%)</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => abrirModalEditarPerfil(u)}
                              className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-blue-900/40 transition-all flex items-center gap-1 cursor-pointer"
                              title="Alterar perfil deste usuário"
                            >
                              <SlidersHorizontal className="w-3 h-3" />
                              <span>Alterar Perfil</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {usuariosFiltrados.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                        Nenhum usuário encontrado para os filtros selecionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* BARRA DE PAGINAÇÃO DE USUÁRIOS */}
              {usuariosFiltrados.length > 0 && (
                <div className="p-4 border-t border-blue-900/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-[#071321]/60">
                  <div className="flex flex-wrap items-center gap-3 text-slate-400">
                    <span>
                      Mostrando <strong className="text-white">{(paginaAtual - 1) * itensPorPagina + 1}</strong> a{" "}
                      <strong className="text-white">
                        {Math.min(paginaAtual * itensPorPagina, usuariosFiltrados.length)}
                      </strong>{" "}
                      de <strong className="text-white">{usuariosFiltrados.length}</strong> participantes
                    </span>

                    <div className="flex items-center gap-1.5 ml-0 sm:ml-2">
                      <span className="text-[11px] text-slate-500">Por página:</span>
                      <select
                        value={itensPorPagina}
                        onChange={(e) => {
                          setItensPorPagina(Number(e.target.value));
                          setPaginaAtual(1);
                        }}
                        className="px-2 py-1 rounded-lg bg-[#0c1e33] border border-blue-900/50 text-slate-200 text-xs font-semibold focus:outline-none focus:border-amber-400 cursor-pointer"
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPaginaAtual(1)}
                      disabled={paginaAtual === 1}
                      className="px-2.5 py-1.5 rounded-xl bg-[#0c1e33] border border-blue-900/40 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors cursor-pointer text-xs font-bold"
                      title="Primeira página"
                    >
                      «
                    </button>
                    <button
                      onClick={() => setPaginaAtual((prev) => Math.max(prev - 1, 1))}
                      disabled={paginaAtual === 1}
                      className="px-3 py-1.5 rounded-xl bg-[#0c1e33] border border-blue-900/40 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Anterior</span>
                    </button>

                    <div className="flex items-center gap-1 px-1">
                      {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                        .filter((p) => {
                          if (totalPaginas <= 7) return true;
                          if (p === 1 || p === totalPaginas) return true;
                          return Math.abs(p - paginaAtual) <= 1;
                        })
                        .map((p, idx, arr) => {
                          const prev = arr[idx - 1];
                          return (
                            <React.Fragment key={p}>
                              {prev && p - prev > 1 && (
                                <span className="text-slate-600 px-1">...</span>
                              )}
                              <button
                                onClick={() => setPaginaAtual(p)}
                                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  paginaAtual === p
                                    ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20"
                                    : "bg-[#0c1e33] text-slate-400 hover:text-white border border-blue-900/40 hover:bg-slate-800"
                                }`}
                              >
                                {p}
                              </button>
                            </React.Fragment>
                          );
                        })}
                    </div>

                    <button
                      onClick={() => setPaginaAtual((prev) => Math.min(prev + 1, totalPaginas))}
                      disabled={paginaAtual === totalPaginas}
                      className="px-3 py-1.5 rounded-xl bg-[#0c1e33] border border-blue-900/40 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1"
                    >
                      <span>Próxima</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setPaginaAtual(totalPaginas)}
                      disabled={paginaAtual === totalPaginas}
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
      )}

      {/* MODAL: AJUSTAR TAXA CÉOS DO PROMOTOR (SPLIT ASAAS) */}
      {modalTaxaPromotor && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#0c1e33] border border-amber-500/30 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setModalTaxaPromotor(null)}
              className="absolute right-5 top-5 p-1.5 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
                <Percent className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  Taxa de Comissão Céos (Split Asaas)
                </span>
                <h3 className="font-montserrat font-bold text-base sm:text-lg text-white">
                  Ajustar Taxa do Promotor
                </h3>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#071321] border border-blue-900/40 text-xs text-slate-300 space-y-1">
              <p>
                <strong className="text-white">Promotor:</strong> {modalTaxaPromotor.nome}
              </p>
              <p>
                <strong className="text-white">E-mail:</strong> {modalTaxaPromotor.email}
              </p>
              <p>
                <strong className="text-white">Subconta Asaas:</strong>{" "}
                {modalTaxaPromotor.asaasAccountId ? (
                  <span className="text-emerald-400 font-mono">Conectada ({modalTaxaPromotor.asaasAccountId})</span>
                ) : (
                  <span className="text-amber-400">Pendente de Configuração</span>
                )}
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Porcentagem Céos (%)</span>
                  <span className="text-amber-400 font-bold">
                    {novaTaxaPromotor}% Céos / {(100 - novaTaxaPromotor).toFixed(1).replace(".0", "")}% Promotor
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="50"
                    value={novaTaxaPromotor}
                    onChange={(e) => setNovaTaxaPromotor(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#071321] border border-amber-500/40 text-amber-400 font-bold text-base focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">%</span>
                </div>

                <div className="flex items-center gap-1.5 pt-1">
                  {[0, 4, 5, 6, 7, 8, 10].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setNovaTaxaPromotor(p)}
                      className={`flex-1 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                        novaTaxaPromotor === p
                          ? "bg-amber-400 text-slate-950 border-amber-400"
                          : "bg-[#071321] text-slate-400 border-blue-900/40 hover:text-white"
                      }`}
                    >
                      {p}%
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#071321] border border-blue-900/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aplicarAosEventosExistentes}
                  onChange={(e) => setAplicarAosEventosExistentes(e.target.checked)}
                  className="mt-0.5 rounded border-blue-900 bg-slate-900 text-amber-500 focus:ring-0 cursor-pointer"
                />
                <div className="text-[11px] leading-tight">
                  <span className="font-bold text-white block">
                    Propagar taxa para todos os eventos existentes deste promotor
                  </span>
                  <span className="text-slate-400 text-[10px] block mt-0.5">
                    Atualiza os {modalTaxaPromotor.totalEventosCriados || 0} eventos já publicados por este promotor para {novaTaxaPromotor}%.
                  </span>
                </div>
              </label>

              <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-900/40 text-[11px] text-slate-300 space-y-1">
                <p className="font-bold text-blue-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Divisão Instantânea (Split Asaas)</span>
                </p>
                <p className="text-slate-400 leading-relaxed text-[10px]">
                  No momento que qualquer participante pagar uma inscrição (Pix, Cartão, Boleto), o gateway Asaas divide o valor em tempo real: <strong>{novaTaxaPromotor}%</strong> vai direto para a carteira da Céos e <strong>{(100 - novaTaxaPromotor).toFixed(1).replace(".0", "")}%</strong> para o promotor. Sem necessidade de repasse manual posterior.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalTaxaPromotor(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmarTaxaPromotor}
                  disabled={salvandoTaxaPromotor}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  {salvandoTaxaPromotor ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Salvar Taxa ({novaTaxaPromotor}%)</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ALTERAR PERFIL / TIPO DE USUÁRIO */}
      {modalEditarPerfilUsuario && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#0c1e33] border border-blue-900/50 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setModalEditarPerfilUsuario(null)}
              className="absolute right-5 top-5 p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                  Gerenciamento de Perfis & Permissões
                </span>
                <h3 className="font-montserrat font-bold text-base sm:text-lg text-white">
                  Alterar Perfil do Usuário
                </h3>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#071321] border border-blue-900/40 text-xs text-slate-300 space-y-1">
              <p>
                <strong className="text-white">Usuário:</strong> {modalEditarPerfilUsuario.nome}
              </p>
              <p>
                <strong className="text-white">E-mail:</strong> {modalEditarPerfilUsuario.email}
              </p>
              <p>
                <strong className="text-white">Perfil Atual:</strong>{" "}
                <span className="text-amber-400 font-bold">
                  {formatarInfoTipoUsuario(modalEditarPerfilUsuario.tipoUsuario).label}
                </span>
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">
                Selecione o Novo Perfil para este Usuário:
              </label>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {[
                  {
                    id: "promotor",
                    titulo: "Promotor de Eventos",
                    desc: "Habilita painel financeiro Asaas, publicação e gestão de eventos.",
                    icon: <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />,
                  },
                  {
                    id: "congressista",
                    titulo: "Congressista",
                    desc: "Perfil de participante em congressos, simpósios e submissão de artigos.",
                    icon: <Ticket className="w-4 h-4 text-blue-400 shrink-0" />,
                  },
                  {
                    id: "palestrante",
                    titulo: "Palestrante",
                    desc: "Conferencistas, ministrantes de palestras e minicursos.",
                    icon: <Mic className="w-4 h-4 text-purple-400 shrink-0" />,
                  },
                  {
                    id: "aluno",
                    titulo: "Aluno (Graduação)",
                    desc: "Estudantes universitários com acesso a lotes e descontos acadêmicos.",
                    icon: <GraduationCap className="w-4 h-4 text-sky-400 shrink-0" />,
                  },
                  {
                    id: "aluno_pos_graduacao",
                    titulo: "Aluno (Pós-Graduação)",
                    desc: "Mestrandos, doutorandos e residentes acadêmicos.",
                    icon: <BookOpen className="w-4 h-4 text-indigo-400 shrink-0" />,
                  },
                  {
                    id: "participante",
                    titulo: "Participante Geral",
                    desc: "Conta padrão de participante para qualquer público.",
                    icon: <User className="w-4 h-4 text-slate-400 shrink-0" />,
                  },
                ].map((item) => {
                  const isSelected = novoTipoSelecionado === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setNovoTipoSelecionado(item.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                        isSelected
                          ? "bg-blue-950/50 border-amber-400 shadow-md ring-1 ring-amber-400/20"
                          : "bg-[#071321] border-blue-900/40 hover:border-slate-700"
                      }`}
                    >
                      <input
                        type="radio"
                        name="tipoUsuarioRadio"
                        checked={isSelected}
                        onChange={() => setNovoTipoSelecionado(item.id)}
                        className="mt-1 text-amber-500 focus:ring-0 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {item.icon}
                          <span className="font-bold text-xs text-white">
                            {item.titulo}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModalEditarPerfilUsuario(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarTipoUsuario}
                disabled={salvandoTipoUsuario}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                {salvandoTipoUsuario ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Salvar Perfil</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
