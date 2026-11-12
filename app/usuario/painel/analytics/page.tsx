"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  buscarEventosDoPromotor,
  buscarAnalyticsDoEvento,
  EventoAnalyticsData,
  EventoPromotorItem,
  TrabalhoSubmetido,
} from "@/lib/analytics";
import { verificarStatusSubconta } from "@/lib/subcontaUtils";
import ModalSubcontaObrigatoria from "@/components/ModalSubcontaObrigatoria";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  AvaliadorEvento,
  HorarioOcupadoParticipante,
  selecionarAvaliadoresPorArea,
  distribuirTrabalhosNosPeriodos,
  calcularNotaRanking,
  isTrabalhoAceito,
} from "@/lib/trabalhos";
import {
  Loader2,
  BarChart3,
  Download,
  Search,
  X,
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  TrendingUp,
  Percent,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Check,
  ChevronDown,
  ExternalLink,
  Pencil,
  ShieldAlert,
  FileText,
  Eye,
  BookOpen,
  Trophy,
} from "lucide-react";

function AnalyticsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramEventoId = searchParams.get("eventoId") || searchParams.get("id");

  const { user, userData } = useAuth();
  const isPromotor =
    userData?.tipoUsuario === "promotor" ||
    userData?.tipo_usuario === "promotor" ||
    userData?.role === "promotor";

  const statusSubconta = verificarStatusSubconta(userData);
  const [modalSubcontaAberto, setModalSubcontaAberto] = useState(false);

  const [eventos, setEventos] = useState<EventoPromotorItem[]>([]);
  const [eventoSelecionado, setEventoSelecionado] = useState<string>("");
  const [analytics, setAnalytics] = useState<EventoAnalyticsData | null>(null);
  const [loadingEventos, setLoadingEventos] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [erroAcesso, setErroAcesso] = useState<string | null>(null);

  // Filtros da tabela de participantes
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroLote, setFiltroLote] = useState("Todos");
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"analytics" | "trabalhos">("analytics");
  const [trabalhoParecer, setTrabalhoParecer] = useState<TrabalhoSubmetido | null>(null);
  const [distribuindoTrabalhos, setDistribuindoTrabalhos] = useState(false);
  const [modoRankingAnalytics, setModoRankingAnalytics] = useState<
    "media_pre_e_apresentacao" | "soma_pre_e_apresentacao" | "apenas_apresentacao" | "apenas_pre_congresso"
  >("media_pre_e_apresentacao");
  const [decisaoModal, setDecisaoModal] = useState<"Aceito" | "Aceito com ressalvas" | "Recusado">("Aceito");
  const [notaPreModal, setNotaPreModal] = useState("9.0");
  const [parecerModalTexto, setParecerModalTexto] = useState("");
  const [salvandoParecerModal, setSalvandoParecerModal] = useState(false);

  const handleDistribuirTrabalhosNoAnalytics = async () => {
    if (!analytics || !eventoSelecionado) return;
    if (!analytics.trabalhos || analytics.trabalhos.length === 0) {
      alert("Nenhum trabalho submetido neste evento para distribuir.");
      return;
    }
    setDistribuindoTrabalhos(true);
    try {
      const st = analytics.submissaoTrabalhos || {};
      const qtdAvs = [1, 2, 3].includes(Number(st.qtdAvaliadoresPorResumo))
        ? Number(st.qtdAvaliadoresPorResumo)
        : 1;

      // 1. Monta lista de avaliadores disponíveis (comissão + inscritos com desejoAvaliador)
      const avaliadoresDisp: AvaliadorEvento[] = [];
      if (Array.isArray(st.avaliadoresComissao)) {
        st.avaliadoresComissao.forEach((av: any, idx: number) => {
          if (av && av.email) {
            avaliadoresDisp.push({
              id: av.id || String(idx),
              nome: av.nome || av.email,
              email: av.email,
              areasInteresse: Array.isArray(av.areasInteresse) ? av.areasInteresse : [],
            });
          }
        });
      }
      analytics.participantes.forEach((p) => {
        const raw = p.raw || {};
        if (raw.desejoAvaliador === true && p.email) {
          if (!avaliadoresDisp.some((a) => a.email.toLowerCase() === p.email.toLowerCase())) {
            avaliadoresDisp.push({
              id: p.id,
              nome: p.nome,
              email: p.email,
              areasInteresse: Array.isArray(raw.areasInteresseAvaliador) ? raw.areasInteresseAvaliador : [],
            });
          }
        }
      });

      const cargaAtual: Record<string, number> = {};
      let qtdDesignados = 0;

      for (const t of analytics.trabalhos) {
        const rawT = t.raw || {};
        if (!Array.isArray(rawT.avaliadoresDesignadosEmails) || rawT.avaliadoresDesignadosEmails.length === 0) {
          const selecionados = selecionarAvaliadoresPorArea(
            t.eixoTematico,
            avaliadoresDisp,
            qtdAvs,
            t.userEmail || "",
            cargaAtual
          );
          if (selecionados.length > 0) {
            selecionados.forEach((s) => {
              const em = s.email.toLowerCase();
              cargaAtual[em] = (cargaAtual[em] || 0) + 1;
            });
            await updateDoc(doc(db, "trabalhos", t.id), {
              avaliadoresDesignadosEmails: selecionados.map((s) => s.email),
              avaliadoresDesignadosNomes: selecionados.map((s) => s.nome),
              avaliadorEmail: selecionados[0].email,
              avaliadorNome: selecionados[0].nome,
              updatedAt: new Date().toISOString(),
            });
            qtdDesignados++;
          }
        }
      }

      // 2. Distribui trabalhos aceitos nos dias/horários sem choque com minicursos
      const aceitosRaw = analytics.trabalhos
        .filter((t) => isTrabalhoAceito(t.status))
        .map((t) => t.raw || t);
      const diasConf = st.avaliacaoDia?.dias || [];
      let qtdHorarios = 0;

      if (aceitosRaw.length > 0 && diasConf.length > 0) {
        const ocupacoesPorEmail: Record<string, HorarioOcupadoParticipante[]> = {};
        const listaMinicursos = analytics.minicursos || [];

        analytics.participantes.forEach((p) => {
          const raw = p.raw || {};
          const emailPart = (p.email || "").trim().toLowerCase();
          const cursosInsc: string[] = Array.isArray(raw.minicursosSelecionados)
            ? raw.minicursosSelecionados
            : [];
          if (emailPart && cursosInsc.length > 0) {
            cursosInsc.forEach((nomeCurso) => {
              const cursoObj = listaMinicursos.find(
                (m: any) => (m.nome || "").trim().toLowerCase() === nomeCurso.trim().toLowerCase()
              );
              if (cursoObj && Array.isArray(cursoObj.dias)) {
                cursoObj.dias.forEach((diaCurso: any) => {
                  if (diaCurso.data && diaCurso.horaInicio && diaCurso.horaFim) {
                    if (!ocupacoesPorEmail[emailPart]) ocupacoesPorEmail[emailPart] = [];
                    ocupacoesPorEmail[emailPart].push({
                      data: diaCurso.data,
                      horaInicio: diaCurso.horaInicio,
                      horaFim: diaCurso.horaFim,
                      descricao: `Minicurso: ${cursoObj.nome}`,
                    });
                  }
                });
              }
            });
          }
        });

        const dist = distribuirTrabalhosNosPeriodos(
          aceitosRaw,
          diasConf,
          Number(st.avaliacaoDia?.oral?.tempoMinutos) || 15,
          Number(st.avaliacaoDia?.banner?.qtdPorPeriodo) || 50,
          ocupacoesPorEmail
        );

        for (const item of dist.atualizados) {
          await updateDoc(doc(db, "trabalhos", item.id), {
            modalidadeApresentacao: item.modalidadeApresentacao,
            apresentacaoDiaId: item.apresentacaoDiaId,
            apresentacaoDiaLabel: item.apresentacaoDiaLabel,
            apresentacaoData: item.apresentacaoData,
            apresentacaoHoraInicio: item.apresentacaoHoraInicio,
            apresentacaoHoraFim: item.apresentacaoHoraFim,
            apresentacaoLocal: item.apresentacaoLocal,
            conflitoMinicursoEvitado: item.conflitoMinicursoEvitado,
            updatedAt: new Date().toISOString(),
          });
          qtdHorarios++;
        }
      }

      const novosDados = await buscarAnalyticsDoEvento(eventoSelecionado, user || undefined);
      setAnalytics(novosDados);
      alert(
        `Distribuição concluída! ${qtdDesignados} resumo(s) encaminhado(s) para avaliadores da mesma área e ${qtdHorarios} trabalho(s) aceito(s) alocado(s) nos horários sem choque com cursos.`
      );
    } catch (e) {
      console.error("Erro ao distribuir trabalhos:", e);
      alert("Erro ao distribuir trabalhos.");
    } finally {
      setDistribuindoTrabalhos(false);
    }
  };

  const handleSalvarParecerNoAnalytics = async () => {
    if (!trabalhoParecer || !eventoSelecionado) return;
    const notaNum =
      decisaoModal === "Aceito" && notaPreModal.trim() !== ""
        ? parseFloat(notaPreModal.replace(",", "."))
        : null;
    setSalvandoParecerModal(true);
    try {
      const payload: any = {
        status: decisaoModal,
        parecerAvaliador: parecerModalTexto.trim(),
        parecer: parecerModalTexto.trim(),
        notaPreCongresso: notaNum,
        updatedAt: new Date().toISOString(),
      };
      if (decisaoModal === "Aceito com ressalvas") {
        payload.avaliadorRessalvaEmail = user?.email || "";
        payload.avaliadorRessalvaNome = userData?.nome || "Comissão Científica";
      }
      await updateDoc(doc(db, "trabalhos", trabalhoParecer.id), payload);
      const novosDados = await buscarAnalyticsDoEvento(eventoSelecionado, user || undefined);
      setAnalytics(novosDados);
      setTrabalhoParecer(null);
    } catch (e) {
      console.error("Erro ao salvar avaliação:", e);
      alert("Erro ao salvar parecer do trabalho.");
    } finally {
      setSalvandoParecerModal(false);
    }
  };

  // 1. Carrega estritamente os eventos pertencentes ao promotor logado
  useEffect(() => {
    if (!user) return;
    if (!isPromotor) {
      setLoadingEventos(false);
      return;
    }

    const carregarEventosPromotor = async () => {
      setLoadingEventos(true);
      try {
        const ev = await buscarEventosDoPromotor(user);
        setEventos(ev);

        // Se veio query param e o evento pertence ao promotor, seleciona ele
        if (paramEventoId && ev.some((item) => item.id === paramEventoId)) {
          setEventoSelecionado(paramEventoId);
        } else if (ev.length > 0) {
          // Se não veio ou o param não for dele, seleciona o primeiro evento dele
          setEventoSelecionado(ev[0].id);
        }
      } catch (err) {
        console.error("Erro ao carregar eventos do promotor:", err);
      } finally {
        setLoadingEventos(false);
      }
    };

    carregarEventosPromotor();
  }, [user, isPromotor, paramEventoId]);

  // 2. Carrega os dados analíticos do evento selecionado e valida propriedade
  useEffect(() => {
    if (!eventoSelecionado || !user) {
      setAnalytics(null);
      return;
    }

    const carregarDadosAnalytics = async () => {
      setLoadingAnalytics(true);
      setErroAcesso(null);
      try {
        // Passa o usuário logado para validar estritamente a posse do evento
        const data = await buscarAnalyticsDoEvento(eventoSelecionado, user);
        setAnalytics(data);
      } catch (err: any) {
        console.error("Erro ao buscar analytics do evento:", err);
        setAnalytics(null);
        setErroAcesso(err?.message || "Não foi possível carregar as métricas deste evento.");
      } finally {
        setLoadingAnalytics(false);
      }
    };

    carregarDadosAnalytics();
  }, [eventoSelecionado, user]);

  // Troca de evento selecionado no dropdown
  const handleTrocarEvento = (novoId: string) => {
    setEventoSelecionado(novoId);
    router.replace(`/usuario/painel/analytics?eventoId=${novoId}`);
  };

  // Filtragem dos participantes em tempo real
  const participantesFiltrados = useMemo(() => {
    if (!analytics) return [];
    return analytics.participantes.filter((p) => {
      const termo = searchTerm.trim().toLowerCase();
      const termoDigitos = termo.replace(/\D/g, "");
      const cpfDigitos = (p.cpf || "").replace(/\D/g, "");

      const matchesSearch =
        !termo ||
        p.nome.toLowerCase().includes(termo) ||
        p.email.toLowerCase().includes(termo) ||
        p.cpf.toLowerCase().includes(termo) ||
        (termoDigitos.length > 0 && cpfDigitos.includes(termoDigitos)) ||
        p.codigoIngresso.toLowerCase().includes(termo);

      const matchesLote = filtroLote === "Todos" || p.lote === filtroLote;
      const matchesStatus = filtroStatus === "Todos" || p.statusNormalizado === filtroStatus;
      return matchesSearch && matchesLote && matchesStatus;
    });
  }, [analytics, searchTerm, filtroLote, filtroStatus]);

  // Lotes únicos para filtro
  const lotesDisponiveis = useMemo(() => {
    if (!analytics) return [];
    const set = new Set<string>();
    analytics.participantes.forEach((p) => {
      if (p.lote) set.add(p.lote);
    });
    return Array.from(set);
  }, [analytics]);

  const statusDisponiveis = ["Confirmada", "Pendente", "Cancelada"] as const;

  // Copiar código do ingresso
  const handleCopyCodigo = (codigo: string) => {
    navigator.clipboard.writeText(codigo);
    setCopiedId(codigo);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Exportar dados da tabela para CSV
  const exportarCSV = () => {
    if (!analytics) return;
    const headers = [
      "Nome Completo",
      "E-mail",
      "CPF",
      "Lote / Categoria",
      "Valor (R$)",
      "Data da Compra",
      "Código do Ingresso",
      "Status",
    ];

    const rows = participantesFiltrados.map((p) => [
      p.nome,
      p.email,
      p.cpf,
      p.lote,
      p.valorFormatado,
      p.dataCompra,
      p.codigoIngresso,
      p.statusNormalizado,
    ]);

    const csvContent =
      "\uFEFF" +
      [headers, ...rows]
        .map((row) => row.map((v) => `"${String(v || "").replace(/"/g, '""')}"`).join(";"))
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const sanitizedTitle = (analytics.eventoTitulo || "evento")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_");
    link.setAttribute("download", `analytics_${sanitizedTitle}_inscritos.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Caso o usuário não seja promotor
  if (!isPromotor) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center bg-white dark:bg-[#0c1e33] border border-slate-200 dark:border-blue-900/40 rounded-3xl space-y-4 shadow-sm my-12">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="font-montserrat font-bold text-xl text-slate-900 dark:text-white">
          Acesso Restrito a Promotores
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Esta área de análise e relatórios está disponível apenas para organizadores e promotores de eventos.
        </p>
        <div className="pt-2">
          <Link
            href="/usuario/painel/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <span>Ir para o Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  // Caso promotor não tenha nenhum evento cadastrado
  if (!loadingEventos && eventos.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link
            href="/usuario/painel/meus-eventos"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para Meus Eventos</span>
          </Link>
        </div>

        <div className="p-12 text-center bg-white dark:bg-[#0c1e33] rounded-3xl border border-dashed border-slate-200 dark:border-blue-900/40 space-y-4 max-w-lg mx-auto my-8">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mx-auto">
            <BarChart3 className="w-6 h-6" />
          </div>
          <h3 className="font-montserrat font-bold text-slate-900 dark:text-white text-lg">
            Nenhum evento criado por você
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Para visualizar o analytics e a lista de participantes, você precisa primeiro criar e publicar um evento de sua responsabilidade.
          </p>
          <button
            type="button"
            onClick={() => {
              if (!statusSubconta.isAtiva) {
                setModalSubcontaAberto(true);
                return;
              }
              router.push("/eventos/createEvent");
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <span>Publicar Meu Primeiro Evento</span>
          </button>
        </div>

        <ModalSubcontaObrigatoria
          isOpen={modalSubcontaAberto}
          onClose={() => setModalSubcontaAberto(false)}
          status={statusSubconta.status}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Barra Superior de Navegação & Seletor de Evento */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-blue-900/40 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/usuario/painel/meus-eventos"
            className="p-2 rounded-xl bg-white dark:bg-[#0c1e33] border border-slate-200 dark:border-blue-900/40 text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:border-blue-400 dark:hover:border-blue-500 transition-all shadow-2xs"
            title="Voltar para Meus Eventos"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
              <span>Painel</span>
              <span>/</span>
              <Link href="/usuario/painel/meus-eventos" className="hover:text-blue-500 transition-colors">
                Meus Eventos
              </Link>
              <span>/</span>
              <span className="text-blue-600 dark:text-blue-400 font-semibold">Analytics</span>
            </div>
            <h1 className="font-montserrat text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              Analytics & Gestão de Inscritos
            </h1>
          </div>
        </div>

        {/* Seletor rápido de evento do promotor */}
        {eventos.length > 1 && (
          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 hidden md:inline">
              Alternar evento:
            </span>
            <div className="relative">
              <select
                value={eventoSelecionado}
                onChange={(e) => handleTrocarEvento(e.target.value)}
                className="appearance-none text-xs font-semibold pl-3 pr-8 py-2 rounded-xl bg-white dark:bg-[#0c1e33] border border-slate-200 dark:border-blue-900/40 text-slate-800 dark:text-slate-200 shadow-2xs hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer max-w-[260px] truncate"
              >
                {eventos.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        )}
      </div>

      {/* Caso de erro de acesso (se o promotor tentar acessar evento de outro) */}
      {erroAcesso && (
        <div className="p-6 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl flex items-start gap-3.5 text-rose-800 dark:text-rose-200">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs sm:text-sm">
            <p className="font-bold">Acesso Restrito</p>
            <p className="text-rose-700 dark:text-rose-300">{erroAcesso}</p>
            <Link
              href="/usuario/painel/meus-eventos"
              className="inline-block mt-2 font-semibold text-rose-600 dark:text-rose-400 hover:underline"
            >
              ← Retornar à lista dos seus eventos
            </Link>
          </div>
        </div>
      )}

      {/* Loading principal */}
      {loadingAnalytics ? (
        <div className="py-24 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Carregando dados analíticos e inscrições do evento...
          </p>
        </div>
      ) : analytics ? (
        <>
          {/* BANNER / HERO DO EVENTO SELECIONADO */}
          <div className="bg-white dark:bg-[#0c1e33] rounded-3xl border border-slate-200/90 dark:border-blue-900/40 p-5 sm:p-6 shadow-xs relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="flex items-start sm:items-center gap-4 min-w-0">
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200/70 dark:border-blue-900/50">
                  <Image
                    src={analytics.eventoImg || "/assets/logos/teste-anatomia.png"}
                    alt={analytics.eventoTitulo}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40">
                      {analytics.eventoCategoria || "Evento Científico"}
                    </span>
                    {analytics.eventoStatus && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                        {analytics.eventoStatus}
                      </span>
                    )}
                  </div>

                  <h2 className="font-montserrat font-extrabold text-base sm:text-xl text-slate-900 dark:text-white truncate">
                    {analytics.eventoTitulo}
                  </h2>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                    {analytics.eventoData && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-500" />
                        <span>{analytics.eventoData}</span>
                      </div>
                    )}
                    {analytics.eventoLocal && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-blue-500" />
                        <span className="truncate max-w-[200px]">{analytics.eventoLocal}</span>
                      </div>
                    )}
                    {analytics.capacidade && (
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-blue-500" />
                        <span>Capacidade: {analytics.capacidade} vagas</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Botões de Ação do Evento */}
              <div className="flex items-center gap-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 dark:border-blue-900/30">
                <Link
                  href={`/eventos/${analytics.eventId}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#071321] dark:hover:bg-blue-950/60 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
                  target="_blank"
                  title="Abrir página pública de apresentação"
                >
                  <span>Página Pública</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>

                <Link
                  href={`/eventos/createEvent?id=${analytics.eventId}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all"
                  title="Editar dados e lotes do evento"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Editar Evento</span>
                </Link>
              </div>
            </div>
          </div>

          {/* TABS DE NAVEGAÇÃO DO PAINEL */}
          <div className="flex items-center gap-6 border-b border-slate-200 dark:border-blue-900/40 mb-6 px-2">
            <button
              onClick={() => setActiveTab("analytics")}
              className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
                activeTab === "analytics"
                  ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              Visão Geral & Inscritos
            </button>
            <button
              onClick={() => setActiveTab("trabalhos")}
              className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === "trabalhos"
                  ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              Trabalhos Submetidos
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                {analytics.trabalhos?.length || 0}
              </span>
            </button>
          </div>

          {activeTab === "analytics" ? (
            <div className="space-y-6">
              {/* CARDS DE KPIS PRINCIPAIS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Total de Inscritos */}
            <div className="bg-white dark:bg-[#0c1e33] rounded-2xl p-5 border border-slate-200/90 dark:border-blue-900/40 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Total de Inscritos
                </span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="font-montserrat text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                  {analytics.totalInscritos}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {analytics.totalConfirmados} confirmados
                  </span>
                  <span>•</span>
                  <span>{analytics.totalPendentes} pendentes</span>
                </p>
              </div>
            </div>

            {/* 2. Receita Arrecadada */}
            <div className="bg-white dark:bg-[#0c1e33] rounded-2xl p-5 border border-slate-200/90 dark:border-blue-900/40 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Receita Arrecadada
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="font-montserrat text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {analytics.receitaFormatada}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Total bruto de inscrições confirmadas
                </p>
              </div>
            </div>

            {/* 3. Ticket Médio */}
            <div className="bg-white dark:bg-[#0c1e33] rounded-2xl p-5 border border-slate-200/90 dark:border-blue-900/40 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Ticket Médio
                </span>
                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="font-montserrat text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                  {analytics.ticketMedioFormatado}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Valor médio por inscrição confirmada
                </p>
              </div>
            </div>

            {/* 4. Taxa de Ocupação */}
            <div className="bg-white dark:bg-[#0c1e33] rounded-2xl p-5 border border-slate-200/90 dark:border-blue-900/40 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Taxa de Ocupação
                </span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Percent className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="font-montserrat text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                  {analytics.taxaOcupacaoPercent !== null ? `${analytics.taxaOcupacaoPercent}%` : "Livre"}
                </p>
                {analytics.capacidade ? (
                  <div className="space-y-1 mt-1.5">
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-amber-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${Math.min(analytics.taxaOcupacaoPercent || 0, 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400">
                      {analytics.totalConfirmados} de {analytics.capacidade} vagas preenchidas
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Sem limite de capacidade configurado
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* DISTRIBUIÇÃO POR LOTES E STATUS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lotes */}
            <div className="lg:col-span-2 bg-white dark:bg-[#0c1e33] rounded-3xl p-5 sm:p-6 border border-slate-200/90 dark:border-blue-900/40 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-montserrat font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                    Distribuição por Lote de Ingressos
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Proporção de inscritos e faturamento de cada lote
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {analytics.distribuicaoLotes.length} {analytics.distribuicaoLotes.length === 1 ? "lote" : "lotes"}
                </span>
              </div>

              {analytics.distribuicaoLotes.length > 0 ? (
                <div className="space-y-3.5 pt-2">
                  {analytics.distribuicaoLotes.map((lote) => (
                    <div key={lote.nome} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {lote.nome}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500 dark:text-slate-400">
                            {lote.quantidade} inscritos ({lote.percentual}%)
                          </span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            R$ {lote.receita.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${Math.max(lote.percentual, 3)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  Nenhum lote identificado nas inscrições até o momento.
                </div>
              )}
            </div>

            {/* Status das Inscrições */}
            <div className="bg-white dark:bg-[#0c1e33] rounded-3xl p-5 sm:p-6 border border-slate-200/90 dark:border-blue-900/40 shadow-xs space-y-4">
              <div>
                <h3 className="font-montserrat font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  Status das Inscrições
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Panorama das transações
                </p>
              </div>

              <div className="space-y-3 pt-2">
                {analytics.distribuicaoStatus.map((st) => {
                  const isConfirmada = st.status.toLowerCase().includes("confirm");
                  const isPendente = st.status.toLowerCase().includes("pend");
                  const badgeColor = isConfirmada
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/40"
                    : isPendente
                    ? "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/40"
                    : "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/40";

                  const IconStatus = isConfirmada ? CheckCircle2 : isPendente ? Clock : AlertCircle;

                  return (
                    <div
                      key={st.status}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-[#071321]/60 border border-slate-100 dark:border-blue-900/30 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-lg border ${badgeColor}`}>
                          <IconStatus className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {st.status}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {st.quantidade}
                        </span>
                        <span className="text-[11px] text-slate-400 ml-1.5">
                          ({st.percentual}%)
                        </span>
                      </div>
                    </div>
                  );
                })}

                {analytics.distribuicaoStatus.length === 0 && (
                  <div className="py-8 text-center text-xs text-slate-400">
                    Nenhuma inscrição registrada ainda.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* TABELA DE GESTÃO DE PARTICIPANTES INSCRITOS */}
          <div className="bg-white dark:bg-[#0c1e33] rounded-3xl border border-slate-200/90 dark:border-blue-900/40 shadow-xs overflow-hidden space-y-4">
            {/* Header da Tabela com Exportação */}
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-blue-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-montserrat font-bold text-base text-slate-900 dark:text-white">
                  Lista de Participantes ({participantesFiltrados.length})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Consulte os inscritos, códigos de ingressos e dados de pagamento deste evento
                </p>
              </div>

              <button
                type="button"
                onClick={exportarCSV}
                disabled={participantesFiltrados.length === 0}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer self-start sm:self-center"
                title="Exportar dados filtrados em formato CSV/Excel"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar CSV</span>
              </button>
            </div>

            {/* Barra de Filtros e Busca */}
            <div className="px-5 sm:px-6 flex flex-col md:flex-row items-stretch md:items-center gap-3">
              {/* Campo de Busca */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nome, e-mail, CPF ou código..."
                  className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-[#071321] border border-slate-200 dark:border-blue-900/40 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filtro por Lote */}
              <div className="relative">
                <select
                  value={filtroLote}
                  onChange={(e) => setFiltroLote(e.target.value)}
                  className="appearance-none text-xs font-medium pl-3 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-[#071321] border border-slate-200 dark:border-blue-900/40 text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                >
                  <option value="Todos">Todos os Lotes</option>
                  {lotesDisponiveis.map((lote) => (
                    <option key={lote} value={lote}>
                      {lote}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Filtro por Status */}
              <div className="relative">
                <select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                  className="appearance-none text-xs font-medium pl-3 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-[#071321] border border-slate-200 dark:border-blue-900/40 text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                >
                  <option value="Todos">Todos os Status</option>
                  {statusDisponiveis.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Tabela Responsiva */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-y border-slate-100 dark:border-blue-900/30 bg-slate-50/70 dark:bg-[#071321]/50 text-slate-500 dark:text-slate-400 font-semibold">
                    <th className="py-3 px-6">Participante</th>
                    <th className="py-3 px-4">CPF</th>
                    <th className="py-3 px-4">Lote</th>
                    <th className="py-3 px-4">Valor</th>
                    <th className="py-3 px-4">Data da Compra</th>
                    <th className="py-3 px-4">Código do Ingresso</th>
                    <th className="py-3 px-6 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-blue-900/20">
                  {participantesFiltrados.map((p) => {
                    const initials = p.nome
                      ? p.nome
                          .split(" ")
                          .slice(0, 2)
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                      : "P";

                    const isConfirmada = p.statusNormalizado === "Confirmada";
                    const isPendente = p.statusNormalizado === "Pendente";

                    const badgeClass = isConfirmada
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/40"
                      : isPendente
                      ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/40"
                      : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/40";

                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-[#071321]/40 transition-colors"
                      >
                        {/* Participante */}
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 dark:text-white truncate max-w-[200px]">
                                {p.nome}
                              </p>
                              <p className="text-[11px] text-slate-400 truncate max-w-[200px]">
                                {p.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* CPF */}
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                          {p.cpf || "—"}
                        </td>

                        {/* Lote */}
                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium">
                          {p.lote || "Padrão"}
                        </td>

                        {/* Valor */}
                        <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                          {p.valorFormatado}
                        </td>

                        {/* Data */}
                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                          {p.dataCompra || "—"}
                        </td>

                        {/* Código Ingresso */}
                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            onClick={() => handleCopyCodigo(p.codigoIngresso)}
                            className="inline-flex items-center gap-1.5 font-mono text-[11px] px-2 py-1 rounded-lg bg-slate-100 dark:bg-[#071321] border border-slate-200 dark:border-blue-900/40 text-slate-700 dark:text-slate-300 hover:border-blue-500 transition-colors cursor-pointer group"
                            title="Clique para copiar código"
                          >
                            <span>{p.codigoIngresso}</span>
                            {copiedId === p.codigoIngresso ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3 text-slate-400 group-hover:text-blue-500" />
                            )}
                          </button>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-6 text-right">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${badgeClass}`}
                          >
                            {p.statusNormalizado}
                          </span>
                        </td>
                      </tr>
                    );
                  })}

                  {participantesFiltrados.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 space-y-2">
                        <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                        <p className="text-xs font-medium">Nenhum participante encontrado.</p>
                        {searchTerm && (
                          <button
                            type="button"
                            onClick={() => {
                              setSearchTerm("");
                              setFiltroLote("Todos");
                              setFiltroStatus("Todos");
                            }}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Limpar filtros de busca
                          </button>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* CABEÇALHO DA ABA DE TRABALHOS */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
                <div>
                  <h3 className="font-montserrat font-bold text-base text-slate-900 dark:text-white">
                    Gestão de Trabalhos Científicos
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Visualize os resumos submetidos, avalie, distribua para a banca por área e gere o ranking de notas.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                  <button
                    type="button"
                    onClick={handleDistribuirTrabalhosNoAnalytics}
                    disabled={distribuindoTrabalhos}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-60"
                    title="Distribuir trabalhos para os avaliadores da mesma área e alocar horários sem choque com minicursos"
                  >
                    {distribuindoTrabalhos ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Users className="w-4 h-4" />
                    )}
                    <span>{distribuindoTrabalhos ? "Distribuindo..." : "Distribuir Trabalhos"}</span>
                  </button>
                </div>
              </div>

              {/* LISTA DE TRABALHOS */}
              {analytics.trabalhos && analytics.trabalhos.length > 0 ? (
                <div className="space-y-4">
                  {analytics.trabalhos.map((trabalho) => (
                    <div
                      key={trabalho.id}
                      className="p-6 rounded-3xl bg-white dark:bg-[#0c1e33] border border-slate-200/90 dark:border-blue-900/40 shadow-xs hover:shadow-md transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
                    >
                      <div className="space-y-3 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              isTrabalhoAceito(trabalho.status)
                                ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40"
                                : trabalho.status.includes("Corre") || trabalho.status.toLowerCase().includes("ressalva")
                                  ? "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40"
                                  : trabalho.status.toLowerCase().includes("recusado") || trabalho.status.toLowerCase().includes("reprovado")
                                    ? "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/40"
                                    : "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40"
                            }`}
                          >
                            {isTrabalhoAceito(trabalho.status) ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : (
                              <Clock className="w-3 h-3" />
                            )}
                            <span>{trabalho.status}</span>
                          </span>

                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                            {trabalho.eixoTematico}
                          </span>

                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {trabalho.tipoResumo === "expandido" ? "Resumo Expandido" : "Resumo Simples"}
                          </span>

                          {trabalho.modalidadeApresentacao && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                              Apresentação: {trabalho.modalidadeApresentacao}
                            </span>
                          )}
                        </div>

                        <h3 className="font-montserrat font-bold text-base sm:text-lg text-slate-900 dark:text-white leading-snug">
                          {trabalho.titulo}
                        </h3>

                        <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                          <p>
                            <strong className="text-slate-700 dark:text-slate-300">Autores: </strong>
                            {trabalho.autores}
                          </p>
                          <p>
                            Submetido em {trabalho.dataSubmissao}
                            {trabalho.notaPreCongresso !== null && trabalho.notaPreCongresso !== undefined
                              ? ` • Nota Pré-Congresso: ${Number(trabalho.notaPreCongresso).toFixed(1)}`
                              : ""}
                            {trabalho.notaDiaMedia !== null && trabalho.notaDiaMedia !== undefined
                              ? ` • Nota Apresentação: ${Number(trabalho.notaDiaMedia).toFixed(2)}`
                              : ""}
                          </p>
                          {trabalho.avaliadoresDesignadosNomes && trabalho.avaliadoresDesignadosNomes.length > 0 && (
                            <p className="text-blue-600 dark:text-blue-400 font-medium">
                              Avaliador(es) na Área: {trabalho.avaliadoresDesignadosNomes.join(", ")}
                            </p>
                          )}
                          {trabalho.apresentacaoDiaLabel && (
                            <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
                              📅 Horário Distribuído: {trabalho.apresentacaoDiaLabel} • {trabalho.apresentacaoHoraInicio} às {trabalho.apresentacaoHoraFim}
                              {trabalho.apresentacaoLocal ? ` (${trabalho.apresentacaoLocal})` : ""} — Sem choque com cursos
                            </p>
                          )}
                        </div>

                        {trabalho.arquivoUrl && (
                          <div className="pt-1">
                            <div className="inline-flex items-center gap-3 p-2.5 px-3.5 rounded-2xl bg-slate-50 dark:bg-[#071321] border border-slate-200/80 dark:border-blue-900/40 text-xs">
                              <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold text-[10px] uppercase shadow-xs shrink-0">
                                PDF
                              </div>
                              <div className="min-w-0 pr-2">
                                <p className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px] sm:max-w-xs">
                                  {trabalho.arquivoNome || "Artigo_Cientifico.pdf"}
                                </p>
                                {trabalho.arquivoTamanho && (
                                  <p className="text-[11px] text-slate-400">{trabalho.arquivoTamanho}</p>
                                )}
                              </div>
                              <a
                                href={trabalho.arquivoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 font-semibold text-xs transition-colors cursor-pointer shrink-0"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Visualizar PDF</span>
                              </a>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0 w-full lg:w-auto pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-blue-900/30">
                        {trabalho.arquivoUrl && (
                          <a
                            href={trabalho.arquivoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={trabalho.arquivoNome || "Trabalho_Cientifico.pdf"}
                            className="flex-1 lg:flex-initial py-2.5 px-4 rounded-xl border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5"
                          >
                            <Download className="w-4 h-4" />
                            <span>Baixar PDF</span>
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setTrabalhoParecer(trabalho);
                            setDecisaoModal(
                              trabalho.status.toLowerCase().includes("ressalva")
                                ? "Aceito com ressalvas"
                                : trabalho.status.toLowerCase().includes("recusado")
                                  ? "Recusado"
                                  : "Aceito"
                            );
                            setNotaPreModal(
                              trabalho.notaPreCongresso !== null && trabalho.notaPreCongresso !== undefined
                                ? String(trabalho.notaPreCongresso)
                                : "9.0"
                            );
                            setParecerModalTexto(trabalho.parecer || "");
                          }}
                          className="flex-1 lg:flex-initial py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors cursor-pointer text-center"
                        >
                          Avaliar / Ver Parecer
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* TABELA DE RANKING DE NOTAS POR ORDEM DECRESCENTE */}
                  <div className="mt-6 rounded-3xl border border-slate-200 dark:border-blue-900/40 bg-white dark:bg-[#0c1e33] overflow-hidden shadow-xs">
                    <div className="bg-gradient-to-r from-[#1e3a8a] to-indigo-900 text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <Trophy className="w-5 h-5 text-amber-300 shrink-0" />
                        <div>
                          <h4 className="font-bold text-sm sm:text-base">
                            Ranking de Notas por Ordem Decrescente
                          </h4>
                          <p className="text-[11px] text-blue-100/90">
                            Maiores notas no topo, com opção de usar também a nota da avaliação pré-congresso.
                          </p>
                        </div>
                      </div>
                      <select
                        value={modoRankingAnalytics}
                        onChange={(e) => setModoRankingAnalytics(e.target.value as any)}
                        className="px-3 py-1.5 rounded-xl bg-white/15 text-white border border-white/25 text-xs font-bold outline-none cursor-pointer"
                      >
                        <option value="media_pre_e_apresentacao" className="text-slate-900">
                          Média (Pré-Congresso + Apresentação)
                        </option>
                        <option value="soma_pre_e_apresentacao" className="text-slate-900">
                          Soma (Pré-Congresso + Apresentação)
                        </option>
                        <option value="apenas_apresentacao" className="text-slate-900">
                          Apenas Nota da Apresentação
                        </option>
                        <option value="apenas_pre_congresso" className="text-slate-900">
                          Apenas Nota Pré-Congresso
                        </option>
                      </select>
                    </div>
                    <div className="p-5 overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                        <thead className="bg-slate-50 dark:bg-[#071321] text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200 dark:border-blue-900/40">
                          <tr>
                            <th className="py-2.5 px-3">Posição</th>
                            <th className="py-2.5 px-3">Trabalho</th>
                            <th className="py-2.5 px-3">Autor</th>
                            <th className="py-2.5 px-3">Área</th>
                            <th className="py-2.5 px-3">Nota Pré</th>
                            <th className="py-2.5 px-3">Nota Apresentação</th>
                            <th className="py-2.5 px-3">Nota Ranking</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-blue-900/30">
                          {[...analytics.trabalhos]
                            .map((t) => ({
                              ...t,
                              notaCalc: calcularNotaRanking(t.raw || t, modoRankingAnalytics),
                            }))
                            .sort((a, b) => b.notaCalc - a.notaCalc)
                            .map((t, idx) => (
                              <tr key={t.id} className="hover:bg-slate-50/60 dark:hover:bg-[#071321]/60">
                                <td className="py-2.5 px-3 font-extrabold text-slate-900 dark:text-white">
                                  {idx + 1}º
                                </td>
                                <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white max-w-xs truncate">
                                  {t.titulo}
                                </td>
                                <td className="py-2.5 px-3">{t.autores}</td>
                                <td className="py-2.5 px-3">{t.eixoTematico}</td>
                                <td className="py-2.5 px-3">
                                  {t.notaPreCongresso !== null && t.notaPreCongresso !== undefined
                                    ? Number(t.notaPreCongresso).toFixed(2)
                                    : "-"}
                                </td>
                                <td className="py-2.5 px-3">
                                  {t.notaDiaMedia !== null && t.notaDiaMedia !== undefined
                                    ? Number(t.notaDiaMedia).toFixed(2)
                                    : "-"}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold text-xs">
                                    {t.notaCalc.toFixed(2)}
                                  </span>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center bg-white dark:bg-[#0c1e33] rounded-3xl border border-dashed border-slate-200 dark:border-blue-900/40 space-y-4 max-w-lg mx-auto mt-8">
                  <div className="w-14 h-14 rounded-3xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-xs">
                    <FileText className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-montserrat font-bold text-slate-900 dark:text-white text-base">
                      Nenhum trabalho científico submetido
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Este evento ainda não recebeu submissões de artigos ou resumos científicos.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Modal de Avaliação e Parecer */}
          {trabalhoParecer && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
              <div className="w-full max-w-lg bg-white dark:bg-[#0c1e33] border border-slate-200 dark:border-blue-900/40 rounded-3xl p-6 sm:p-7 space-y-4 shadow-2xl animate-in fade-in max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-montserrat font-bold text-base text-slate-900 dark:text-white">
                        Avaliação e Parecer do Resumo
                      </h3>
                      <p className="text-xs text-slate-500">ID: {trabalhoParecer.id}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTrabalhoParecer(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs sm:text-sm">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-semibold">
                      Título do Trabalho
                    </span>
                    <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                      {trabalhoParecer.titulo}
                    </p>
                  </div>

                  {trabalhoParecer.resumo && (
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-semibold">
                        Texto do Resumo ({trabalhoParecer.tipoResumo === "expandido" ? "Expandido" : "Simples"})
                      </span>
                      <div className="mt-1 p-3.5 rounded-2xl bg-slate-50 dark:bg-[#071321] border border-slate-200/80 dark:border-blue-900/40 text-slate-700 dark:text-slate-300 leading-relaxed text-xs max-h-40 overflow-y-auto whitespace-pre-wrap">
                        {trabalhoParecer.resumo}
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-semibold">
                      Resultado da Avaliação (3 opções)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {(["Aceito", "Aceito com ressalvas", "Recusado"] as const).map((op) => (
                        <button
                          key={op}
                          type="button"
                          onClick={() => setDecisaoModal(op)}
                          className={`py-2 px-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                            decisaoModal === op
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-slate-50 dark:bg-[#071321] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-blue-900/40"
                          }`}
                        >
                          {op}
                        </button>
                      ))}
                    </div>
                    {decisaoModal === "Aceito com ressalvas" && (
                      <p className="text-[11px] text-indigo-600 dark:text-indigo-400">
                        O resumo voltará para o autor corrigir e será reenviado automaticamente para o mesmo avaliador.
                      </p>
                    )}
                  </div>

                  {decisaoModal === "Aceito" && (
                    <div>
                      <label className="text-[11px] uppercase tracking-wider text-slate-400 block font-semibold mb-1">
                        Nota da Avaliação Pré-Congresso (0 a 10)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={notaPreModal}
                        onChange={(e) => setNotaPreModal(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-blue-900/40 bg-slate-50 dark:bg-[#071321] text-slate-900 dark:text-white text-xs font-bold outline-none"
                      />
                    </div>
                  )}

                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-semibold mb-1">
                      Parecer & Considerações para o Autor
                    </span>
                    <textarea
                      rows={3}
                      value={parecerModalTexto}
                      onChange={(e) => setParecerModalTexto(e.target.value)}
                      className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-[#071321] border border-slate-200/80 dark:border-blue-900/40 text-slate-700 dark:text-slate-300 text-xs outline-none"
                    />
                  </div>

                  {trabalhoParecer.arquivoUrl && (
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-semibold mb-1.5">
                        Arquivo Submetido
                      </span>
                      <a
                        href={trabalhoParecer.arquivoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200/70 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 font-semibold text-xs hover:bg-rose-100 transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Visualizar Arquivo PDF ({trabalhoParecer.arquivoNome || "artigo.pdf"})</span>
                      </a>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setTrabalhoParecer(null)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSalvarParecerNoAnalytics}
                    disabled={salvandoParecerModal}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer"
                  >
                    {salvandoParecerModal ? "Salvando..." : "Salvar Avaliação"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : null}

      <ModalSubcontaObrigatoria
        isOpen={modalSubcontaAberto}
        onClose={() => setModalSubcontaAberto(false)}
        status={statusSubconta.status}
      />
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
          <p className="text-xs sm:text-sm text-slate-500">Carregando painel analítico...</p>
        </div>
      }
    >
      <AnalyticsContent />
    </Suspense>
  );
}
