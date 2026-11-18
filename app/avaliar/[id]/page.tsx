"use client";

import { Suspense, useEffect, useState, useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Download,
  Send,
  Loader2,
  Award,
  ChevronLeft,
  Sparkles,
  BookOpen,
  Calendar,
  Layers,
  UserCheck,
  Check,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  EyeOff,
} from "lucide-react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { AvaliacaoPreCongresso, isAvaliadorConflitoComTrabalho } from "@/lib/trabalhos";

interface CriterioItem {
  id: number | string;
  nome: string;
  peso: number;
}

interface TrabalhoData {
  id: string;
  eventoId: string;
  eventoTitulo?: string;
  titulo: string;
  userId?: string;
  userEmail?: string;
  area?: string;
  eixoTematico?: string;
  tipoResumo?: "simples" | "expandido";
  modalidade?: string;
  autores?: string;
  autorPrincipal?: string;
  orientador?: string;
  coAutores?: Array<{ nome?: string; cpf?: string; email?: string }>;
  resumo: string;
  arquivoUrl?: string;
  arquivoNome?: string;
  status: string;
  avaliadoresDesignados?: Array<{ nome: string; email: string; area?: string }>;
  avaliacoesPreCongresso?: AvaliacaoPreCongresso[];
  notaPreCongresso?: number | null;
  parecer?: string;
  rodadaCorrecao?: number;
}

function ConteudoAvaliacaoTrabalho() {
  const params = useParams();
  const searchParams = useSearchParams();
  const trabalhoId = String(params?.id || "");
  const emailQuery = searchParams.get("email") || "";

  const { user, userData } = useAuth();

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [trabalho, setTrabalho] = useState<TrabalhoData | null>(null);
  const [evento, setEvento] = useState<any | null>(null);

  // Critérios e pesos
  const [criterios, setCriterios] = useState<CriterioItem[]>([]);
  // Notas por critério: { [criterioId]: nota }
  const [notasCriterios, setNotasCriterios] = useState<Record<string, number>>({});

  // Decisão e Parecer
  const [decisao, setDecisao] = useState<"Aceito" | "Aceito com ressalvas" | "Recusado">("Aceito");
  const [parecer, setParecer] = useState("");

  // Dados do Avaliador
  const [nomeAvaliadorInput, setNomeAvaliadorInput] = useState("");
  const [emailAvaliadorInput, setEmailAvaliadorInput] = useState("");

  useEffect(() => {
    if (user?.email) {
      setEmailAvaliadorInput(user.email);
      setNomeAvaliadorInput(userData?.nome || user.displayName || user.email.split("@")[0]);
    } else if (emailQuery) {
      setEmailAvaliadorInput(emailQuery);
    }
  }, [user, userData, emailQuery]);

  useEffect(() => {
    async function carregarDados() {
      if (!trabalhoId) return;
      try {
        setLoading(true);
        setErro(null);

        // 1. Carrega Trabalho
        const trabRef = doc(db, "trabalhos", trabalhoId);
        const trabSnap = await getDoc(trabRef);
        if (!trabSnap.exists()) {
          setErro("Trabalho acadêmico não encontrado ou já removido.");
          return;
        }

        const tData = { id: trabSnap.id, ...trabSnap.data() } as TrabalhoData;
        setTrabalho(tData);

        // Se o avaliador que está acessando já avaliou anteriormente, pré-carrega os dados
        const emailAtual = (user?.email || emailQuery || "").toLowerCase().trim();
        if (emailAtual && Array.isArray(tData.avaliacoesPreCongresso)) {
          const avAnterior = tData.avaliacoesPreCongresso.find(
            (a) => (a.avaliadorEmail || "").toLowerCase().trim() === emailAtual
          );
          if (avAnterior) {
            setDecisao(avAnterior.decisao || "Aceito");
            setParecer(avAnterior.parecer || "");
          }
        }

        // 2. Extrai critérios de avaliação (do evento ou critérios padrão acadêmicos)
        let listaCrit: CriterioItem[] = [
          { id: "c1", nome: "Relevância do Tema e Originalidade", peso: 2.5 },
          { id: "c2", nome: "Rigor Metodológico e Fundamentação", peso: 2.5 },
          { id: "c3", nome: "Clareza da Redação, Estrutura e Coesão", peso: 2.5 },
          { id: "c4", nome: "Resultados, Discussão e Conclusões", peso: 2.5 },
        ];

        if (tData.eventoId) {
          try {
            const evRef = doc(db, "events", tData.eventoId);
            const evSnap = await getDoc(evRef);
            if (evSnap.exists()) {
              const evData = evSnap.data();
              setEvento(evData);

              const sub = evData.submissaoTrabalhos || {};
              const critCadastrados =
                (Array.isArray(sub.criterios) && sub.criterios.length > 0 && sub.criterios) ||
                (Array.isArray(sub.avaliacaoDia?.criterios) && sub.avaliacaoDia.criterios.length > 0 && sub.avaliacaoDia.criterios) ||
                (Array.isArray(evData.criteriosAvaliacao) && evData.criteriosAvaliacao.length > 0 && evData.criteriosAvaliacao);

              if (critCadastrados) {
                listaCrit = critCadastrados.map((c: any, idx: number) => ({
                  id: c.id || idx,
                  nome: c.nome || `Critério ${idx + 1}`,
                  peso: Number(c.peso) || 2.5,
                }));
              }
            }
          } catch (errEv) {
            console.warn("Aviso ao carregar critérios do evento:", errEv);
          }
        }

        setCriterios(listaCrit);

        // Inicializa notas dos critérios na metade superior do peso
        const initialNotas: Record<string, number> = {};
        listaCrit.forEach((c) => {
          initialNotas[String(c.id)] = Number((c.peso * 0.8).toFixed(1));
        });
        setNotasCriterios(initialNotas);
      } catch (e: any) {
        console.error("Erro ao carregar trabalho para avaliação:", e);
        setErro("Não foi possível carregar as informações do trabalho científico.");
      } finally {
        setLoading(false);
      }
    }

    carregarDados();
  }, [trabalhoId, emailQuery]);

  // Cálculo da nota total ponderada
  const { notaTotal, pesoTotal } = useMemo(() => {
    let somaNota = 0;
    let somaPeso = 0;
    criterios.forEach((c) => {
      const p = Number(c.peso) || 0;
      somaPeso += p;
      const n = Number(notasCriterios[String(c.id)]) || 0;
      somaNota += Math.min(n, p);
    });
    return {
      notaTotal: Number(somaNota.toFixed(2)),
      pesoTotal: Number(somaPeso.toFixed(2)),
    };
  }, [criterios, notasCriterios]);

  const handleSliderChange = (criterioId: string | number, valor: number) => {
    setNotasCriterios((prev) => ({
      ...prev,
      [String(criterioId)]: valor,
    }));
  };

  // Verificação de Conflito de Interesses (Autor, Coautor ou Orientador não podem avaliar o próprio trabalho)
  const temConflito = useMemo(() => {
    if (!trabalho) return false;
    const avaliadorInfo = {
      email: (emailAvaliadorInput || user?.email || emailQuery || "").trim().toLowerCase(),
      nome: (nomeAvaliadorInput || userData?.nome || user?.displayName || "").trim(),
      cpf: userData?.cpf || "",
      userId: user?.uid || "",
    };
    return isAvaliadorConflitoComTrabalho(avaliadorInfo, trabalho);
  }, [trabalho, emailAvaliadorInput, nomeAvaliadorInput, user, userData, emailQuery]);

  // Verificação de Prazo de Avaliação (Início e Fim da Avaliação)
  const statusPrazoAvaliacao = useMemo(() => {
    const sub = evento?.submissaoTrabalhos;
    if (!sub) return { aberto: true, mensagem: null, motivo: null };

    const inicioStr =
      sub.dataInicioAvaliacaoDateTime ||
      (sub.dataInicioAvaliacao ? `${sub.dataInicioAvaliacao}T${sub.horaInicioAvaliacao || "00:00"}` : "");
    const fimStr =
      sub.dataFimAvaliacaoDateTime ||
      (sub.dataFimAvaliacao ? `${sub.dataFimAvaliacao}T${sub.horaFimAvaliacao || "23:59"}` : "");

    const agora = new Date();

    if (inicioStr) {
      const inicio = new Date(inicioStr);
      if (!isNaN(inicio.getTime()) && agora < inicio) {
        return {
          aberto: false,
          motivo: "futuro",
          mensagem: `O período oficial de avaliação deste evento iniciará em ${inicio.toLocaleDateString("pt-BR")} às ${inicio.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}.`,
        };
      }
    }

    if (fimStr) {
      const fim = new Date(fimStr);
      if (!isNaN(fim.getTime()) && agora > fim) {
        return {
          aberto: false,
          motivo: "encerrado",
          mensagem: `O prazo oficial para envio de avaliações encerrou em ${fim.toLocaleDateString("pt-BR")} às ${fim.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}.`,
        };
      }
    }

    return { aberto: true, mensagem: null, motivo: null };
  }, [evento]);

  const handleSubmitAvaliacao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trabalho) return;

    if (!statusPrazoAvaliacao.aberto) {
      alert(`Prazo de avaliação: ${statusPrazoAvaliacao.mensagem}`);
      return;
    }

    const emailAvaliadorFinal = (emailAvaliadorInput || user?.email || "").trim().toLowerCase();
    const nomeAvaliadorFinal = (
      nomeAvaliadorInput ||
      userData?.nome ||
      user?.displayName ||
      emailAvaliadorFinal.split("@")[0] ||
      "Avaliador Científico"
    ).trim();

    if (!emailAvaliadorFinal || !emailAvaliadorFinal.includes("@")) {
      alert("Por favor, informe seu e-mail de avaliador para assinar o parecer.");
      return;
    }

    // Bloqueio de Conflito de Interesses no momento do submit
    const avaliadorInfoFinal = {
      email: emailAvaliadorFinal,
      nome: nomeAvaliadorFinal,
      cpf: userData?.cpf || "",
      userId: user?.uid || "",
    };

    if (isAvaliadorConflitoComTrabalho(avaliadorInfoFinal, trabalho)) {
      alert(
        "Conflito de Interesses Detectado: Você consta como autor principal, coautor ou orientador deste trabalho científico e não pode avaliá-lo."
      );
      return;
    }

    if (decisao === "Aceito com ressalvas" && !parecer.trim()) {
      alert(
        "Atenção: Ao optar por 'Aceito com ressalvas', é obrigatório descrever no parecer quais correções o autor deve realizar no resumo."
      );
      return;
    }

    try {
      setSalvando(true);

      const novaAvaliacaoPre: AvaliacaoPreCongresso = {
        id: `${Date.now()}`,
        avaliadorId: user?.uid || "",
        avaliadorNome: nomeAvaliadorFinal,
        avaliadorEmail: emailAvaliadorFinal,
        decisao,
        nota: decisao === "Aceito" ? notaTotal : null,
        parecer:
          parecer.trim() ||
          (decisao === "Aceito"
            ? "Resumo aprovado pela banca examinadora conforme os critérios de avaliação."
            : decisao === "Recusado"
            ? "Resumo não aprovado pela banca examinadora."
            : "Solicitadas correções e ajustes no resumo."),
        data: new Date().toISOString(),
        rodada: Number(trabalho.rodadaCorrecao) || 1,
      };

      const listaAnterior: AvaliacaoPreCongresso[] = Array.isArray(trabalho.avaliacoesPreCongresso)
        ? trabalho.avaliacoesPreCongresso.filter(
            (a) => (a.avaliadorEmail || "").toLowerCase() !== emailAvaliadorFinal
          )
        : [];

      const novaLista = [...listaAnterior, novaAvaliacaoPre];

      const notasValidas = novaLista
        .map((a) => a.nota)
        .filter((n): n is number => n !== null && n !== undefined && !isNaN(Number(n)));

      const mediaPre =
        notasValidas.length > 0
          ? Number((notasValidas.reduce((acc, v) => acc + Number(v), 0) / notasValidas.length).toFixed(2))
          : null;

      const updatePayload: Record<string, any> = {
        status: decisao,
        parecer: novaAvaliacaoPre.parecer,
        avaliacoesPreCongresso: novaLista,
        notaPreCongresso: mediaPre,
        nota: mediaPre !== null ? String(mediaPre) : "-",
      };

      // Se for "Aceito com ressalvas", vincula o e-mail deste avaliador para reenvio automático
      if (decisao === "Aceito com ressalvas") {
        updatePayload.avaliadorRessalvaEmail = emailAvaliadorFinal;
        updatePayload.avaliadorRessalvaNome = nomeAvaliadorFinal;
      }

      const trabRef = doc(db, "trabalhos", trabalho.id);
      await updateDoc(trabRef, updatePayload);

      setSucesso(true);
    } catch (err: any) {
      console.error("Erro ao salvar avaliação:", err);
      alert("Erro ao registrar avaliação: " + (err?.message || "Tente novamente."));
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#071321] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">
          Carregando trabalho científico...
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Buscando ficha de critérios e texto do resumo no banco de dados.
        </p>
      </div>
    );
  }

  if (erro || !trabalho) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#071321] flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-[#0c1e33] border border-rose-200 dark:border-rose-900/40 rounded-3xl p-8 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Não foi possível abrir o trabalho</h2>
          <p className="text-xs text-slate-500">{erro || "Trabalho não encontrado."}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Voltar ao Início</span>
          </Link>
        </div>
      </div>
    );
  }

  if (temConflito) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#071321] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white dark:bg-[#0c1e33] border border-amber-300 dark:border-amber-900/50 rounded-3xl p-8 space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-600 dark:text-amber-400">
              Integridade Acadêmica • Conflito de Interesses
            </span>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">
              Avaliação Bloqueada
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
              Você consta como <strong>autor principal, coautor ou orientador</strong> do trabalho &ldquo;{trabalho.titulo}&rdquo;.
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Por normas éticas e regulamento oficial da Céos System, autores e coautores não podem avaliar suas próprias submissões científicas.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/usuario/painel/trabalhos"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
            >
              <span>Ver Meus Trabalhos no Painel</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (sucesso) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#071321] flex flex-col items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white dark:bg-[#0c1e33] border border-emerald-200 dark:border-emerald-800/40 rounded-3xl p-8 sm:p-10 text-center space-y-5 shadow-2xl animate-in fade-in">
          <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-600 dark:text-emerald-400">
              Parecer Registrado com Sucesso!
            </span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              Avaliação Concluída
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Sua avaliação para o trabalho <strong>&ldquo;{trabalho.titulo}&rdquo;</strong> foi salva com a decisão{" "}
              <strong className="text-emerald-600 dark:text-emerald-400">&ldquo;{decisao}&rdquo;</strong>
              {decisao === "Aceito" && (
                <> com nota final <strong>{notaTotal.toFixed(2)}</strong></>
              )}.
            </p>
          </div>

          {decisao === "Aceito com ressalvas" && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 text-left">
              💡 O resumo retornará para o autor realizar as correções que você solicitou. Assim que ele reenviar, você receberá a nova versão automaticamente para aprovação final.
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setSucesso(false)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-blue-900/40 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Revisar esta Avaliação
            </button>
            <Link
              href="/usuario/painel/trabalhos"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20"
            >
              Ir para Painel de Trabalhos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#071321] text-slate-900 dark:text-slate-100 py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Topo / Barra de Navegação */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-blue-900/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                Portal do Avaliador Científico • Céos System
              </span>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white leading-tight">
                {evento?.title || trabalho.eventoTitulo || "Avaliação de Resumo Científico"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{trabalho.tipoResumo === "expandido" ? "Resumo Expandido" : "Resumo Simples"}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Área: {trabalho.eixoTematico || trabalho.area || "Geral"}</span>
            </span>
          </div>
        </div>

        {/* Layout Dividido em Duas Colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* =========================================================
              COLUNA 1 (7 colunas): VISUALIZADOR DO TRABALHO CIENTÍFICO
          ========================================================== */}
          <div className="lg:col-span-7 space-y-5">
            <div className="bg-white dark:bg-[#0c1e33] border border-slate-200/90 dark:border-blue-900/40 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
              
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  Trabalho Submetido
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-snug">
                  {trabalho.titulo}
                </h2>
                <div className="pt-1 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                    <EyeOff className="w-3.5 h-3.5" />
                    Avaliação às Cegas (Blind Peer Review)
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    Autores e orientador ocultados para garantir a total imparcialidade
                  </span>
                </div>
              </div>

              {/* Botão de Anexo (se houver arquivo PDF/DOCX anexado pelo autor) */}
              {trabalho.arquivoUrl && (
                <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {trabalho.arquivoNome || "Arquivo complementar anexado"}
                      </p>
                      <p className="text-[11px] text-slate-500">Documento submetido pelo autor</p>
                    </div>
                  </div>
                  <a
                    href={trabalho.arquivoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shrink-0 cursor-pointer shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Abrir Anexo</span>
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </a>
                </div>
              )}

              {/* Corpo do Resumo */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-blue-900/30">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-blue-500" />
                    <span>Texto do Resumo</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    {trabalho.resumo?.length || 0} caracteres
                  </span>
                </div>

                <div className="p-5 sm:p-6 rounded-2xl bg-slate-50/80 dark:bg-[#071321] border border-slate-200/70 dark:border-blue-900/30 text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed font-sans max-h-[550px] overflow-y-auto shadow-inner">
                  {trabalho.resumo}
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================
              COLUNA 2 (5 colunas): FORMULÁRIO DE AVALIAÇÃO COM SLIDERS
          ========================================================== */}
          <div className="lg:col-span-5 space-y-5">
            <form onSubmit={handleSubmitAvaliacao} className="space-y-5">
              
              <div className="bg-white dark:bg-[#0c1e33] border border-slate-200/90 dark:border-blue-900/40 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
                
                {/* Cabeçalho da Ficha */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-blue-900/30">
                  <div className="flex items-center gap-2.5">
                    <Sliders className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                        Ficha de Avaliação por Critérios
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Arraste as barras conforme o peso de cada critério
                      </p>
                    </div>
                  </div>

                  {/* Card de Pontuação Total em Destaque */}
                  <div className="text-right bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/40 px-3.5 py-1.5 rounded-2xl">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                      Nota Total
                    </span>
                    <span className="text-lg font-black text-blue-700 dark:text-blue-300">
                      {notaTotal.toFixed(2)}
                      <span className="text-xs font-semibold text-slate-400"> / {pesoTotal.toFixed(1)}</span>
                    </span>
                  </div>
                </div>

                {/* Banner de Prazo de Avaliação */}
                {!statusPrazoAvaliacao.aberto && (
                  <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Aviso sobre o Prazo de Avaliação:</p>
                      <p className="text-[11px] mt-0.5">{statusPrazoAvaliacao.mensagem}</p>
                    </div>
                  </div>
                )}

                {/* Lista de Critérios com Sliders Interativos */}
                <div className="space-y-4">
                  {criterios.map((crit, index) => {
                    const valorAtual = Number(notasCriterios[String(crit.id)] ?? 0);
                    const pesoMax = Number(crit.peso) || 2.5;
                    const percentual = Math.min(100, Math.max(0, (valorAtual / pesoMax) * 100));

                    return (
                      <div
                        key={crit.id}
                        className="p-4 rounded-2xl bg-slate-50/70 dark:bg-[#071321] border border-slate-200/70 dark:border-blue-900/30 space-y-2.5 hover:border-blue-300 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <label className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">
                            {index + 1}. {crit.nome}
                          </label>
                          <div className="shrink-0 flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                              Peso: {pesoMax.toFixed(1)}
                            </span>
                            <span className="font-mono text-xs font-black text-slate-900 dark:text-white min-w-[36px] text-right">
                              {valorAtual.toFixed(1)}
                            </span>
                          </div>
                        </div>

                        {/* Barra de Arrastar (Range Slider) */}
                        <div className="space-y-1">
                          <input
                            type="range"
                            min="0"
                            max={pesoMax}
                            step="0.1"
                            value={valorAtual}
                            onChange={(e) => handleSliderChange(crit.id, parseFloat(e.target.value))}
                            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-blue-400"
                          />
                          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                            <span>0.0</span>
                            <span className="font-semibold text-blue-600 dark:text-blue-400">
                              {percentual.toFixed(0)}% do peso
                            </span>
                            <span>{pesoMax.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Decisão Final da Avaliação */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-blue-900/30">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Decisão da Avaliação:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["Aceito", "Aceito com ressalvas", "Recusado"] as const).map((opcao) => {
                      const ativo = decisao === opcao;
                      return (
                        <button
                          key={opcao}
                          type="button"
                          onClick={() => setDecisao(opcao)}
                          className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                            ativo
                              ? opcao === "Aceito"
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                                : opcao === "Aceito com ressalvas"
                                ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                                : "bg-rose-600 text-white border-rose-600 shadow-sm"
                              : "bg-slate-50 dark:bg-[#071321] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-blue-900/40 hover:bg-slate-100"
                          }`}
                        >
                          {opcao === "Aceito" && <Check className="w-3.5 h-3.5" />}
                          {opcao === "Aceito com ressalvas" && <RefreshCw className="w-3.5 h-3.5" />}
                          {opcao === "Recusado" && <AlertCircle className="w-3.5 h-3.5" />}
                          <span className="text-center text-[11px] leading-tight">{opcao}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Alerta de Ressalva */}
                {decisao === "Aceito com ressalvas" && (
                  <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                    <p className="font-bold">⚠️ Correção solicitada ao autor:</p>
                    <p className="text-[11px]">
                      Descreva detalhadamente no campo abaixo as correções necessárias. O autor corrigirá o texto e ele será devolvido automaticamente para o seu e-mail para nova conferência.
                    </p>
                  </div>
                )}

                {/* Parecer / Observações */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Parecer Técnico / Justificativa {decisao === "Aceito com ressalvas" && <span className="text-rose-500">*</span>}:
                  </label>
                  <textarea
                    rows={4}
                    value={parecer}
                    onChange={(e) => setParecer(e.target.value)}
                    placeholder={
                      decisao === "Aceito com ressalvas"
                        ? "Descreva claramente quais pontos, referências ou estruturas o autor precisa corrigir..."
                        : "Comentários sobre a metodologia, qualidade acadêmica e mérito do trabalho..."
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-blue-900/50 bg-slate-50 dark:bg-[#071321] text-xs text-slate-900 dark:text-white outline-none leading-relaxed focus:border-blue-500"
                  />
                </div>

                {/* Identificação do Avaliador */}
                <div className="pt-2 border-t border-slate-100 dark:border-blue-900/30 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                        Seu Nome (Avaliador):
                      </label>
                      <input
                        type="text"
                        value={nomeAvaliadorInput}
                        onChange={(e) => setNomeAvaliadorInput(e.target.value)}
                        placeholder="Nome completo"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-blue-900/50 bg-slate-50 dark:bg-[#071321] text-xs text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                        Seu E-mail:
                      </label>
                      <input
                        type="email"
                        value={emailAvaliadorInput}
                        onChange={(e) => setEmailAvaliadorInput(e.target.value)}
                        placeholder="seu.email@exemplo.com"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-blue-900/50 bg-slate-50 dark:bg-[#071321] text-xs text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Botão de Envio */}
                <button
                  type="submit"
                  disabled={salvando || !statusPrazoAvaliacao.aberto}
                  className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white font-extrabold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {salvando ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Registrando Avaliação...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Finalizar e Enviar Avaliação</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaginaAvaliacaoTrabalho() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-[#071321] flex flex-col items-center justify-center p-6 text-center">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Carregando formulário de avaliação...
          </h2>
        </div>
      }
    >
      <ConteudoAvaliacaoTrabalho />
    </Suspense>
  );
}

