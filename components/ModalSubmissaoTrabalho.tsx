"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, X, CheckCircle2, Trash2, Send, Loader2, Plus, FileText, Lock } from "lucide-react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { db } from "@/lib/firebase";
import { supabase } from "@/lib/supabase";

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
  user: any; // firebase user
  userData: any; // from firestore
}

export default function ModalSubmissaoTrabalho({
  isOpen,
  onClose,
  eventoId,
  eventoTitulo,
  user,
  userData,
}: ModalSubmissaoTrabalhoProps) {
  const [submitting, setSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form Fields
  const [titulo, setTitulo] = useState("");
  const [area, setArea] = useState("");
  const [senha, setSenha] = useState("");
  const [orientador, setOrientador] = useState("");
  const [coAutores, setCoAutores] = useState<CoAutor[]>([]);
  
  const [resumoTitulo, setResumoTitulo] = useState("");
  const [resumoAutores, setResumoAutores] = useState("");
  const [resumoTexto, setResumoTexto] = useState("");

  const [arquivo, setArquivo] = useState<File | null>(null);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTitulo("");
      setArea("");
      setSenha("");
      setOrientador("");
      setCoAutores([]);
      setResumoTitulo("");
      setResumoAutores("");
      setResumoTexto("");
      setArquivo(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const autorPrincipal = userData?.nome || user?.displayName || user?.email || "";

  const handleAddCoAutor = () => {
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
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf' || ext === 'doc' || ext === 'docx') {
      if (file.size <= 20 * 1024 * 1024) { // 20MB limit
        setArquivo(file);
      } else {
        alert("O arquivo não pode exceder 20MB.");
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
    if (!arquivo) {
      alert("Anexe o arquivo do trabalho (PDF/DOC).");
      return;
    }

    try {
      setSubmitting(true);

      // 1. Re-authenticate
      const credential = EmailAuthProvider.credential(user.email!, senha);
      await reauthenticateWithCredential(user, credential);

      // 2. Upload file
      const safeName = arquivo.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const fileName = `${Date.now()}-${safeName}`;
      const filePath = `trabalhos/${fileName}`;
      
      const { data: uploadData, error: supaErr } = await supabase.storage
        .from("events")
        .upload(filePath, arquivo, { upsert: true });
        
      if (supaErr) throw new Error("Erro no upload do arquivo.");
      const { data: pubData } = supabase.storage.from("events").getPublicUrl(filePath);

      // 3. Save to Firestore
      await addDoc(collection(db, "trabalhos"), {
        eventoId,
        eventoTitulo,
        userId: user.uid,
        userEmail: user.email,
        titulo: titulo.trim(),
        area,
        autorPrincipal,
        orientador: orientador.trim(),
        coAutores,
        resumoTitulo: resumoTitulo.trim(),
        resumoAutores: resumoAutores.trim(),
        resumo: resumoTexto.trim(),
        arquivoUrl: pubData.publicUrl,
        arquivoNome: arquivo.name,
        arquivoTamanho: formatBytes(arquivo.size),
        status: "Em Avaliação",
        createdAt: Date.now(),
        createdAtServer: serverTimestamp(),
      });

      alert("Trabalho submetido com sucesso!");
      onClose();
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
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
                Submissão de Trabalho
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
          {/* SCROLLING BODY */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-7 space-y-6 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
            <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Título do trabalho</label>
                <input required type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-blue-900/50 bg-slate-50 dark:bg-[#071321] text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500" />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Área</label>
                <select required value={area} onChange={(e) => setArea(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-blue-900/50 bg-slate-50 dark:bg-[#071321] text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500">
                  <option value="">Selecione uma área...</option>
                  <option value="Ciências da Saúde">Ciências da Saúde</option>
                  <option value="Engenharia">Engenharia</option>
                  <option value="Humanas">Humanas</option>
                  <option value="Exatas">Exatas</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Autor</label>
                <input type="text" value={autorPrincipal} disabled className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-blue-900/50 bg-slate-100 dark:bg-slate-800 text-sm text-slate-500 dark:text-slate-400 opacity-70 cursor-not-allowed" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Senha</label>
                <input required type="password" value={senha} onChange={(e) => setSenha(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-blue-900/50 bg-slate-50 dark:bg-[#071321] text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500" />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Orientador</label>
                <input type="text" value={orientador} onChange={(e) => setOrientador(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-blue-900/50 bg-slate-50 dark:bg-[#071321] text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500" />
              </div>
            </div>

            {/* CO-AUTORES */}
            <div className="pt-0">
              <div className="flex items-center justify-start mb-3">
                <button type="button" onClick={handleAddCoAutor} className="text-sm font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-200 transition-colors">
                  <Plus className="w-4 h-4" /> Criar co-autores
                </button>
              </div>
              
              {coAutores.map((co, idx) => (
                <div key={idx} className="p-3 bg-slate-50 dark:bg-[#071321] border border-slate-200 dark:border-blue-900/40 rounded-xl mb-2 flex flex-col gap-2 relative">
                  <button type="button" onClick={() => handleRemoveCoAutor(idx)} className="absolute top-2 right-2 text-slate-400 hover:text-rose-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pr-6">
                    <input required type="text" placeholder="Nome" value={co.nome} onChange={(e) => handleCoAutorChange(idx, "nome", e.target.value)} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-blue-900/50 bg-white dark:bg-[#0c1e33] text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500" />
                    <input required type="text" placeholder="CPF" value={co.cpf} onChange={(e) => handleCoAutorChange(idx, "cpf", e.target.value)} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-blue-900/50 bg-white dark:bg-[#0c1e33] text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500" />
                    <input required type="text" placeholder="Instituição" value={co.instituicao} onChange={(e) => handleCoAutorChange(idx, "instituicao", e.target.value)} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-blue-900/50 bg-white dark:bg-[#0c1e33] text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500" />
                    <input required type="text" placeholder="Curso" value={co.curso} onChange={(e) => handleCoAutorChange(idx, "curso", e.target.value)} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-blue-900/50 bg-white dark:bg-[#0c1e33] text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RESUMO PARA AVALIADOR */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-blue-900/40">
            <h4 className="font-semibold text-slate-900 dark:text-white">Resumo para avaliador</h4>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Titulo</label>
                <input required type="text" value={resumoTitulo} onChange={(e) => setResumoTitulo(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-blue-900/50 bg-slate-50 dark:bg-[#071321] text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500" />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">autores</label>
                <input required type="text" value={resumoAutores} onChange={(e) => setResumoAutores(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-blue-900/50 bg-slate-50 dark:bg-[#071321] text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500" />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">texto</label>
                <textarea required minLength={50} rows={4} value={resumoTexto} onChange={(e) => setResumoTexto(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-blue-900/50 bg-slate-50 dark:bg-[#071321] text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 resize-none"></textarea>
              </div>

            </div>
          </div>

          {/* ARQUIVO */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-blue-900/40">
            <h4 className="font-semibold text-slate-900 dark:text-white">Resumo texto</h4>
            
            {!arquivo ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault(); setIsDragging(false);
                  if (e.dataTransfer.files?.length > 0) handleFileSelect(e.dataTransfer.files[0]);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-2 ${isDragging ? "border-blue-500 bg-blue-50/80 dark:bg-blue-950/40" : "border-slate-300 dark:border-blue-900/60 hover:border-blue-400 bg-slate-50/70 dark:bg-[#071321]/60"}`}
              >
                <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" onChange={(e) => { if (e.target.files?.length) handleFileSelect(e.target.files[0]); }} className="hidden" />
                <Upload className="w-6 h-6 text-blue-500" />
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Texto completo formatado no word ou pdf</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Word (.doc/.docx) ou PDF até 20MB (Clique para anexar)</p>
              </div>
            ) : (
              <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                    {arquivo.name.split('.').pop()?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-xs">{arquivo.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> {formatBytes(arquivo.size)}</p>
                  </div>
                </div>
                <button type="button" onClick={() => { setArquivo(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="p-2 text-slate-400 hover:text-rose-600 transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          </div>

          {/* FOOTER */}
          <div className="p-4 sm:px-7 sm:py-5 border-t border-slate-100 dark:border-blue-900/40 flex justify-end gap-2 shrink-0 bg-white dark:bg-[#0c1e33]">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 font-semibold text-sm transition-colors">
              Cancelar
            </button>
            <button form="form-submissao" type="submit" disabled={submitting} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-md transition-all disabled:opacity-50">
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
              ) : (
                <><Send className="w-4 h-4" /> Confirmar Submissão</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
