"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Send,
  Download,
  Eye,
  BookOpen,
  Edit3,
  ClipboardCheck,
  Star,
  Calendar,
  MapPin,
  Mic,
  Presentation,
  Check,
  XCircle,
  RefreshCw,
  Tag,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { supabase } from "@/lib/supabase";
import {
  AvaliacaoDiaEvento,
  AvaliacaoPreCongresso,
  isTrabalhoAceito,
  isTrabalhoComRessalvas,
} from "@/lib/trabalhos";

interface TrabalhoItem {
  id: string;
  eventoId: string;
  titulo: string;
  eixoTematico: string;
  evento: string;
  autores: string;
  userEmail?: string;
  tipoResumo: "simples" | "expandido";
  status: string;
  dataSubmissao: string;
  nota?: string;
  notaPreCongresso?: number | null;
  notaApresentacaoMedia?: number | null;
  resumo?: string;
  parecer?: string;
  arquivoUrl?: string;
  arquivoNome?: string;
  arquivoTamanho?: string;
  avaliadoresDesignados?: Array<{ nome: string; email: string; area?: string }>;
  avaliadorRessalvaEmail?: string;
  avaliadorRessalvaNome?: string;
  avaliacoesPreCongresso?: AvaliacaoPreCongresso[];
  avaliacoesDiaEvento?: AvaliacaoDiaEvento[];
  rodadaCorrecao?: number;
  modalidadeApresentacao?: "oral" | "banner" | "";
  apresentacaoDiaLabel?: string;
  apresentacaoData?: string;
  apresentacaoHoraInicio?: string;
  apresentacaoHoraFim?: string;
  apresentacaoLocal?: string;
  conflitoMinicursoEvitado?: boolean;
  apresentadoNoEvento?: boolean;
}

export default function TrabalhosPage() {
  const { user, userData } = useAuth();
  const [abaAtiva, setAbaAtiva] = useState<"meus_trabalhos" | "banca_avaliadora">(
    "meus_trabalhos"
  );

  const [trabalhos, setTrabalhos] = useState<TrabalhoItem[]>([]);
  const [trabalhosParaAvaliar, setTrabalhosParaAvaliar] = useState<TrabalhoItem[]>([]);
  const [areasPorEvento, setAreasPorEvento] = useState<Record<string, { titulo: string; areas: string[] }>>({});
  const [minhasAreasInteresse, setMinhasAreasInteresse] = useState<string[]>([]);
  const [salvandoAreas, setSalvandoAreas] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal de Parecer (Autor)
  const [trabalhoParecer, setTrabalhoParecer] = useState<TrabalhoItem | null>(null);

  // Modal de Correção de Resumo (Autor -> quando "Aceito com ressalvas")
  const [trabalhoParaCorrigir, setTrabalhoParaCorrigir] = useState<TrabalhoItem | null>(null);
  const [textoCorrecao, setTextoCorrecao] = useState("");
  const [tituloCorrecao, setTituloCorrecao] = useState("");
  const [arquivoCorrecao, setArquivoCorrecao] = useState<File | null>(null);
  const [enviandoCorrecao, setEnviandoCorrecao] = useState(false);

  // Modal de Avaliação (Avaliador / Professor)
  const [trabalhoSendoAvaliado, setTrabalhoSendoAvaliado] = useState<TrabalhoItem | null>(null);
  const [etapaAvaliacaoModal, setEtapaAvaliacaoModal] = useState<"pre_congresso" | "dia_evento">(
    "pre_congresso"
  );
  const [decisaoAvaliador, setDecisaoAvaliador] = useState<
    "Aceito" | "Aceito com ressalvas" | "Recusado"
  >("Aceito");
  const [incluirNotaPre, setIncluirNotaPre] = useState(true);
  const [notaPreInput, setNotaPreInput] = useState("9.0");
  const [parecerInput, setParecerInput] = useState("");
  const [notaDiaInput, setNotaDiaInput] = useState("9.5");
  const [parecerDiaInput, setParecerDiaInput] = useState("");
  const [confirmarApresentado, setConfirmarApresentado] = useState(true);
  const [salvandoAvaliacao, setSalvandoAvaliacao] = useState(false);

  const mapDocToTrabalho = (d: any): TrabalhoItem => {
    const data = d.data();
    return {
      id: d.id,
      eventoId: data.eventoId || data.evento_id || data.eventId || "",
      titulo: data.titulo || data.title || "Sem título informado",
      eixoTematico: data.eixoTematico || data.area || "Geral",
      evento: data.eventoTitulo || data.evento || "Congresso Científico",
      autores: data.autores || data.resumoAutores || data.autorPrincipal || "Autor Principal",
      userEmail: data.userEmail || "",
      tipoResumo: data.tipoResumo === "expandido" ? "expandido" : "simples",
      status: data.status || "Em Avaliação",
      dataSubmissao: data.createdAt
        ? new Date(data.createdAt).toLocaleDateString("pt-BR")
        : "Data não informada",
      nota:
        data.notaApresentacaoMedia !== undefined && data.notaApresentacaoMedia !== null
          ? Number(data.notaApresentacaoMedia).toFixed(2)
          : data.notaPreCongresso !== undefined && data.notaPreCongresso !== null
            ? Number(data.notaPreCongresso).toFixed(2)
            : data.nota || "-",
      notaPreCongresso:
        data.notaPreCongresso !== undefined && data.notaPreCongresso !== null
          ? Number(data.notaPreCongresso)
          : null,
      notaApresentacaoMedia:
        data.notaApresentacaoMedia !== undefined && data.notaApresentacaoMedia !== null
          ? Number(data.notaApresentacaoMedia)
          : null,
      resumo: data.resumo || "",
      parecer:
        data.parecer ||
        "Resumo submetido com sucesso. Aguardando parecer da comissão científica examinadora.",
      arquivoUrl: data.arquivoUrl || data.pdfUrl || data.fileUrl || "",
      arquivoNome: data.arquivoNome || data.pdfNome || data.fileName || "",
      arquivoTamanho: data.arquivoTamanho || data.fileSize || "",
      avaliadoresDesignados: Array.isArray(data.avaliadoresDesignados)
        ? data.avaliadoresDesignados
        : [],
      avaliadorRessalvaEmail: data.avaliadorRessalvaEmail || "",
      avaliadorRessalvaNome: data.avaliadorRessalvaNome || "",
      avaliacoesPreCongresso: Array.isArray(data.avaliacoesPreCongresso)
        ? data.avaliacoesPreCongresso
        : [],
      avaliacoesDiaEvento: Array.isArray(data.avaliacoesDiaEvento)
        ? data.avaliacoesDiaEvento
        : [],
      rodadaCorrecao: Number(data.rodadaCorrecao) || 1,
      modalidadeApresentacao: data.modalidadeApresentacao || "",
      apresentacaoDiaLabel: data.apresentacaoDiaLabel || "",
      apresentacaoData: data.apresentacaoData || "",
      apresentacaoHoraInicio: data.apresentacaoHoraInicio || "",
      apresentacaoHoraFim: data.apresentacaoHoraFim || "",
      apresentacaoLocal: data.apresentacaoLocal || "",
      conflitoMinicursoEvitado: Boolean(data.conflitoMinicursoEvitado),
      apresentadoNoEvento: Boolean(data.apresentadoNoEvento),
    };
  };

  const carregarDados = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);

      // 1. Meus Trabalhos (Autor)
      const qByUid = query(collection(db, "trabalhos"), where("userId", "==", user.uid));
      const snapUid = await getDocs(qByUid);
      let meusDocs = snapUid.docs.map(mapDocToTrabalho);

      if (meusDocs.length === 0 && user.email) {
        const qByEmail = query(
          collection(db, "trabalhos"),
          where("userEmail", "==", user.email)
        );
        const snapEmail = await getDocs(qByEmail);
        meusDocs = snapEmail.docs.map(mapDocToTrabalho);
      }
      setTrabalhos(meusDocs);

      // 2. Carrega áreas de interesse salvas do usuário/avaliador e inscrições como avaliador
      const areasUserSet = new Set<string>(
        Array.isArray(userData?.areasInteresseAvaliador)
          ? userData.areasInteresseAvaliador
          : []
      );

      if (user.email) {
        try {
          const snapInsc = await getDocs(
            query(collection(db, "inscricoes"), where("email", "==", user.email))
          );
          snapInsc.docs.forEach((docSnap) => {
            const d = docSnap.data();
            if (Array.isArray(d.areasInteresseAvaliador)) {
              d.areasInteresseAvaliador.forEach((a: string) => areasUserSet.add(a));
            } else if (d.areaAtuacao && d.desejoAvaliador) {
              areasUserSet.add(d.areaAtuacao);
            }
          });
        } catch { }
      }
      const areasInteresseArr = Array.from(areasUserSet).filter(Boolean);
      setMinhasAreasInteresse(areasInteresseArr);

      // 3. Busca todos os trabalhos para filtrar os que pertencem à banca deste avaliador
      const snapTodosTrabalhos = await getDocs(collection(db, "trabalhos"));
      const todosTrabalhos = snapTodosTrabalhos.docs.map(mapDocToTrabalho);

      const emailLogado = (user.email || "").trim().toLowerCase();

      const paraAvaliar = todosTrabalhos.filter((t) => {
        // Nunca avalia o próprio trabalho
        if (t.userEmail && t.userEmail.trim().toLowerCase() === emailLogado) {
          return false;
        }
        // Foi designado diretamente para este avaliador (ou é o avaliador da ressalva para retorno automático)
        const designadoDireto =
          (t.avaliadoresDesignados || []).some(
            (av) => (av.email || "").trim().toLowerCase() === emailLogado
          ) ||
          (t.avaliadorRessalvaEmail &&
            t.avaliadorRessalvaEmail.trim().toLowerCase() === emailLogado);

        if (designadoDireto) return true;

        // Ou tem a mesma área de interesse marcada pelo avaliador/professor
        if (areasInteresseArr.length > 0) {
          const areaTrab = (t.eixoTematico || "").trim().toLowerCase();
          return areasInteresseArr.some(
            (a) => a.trim().toLowerCase() === areaTrab
          );
        }

        return false;
      });

      setTrabalhosParaAvaliar(paraAvaliar);

      // 4. Carrega as áreas cadastradas pelos administradores nos eventos ativos
      const snapEvents = await getDocs(collection(db, "events"));
      const mapaAreasEv: Record<string, { titulo: string; areas: string[] }> = {};
      snapEvents.docs.forEach((evDoc) => {
        const evData = evDoc.data();
        const sub = evData.submissaoTrabalhos;
        if (sub && !sub.naoSeAplica) {
          const listaAreas: string[] = Array.isArray(sub.areasAvaliacao)
            ? sub.areasAvaliacao
            : Array.isArray(sub.eixosTematicos)
              ? sub.eixosTematicos.map((e: any) => (typeof e === "string" ? e : e.nome))
              : [];
          if (listaAreas.length > 0) {
            mapaAreasEv[evDoc.id] = {
              titulo: evData.title || "Evento Científico",
              areas: listaAreas.filter(Boolean),
            };
          }
        }
      });
      setAreasPorEvento(mapaAreasEv);
    } catch (err: any) {
      console.error("Erro ao buscar trabalhos:", err);
      setError("Não foi possível carregar os trabalhos científicos do banco de dados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [user]);

  // Alternar área de interesse do avaliador/professor
  const toggleMinhaAreaInteresse = async (areaNome: string) => {
    if (!user) return;
    const novaLista = minhasAreasInteresse.includes(areaNome)
      ? minhasAreasInteresse.filter((a) => a !== areaNome)
      : [...minhasAreasInteresse, areaNome];

    setMinhasAreasInteresse(novaLista);
    setSalvandoAreas(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        areasInteresseAvaliador: novaLista,
      });
      await carregarDados();
    } catch (e) {
      console.warn("Aviso ao salvar áreas do avaliador no perfil:", e);
    } finally {
      setSalvandoAreas(false);
    }
  };

  // Autor: Abrir modal para corrigir resumo com ressalvas
  const handleAbrirModalCorrecao = (trab: TrabalhoItem) => {
    setTrabalhoParaCorrigir(trab);
    setTituloCorrecao(trab.titulo);
    setTextoCorrecao(trab.resumo || "");
    setArquivoCorrecao(null);
  };

  // Autor: Enviar resumo corrigido automaticamente de volta para o mesmo avaliador
  const handleEnviarResumoCorrigido = async () => {
    if (!trabalhoParaCorrigir) return;
    const limiteMax = trabalhoParaCorrigir.tipoResumo === "simples" ? 2500 : 10000;
    if (!textoCorrecao.trim()) {
      alert("Digite o texto corrigido do resumo.");
      return;
    }
    if (textoCorrecao.length > limiteMax) {
      alert(`O resumo excede o limite de ${limiteMax.toLocaleString("pt-BR")} caracteres.`);
      return;
    }

    setEnviandoCorrecao(true);
    try {
      let novoArquivoUrl = trabalhoParaCorrigir.arquivoUrl || "";
      let novoArquivoNome = trabalhoParaCorrigir.arquivoNome || "";

      if (arquivoCorrecao) {
        const safeName = arquivoCorrecao.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const filePath = `trabalhos/${Date.now()}-${safeName}`;
        const { error: upErr } = await supabase.storage
          .from("events")
          .upload(filePath, arquivoCorrecao, { upsert: true });
        if (!upErr) {
          const { data: pubData } = supabase.storage.from("events").getPublicUrl(filePath);
          novoArquivoUrl = pubData.publicUrl;
          novoArquivoNome = arquivoCorrecao.name;
        }
      }

      const novaRodada = (trabalhoParaCorrigir.rodadaCorrecao || 1) + 1;
      const avaliadorDestino =
        trabalhoParaCorrigir.avaliadorRessalvaNome ||
        trabalhoParaCorrigir.avaliadorRessalvaEmail ||
        (trabalhoParaCorrigir.avaliadoresDesignados?.[0]?.nome ?? "o mesmo avaliador");

      await updateDoc(doc(db, "trabalhos", trabalhoParaCorrigir.id), {
        titulo: tituloCorrecao.trim(),
        resumoTitulo: tituloCorrecao.trim(),
        resumo: textoCorrecao.trim(),
        arquivoUrl: novoArquivoUrl,
        arquivoNome: novoArquivoNome,
        status: "Corrigido - Reenviado ao Avaliador",
        rodadaCorrecao: novaRodada,
        dataUltimaCorrecao: new Date().toISOString(),
      });

      alert(
        `Resumo corrigido com sucesso! O trabalho foi reenviado automaticamente para ${avaliadorDestino}.`
      );
      setTrabalhoParaCorrigir(null);
      await carregarDados();
    } catch (e) {
      console.error(e);
      alert("Erro ao enviar correção do resumo.");
    } finally {
      setEnviandoCorrecao(false);
    }
  };

  // Avaliador: Abrir modal de avaliação
  const handleAbrirModalAvaliacao = (
    trab: TrabalhoItem,
    etapa: "pre_congresso" | "dia_evento"
  ) => {
    setTrabalhoSendoAvaliado(trab);
    setEtapaAvaliacaoModal(etapa);
    setDecisaoAvaliador("Aceito");
    setIncluirNotaPre(true);
    setNotaPreInput(
      trab.notaPreCongresso !== null && trab.notaPreCongresso !== undefined
        ? String(trab.notaPreCongresso)
        : "9.0"
    );
    setParecerInput(trab.parecer && !trab.parecer.includes("Aguardando parecer") ? trab.parecer : "");
    setNotaDiaInput("9.5");
    setParecerDiaInput("");
    setConfirmarApresentado(trab.apresentadoNoEvento ?? true);
  };

  // Avaliador: Salvar avaliação pré-congresso ou avaliação do dia
  const handleSalvarAvaliacaoBanca = async () => {
    if (!trabalhoSendoAvaliado || !user) return;

    const avaliadorNome =
      userData?.nome || user.displayName || user.email?.split("@")[0] || "Avaliador";
    const avaliadorEmail = user.email || "";

    setSalvandoAvaliacao(true);
    try {
      const trabRef = doc(db, "trabalhos", trabalhoSendoAvaliado.id);
      const snapAtual = await getDoc(trabRef);
      const dadosAtuais = snapAtual.exists() ? snapAtual.data() : {};

      if (etapaAvaliacaoModal === "pre_congresso") {
        if (decisaoAvaliador === "Aceito com ressalvas" && !parecerInput.trim()) {
          alert(
            "Para 'Aceito com ressalvas', descreva no parecer quais correções o autor precisa realizar."
          );
          setSalvandoAvaliacao(false);
          return;
        }

        const notaNum =
          decisaoAvaliador === "Aceito" && incluirNotaPre
            ? parseFloat(String(notaPreInput).replace(",", "."))
            : null;

        const novaAvaliacaoPre: AvaliacaoPreCongresso = {
          id: `${Date.now()}`,
          avaliadorId: user.uid,
          avaliadorNome,
          avaliadorEmail,
          decisao: decisaoAvaliador,
          nota: notaNum !== null && !isNaN(notaNum) ? notaNum : null,
          parecer:
            parecerInput.trim() ||
            (decisaoAvaliador === "Aceito"
              ? "Resumo aprovado pela comissão científica."
              : decisaoAvaliador === "Recusado"
                ? "Resumo não aprovado."
                : "Solicitadas correções no resumo."),
          data: new Date().toISOString(),
          rodada: Number(dadosAtuais.rodadaCorrecao) || 1,
        };

        const listaPreAnterior: AvaliacaoPreCongresso[] = Array.isArray(
          dadosAtuais.avaliacoesPreCongresso
        )
          ? dadosAtuais.avaliacoesPreCongresso.filter(
            (a: AvaliacaoPreCongresso) =>
              (a.avaliadorEmail || "").toLowerCase() !== avaliadorEmail.toLowerCase()
          )
          : [];

        const novaListaPre = [...listaPreAnterior, novaAvaliacaoPre];
        const notasValidas = novaListaPre
          .map((a) => a.nota)
          .filter((n): n is number => n !== null && n !== undefined && !isNaN(Number(n)));
        const mediaPre =
          notasValidas.length > 0
            ? Number(
              (notasValidas.reduce((acc, v) => acc + Number(v), 0) / notasValidas.length).toFixed(
                2
              )
            )
            : null;

        const updatePayload: Record<string, any> = {
          status: decisaoAvaliador,
          parecer: novaAvaliacaoPre.parecer,
          avaliacoesPreCongresso: novaListaPre,
          notaPreCongresso: mediaPre,
          nota: mediaPre !== null ? String(mediaPre) : "-",
        };

        // Se for "Aceito com ressalvas", vincula este avaliador para que o retorno da correção volte automaticamente para ele
        if (decisaoAvaliador === "Aceito com ressalvas") {
          updatePayload.avaliadorRessalvaEmail = avaliadorEmail;
          updatePayload.avaliadorRessalvaNome = avaliadorNome;
        }

        await updateDoc(trabRef, updatePayload);
        alert(
          decisaoAvaliador === "Aceito com ressalvas"
            ? "Avaliação 'Aceito com ressalvas' enviada! O resumo voltou para o autor corrigir e retornará automaticamente para você assim que ele reenviar."
            : `Avaliação pré-congresso registrada como "${decisaoAvaliador}"!`
        );
      } else {
        // Etapa: Avaliação da Apresentação no Dia do Evento (suporta múltiplos avaliadores)
        const notaDiaNum = parseFloat(String(notaDiaInput).replace(",", "."));
        if (isNaN(notaDiaNum) || notaDiaNum < 0) {
          alert("Informe uma nota válida para a apresentação.");
          setSalvandoAvaliacao(false);
          return;
        }

        const novaAvDia: AvaliacaoDiaEvento = {
          id: `${Date.now()}`,
          avaliadorId: user.uid,
          avaliadorNome,
          avaliadorEmail,
          nota: notaDiaNum,
          parecer: parecerDiaInput.trim(),
          data: new Date().toISOString(),
        };

        const listaDiaAnterior: AvaliacaoDiaEvento[] = Array.isArray(
          dadosAtuais.avaliacoesDiaEvento
        )
          ? dadosAtuais.avaliacoesDiaEvento.filter(
            (a: AvaliacaoDiaEvento) =>
              (a.avaliadorEmail || "").toLowerCase() !== avaliadorEmail.toLowerCase()
          )
          : [];

        const novaListaDia = [...listaDiaAnterior, novaAvDia];
        const mediaDia = Number(
          (
            novaListaDia.reduce((acc, a) => acc + Number(a.nota || 0), 0) /
            novaListaDia.length
          ).toFixed(2)
        );

        await updateDoc(trabRef, {
          avaliacoesDiaEvento: novaListaDia,
          notaApresentacaoMedia: mediaDia,
          apresentadoNoEvento: confirmarApresentado,
        });

        alert(
          `Nota da apresentação (${notaDiaNum.toFixed(
            2
          )}) registrada! Média atual do trabalho no dia (${novaListaDia.length} avaliador(es)): ${mediaDia.toFixed(
            2
          )}.`
        );
      }

      setTrabalhoSendoAvaliado(null);
      await carregarDados();
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar avaliação.");
    } finally {
      setSalvandoAvaliacao(false);
    }
  };

  // Todas as áreas únicas cadastradas pelos administradores nos eventos
  const todasAreasDisponiveis = Array.from(
    new Set(Object.values(areasPorEvento).flatMap((ev) => ev.areas))
  );

  return (
    <div className="space-y-6">
      {/* Cabeçalho e Seletor de Modo (Autor vs Avaliador/Professor) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-montserrat text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Trabalhos & Avaliações Científicas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Acompanhe seus resumos submetidos, realize correções de ressalvas ou avalie trabalhos da sua área de interesse.
          </p>
        </div>

        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-[#071321] border border-slate-200 dark:border-blue-900/40 self-start">
          <button
            type="button"
            onClick={() => setAbaAtiva("meus_trabalhos")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${abaAtiva === "meus_trabalhos"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Meus Resumos ({trabalhos.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva("banca_avaliadora")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${abaAtiva === "banca_avaliadora"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>Área do Avaliador / Professor ({trabalhosParaAvaliar.length})</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-xs sm:text-sm text-slate-500">
            Buscando trabalhos no banco de dados...
          </p>
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-white dark:bg-[#0c1e33] rounded-3xl border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p className="text-xs sm:text-sm font-semibold">{error}</p>
        </div>
      ) : abaAtiva === "meus_trabalhos" ? (
        /* =========================================================
           ABA 1: MEUS TRABALHOS SUBMETIDOS (VISÃO DO AUTOR)
        ========================================================== */
        trabalhos.length > 0 ? (
          <div className="space-y-4">
            {trabalhos.map((trabalho) => {
              const aceito = isTrabalhoAceito(trabalho.status);
              const comRessalvas = isTrabalhoComRessalvas(trabalho.status);
              const recusado = trabalho.status.toLowerCase().includes("recusado");

              return (
                <div
                  key={trabalho.id}
                  className="p-6 rounded-3xl bg-white dark:bg-[#0c1e33] border border-slate-200/90 dark:border-blue-900/40 shadow-xs hover:shadow-md transition-all space-y-4"
                >
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                    <div className="space-y-3 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${aceito
                              ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40"
                              : comRessalvas
                                ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40"
                                : recusado
                                  ? "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/40"
                                  : "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40"
                            }`}
                        >
                          {aceito ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : comRessalvas ? (
                            <AlertCircle className="w-3 h-3" />
                          ) : recusado ? (
                            <XCircle className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          <span>{trabalho.status}</span>
                        </span>

                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                          {trabalho.tipoResumo === "expandido"
                            ? "Resumo Expandido"
                            : "Resumo Simples"}
                        </span>

                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                          Área: {trabalho.eixoTematico}
                        </span>

                        {trabalho.modalidadeApresentacao && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                            {trabalho.modalidadeApresentacao === "oral" ? (
                              <>
                                <Mic className="w-3 h-3" /> Apresentação Oral
                              </>
                            ) : (
                              <>
                                <Presentation className="w-3 h-3" /> Apresentação Banner
                              </>
                            )}
                          </span>
                        )}
                      </div>

                      <h3 className="font-montserrat font-bold text-base sm:text-lg text-slate-900 dark:text-white leading-snug">
                        {trabalho.titulo}
                      </h3>

                      <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                        <p>
                          <strong className="text-slate-700 dark:text-slate-300">Evento: </strong>
                          {trabalho.evento}
                        </p>
                        <p>
                          <strong className="text-slate-700 dark:text-slate-300">Autores: </strong>
                          {trabalho.autores}
                        </p>
                        <p>
                          Submetido em {trabalho.dataSubmissao}
                          {trabalho.notaPreCongresso !== null &&
                            trabalho.notaPreCongresso !== undefined &&
                            ` • Nota Pré-Congresso: ${trabalho.notaPreCongresso.toFixed(2)}`}
                          {trabalho.notaApresentacaoMedia !== null &&
                            trabalho.notaApresentacaoMedia !== undefined &&
                            ` • Nota Apresentação: ${trabalho.notaApresentacaoMedia.toFixed(2)}`}
                        </p>
                      </div>

                      {/* Escala de Apresentação (quando já distribuído pelo administrador) */}
                      {trabalho.apresentacaoDiaLabel && trabalho.apresentacaoHoraInicio && (
                        <div className="p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-800/40 text-xs flex flex-wrap items-center gap-3 text-slate-700 dark:text-slate-200">
                          <span className="font-bold flex items-center gap-1.5 text-blue-700 dark:text-blue-300">
                            <Calendar className="w-3.5 h-3.5" />
                            {trabalho.apresentacaoDiaLabel}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                            {trabalho.apresentacaoHoraInicio} às {trabalho.apresentacaoHoraFim}
                          </span>
                          {trabalho.apresentacaoLocal && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-blue-600" />
                              {trabalho.apresentacaoLocal}
                            </span>
                          )}
                          {trabalho.conflitoMinicursoEvitado && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                              ✓ Sem choque com seus minicursos
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0 w-full lg:w-auto pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-blue-900/30">
                      {comRessalvas && (
                        <button
                          type="button"
                          onClick={() => handleAbrirModalCorrecao(trabalho)}
                          className="flex-1 lg:flex-initial py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Edit3 className="w-4 h-4" />
                          <span>Corrigir e Reenviar Resumo</span>
                        </button>
                      )}

                      {trabalho.arquivoUrl && (
                        <a
                          href={trabalho.arquivoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 lg:flex-initial py-2.5 px-4 rounded-xl border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Ver PDF</span>
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => setTrabalhoParecer(trabalho)}
                        className="flex-1 lg:flex-initial py-2.5 px-4 rounded-xl border border-slate-200 dark:border-blue-900/50 hover:bg-slate-50 dark:hover:bg-blue-950/60 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer text-center"
                      >
                        Ver Parecer & Resumo
                      </button>
                    </div>
                  </div>

                  {/* Alerta em destaque quando o resumo está "Aceito com ressalvas" */}
                  {comRessalvas && (
                    <div className="p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
                      <div className="space-y-1">
                        <p className="font-bold flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>
                            Seu resumo foi avaliado como &ldquo;Aceito com ressalvas&rdquo;.
                          </span>
                        </p>
                        <p className="text-amber-800 dark:text-amber-300">
                          <strong>Parecer do avaliador:</strong> {trabalho.parecer}
                        </p>
                        <p className="text-[11px] opacity-85">
                          Ao corrigir e salvar, o seu resumo será reenviado automaticamente para o mesmo avaliador concluir a aprovação.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAbrirModalCorrecao(trabalho)}
                        className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shrink-0 cursor-pointer"
                      >
                        Realizar Correção Agora
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center bg-white dark:bg-[#0c1e33] rounded-3xl border border-dashed border-slate-200 dark:border-blue-900/40 space-y-4 max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-3xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-xs">
              <FileText className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-montserrat font-bold text-slate-900 dark:text-white text-base">
                Nenhum resumo científico submetido
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Acesse a página do evento em que você está inscrito e clique em &ldquo;Submissão de Trabalhos&rdquo; para enviar um Resumo Simples ou Resumo Expandido.
              </p>
            </div>
          </div>
        )
      ) : (
        /* =========================================================
           ABA 2: BANCA AVALIADORA (VISÃO DO AVALIADOR / PROFESSOR)
        ========================================================== */
        <div className="space-y-6">
          {/* Seleção de Áreas de Interesse do Avaliador/Professor (mesmas áreas elencadas pelo administrador) */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#0c1e33] border border-slate-200 dark:border-blue-900/40 space-y-3 shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <Tag className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  Minhas Áreas de Interesse para Avaliação (Professor / Avaliador)
                </h3>
              </div>
              {salvandoAreas && (
                <span className="text-xs text-blue-600 flex items-center gap-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Atualizando...
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Marque abaixo as áreas temáticas (elencadas pelos administradores dos eventos) nas quais você atua como avaliador/professor para receber os resumos compatíveis:
            </p>

            {todasAreasDisponiveis.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                Nenhuma área temática cadastrada nos eventos até o momento.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 pt-1">
                {todasAreasDisponiveis.map((areaNome) => {
                  const selecionada = minhasAreasInteresse.includes(areaNome);
                  return (
                    <button
                      key={areaNome}
                      type="button"
                      onClick={() => toggleMinhaAreaInteresse(areaNome)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${selecionada
                          ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                          : "bg-slate-50 dark:bg-[#071321] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-blue-900/40 hover:border-blue-400"
                        }`}
                    >
                      {selecionada && <Check className="w-3.5 h-3.5" />}
                      <span>{areaNome}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Lista de Trabalhos Designados / Compatíveis com a Área do Avaliador */}
          {trabalhosParaAvaliar.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-[#0c1e33] rounded-3xl border border-dashed border-slate-200 dark:border-blue-900/40 space-y-3 max-w-lg mx-auto">
              <ClipboardCheck className="w-10 h-10 text-blue-600 mx-auto" />
              <h3 className="font-montserrat font-bold text-slate-900 dark:text-white text-base">
                Nenhum resumo pendente na sua fila de avaliação
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Selecione suas áreas de interesse acima. Assim que autores submeterem resumos nessas áreas (ou o administrador distribuir os trabalhos), eles aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {trabalhosParaAvaliar.map((trab) => {
                const reenviadoAposRessalva =
                  trab.status.toLowerCase().includes("corrigido") ||
                  (trab.rodadaCorrecao && trab.rodadaCorrecao > 1);

                return (
                  <div
                    key={trab.id}
                    className="p-6 rounded-3xl bg-white dark:bg-[#0c1e33] border border-slate-200 dark:border-blue-900/40 shadow-xs space-y-4"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                            {trab.status}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                            {trab.tipoResumo === "expandido"
                              ? "Resumo Expandido"
                              : "Resumo Simples"}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-[#071321] text-slate-700 dark:text-slate-300">
                            Área: {trab.eixoTematico}
                          </span>
                          {reenviadoAposRessalva && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                              <RefreshCw className="w-3 h-3" />
                              Resumo Corrigido pelo Autor ({trab.rodadaCorrecao}ª rodada)
                            </span>
                          )}
                        </div>

                        <h4 className="font-montserrat font-bold text-base text-slate-900 dark:text-white">
                          {trab.titulo}
                        </h4>

                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          <strong>Evento:</strong> {trab.evento} • <strong>Autores:</strong>{" "}
                          {trab.autores}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleAbrirModalAvaliacao(trab, "pre_congresso")}
                          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 shadow-sm"
                        >
                          <ClipboardCheck className="w-4 h-4" />
                          <span>Avaliar Resumo (Pré-Congresso)</span>
                        </button>

                        {isTrabalhoAceito(trab.status) && (
                          <button
                            type="button"
                            onClick={() => handleAbrirModalAvaliacao(trab, "dia_evento")}
                            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 shadow-sm"
                          >
                            <Star className="w-4 h-4" />
                            <span>Avaliar Apresentação do Dia</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Preview do Texto do Resumo */}
                    {trab.resumo && (
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#071321] border border-slate-200/80 dark:border-blue-900/40 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line max-h-40 overflow-y-auto">
                        {trab.resumo}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================
          MODAL 1: VER PARECER E RESUMO (AUTOR)
      ========================================================== */}
      {trabalhoParecer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white dark:bg-[#0c1e33] border border-slate-200 dark:border-blue-900/40 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl animate-in fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-montserrat font-bold text-base text-slate-900 dark:text-white">
                    Parecer da Banca & Detalhes do Resumo
                  </h3>
                  <p className="text-xs text-slate-500">
                    {trabalhoParecer.tipoResumo === "expandido"
                      ? "Resumo Expandido"
                      : "Resumo Simples"}{" "}
                    • Área: {trabalhoParecer.eixoTematico}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTrabalhoParecer(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-semibold">
                  Título do Trabalho
                </span>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                  {trabalhoParecer.titulo}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-[#071321] border border-slate-200/80 dark:border-blue-900/40">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">
                    Status
                  </span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {trabalhoParecer.status}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">
                    Nota Pré-Congresso
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {trabalhoParecer.notaPreCongresso !== null &&
                      trabalhoParecer.notaPreCongresso !== undefined
                      ? trabalhoParecer.notaPreCongresso.toFixed(2)
                      : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">
                    Nota Apresentação (Dia)
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {trabalhoParecer.notaApresentacaoMedia !== null &&
                      trabalhoParecer.notaApresentacaoMedia !== undefined
                      ? trabalhoParecer.notaApresentacaoMedia.toFixed(2)
                      : "—"}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-semibold">
                  Parecer da Comissão Avaliadora
                </span>
                <p className="mt-1 p-3.5 rounded-2xl bg-slate-50 dark:bg-[#071321] border border-slate-200/80 dark:border-blue-900/40 text-slate-700 dark:text-slate-300 leading-relaxed text-xs">
                  {trabalhoParecer.parecer}
                </p>
              </div>

              {trabalhoParecer.resumo && (
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-semibold">
                    Texto do Resumo Submetido ({trabalhoParecer.resumo.length} caracteres)
                  </span>
                  <div className="mt-1 p-3.5 rounded-2xl bg-slate-50 dark:bg-[#071321] border border-slate-200/80 dark:border-blue-900/40 text-slate-700 dark:text-slate-300 leading-relaxed text-xs whitespace-pre-line max-h-52 overflow-y-auto">
                    {trabalhoParecer.resumo}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end gap-2">
              {isTrabalhoComRessalvas(trabalhoParecer.status) && (
                <button
                  type="button"
                  onClick={() => {
                    const t = trabalhoParecer;
                    setTrabalhoParecer(null);
                    handleAbrirModalCorrecao(t);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold cursor-pointer"
                >
                  Corrigir e Reenviar Resumo
                </button>
              )}
              <button
                type="button"
                onClick={() => setTrabalhoParecer(null)}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 2: CORRIGIR RESUMO COM RESSALVAS (RETORNO AUTOMÁTICO AO MESMO AVALIADOR)
      ========================================================== */}
      {trabalhoParaCorrigir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white dark:bg-[#0c1e33] border border-slate-200 dark:border-blue-900/40 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl animate-in fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-blue-900/30 pb-3">
              <div>
                <h3 className="font-montserrat font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                  Corrigir Resumo (Aceito com Ressalvas)
                </h3>
                <p className="text-xs text-slate-500">
                  Ao salvar, o resumo corrigido será enviado automaticamente para o mesmo avaliador.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTrabalhoParaCorrigir(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-900 dark:text-amber-200 space-y-1">
              <span className="font-bold block">Ressalvas solicitadas pelo avaliador:</span>
              <p>{trabalhoParaCorrigir.parecer}</p>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Título do Resumo
                </label>
                <input
                  type="text"
                  value={tituloCorrecao}
                  onChange={(e) => setTituloCorrecao(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-blue-900/50 bg-slate-50 dark:bg-[#071321] text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Texto Corrigido (
                    {trabalhoParaCorrigir.tipoResumo === "simples"
                      ? "Resumo Simples — máx. 2.500 letras"
                      : "Resumo Expandido — máx. 10.000 letras"}
                    )
                  </label>
                  <span className="text-xs font-bold text-blue-600">
                    {textoCorrecao.length} /{" "}
                    {trabalhoParaCorrigir.tipoResumo === "simples" ? 2500 : 10000}
                  </span>
                </div>
                <textarea
                  rows={trabalhoParaCorrigir.tipoResumo === "simples" ? 5 : 12}
                  maxLength={trabalhoParaCorrigir.tipoResumo === "simples" ? 2500 : 10000}
                  value={textoCorrecao}
                  onChange={(e) =>
                    setTextoCorrecao(
                      e.target.value.slice(
                        0,
                        trabalhoParaCorrigir.tipoResumo === "simples" ? 2500 : 10000
                      )
                    )
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-blue-900/50 bg-slate-50 dark:bg-[#071321] text-slate-900 dark:text-white outline-none leading-relaxed"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Substituir PDF Anexado (Opcional)
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setArquivoCorrecao(e.target.files[0]);
                  }}
                  className="text-xs text-slate-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTrabalhoParaCorrigir(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={enviandoCorrecao}
                onClick={handleEnviarResumoCorrigido}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-md"
              >
                {enviandoCorrecao ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>Enviar Correção para o Mesmo Avaliador</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 3: AVALIAR TRABALHO (PRÉ-CONGRESSO OU DIA DO EVENTO)
      ========================================================== */}
      {trabalhoSendoAvaliado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white dark:bg-[#0c1e33] border border-slate-200 dark:border-blue-900/40 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl animate-in fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-blue-900/30 pb-3">
              <div>
                <h3 className="font-montserrat font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                  {etapaAvaliacaoModal === "pre_congresso"
                    ? "Avaliação Pré-Congresso do Resumo"
                    : "Avaliação da Apresentação no Dia do Evento"}
                </h3>
                <p className="text-xs text-slate-500">
                  {trabalhoSendoAvaliado.titulo} ({trabalhoSendoAvaliado.eixoTematico})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTrabalhoSendoAvaliado(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {trabalhoSendoAvaliado.resumo && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#071321] border border-slate-200 dark:border-blue-900/40 text-xs text-slate-700 dark:text-slate-300 space-y-1 max-h-48 overflow-y-auto whitespace-pre-line">
                <span className="font-bold text-blue-600 block">
                  Texto do{" "}
                  {trabalhoSendoAvaliado.tipoResumo === "expandido"
                    ? "Resumo Expandido"
                    : "Resumo Simples"}
                  :
                </span>
                {trabalhoSendoAvaliado.resumo}
              </div>
            )}

            {etapaAvaliacaoModal === "pre_congresso" ? (
              <div className="space-y-4 text-xs sm:text-sm">
                <div>
                  <label className="font-bold text-slate-800 dark:text-slate-200 block mb-2">
                    Decisão da Avaliação do Resumo (3 Opções):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {(["Aceito", "Aceito com ressalvas", "Recusado"] as const).map((op) => (
                      <button
                        key={op}
                        type="button"
                        onClick={() => setDecisaoAvaliador(op)}
                        className={`py-3 px-3 rounded-xl font-bold text-xs border transition-all cursor-pointer ${decisaoAvaliador === op
                            ? op === "Aceito"
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                              : op === "Aceito com ressalvas"
                                ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                                : "bg-rose-600 text-white border-rose-600 shadow-sm"
                            : "bg-slate-50 dark:bg-[#071321] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-blue-900/40"
                          }`}
                      >
                        {op}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quando "Aceito", opção de atribuir nota na avaliação pré-congresso */}
                {decisaoAvaliador === "Aceito" && (
                  <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 space-y-3">
                    <label className="flex items-center gap-2 text-xs font-bold text-emerald-900 dark:text-emerald-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={incluirNotaPre}
                        onChange={(e) => setIncluirNotaPre(e.target.checked)}
                        className="rounded text-emerald-600"
                      />
                      <span>Atribuir Nota de Avaliação Pré-Congresso a este Resumo</span>
                    </label>

                    {incluirNotaPre && (
                      <div className="flex items-center gap-3">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Nota (0 a 10):
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="10"
                          value={notaPreInput}
                          onChange={(e) => setNotaPreInput(e.target.value)}
                          className="w-28 px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-[#071321] text-sm font-bold text-slate-900 dark:text-white outline-none"
                        />
                      </div>
                    )}
                  </div>
                )}

                {decisaoAvaliador === "Aceito com ressalvas" && (
                  <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-800 dark:text-amber-300">
                    Ao salvar como <strong>Aceito com ressalvas</strong>, o resumo voltará para o autor realizar as correções abaixo e será reenviado automaticamente para você.
                  </div>
                )}

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Parecer / Observações para o Autor:
                  </label>
                  <textarea
                    rows={4}
                    placeholder={
                      decisaoAvaliador === "Aceito com ressalvas"
                        ? "Descreva detalhadamente o que o autor precisa corrigir no resumo..."
                        : "Insira o parecer técnico da avaliação..."
                    }
                    value={parecerInput}
                    onChange={(e) => setParecerInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-blue-900/50 bg-slate-50 dark:bg-[#071321] text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>
            ) : (
              /* Avaliação do Dia do Evento */
              <div className="space-y-4 text-xs sm:text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Nota da Apresentação no Dia (0 a 10):
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      value={notaDiaInput}
                      onChange={(e) => setNotaDiaInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-blue-900/50 bg-slate-50 dark:bg-[#071321] font-bold text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={confirmarApresentado}
                        onChange={(e) => setConfirmarApresentado(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600"
                      />
                      <span>Confirmar que o trabalho foi efetivamente apresentado</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Comentários da Apresentação (Opcional):
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Observações sobre a apresentação oral ou banner..."
                    value={parecerDiaInput}
                    onChange={(e) => setParecerDiaInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-blue-900/50 bg-slate-50 dark:bg-[#071321] text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTrabalhoSendoAvaliado(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={salvandoAvaliacao}
                onClick={handleSalvarAvaliacaoBanca}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-md"
              >
                {salvandoAvaliacao ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>Salvar Avaliação</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
