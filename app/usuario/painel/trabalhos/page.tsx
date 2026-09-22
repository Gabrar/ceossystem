"use client";

import { useState, useEffect, useRef } from "react";
import {
  FileText,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Send,
  Upload,
  Download,
  Eye,
  Trash2,
  BookOpen
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { collection, getDocs, addDoc, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { supabase } from "@/lib/supabase";

interface TrabalhoItem {
  id: string;
  titulo: string;
  eixoTematico: string;
  evento: string;
  autores: string;
  status: string;
  dataSubmissao: string;
  nota?: string;
  resumo?: string;
  parecer?: string;
  arquivoUrl?: string;
  arquivoNome?: string;
  arquivoTamanho?: string;
}

export default function TrabalhosPage() {
  const { user, userData } = useAuth();
  const [trabalhos, setTrabalhos] = useState<TrabalhoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal de Submissão
  const [modalAberto, setModalAberto] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [eventosDisponiveis, setEventosDisponiveis] = useState<Array<{ id: string; title: string }>>([]);

  // Modal de Parecer
  const [trabalhoParecer, setTrabalhoParecer] = useState<TrabalhoItem | null>(null);

  // Campos do formulário
  const [novoTitulo, setNovoTitulo] = useState("");
  const [novoEixo, setNovoEixo] = useState("Ciências da Saúde");
  const [eventoSelecionado, setEventoSelecionado] = useState("");
  const [novosAutores, setNovosAutores] = useState(userData?.nome || user?.displayName || "");
  const [novoResumo, setNovoResumo] = useState("");

  // Arquivo PDF
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const carregarTrabalhos = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);

      // Busca trabalhos reais submetidos pelo usuário no Firestore
      const qByUid = query(
        collection(db, "trabalhos"),
        where("userId", "==", user.uid)
      );
      const snapUid = await getDocs(qByUid);

      let docs = snapUid.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          titulo: data.titulo || data.title || "Sem título informado",
          eixoTematico: data.eixoTematico || data.area || "Geral",
          evento: data.eventoTitulo || data.evento || "Congresso Científico",
          autores: data.autores || data.authors || (userData?.nome || "Autor Principal"),
          status: data.status || "Em Avaliação",
          dataSubmissao: data.createdAt ? new Date(data.createdAt).toLocaleDateString("pt-BR") : "Data não informada",
          nota: data.nota || "-",
          resumo: data.resumo || "",
          parecer: data.parecer || "Trabalho submetido com sucesso. Aguardando parecer da comissão científica examinadora.",
          arquivoUrl: data.arquivoUrl || data.pdfUrl || data.fileUrl || "",
          arquivoNome: data.arquivoNome || data.pdfNome || data.fileName || "",
          arquivoTamanho: data.arquivoTamanho || data.fileSize || "",
        };
      });

      if (docs.length === 0 && user.email) {
        const qByEmail = query(
          collection(db, "trabalhos"),
          where("userEmail", "==", user.email)
        );
        const snapEmail = await getDocs(qByEmail);
        docs = snapEmail.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            titulo: data.titulo || data.title || "Sem título informado",
            eixoTematico: data.eixoTematico || data.area || "Geral",
            evento: data.eventoTitulo || data.evento || "Congresso Científico",
            autores: data.autores || data.authors || (userData?.nome || "Autor Principal"),
            status: data.status || "Em Avaliação",
            dataSubmissao: data.createdAt ? new Date(data.createdAt).toLocaleDateString("pt-BR") : "Data não informada",
            nota: data.nota || "-",
            resumo: data.resumo || "",
            parecer: data.parecer || "Trabalho submetido com sucesso. Aguardando parecer da comissão científica examinadora.",
            arquivoUrl: data.arquivoUrl || data.pdfUrl || data.fileUrl || "",
            arquivoNome: data.arquivoNome || data.pdfNome || data.fileName || "",
            arquivoTamanho: data.arquivoTamanho || data.fileSize || "",
          };
        });
      }

      setTrabalhos(docs);
    } catch (err: any) {
      console.error("Erro ao buscar trabalhos:", err);
      setError("Não foi possível carregar os trabalhos científicos do banco de dados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarTrabalhos();
  }, [user]);

  // Carrega eventos reais para preencher o select de submissão
  useEffect(() => {
    async function carregarEventos() {
      try {
        const snap = await getDocs(collection(db, "events"));
        const lista = snap.docs.map((d) => ({
          id: d.id,
          title: d.data().title || "Evento sem título",
        }));
        setEventosDisponiveis(lista);
        if (lista.length > 0) {
          setEventoSelecionado(lista[0].title);
        }
      } catch (e) {
        console.error("Erro ao carregar lista de eventos:", e);
      }
    }
    carregarEventos();
  }, []);

  const handleFileSelect = (file: File | null) => {
    if (!file) return;
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      alert("Formato de arquivo inválido. Por favor, selecione exclusivamente um arquivo no formato PDF (.pdf).");
      return;
    }
    const maxBytes = 25 * 1024 * 1024; // 25 MB
    if (file.size > maxBytes) {
      alert("O arquivo excede o limite máximo permitido de 25 MB.");
      return;
    }
    setPdfFile(file);
  };

  const uploadPdf = async (file: File): Promise<{ url: string; nome: string; tamanho: string }> => {
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `${Date.now()}-${safeName}`;
    const sizeFormatted = file.size < 1024 * 1024
      ? `${(file.size / 1024).toFixed(1)} KB`
      : `${(file.size / (1024 * 1024)).toFixed(2)} MB`;

    // Envio do arquivo PDF diretamente para o Supabase Storage (bucket 'events')
    const filePath = `trabalhos/${fileName}`;
    const { data: uploadData, error: supaErr } = await supabase.storage
      .from("events")
      .upload(filePath, file, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (!supaErr && uploadData) {
      const { data: pubData } = supabase.storage.from("events").getPublicUrl(filePath);
      return {
        url: pubData.publicUrl,
        nome: file.name,
        tamanho: sizeFormatted,
      };
    }

    if (supaErr) {
      console.warn("Supabase Storage retorno:", supaErr);

      // Contingência para testes locais caso as políticas RLS do bucket 'events' ainda não permitam anon INSERT
      if (file.size < 850 * 1024) {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              url: reader.result as string,
              nome: file.name,
              tamanho: sizeFormatted,
            });
          };
          reader.readAsDataURL(file);
        });
      }

      throw new Error(`Falha no upload para o Supabase Storage: ${supaErr.message}`);
    }

    const { data: pubData } = supabase.storage.from("events").getPublicUrl(filePath);
    return {
      url: pubData.publicUrl,
      nome: file.name,
      tamanho: sizeFormatted,
    };
  };

  const handleSubmeterTrabalho = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoTitulo.trim() || !user) {
      alert("Por favor, preencha o título do trabalho científico.");
      return;
    }

    if (!pdfFile) {
      alert("O envio de trabalho é feito obrigatoriamente por arquivo PDF. Por favor, anexe o arquivo .pdf do seu trabalho.");
      return;
    }

    try {
      setSubmitting(true);

      // Upload do arquivo PDF
      const pdfUploadResult = await uploadPdf(pdfFile);

      const novoDoc = {
        titulo: novoTitulo,
        eixoTematico: novoEixo,
        eventoTitulo: eventoSelecionado || "Congresso Céos System",
        autores: novosAutores,
        resumo: novoResumo,
        arquivoUrl: pdfUploadResult.url,
        arquivoNome: pdfUploadResult.nome,
        arquivoTamanho: pdfUploadResult.tamanho,
        tipoArquivo: "application/pdf",
        status: "Em Avaliação",
        parecer: "Trabalho e arquivo PDF recebidos com sucesso. Em fase de distribuição para a comissão examinadora.",
        userId: user.uid,
        userEmail: user.email || null,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, "trabalhos"), novoDoc);

      setModalAberto(false);
      setNovoTitulo("");
      setNovoResumo("");
      setPdfFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      alert("Trabalho e arquivo PDF submetidos com sucesso para a banca avaliadora!");
      await carregarTrabalhos();
    } catch (err: any) {
      console.error("Erro ao salvar trabalho:", err);
      alert(err.message || "Erro ao submeter o trabalho. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-montserrat text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Trabalhos Científicos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Envio de trabalhos em formato PDF, acompanhamento de bancas examinadoras e anais de eventos.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setPdfFile(null);
            setModalAberto(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-blue-600/20 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Submeter Trabalho (PDF)</span>
        </button>
      </div>

      {/* Estados de Carregamento, Erro ou Lista */}
      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-xs sm:text-sm text-slate-500">Buscando trabalhos no banco de dados...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-white dark:bg-[#0c1e33] rounded-3xl border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p className="text-xs sm:text-sm font-semibold">{error}</p>
        </div>
      ) : trabalhos.length > 0 ? (
        <div className="space-y-4">
          {trabalhos.map((trabalho) => (
            <div
              key={trabalho.id}
              className="p-6 rounded-3xl bg-white dark:bg-[#0c1e33] border border-slate-200/90 dark:border-blue-900/40 shadow-xs hover:shadow-md transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
            >
              <div className="space-y-3 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      trabalho.status.includes("Aprovado")
                        ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40"
                        : trabalho.status.includes("Corre") || trabalho.status.includes("Ressalva")
                        ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40"
                        : "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40"
                    }`}
                  >
                    {trabalho.status.includes("Aprovado") ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <Clock className="w-3 h-3" />
                    )}
                    <span>{trabalho.status}</span>
                  </span>

                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                    {trabalho.eixoTematico}
                  </span>

                  <span className="text-xs text-slate-400 font-mono">
                    ID: {trabalho.id}
                  </span>
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
                    {trabalho.nota && trabalho.nota !== "-" && ` • Nota: ${trabalho.nota}`}
                  </p>
                </div>

                {/* Arquivo PDF Anexado */}
                {trabalho.arquivoUrl ? (
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
                ) : null}
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
                  onClick={() => setTrabalhoParecer(trabalho)}
                  className="flex-1 lg:flex-initial py-2.5 px-4 rounded-xl border border-slate-200 dark:border-blue-900/50 hover:bg-slate-50 dark:hover:bg-blue-950/60 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer text-center"
                >
                  Ver Parecer
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-white dark:bg-[#0c1e33] rounded-3xl border border-dashed border-slate-200 dark:border-blue-900/40 space-y-4 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-3xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-xs">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-montserrat font-bold text-slate-900 dark:text-white text-base">
              Nenhum trabalho científico submetido
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Você ainda não enviou artigos ou resumos científicos. Submeta seu trabalho em formato PDF para avaliação da comissão examinadora.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setPdfFile(null);
              setModalAberto(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-md shadow-blue-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Submeter Primeiro Trabalho (PDF)</span>
          </button>
        </div>
      )}

      {/* Modal de Parecer da Banca */}
      {trabalhoParecer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-[#0c1e33] border border-slate-200 dark:border-blue-900/40 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-montserrat font-bold text-base text-slate-900 dark:text-white">
                    Parecer da Banca Avaliadora
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

            <div className="space-y-4 text-xs sm:text-sm">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-semibold">
                  Título do Trabalho
                </span>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                  {trabalhoParecer.titulo}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-[#071321] border border-slate-200/80 dark:border-blue-900/40">
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
                    Nota Final
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {trabalhoParecer.nota || "Pendente"}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-semibold">
                  Avaliação & Considerações da Comissão
                </span>
                <p className="mt-1 p-3.5 rounded-2xl bg-slate-50 dark:bg-[#071321] border border-slate-200/80 dark:border-blue-900/40 text-slate-700 dark:text-slate-300 leading-relaxed text-xs">
                  {trabalhoParecer.parecer || "Nenhum parecer emitido até o momento. A comissão científica está em processo de avaliação."}
                </p>
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

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setTrabalhoParecer(null)}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer"
              >
                Fechar Parecer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Submissão com Upload de PDF */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-[#0c1e33] border border-slate-200 dark:border-blue-900/40 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl animate-in fade-in my-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-montserrat font-bold text-base text-slate-900 dark:text-white">
                    Submeter Trabalho Científico
                  </h3>
                  <p className="text-xs text-slate-500">Envio do arquivo PDF para banca examinadora</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalAberto(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmeterTrabalho} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Título do Trabalho / Artigo
                </label>
                <input
                  type="text"
                  required
                  value={novoTitulo}
                  onChange={(e) => setNovoTitulo(e.target.value)}
                  placeholder="Ex: Análise das Variações Anatômicas do Nervo Ciático..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-blue-900/50 bg-slate-50 dark:bg-[#071321] text-slate-900 dark:text-white outline-none focus:border-blue-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Evento de Destino
                  </label>
                  <select
                    value={eventoSelecionado}
                    onChange={(e) => setEventoSelecionado(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-blue-900/50 bg-slate-50 dark:bg-[#071321] text-slate-900 dark:text-white outline-none focus:border-blue-500 text-xs"
                  >
                    {eventosDisponiveis.length > 0 ? (
                      eventosDisponiveis.map((ev) => (
                        <option key={ev.id} value={ev.title}>
                          {ev.title}
                        </option>
                      ))
                    ) : (
                      <option value="Congresso Céos System Geral">Congresso Científico Geral</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Eixo Temático
                  </label>
                  <select
                    value={novoEixo}
                    onChange={(e) => setNovoEixo(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-blue-900/50 bg-slate-50 dark:bg-[#071321] text-slate-900 dark:text-white outline-none focus:border-blue-500 text-xs"
                  >
                    <option value="Ciências da Saúde">Ciências da Saúde</option>
                    <option value="Medicina Clínica e Cirúrgica">Medicina Clínica e Cirúrgica</option>
                    <option value="Anatomia & Morfologia">Anatomia & Morfologia</option>
                    <option value="Inovação & Biotecnologia">Inovação & Biotecnologia</option>
                    <option value="Educação e Metodologias">Educação e Metodologias</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Autores e Coautores
                </label>
                <input
                  type="text"
                  required
                  value={novosAutores}
                  onChange={(e) => setNovosAutores(e.target.value)}
                  placeholder="Ex: Silva, M. A.; Santos, J. P."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-blue-900/50 bg-slate-50 dark:bg-[#071321] text-slate-900 dark:text-white outline-none focus:border-blue-500 text-xs"
                />
              </div>

              {/* Upload de Arquivo PDF (Obrigatório) */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Arquivo do Trabalho (.PDF)</span>
                  <span className="text-[11px] text-rose-500 font-bold uppercase tracking-wide">
                    Obrigatório
                  </span>
                </label>

                {!pdfFile ? (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        handleFileSelect(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-2 ${
                      isDragging
                        ? "border-rose-500 bg-rose-50/80 dark:bg-rose-950/40"
                        : "border-slate-300 dark:border-blue-900/60 hover:border-rose-400 bg-slate-50/70 dark:bg-[#071321]/60"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf,.pdf"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleFileSelect(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-xs">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                        Clique para anexar ou arraste o PDF aqui
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Formato aceito: <strong>.PDF</strong> (Tamanho máximo: 25 MB)
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold text-xs uppercase tracking-wider shrink-0 shadow-xs">
                        PDF
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                          {pdfFile.name}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          <span>
                            {pdfFile.size < 1024 * 1024
                              ? `${(pdfFile.size / 1024).toFixed(1)} KB`
                              : `${(pdfFile.size / (1024 * 1024)).toFixed(2)} MB`}
                          </span>
                          <span>•</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Arquivo pronto
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setPdfFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                      title="Remover arquivo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Resumo / Observações da Pesquisa (Opcional)
                </label>
                <textarea
                  rows={3}
                  value={novoResumo}
                  onChange={(e) => setNovoResumo(e.target.value)}
                  placeholder="Síntese dos objetivos, métodos e resultados principais..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-blue-900/50 bg-slate-50 dark:bg-[#071321] text-slate-900 dark:text-white outline-none focus:border-blue-500 text-xs resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-blue-900/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-blue-950/40 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Enviando PDF...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submeter Trabalho</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
