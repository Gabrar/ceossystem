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
  
  // Modal de Parecer
  const [trabalhoParecer, setTrabalhoParecer] = useState<TrabalhoItem | null>(null);

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



    </div>
  );
}
