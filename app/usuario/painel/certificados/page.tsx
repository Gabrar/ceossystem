"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Award,
  Download,
  ShieldCheck,
  Calendar,
  ExternalLink,
  Copy,
  Check,
  FileCheck2,
  Loader2,
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface CertificadoItem {
  id: string;
  tituloEvento: string;
  tipo?: string;
  cargaHoraria?: string;
  dataEmissao?: string;
  codigoValidacao?: string;
  status?: string;
  pdfUrl?: string;
}

export default function CertificadosPage() {
  const { user } = useAuth();
  const [certificados, setCertificados] = useState<CertificadoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    async function carregarCertificados() {
      if (!user) return;
      try {
        setLoading(true);
        setError(null);

        // Busca certificados do usuário no Firestore pelo UID ou e-mail
        const qByUid = query(
          collection(db, "certificados"),
          where("userId", "==", user.uid)
        );
        const snapUid = await getDocs(qByUid);

        let docs = snapUid.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            tituloEvento: data.tituloEvento || data.eventTitle || data.evento || "Certificado de Participação",
            tipo: data.tipo || data.type || "Participação",
            cargaHoraria: data.cargaHoraria || data.workload || "",
            dataEmissao: data.dataEmissao || data.createdAt ? new Date(data.dataEmissao || data.createdAt).toLocaleDateString("pt-BR") : "",
            codigoValidacao: data.codigoValidacao || data.code || d.id,
            status: data.status || "Autenticado",
            pdfUrl: data.pdfUrl || data.url || "",
          };
        });

        // Caso não encontre por UID, tenta por e-mail
        if (docs.length === 0 && user.email) {
          const qByEmail = query(
            collection(db, "certificados"),
            where("userEmail", "==", user.email)
          );
          const snapEmail = await getDocs(qByEmail);
          docs = snapEmail.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              tituloEvento: data.tituloEvento || data.eventTitle || data.evento || "Certificado de Participação",
              tipo: data.tipo || data.type || "Participação",
              cargaHoraria: data.cargaHoraria || data.workload || "",
              dataEmissao: data.dataEmissao || data.createdAt ? new Date(data.dataEmissao || data.createdAt).toLocaleDateString("pt-BR") : "",
              codigoValidacao: data.codigoValidacao || data.code || d.id,
              status: data.status || "Autenticado",
              pdfUrl: data.pdfUrl || data.url || "",
            };
          });
        }

        setCertificados(docs);
      } catch (err: any) {
        console.error("Erro ao carregar certificados:", err);
        setError("Não foi possível carregar os certificados do banco de dados.");
      } finally {
        setLoading(false);
      }
    }

    carregarCertificados();
  }, [user]);

  const handleCopyCode = (codigo: string) => {
    navigator.clipboard.writeText(codigo);
    setCopiedCode(codigo);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Cabeçalho */}
      <div>
        <h1 className="font-montserrat text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          Meus Certificados
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Emissão oficial com validação por código criptográfico e reconhecimento para horas complementares.
        </p>
      </div>

      {/* Estados de Carregamento, Erro ou Lista */}
      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-xs sm:text-sm text-slate-500">Consultando certificados no banco de dados...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-white dark:bg-[#0c1e33] rounded-3xl border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p className="text-xs sm:text-sm font-semibold">{error}</p>
        </div>
      ) : certificados.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificados.map((cert) => (
            <div
              key={cert.id}
              className="p-6 rounded-3xl bg-white dark:bg-[#0c1e33] border border-slate-200/90 dark:border-blue-900/40 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-5 relative overflow-hidden"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Award className="w-5 h-5" />
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                    <ShieldCheck className="w-3 h-3" />
                    <span>{cert.status}</span>
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    {cert.tipo}
                  </span>
                  <h3 className="font-montserrat font-bold text-slate-900 dark:text-white text-base mt-1 line-clamp-2">
                    {cert.tituloEvento}
                  </h3>
                </div>

                <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 pt-1">
                  {cert.cargaHoraria && (
                    <div className="flex items-center justify-between">
                      <span>Carga Horária:</span>
                      <strong className="text-slate-900 dark:text-white">{cert.cargaHoraria}</strong>
                    </div>
                  )}
                  {cert.dataEmissao && (
                    <div className="flex items-center justify-between">
                      <span>Data de Emissão:</span>
                      <span>{cert.dataEmissao}</span>
                    </div>
                  )}
                  {cert.codigoValidacao && (
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-blue-900/30">
                      <span>Código:</span>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(cert.codigoValidacao!)}
                        className="font-mono font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                        title="Copiar código"
                      >
                        <span className="truncate max-w-[140px]">{cert.codigoValidacao}</span>
                        {copiedCode === cert.codigoValidacao ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3 opacity-70" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-blue-900/30 flex items-center gap-2">
                {cert.pdfUrl ? (
                  <a
                    href={cert.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Baixar PDF</span>
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => alert(`Certificado ${cert.codigoValidacao} autenticado no banco de dados.`)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Emitir Certificado</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-white dark:bg-[#0c1e33] rounded-3xl border border-dashed border-slate-200 dark:border-blue-900/40 space-y-4 max-w-lg mx-auto">
          <Award className="w-10 h-10 text-slate-400 mx-auto" />
          <div>
            <h3 className="font-montserrat font-bold text-slate-900 dark:text-white text-base">
              Nenhum certificado disponível
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Você ainda não possui certificados emitidos. Eles serão liberados automaticamente após a confirmação da sua presença ou apresentação de trabalho nos eventos.
            </p>
          </div>
          <Link
            href="/usuario/painel/inscricoes"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
          >
            <span>Ver Minhas Inscrições</span>
          </Link>
        </div>
      )}

    </div>
  );
}
