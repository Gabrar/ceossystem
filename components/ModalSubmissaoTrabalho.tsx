"use client";

import { useState, useRef, useEffect } from "react";
import {
  Upload,
  X,
  CheckCircle2,
  Trash2,
  Send,
  Loader2,
  Plus,
  FileText,
  Download,
  AlertTriangle,
  ChevronDown,
  AlignLeft,
  BookOpen,
} from "lucide-react";
import { addDoc, collection, getDocs, query, serverTimestamp, where } from "firebase/firestore";
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { db } from "@/lib/firebase";
import { supabase } from "@/lib/supabase";
import { AvaliadorEvento, selecionarAvaliadoresPorArea } from "@/lib/trabalhos";

interface CoAutor {
  nome: string;
  cpf: string;
  instituicao: string;
  curso: string;
}

interface ModalSubmissaoTrabalhoProps {
  isOpen: boolean;
  onClose: () => void;
  eventoId: string;
  eventoTitulo: string;
  user: any;
  userData: any;
  submissaoConfig?: {
    naoSeAplica?: boolean;
    dataInicio?: string;
    horaInicio?: string;
    dataFim?: string;
    horaFim?: string;
    dataInicioDateTime?: string;
    dataFimDateTime?: string;
    dataResultado?: string;
    areasAvaliacao?: string[];
    eixosTematicos?: Array<{ nome: string; descricao?: string } | string>;
    modalidades?: string[];
    limiteAutores?: number;
    limiteTrabalhos?: number;
    limitesPorTrabalho?: {
      coautores?: number;
      orientadores?: number;
    };
    limiteCaracteresSimples?: number;
    limiteCaracteresExpandido?: number;
    qtdAvaliadoresPorResumo?: number;
    avaliadoresComissao?: AvaliadorEvento[];
    exigirInscricaoPaga?: boolean;
    tipoAvaliacao?: string;
    normas?: string;
    instrucoes?: string;
    regulamento?: {
      tipo?: string;
      url?: string;
      nome?: string;
    };
    editalUrl?: string;
    editalNome?: string;
  } | null;
}

export default function ModalSubmissaoTrabalho({
  isOpen,
  onClose,
  eventoId,
  eventoTitulo,
  user,
  userData,
  submissaoConfig,
}: ModalSubmissaoTrabalhoProps) {
  const [submitting, setSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Campos do Formulário
  const [titulo, setTitulo] = useState("");
  const [area, setArea] = useState("");
  const [tipoResumo, setTipoResumo] = useState<"simples" | "expandido">("simples");
  const [senha, setSenha] = useState("");
  const [orientador, setOrientador] = useState("");
  const [coAutores, setCoAutores] = useState<CoAutor[]>([]);
  const [mostrarNormas, setMostrarNormas] = useState(false);

  const [resumoTitulo, setResumoTitulo] = useState("");
  const [resumoAutores, setResumoAutores] = useState("");
  const [resumoTexto, setResumoTexto] = useState("");

  const [arquivo, setArquivo] = useState<File | null>(null);

  // Áreas elencadas pelo administrador do evento
  const areasDisponiveis: string[] = (
    submissaoConfig?.areasAvaliacao && submissaoConfig.areasAvaliacao.length > 0
      ? submissaoConfig.areasAvaliacao
      : submissaoConfig?.eixosTematicos && submissaoConfig.eixosTematicos.length > 0
      ? submissaoConfig.eixosTematicos.map((e: any) => (typeof e === "string" ? e : e.nome))
      : []
  ).filter(Boolean);

  // Limites de letras/caracteres distintos para Resumo Simples vs Resumo Expandido
  const limiteSimples = Number(submissaoConfig?.limiteCaracteresSimples) || 2500;
  const limiteExpandido = Number(submissaoConfig?.limiteCaracteresExpandido) || 10000;
  const limiteCaracteresAtual = tipoResumo === "simples" ? limiteSimples : limiteExpandido;
  const minimoCaracteresAtual = tipoResumo === "simples" ? 100 : 500;

  const urlEditalFinal = submissaoConfig?.regulamento?.url || submissaoConfig?.editalUrl || "";
  const instrucoesFinais = submissaoConfig?.instrucoes || submissaoConfig?.normas || "";

  const prazoEncerrado = (() => {
    if (submissaoConfig?.dataFimDateTime) {
      const deadline = new Date(submissaoConfig.dataFimDateTime);
      return !isNaN(deadline.getTime()) && new Date() > deadline;
    }
    if (!submissaoConfig?.dataFim) return false;
    const hora = submissaoConfig.horaFim || "23:59";
    const deadline = new Date(`${submissaoConfig.dataFim}T${hora}:00`);
    return !isNaN(deadline.getTime()) && new Date() > deadline;
  })();

  useEffect(() => {
    if (!isOpen) {
      setTitulo("");
      setArea("");
      setTipoResumo("simples");
      setSenha("");
      setOrientador("");
      setCoAutores([]);
      setResumoTitulo("");
      setResumoAutores("");
      setResumoTexto("");
      setArquivo(null);
      setMostrarNormas(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [isOpen]);

  // Se o usuário trocar de Expandido para Simples e o texto exceder o limite do Simples, trunca suavemente
  const handleTrocarTipoResumo = (novoTipo: "simples" | "expandido") => {
    setTipoResumo(novoTipo);
    const novoLimite = novoTipo === "simples" ? limiteSimples : limiteExpandido;
    if (resumoTexto.length > novoLimite) {
      setResumoTexto((prev) => prev.slice(0, novoLimite));
    }
  };

  if (!isOpen) return null;

  const autorPrincipal = userData?.nome || user?.displayName || user?.email || "";

  const maxCoautores =
    submissaoConfig?.limitesPorTrabalho?.coautores ||
    submissaoConfig?.limiteAutores ||
    10;

  const handleAddCoAutor = () => {
    if (coAutores.length >= Number(maxCoautores)) {
      alert(`O limite máximo configurado para este evento é de até ${maxCoautores} coautores por trabalho.`);
      return;
    }
    setCoAutores([...coAutores, { nome: "", cpf: "", instituicao: "", curso: "" }]);
  };

  const handleRemoveCoAutor = (index: number) => {
    const novos = [...coAutores];
    novos.splice(index, 1);
    setCoAutores(novos);
  };

  const handleCoAutorChange = (index: number, field: keyof CoAutor, value: string) => {
    const novos = [...coAutores];
    if (field === "cpf") {
      let v = value.replace(/\D/g, "");
      if (v.length > 11) v = v.slice(0, 11);
      v = v.replace(/(\d{3})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
      novos[index][field] = v;
    } else {
      novos[index][field] = value;
    }
    setCoAutores(novos);
  };

  const handleFileSelect = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "pdf" || ext === "doc" || ext === "docx") {
      if (file.size <= 25 * 1024 * 1024) {
        setArquivo(file);
      } else {
        alert("O arquivo não pode exceder 25MB.");
      }
    } else {
      alert("Apenas arquivos .pdf, .doc e .docx são aceitos.");
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Você precisa estar logado para submeter.");
      return;
    }
    if (prazoEncerrado) {
      alert("O prazo para submissão de trabalhos deste evento já encerrou.");
      return;
    }
    if (!area.trim()) {
      alert("Selecione uma área de avaliação para o seu resumo.");
      return;
    }
    if (resumoTexto.trim().length < minimoCaracteresAtual) {
      alert(
        `O texto do ${
          tipoResumo === "simples" ? "Resumo Simples" : "Resumo Expandido"
        } deve ter pelo menos ${minimoCaracteresAtual} caracteres.`
      );
      return;
    }
    if (resumoTexto.length > limiteCaracteresAtual) {
      alert(
        `O texto ultrapassa o limite máximo de ${limiteCaracteresAtual.toLocaleString(
          "pt-BR"
        )} caracteres para ${tipoResumo === "simples" ? "Resumo Simples" : "Resumo Expandido"}.`
      );
      return;
    }

    try {
      setSubmitting(true);

      // 1. Re-autenticação de segurança do autor
      const credential = EmailAuthProvider.credential(user.email!, senha);
      await reauthenticateWithCredential(user, credential);

      // 2. Upload de arquivo se houver anexo
      let publicUrl = "";
      let nomeArquivoSalvo = "";
      let tamanhoArquivoSalvo = "";

      if (arquivo) {
        const safeName = arquivo.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const fileName = `${Date.now()}-${safeName}`;
        const filePath = `trabalhos/${fileName}`;

        const { error: supaErr } = await supabase.storage
          .from("events")
          .upload(filePath, arquivo, { upsert: true });

        if (supaErr) throw new Error("Erro no upload do arquivo.");
        const { data: pubData } = supabase.storage.from("events").getPublicUrl(filePath);
        publicUrl = pubData.publicUrl;
        nomeArquivoSalvo = arquivo.name;
        tamanhoArquivoSalvo = formatBytes(arquivo.size);
      }

      // 3. Busca avaliadores/professores do evento com a mesma área de interesse (1, 2 ou 3 avaliadores)
      const qtdAvaliadoresConfig = Number(submissaoConfig?.qtdAvaliadoresPorResumo) || 1;
      const mapaAvaliadores = new Map<string, AvaliadorEvento>();

      // 3.1 Avaliadores cadastrados diretamente pelo administrador na comissão
      (submissaoConfig?.avaliadoresComissao || []).forEach((av) => {
        if (av.email) {
          mapaAvaliadores.set(av.email.toLowerCase(), av);
        }
      });

      // 3.2 Professores / inscritos no evento que marcaram "Desejo atuar como avaliador"
      try {
        const snapInsc = await getDocs(
          query(collection(db, "inscricoes"), where("eventoId", "==", eventoId))
        );
        snapInsc.docs.forEach((d) => {
          const data = d.data();
          const emailAv = (data.email || data.userEmail || "").trim().toLowerCase();
          if (emailAv && data.desejoAvaliador) {
            const areasInsc: string[] = Array.isArray(data.areasInteresseAvaliador)
              ? data.areasInteresseAvaliador
              : data.areaAtuacao
              ? [data.areaAtuacao]
              : [];
            if (!mapaAvaliadores.has(emailAv)) {
              mapaAvaliadores.set(emailAv, {
                id: d.id,
                nome: data.nome || data.userName || emailAv,
                email: emailAv,
                areas: areasInsc,
                instituicao: data.instituicao || "",
                qualificacao: data.qualificacao || data.tipoParticipante || "",
              });
            }
          }
        });
      } catch (e) {
        console.warn("Aviso ao consultar avaliadores inscritos:", e);
      }

      // 3.3 Conta carga atual para equilibrar distribuição
      const contagemCarga: Record<string, number> = {};
      try {
        const snapTrab = await getDocs(
          query(collection(db, "trabalhos"), where("eventoId", "==", eventoId))
        );
        snapTrab.docs.forEach((d) => {
          const tData = d.data();
          (tData.avaliadoresDesignados || []).forEach((av: any) => {
            const em = (av.email || "").toLowerCase();
            if (em) contagemCarga[em] = (contagemCarga[em] || 0) + 1;
          });
        });
      } catch {}

      const avaliadoresDesignados = selecionarAvaliadoresPorArea(
        area,
        Array.from(mapaAvaliadores.values()),
        qtdAvaliadoresConfig,
        user.email || "",
        contagemCarga
      );

      const nomesCoautores = coAutores.map((c) => c.nome.trim()).filter(Boolean);
      const todosAutoresStr = [autorPrincipal, ...nomesCoautores].filter(Boolean).join(", ");

      // 4. Salvar no Firestore
      await addDoc(collection(db, "trabalhos"), {
        eventoId,
        eventoTitulo,
        userId: user.uid,
        userEmail: user.email,
        titulo: (titulo || resumoTitulo).trim(),
        area,
        eixoTematico: area,
        tipoResumo,
        modalidade: tipoResumo === "simples" ? "Resumo Simples" : "Resumo Expandido",
        autorPrincipal,
        autores: resumoAutores.trim() || todosAutoresStr,
        orientador: orientador.trim(),
        coAutores,
        resumoTitulo: (resumoTitulo || titulo).trim(),
        resumoAutores: resumoAutores.trim() || todosAutoresStr,
        resumo: resumoTexto.trim(),
        arquivoUrl: publicUrl,
        arquivoNome: nomeArquivoSalvo,
        arquivoTamanho: tamanhoArquivoSalvo,
        status: "Em Avaliação",
        qtdAvaliadoresAlvo: qtdAvaliadoresConfig,
        avaliadoresDesignados,
        avaliacoesPreCongresso: [],
        notaPreCongresso: null,
        modalidadeApresentacao: "",
        avaliacoesDiaEvento: [],
        notaApresentacaoMedia: null,
        apresentadoNoEvento: false,
        createdAt: Date.now(),
        createdAtServer: serverTimestamp(),
      });

      const msgAvaliadores =
        avaliadoresDesignados.length > 0
          ? ` Seu resumo foi encaminhado automaticamente para ${avaliadoresDesignados.length} avaliador(es) da área "${area}".`
          : ` Seu resumo foi registrado na área "${area}" e aguarda designação da comissão avaliadora.`;

      alert(`Resumo submetido com sucesso!${msgAvaliadores}`);
      onClose();
    } catch (error: any) {
      console.error(error);
      if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        alert("Senha incorreta. A re-autenticação falhou.");
      } else {
        alert("Erro ao submeter: " + (error.message || "Tente novamente."));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-3xl bg-white dark:bg-[#0c1e33] border border-slate-200 dark:border-blue-900/40 rounded-3xl shadow-2xl animate-in fade-in flex flex-col max-h-[90vh] overflow-hidden">
        {/* HEADER */}
        <div className="flex items-center justify-between p-6 sm:px-7 sm:py-5 border-b border-slate-100 dark:border-blue-900/40 shrink-0 bg-white dark:bg-[#0c1e33] z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-montserrat font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                Submissão de Resumo Científico
              </h3>
              <p className="text-xs text-slate-500">{eventoTitulo}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form id="form-submissao" onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col">
          {/* CORPO ROLÁVEL */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-7 space-y-6 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
            {/* Aviso de Prazo Encerrado */}
            {prazoEncerrado && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3 text-xs text-rose-700 dark:text-rose-300">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Prazo de submissão encerrado</p>
                  <p className="text-[11px] opacity-90 mt-0.5">
                    O período de envio de trabalhos para este evento já foi encerrado.
                  </p>
                </div>
              </div>
            )}

            {/* Banner de Edital / Regulamento Oficial */}
            {urlEditalFinal && (
              <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <Download className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Regulamento & Edital Oficial de Submissão
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Consulte as regras e diretrizes oficiais definidas pela organização.
                    </p>
                  </div>
                </div>
                <a
                  href={urlEditalFinal}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shrink-0 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Regulamento</span>
                </a>
              </div>
            )}

            {/* Instruções / Normas */}
            {instrucoesFinais && (
              <div className="rounded-2xl border border-slate-200 dark:border-blue-900/40 bg-slate-50/60 dark:bg-[#071321]/50 overflow-hidden text-xs">
                <button
                  type="button"
                  onClick={() => setMostrarNormas(!mostrarNormas)}
                  className="w-full p-3.5 flex items-center justify-between font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>Instruções & Diretrizes de Submissão</span>
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${mostrarNormas ? "rotate-180" : ""}`}
                  />
                </button>
                {mostrarNormas && (
                  <div className="p-4 pt-1 border-t border-slate-200/60 dark:border-blue-900/30 text-slate-600 dark:text-slate-300 whitespace-pre-line text-xs leading-relaxed">
                    {instrucoesFinais}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-6">
              {/* 1. SELEÇÃO DO TIPO DE RESUMO (Simples vs Expandido) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  1. Escolha o Formato do Resumo
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleTrocarTipoResumo("simples")}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                      tipoResumo === "simples"
                        ? "border-blue-600 bg-blue-50/70 dark:bg-blue-950/50 ring-2 ring-blue-500/20"
                        : "border-slate-200 dark:border-blue-900/40 bg-slate-50/50 dark:bg-[#071321] hover:border-blue-400"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        tipoResumo === "simples"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <AlignLeft className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          Resumo Simples
                        </span>
                        {tipoResumo === "simples" && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                            Selecionado
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Caixa de texto compacta • Limite de até{" "}
                        <strong>{limiteSimples.toLocaleString("pt-BR")} letras/caracteres</strong>.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTrocarTipoResumo("expandido")}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                      tipoResumo === "expandido"
                        ? "border-blue-600 bg-blue-50/70 dark:bg-blue-950/50 ring-2 ring-blue-500/20"
                        : "border-slate-200 dark:border-blue-900/40 bg-slate-50/50 dark:bg-[#071321] hover:border-blue-400"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        tipoResumo === "expandido"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          Resumo Expandido
                        </span>
                        {tipoResumo === "expandido" && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                            Selecionado
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Caixa de texto ampla • Limite de até{" "}
                        <strong>{limiteExpandido.toLocaleString("pt-BR")} letras/caracteres</strong>.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* 2. DADOS DO TRABALHO E ÁREA DE AVALIAÇÃO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Título do Trabalho / Resumo
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Informe o título oficial do resumo científico"
                    value={titulo}
                    onChange={(e) => {
                      setTitulo(e.target.value);
                      setResumoTitulo(e.target.value);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-blue-900/50 bg-slate-50 dark:bg-[#071321] text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Área de Avaliação (Elencada pelo Administrador do Evento)
                  </label>
                  {areasDisponiveis.length > 0 ? (
                    <select
                      required
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-blue-900/50 bg-slate-50 dark:bg-[#071321] text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    >
                      <option value="">Selecione a área temática do trabalho...</option>
                      {areasDisponiveis.map((a: string) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      required
                      type="text"
                      placeholder="Informe a área temática do trabalho"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-blue-900/50 bg-slate-50 dark:bg-[#071321] text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    />
                  )}
                  <p className="text-[11px] text-slate-400 mt-1">
                    O seu resumo será encaminhado automaticamente para avaliadores/professores com esta mesma área de interesse.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Autor Principal (Apresentador)
                  </label>
                  <input
                    type="text"
                    value={autorPrincipal}
                    disabled
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-blue-900/50 bg-slate-100 dark:bg-slate-800 text-sm text-slate-500 dark:text-slate-400 opacity-70 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Senha da Conta (Confirmação de Autoria)
                  </label>
                  <input
                    required
                    type="password"
                    placeholder="Digite sua senha para confirmar"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-blue-900/50 bg-slate-50 dark:bg-[#071321] text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Orientador(a) (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Nome completo do(a) professor(a) orientador(a)"
                    value={orientador}
                    onChange={(e) => setOrientador(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-blue-900/50 bg-slate-50 dark:bg-[#071321] text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* CO-AUTORES */}
              <div className="pt-0">
                <div className="flex items-center justify-between mb-3">
                  <button
                    type="button"
                    onClick={handleAddCoAutor}
                    className="text-xs font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-3.5 py-2 rounded-xl flex items-center gap-1.5 hover:bg-blue-200 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Adicionar Coautor
                  </button>
                  <span className="text-[11px] text-slate-400">
                    Limite: até {maxCoautores} coautores por trabalho
                  </span>
                </div>

                {coAutores.map((co, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 dark:bg-[#071321] border border-slate-200 dark:border-blue-900/40 rounded-xl mb-2 flex flex-col gap-2 relative"
                  >
                    <button
                      type="button"
                      onClick={() => handleRemoveCoAutor(idx)}
                      className="absolute top-2 right-2 text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pr-6">
                      <input
                        required
                        type="text"
                        placeholder="Nome do Coautor"
                        value={co.nome}
                        onChange={(e) => handleCoAutorChange(idx, "nome", e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-blue-900/50 bg-white dark:bg-[#0c1e33] text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
                      />
                      <input
                        required
                        type="text"
                        placeholder="CPF"
                        value={co.cpf}
                        onChange={(e) => handleCoAutorChange(idx, "cpf", e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-blue-900/50 bg-white dark:bg-[#0c1e33] text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
                      />
                      <input
                        required
                        type="text"
                        placeholder="Instituição"
                        value={co.instituicao}
                        onChange={(e) => handleCoAutorChange(idx, "instituicao", e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-blue-900/50 bg-white dark:bg-[#0c1e33] text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
                      />
                      <input
                        required
                        type="text"
                        placeholder="Curso / Departamento"
                        value={co.curso}
                        onChange={(e) => handleCoAutorChange(idx, "curso", e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-blue-900/50 bg-white dark:bg-[#0c1e33] text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. CAIXA DE TEXTO DIFERENCIADA (RESUMO SIMPLES vs RESUMO EXPANDIDO) */}
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-blue-900/40">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    {tipoResumo === "simples" ? (
                      <>
                        <AlignLeft className="w-4 h-4 text-blue-600" />
                        <span>Caixa de Texto — Resumo Simples</span>
                      </>
                    ) : (
                      <>
                        <BookOpen className="w-4 h-4 text-blue-600" />
                        <span>Caixa de Texto — Resumo Expandido</span>
                      </>
                    )}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {tipoResumo === "simples"
                      ? `Texto objetivo em parágrafo único (máximo de ${limiteSimples.toLocaleString("pt-BR")} caracteres).`
                      : `Texto estruturado detalhado com introdução, metodologia, resultados e conclusões (máximo de ${limiteExpandido.toLocaleString("pt-BR")} caracteres).`}
                  </p>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
                    resumoTexto.length >= limiteCaracteresAtual
                      ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                      : "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                  }`}
                >
                  {resumoTexto.length.toLocaleString("pt-BR")} /{" "}
                  {limiteCaracteresAtual.toLocaleString("pt-BR")} letras
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Autores (como constarão nos Anais do Evento)
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Ex: SILVA, J. A.; SANTOS, M. B.; OLIVEIRA, C. D."
                    value={resumoAutores}
                    onChange={(e) => setResumoAutores(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-blue-900/50 bg-slate-50 dark:bg-[#071321] text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {tipoResumo === "simples"
                      ? `Conteúdo do Resumo Simples (até ${limiteSimples.toLocaleString("pt-BR")} caracteres)`
                      : `Conteúdo do Resumo Expandido (até ${limiteExpandido.toLocaleString("pt-BR")} caracteres)`}
                  </label>

                  {tipoResumo === "simples" ? (
                    /* Caixa de texto MENOR para Resumo Simples */
                    <textarea
                      required
                      rows={4}
                      maxLength={limiteSimples}
                      placeholder={`Digite aqui o seu Resumo Simples (máximo de ${limiteSimples.toLocaleString("pt-BR")} letras/caracteres)...`}
                      value={resumoTexto}
                      onChange={(e) => setResumoTexto(e.target.value.slice(0, limiteSimples))}
                      className="w-full h-28 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-blue-900/50 bg-slate-50 dark:bg-[#071321] text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 resize-none leading-relaxed"
                    />
                  ) : (
                    /* Caixa de texto BEM MAIOR para Resumo Expandido */
                    <textarea
                      required
                      rows={12}
                      maxLength={limiteExpandido}
                      placeholder={`Digite aqui o seu Resumo Expandido completo contendo Introdução, Objetivos, Metodologia, Resultados/Discussão e Conclusões (máximo de ${limiteExpandido.toLocaleString("pt-BR")} letras/caracteres)...`}
                      value={resumoTexto}
                      onChange={(e) => setResumoTexto(e.target.value.slice(0, limiteExpandido))}
                      className="w-full min-h-[260px] px-3.5 py-3 rounded-xl border border-slate-200 dark:border-blue-900/50 bg-slate-50 dark:bg-[#071321] text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 leading-relaxed"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* ARQUIVO COMPLEMENTAR (OPCIONAL OU PDF DO TRABALHO) */}
            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-blue-900/40">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white">
                  Anexar Arquivo em PDF / Word (Opcional)
                </h4>
                <span className="text-[11px] text-slate-400">PDF, DOC ou DOCX até 25MB</span>
              </div>

              {!arquivo ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files?.length > 0) handleFileSelect(e.dataTransfer.files[0]);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-5 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-1.5 ${
                    isDragging
                      ? "border-blue-500 bg-blue-50/80 dark:bg-blue-950/40"
                      : "border-slate-300 dark:border-blue-900/60 hover:border-blue-400 bg-slate-50/70 dark:bg-[#071321]/60"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      if (e.target.files?.length) handleFileSelect(e.target.files[0]);
                    }}
                    className="hidden"
                  />
                  <Upload className="w-5 h-5 text-blue-500" />
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Clique ou arraste o arquivo PDF/Word caso queira anexar documento formatado
                  </p>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                      {arquivo.name.split(".").pop()?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-xs">
                        {arquivo.name}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />{" "}
                        {formatBytes(arquivo.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setArquivo(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* RODAPÉ */}
          <div className="p-4 sm:px-7 sm:py-5 border-t border-slate-100 dark:border-blue-900/40 flex justify-end gap-2 shrink-0 bg-white dark:bg-[#0c1e33]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 font-semibold text-sm transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              form="form-submissao"
              type="submit"
              disabled={submitting || prazoEncerrado}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Submeter{" "}
                  {tipoResumo === "simples" ? "Resumo Simples" : "Resumo Expandido"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
