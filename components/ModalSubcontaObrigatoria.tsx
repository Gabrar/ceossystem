"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Wallet,
  ShieldAlert,
  ArrowRight,
  X,
  CreditCard,
  CheckCircle2,
  Lock,
  ExternalLink,
} from "lucide-react";

interface ModalSubcontaObrigatoriaProps {
  isOpen: boolean;
  onClose: () => void;
  status?: "SEM_CONTA" | "ENCERRADA" | "ATIVA" | "NAO_PROMOTOR" | "ADMIN";
  mensagemCustom?: string;
}

export default function ModalSubcontaObrigatoria({
  isOpen,
  onClose,
  status = "SEM_CONTA",
  mensagemCustom,
}: ModalSubcontaObrigatoriaProps) {
  const router = useRouter();

  // Fecha o modal ao pressionar ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleIrParaFinanceiro = () => {
    onClose();
    router.push("/usuario/painel/financeiro");
  };

  const isEncerrada = status === "ENCERRADA";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-subconta-titulo"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      {/* Backdrop click */}
      <div
        className="absolute inset-0 -z-10"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-lg bg-white dark:bg-[#0c1e33] border border-slate-200/90 dark:border-blue-900/50 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-blue-500/10 space-y-6 overflow-hidden">
        {/* Detalhe de iluminação suave no topo */}
        <div
          aria-hidden="true"
          className="absolute -top-16 -right-16 w-44 h-44 bg-blue-500/15 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none"
        />

        {/* Botão Fechar */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar modal"
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header com Ícone e Título */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-xs">
            <ShieldAlert className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
              <Lock className="w-3 h-3 text-blue-600 dark:text-blue-400" />
              <span>Obrigatório para Promotores</span>
            </div>

            <h2
              id="modal-subconta-titulo"
              className="font-montserrat text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white leading-tight"
            >
              {isEncerrada
                ? "Subconta Asaas Precisa de Regularização"
                : "Subconta Asaas Obrigatória"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Etapa de segurança financeira antes de criar seu evento
            </p>
          </div>
        </div>

        {/* Mensagem Principal */}
        <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/50 text-slate-900 dark:text-slate-100 space-y-2">
          <p className="text-xs sm:text-sm font-semibold leading-relaxed text-blue-950 dark:text-blue-100">
            {mensagemCustom ||
              (isEncerrada
                ? "Sua subconta no Asaas consta como desvinculada ou cancelada. Para poder criar eventos, é necessário configurar uma nova subconta ativa."
                : "Para poder criar eventos na plataforma, é obrigatório criar a sua subconta no Asaas para o recebimento das inscrições.")}
          </p>
          <p className="text-[11px] sm:text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
            A criação de novos eventos só é liberada quando a situação do cadastro da sua conta estiver completa (<strong>conta ativa</strong>).
          </p>
        </div>

        {/* Motivos / Benefícios */}
        <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <span>
              <strong>Recebimento Direto:</strong> As vendas de ingressos via Pix, Cartão e Boleto caem diretamente na sua carteira.
            </span>
          </div>

          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <span>
              <strong>Divisão Automática:</strong> A taxa da plataforma é repassada com total transparência e sem cobranças manuais.
            </span>
          </div>

          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <span>
              <strong>Liberação Automática:</strong> Assim que cadastrada no painel financeiro, a publicação de eventos é liberada na hora.
            </span>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="pt-2 flex flex-col sm:flex-row gap-2.5 sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-blue-900/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-blue-950/40 text-xs font-semibold transition-colors cursor-pointer text-center"
          >
            Agora Não
          </button>

          <button
            type="button"
            onClick={handleIrParaFinanceiro}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/25 transition-all cursor-pointer"
          >
            <Wallet className="w-4 h-4" />
            <span>
              {isEncerrada ? "Regularizar no Financeiro" : "Criar Subconta Asaas Agora"}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
