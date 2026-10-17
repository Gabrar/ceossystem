"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Wallet,
  Building2,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Copy,
  Check,
  RefreshCw,
  Coins,
  TrendingUp,
  Landmark,
  Calendar,
  CreditCard,
  Lock,
  Trash2,
  Camera,
  Smartphone,
  ExternalLink,
  QrCode,
  Clock,
  XCircle,
  FileText,
  X,
  ShieldAlert,
  Send,
  Key,
  ArrowUpRight,
  History,
  Plus,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface DocumentoItem {
  id: string;
  title: string;
  status: "PENDING" | "AWAITING_APPROVAL" | "APPROVED" | "REJECTED" | string;
  type: string;
  onboardingUrl?: string | null;
  rejectReasons?: string | null;
}

interface SubcontaInfo {
  exists: boolean;
  accountId?: string;
  walletId?: string;
  status?: string;
  contaEncerrada?: boolean;
  accountNumber?: {
    agency?: string;
    account?: string;
    accountDigit?: string;
  };
  saldo?: {
    balance?: number;
    paymentInProgressValue?: number;
  };
  dadosCadastrais?: {
    name?: string;
    email?: string;
    cpfCnpj?: string;
    phone?: string;
  };
  onboardingUrl?: string | null;
  documentos?: DocumentoItem[];
  todosDocumentosAprovados?: boolean;
  precisaVerificacao?: boolean;
}

interface EventoFaturamentoItem {
  titulo: string;
  arrecadado: number;
  totalInscritos: number;
}

export default function FinanceiroPage() {
  const { user, userData, loading: authLoading } = useAuth();

  const isPromotor =
    userData?.tipoUsuario === "promotor" ||
    userData?.tipo_usuario === "promotor" ||
    userData?.role === "promotor";

  const [loading, setLoading] = useState(true);
  const [subconta, setSubconta] = useState<SubcontaInfo | null>(null);
  const [eventosFaturamento, setEventosFaturamento] = useState<EventoFaturamentoItem[]>([]);
  const [totalArrecadado, setTotalArrecadado] = useState(0);

  // Estados do formulário de Onboarding
  const [personType, setPersonType] = useState<"FISICA" | "JURIDICA">("FISICA");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [companyType, setCompanyType] = useState<"MEI" | "LIMITED" | "INDIVIDUAL" | "ASSOCIATION">("MEI");
  const [phone, setPhone] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [address, setAddress] = useState("");
  const [addressNumber, setAddressNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [province, setProvince] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [incomeValue, setIncomeValue] = useState("5000");

  // Estados de controle
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [submetendo, setSubmetendo] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState("");
  const [mensagemErro, setMensagemErro] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [recarregandoSaldo, setRecarregandoSaldo] = useState(false);
  const [desvinculando, setDesvinculando] = useState(false);
  const [modalValidacaoAberto, setModalValidacaoAberto] = useState(false);
  const [linkCopiado, setLinkCopiado] = useState(false);
  const [reenviandoEmail, setReenviandoEmail] = useState(false);

  // Controle de Abas
  const [abaAtiva, setAbaAtiva] = useState<"visao_geral" | "pix">("visao_geral");

  // Estados de Chaves Pix
  const [chavesPix, setChavesPix] = useState<any[]>([]);
  const [carregandoChaves, setCarregandoChaves] = useState(false);
  const [criandoChave, setCriandoChave] = useState(false);
  const [removendoChaveId, setRemovendoChaveId] = useState<string | null>(null);
  const [chaveCopiadaId, setChaveCopiadaId] = useState<string | null>(null);

  // Estados de Envio / Transferência Pix
  const [tipoChaveDestino, setTipoChaveDestino] = useState<"CPF" | "CNPJ" | "EMAIL" | "PHONE" | "EVP">("CPF");
  const [chaveDestino, setChaveDestino] = useState("");
  const [valorPix, setValorPix] = useState("");
  const [descricaoPix, setDescricaoPix] = useState("");
  const [enviandoPix, setEnviandoPix] = useState(false);
  const [sucessoPix, setSucessoPix] = useState("");
  const [erroPix, setErroPix] = useState("");

  // Histórico de Transferências
  const [transferencias, setTransferencias] = useState<any[]>([]);
  const [carregandoTransferencias, setCarregandoTransferencias] = useState(false);

  // Inicializa dados do formulário a partir do perfil do promotor sem cascata de renders
  const [perfilInicializado, setPerfilInicializado] = useState(false);
  if (!perfilInicializado && userData) {
    if (userData.nome) setName(userData.nome);
    if (userData.email) setEmail(userData.email);
    if (userData.documento) setCpfCnpj(userData.documento);
    if (userData.telefone) setPhone(userData.telefone);
    if (userData.estado) setEstado(userData.estado);
    setPerfilInicializado(true);
  }

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function buscarDados() {
      if (!user || !isPromotor) {
        if (!authLoading && !ignore) setLoading(false);
        return;
      }

      try {
        // 1. Consulta API da Subconta
        const res = await fetch(`/api/asaas/subconta?userId=${user.uid}`);
        const data = await res.json();
        if (ignore) return;

        if (data.exists) {
          setSubconta(data);
          carregarDadosPix();
        } else {
          setSubconta(null);
        }

        // 2. Busca inscrições confirmadas dos eventos deste promotor
        try {
          const qEventos = query(collection(db, "events"), where("userId", "==", user.uid));
          const snapEventos = await getDocs(qEventos);
          if (ignore) return;

          const listaEventosIds = snapEventos.docs.map((d) => d.id);

          if (listaEventosIds.length > 0) {
            const qInsc = query(
              collection(db, "inscricoes"),
              where("status", "in", ["Confirmada", "Pendente"])
            );
            const snapInsc = await getDocs(qInsc);
            if (ignore) return;

            const mapaEventos: Record<string, { titulo: string; arrecadado: number; totalInscritos: number }> = {};
            snapEventos.docs.forEach((docEv) => {
              mapaEventos[docEv.id] = {
                titulo: docEv.data().nomeEvento || docEv.data().titulo || "Evento sem título",
                arrecadado: 0,
                totalInscritos: 0,
              };
            });

            let somaTotal = 0;
            snapInsc.docs.forEach((d) => {
              const insc = d.data();
              if (mapaEventos[insc.eventoId]) {
                mapaEventos[insc.eventoId].totalInscritos += 1;
                if (insc.status === "Confirmada") {
                  const val = Number(insc.valorNumerico) || 0;
                  mapaEventos[insc.eventoId].arrecadado += val;
                  somaTotal += val;
                }
              }
            });

            setTotalArrecadado(somaTotal);
            setEventosFaturamento(Object.values(mapaEventos));
          }
        } catch (errInsc) {
          console.warn("Aviso ao buscar faturamento dos eventos:", errInsc);
        }
      } catch (e: unknown) {
        if (ignore) return;
        console.error("Erro ao carregar dados financeiros:", e);
        setMensagemErro("Não foi possível carregar os dados financeiros no momento.");
      } finally {
        if (!ignore) {
          setLoading(false);
          setRecarregandoSaldo(false);
        }
      }
    }

    buscarDados();

    return () => {
      ignore = true;
    };
  }, [user, isPromotor, authLoading, reloadKey]);

  // Recarrega saldo em tempo real
  const handleAtualizarSaldo = () => {
    setRecarregandoSaldo(true);
    setReloadKey((prev) => prev + 1);
  };

  // Busca CEP via ViaCEP
  const handleCepChange = async (cepInput: string) => {
    const raw = cepInput.replace(/\D/g, "").slice(0, 8);
    let formatado = raw;
    if (raw.length > 5) {
      formatado = `${raw.slice(0, 5)}-${raw.slice(5)}`;
    }
    setPostalCode(formatado);

    if (raw.length === 8) {
      try {
        setBuscandoCep(true);
        const res = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
        const json = await res.json();
        if (!json.erro) {
          if (json.logradouro) setAddress(json.logradouro);
          if (json.bairro) setProvince(json.bairro);
          if (json.localidade) setCidade(json.localidade);
          if (json.uf) setEstado(json.uf);
        }
      } catch (e) {
        console.warn("Erro ao buscar ViaCEP:", e);
      } finally {
        setBuscandoCep(false);
      }
    }
  };

  // Formata CPF / CNPJ
  const handleCpfCnpjChange = (val: string) => {
    const digits = val.replace(/\D/g, "");
    if (personType === "FISICA") {
      const numeric = digits.slice(0, 11);
      let formatado = numeric;
      if (numeric.length > 9) {
        formatado = `${numeric.slice(0, 3)}.${numeric.slice(3, 6)}.${numeric.slice(6, 9)}-${numeric.slice(9)}`;
      } else if (numeric.length > 6) {
        formatado = `${numeric.slice(0, 3)}.${numeric.slice(3, 6)}.${numeric.slice(6)}`;
      } else if (numeric.length > 3) {
        formatado = `${numeric.slice(0, 3)}.${numeric.slice(3)}`;
      }
      setCpfCnpj(formatado);
    } else {
      const numeric = digits.slice(0, 14);
      let formatado = numeric;
      if (numeric.length > 12) {
        formatado = `${numeric.slice(0, 2)}.${numeric.slice(2, 5)}.${numeric.slice(5, 8)}/${numeric.slice(8, 12)}-${numeric.slice(12)}`;
      } else if (numeric.length > 8) {
        formatado = `${numeric.slice(0, 2)}.${numeric.slice(2, 5)}.${numeric.slice(5, 8)}/${numeric.slice(8)}`;
      } else if (numeric.length > 5) {
        formatado = `${numeric.slice(0, 2)}.${numeric.slice(2, 5)}.${numeric.slice(5)}`;
      } else if (numeric.length > 2) {
        formatado = `${numeric.slice(0, 2)}.${numeric.slice(2)}`;
      }
      setCpfCnpj(formatado);
    }
  };

  // Submissão do formulário de criação da subconta
  const handleCriarSubconta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setMensagemErro("");
    setMensagemSucesso("");

    const docLimpo = cpfCnpj.replace(/\D/g, "");
    if (personType === "FISICA" && docLimpo.length !== 11) {
      setMensagemErro("Informe um CPF válido com 11 dígitos.");
      return;
    }
    if (personType === "JURIDICA" && docLimpo.length !== 14) {
      setMensagemErro("Informe um CNPJ válido com 14 dígitos.");
      return;
    }

    try {
      setSubmetendo(true);
      const res = await fetch("/api/asaas/subconta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          name,
          email,
          cpfCnpj: docLimpo,
          personType,
          birthDate: personType === "FISICA" ? birthDate : undefined,
          companyType: personType === "JURIDICA" ? companyType : undefined,
          phone: phone.replace(/\D/g, ""),
          postalCode: postalCode.replace(/\D/g, ""),
          address,
          addressNumber,
          complement,
          province,
          incomeValue: Number(incomeValue) || 2000,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Falha ao criar subconta no Asaas.");
      }

      setMensagemSucesso("Subconta Asaas criada e configurada com sucesso para seus eventos!");
      setReloadKey((prev) => prev + 1);
    } catch (err: unknown) {
      console.error("Erro ao ativar conta Asaas:", err);
      const msg = err instanceof Error ? err.message : "Erro inesperado ao criar subconta no Asaas.";
      setMensagemErro(msg);
    } finally {
      setSubmetendo(false);
    }
  };

  const handleCopiarWallet = (texto?: string) => {
    if (!texto) return;
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const handleDesvincularConta = async () => {
    if (!user) return;
    const confirmou = window.confirm(
      "Deseja realmente desvincular esta subconta? Os dados da conta encerrada serão removidos do seu perfil e você poderá cadastrar uma nova subconta imediatamente."
    );
    if (!confirmou) return;

    try {
      setDesvinculando(true);
      const res = await fetch(`/api/asaas/subconta?userId=${user.uid}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        setSubconta(null);
        setMensagemSucesso("Subconta desvinculada com sucesso! Você já pode preencher os dados abaixo para cadastrar sua nova subconta.");
        setMensagemErro("");
      } else {
        setMensagemErro(data.error || "Erro ao desvincular subconta.");
      }
    } catch (err) {
      console.error("Erro ao desvincular subconta:", err);
      setMensagemErro("Não foi possível desvincular a subconta no momento.");
    } finally {
      setDesvinculando(false);
    }
  };

  const handleReenviarEmailAtivacao = async () => {
    if (!user) return;
    try {
      setReenviandoEmail(true);
      setMensagemErro("");
      setMensagemSucesso("");
      const res = await fetch("/api/asaas/subconta", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid }),
      });
      const data = await res.json();
      if (res.ok) {
        setMensagemSucesso(data.message || "Link de ativação reenviado para o seu e-mail pelo Asaas!");
      } else {
        setMensagemErro(data.error || "Não foi possível reenviar o link no momento. Verifique se o e-mail já foi ativado.");
      }
    } catch (err: any) {
      console.error("Erro ao reenviar link:", err);
      setMensagemErro(err.message || "Erro de conexão ao reenviar link.");
    } finally {
      setReenviandoEmail(false);
    }
  };

  // Funções de Gestão Pix e Transferências
  const carregarDadosPix = async () => {
    if (!user) return;
    try {
      setCarregandoChaves(true);
      setCarregandoTransferencias(true);
      const [resChaves, resTransf] = await Promise.all([
        fetch(`/api/asaas/pix/chaves?userId=${user.uid}`),
        fetch(`/api/asaas/pix/transferir?userId=${user.uid}`),
      ]);
      const dataChaves = await resChaves.json();
      const dataTransf = await resTransf.json();

      if (resChaves.ok && dataChaves.chaves) {
        setChavesPix(dataChaves.chaves);
      }
      if (resTransf.ok && dataTransf.transferencias) {
        setTransferencias(dataTransf.transferencias);
      }
    } catch (e) {
      console.warn("Aviso ao carregar dados Pix:", e);
    } finally {
      setCarregandoChaves(false);
      setCarregandoTransferencias(false);
    }
  };

  const handleCriarChavePix = async () => {
    if (!user) return;
    setErroPix("");
    setSucessoPix("");
    try {
      setCriandoChave(true);
      const res = await fetch("/api/asaas/pix/chaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, type: "EVP" }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Não foi possível cadastrar a chave Pix.");
      }
      setSucessoPix("Chave Pix aleatória (EVP) gerada com sucesso!");
      carregarDadosPix();
    } catch (e: any) {
      setErroPix(e.message || "Erro ao cadastrar chave Pix.");
    } finally {
      setCriandoChave(false);
    }
  };

  const handleRemoverChavePix = async (keyId: string) => {
    if (!user) return;
    const confirmou = window.confirm("Deseja realmente remover esta chave Pix da sua subconta?");
    if (!confirmou) return;
    setErroPix("");
    setSucessoPix("");
    try {
      setRemovendoChaveId(keyId);
      const res = await fetch(`/api/asaas/pix/chaves?userId=${user.uid}&keyId=${keyId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao remover chave Pix.");
      }
      setSucessoPix("Chave Pix removida com sucesso!");
      carregarDadosPix();
    } catch (e: any) {
      setErroPix(e.message || "Erro ao remover chave Pix.");
    } finally {
      setRemovendoChaveId(null);
    }
  };

  const handleCopiarChave = (keyId: string, valor: string) => {
    navigator.clipboard.writeText(valor);
    setChaveCopiadaId(keyId);
    setTimeout(() => setChaveCopiadaId(null), 2000);
  };

  const handleEnviarTransferenciaPix = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setErroPix("");
    setSucessoPix("");

    const valNum = parseFloat(valorPix.replace(",", "."));
    if (isNaN(valNum) || valNum <= 0) {
      setErroPix("Informe um valor válido para a transferência.");
      return;
    }

    if (!chaveDestino.trim()) {
      setErroPix("Informe a chave Pix de destino.");
      return;
    }

    const saldoDisponivel = subconta?.saldo?.balance || 0;
    if (valNum > saldoDisponivel) {
      setErroPix(`Saldo disponível insuficiente (R$ ${saldoDisponivel.toFixed(2).replace(".", ",")}).`);
      return;
    }

    const confirmou = window.confirm(
      `Confirma a transferência Pix no valor de R$ ${valNum.toFixed(2).replace(".", ",")} para a chave ${chaveDestino}?`
    );
    if (!confirmou) return;

    try {
      setEnviandoPix(true);
      const res = await fetch("/api/asaas/pix/transferir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          value: valNum,
          pixAddressKey: chaveDestino.trim(),
          pixAddressKeyType: tipoChaveDestino,
          description: descricaoPix.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Falha ao processar transferência Pix.");
      }

      setSucessoPix("Transferência Pix enviada com sucesso!");
      setValorPix("");
      setChaveDestino("");
      setDescricaoPix("");
      handleAtualizarSaldo();
      carregarDadosPix();
    } catch (e: any) {
      setErroPix(e.message || "Erro inesperado ao realizar transferência Pix.");
    } finally {
      setEnviandoPix(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
        <Loader2 className="w-9 h-9 text-blue-600 animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
          Carregando informações financeiras do Asaas...
        </p>
      </div>
    );
  }

  if (!isPromotor) {
    return (
      <div className="p-6 sm:p-8 max-w-4xl mx-auto">
        <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
          <div>
            <h3 className="font-bold text-sm">Acesso Restrito a Promotores</h3>
            <p className="text-xs mt-1 text-amber-800 dark:text-amber-300">
              A gestão de subcontas Asaas e faturamento é exclusiva para organizadores de eventos
              cadastrados na plataforma.
            </p>
            <Link
              href="/usuario/painel/dashboard"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-900 dark:text-amber-200 underline"
            >
              Voltar ao Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* HEADER DA PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-blue-900/30 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
              <Wallet className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-montserrat font-bold text-slate-900 dark:text-white">
              Financeiro & Subconta Asaas
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Recebimento direto das inscrições dos seus eventos via Pix, Cartão de Crédito e Boleto com a tecnologia Asaas White Label.
          </p>
        </div>

        {subconta && (
          <button
            type="button"
            onClick={handleAtualizarSaldo}
            disabled={recarregandoSaldo}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-blue-900/40 bg-white dark:bg-[#0c1e33] text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${recarregandoSaldo ? "animate-spin" : ""}`} />
            <span>Atualizar Saldo</span>
          </button>
        )}
      </div>

      {mensagemSucesso && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-200 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-xs font-semibold">{mensagemSucesso}</span>
        </div>
      )}

      {mensagemErro && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="text-xs font-semibold">{mensagemErro}</span>
        </div>
      )}

      {/* CASO 1: O PROMOTOR JÁ POSSUI SUBCONTA CONFIGURADA */}
      {subconta ? (
        <div className="space-y-6">
          {/* AVISO SE A CONTA FOI ENCERRADA NO ASAAS */}
          {(subconta.contaEncerrada || subconta.status === "ENCERRADA") && (
            <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 space-y-3.5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-montserrat font-bold text-sm sm:text-base text-rose-900 dark:text-rose-100">
                    Subconta Encerrada no Asaas
                  </h3>
                  <p className="text-xs text-rose-700/80 dark:text-rose-300/80">
                    Esta subconta foi cancelada ou não foi encontrada no Asaas.
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                Identificamos que a subconta vinculada a este perfil foi encerrada no Asaas. Seus eventos não conseguirão processar novos pagamentos enquanto uma subconta ativa não estiver vinculada. Clique no botão abaixo para desvincular a conta antiga e cadastrar uma nova.
              </p>

              <button
                type="button"
                onClick={handleDesvincularConta}
                disabled={desvinculando}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{desvinculando ? "Desvinculando..." : "Desvincular Conta Antiga e Configurar Nova"}</span>
              </button>
            </div>
          )}

          {/* BANNER DE STATUS CONECTADO */}
          <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-blue-900/20 via-indigo-900/20 to-blue-950/30 border border-blue-500/20 dark:border-blue-800/40 backdrop-blur-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className={`w-12 h-12 rounded-2xl ${subconta.contaEncerrada || subconta.status === "ENCERRADA" ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"} border flex items-center justify-center shrink-0`}>
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-montserrat font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                    {subconta.dadosCadastrais?.name || userData?.nome || "Subconta Promotor"}
                  </span>
                  {subconta.contaEncerrada || subconta.status === "ENCERRADA" ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      Conta Encerrada
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Conta Ativa
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex flex-wrap items-center gap-2">
                  <span>ID Asaas: <code className="text-blue-600 dark:text-blue-400 font-mono">{subconta.accountId}</code></span>
                  <span>•</span>
                  <span>Documento: <code className="font-mono">{subconta.dadosCadastrais?.cpfCnpj || userData?.documento}</code></span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
              <button
                type="button"
                onClick={handleDesvincularConta}
                disabled={desvinculando}
                className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Desvincular esta subconta do Asaas"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="text-[11px]">{desvinculando ? "Desvinculando..." : "Desvincular"}</span>
              </button>

              <button
                type="button"
                onClick={() => handleCopiarWallet(subconta.walletId)}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#071321] border border-slate-200 dark:border-blue-900/40 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:border-blue-500 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Copiar WalletId"
              >
                {copiado ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600 text-[11px]">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[11px]">Wallet ID</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* CARD DE VALIDAÇÃO DE IDENTIDADE E BIOMETRIA (KYC WHITE LABEL) */}
          {subconta.todosDocumentosAprovados ? (
            <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-montserrat font-bold text-xs sm:text-sm text-emerald-900 dark:text-emerald-100">
                    Identidade & Subconta 100% Homologadas
                  </h4>
                  <p className="text-[11px] text-emerald-700/90 dark:text-emerald-300/90 mt-0.5">
                    Biometria facial, SMS e documentos aprovados. Seus recebimentos e transferências Pix estão operando normalmente.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shrink-0">
                ● Homologada no Asaas
              </span>
            </div>
          ) : (
            <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/30 dark:border-amber-500/20 space-y-4 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-montserrat font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                        Validação de Identidade Obrigatória (SMS, Documento & Biometria)
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                        Ativação do Pix
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      Para cumprir a regulação do Banco Central e liberar transferências e Pix na subconta, conclua a validação de segurança diretamente pelo Céos (sem precisar acessar o Asaas).
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setModalValidacaoAberto(true)}
                  className="self-start md:self-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0"
                >
                  <Camera className="w-4 h-4" />
                  <span>{subconta.onboardingUrl ? "Iniciar Validação pelo Céos" : "Como Concluir a Validação"}</span>
                </button>
              </div>

              {/* AS 3 ETAPAS VISUAIS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#071321] border border-slate-200/80 dark:border-blue-900/40 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="p-1.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <Smartphone className="w-4 h-4" />
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Etapa 1</span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white mt-1">Confirmação SMS</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Código de 6 dígitos enviado para seu telefone cadastrado.
                  </p>
                </div>

                <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#071321] border border-slate-200/80 dark:border-blue-900/40 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                      <FileText className="w-4 h-4" />
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Etapa 2</span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white mt-1">Foto do Documento</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Frente e verso do seu RG ou CNH original com boa iluminação.
                  </p>
                </div>

                <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#071321] border border-slate-200/80 dark:border-blue-900/40 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="p-1.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                      <Camera className="w-4 h-4" />
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Etapa 3</span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white mt-1">Biometria Facial</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Selfie com câmera para prova de vida em tempo real.
                  </p>
                </div>
              </div>

              {/* LISTA DE SITUAÇÃO DOS DOCUMENTOS */}
              {subconta.documentos && subconta.documentos.length > 0 && (
                <div className="pt-2 border-t border-amber-500/20 dark:border-amber-500/10 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mr-1">Status da Documentação:</span>
                  {subconta.documentos.map((docItem) => {
                    const isApproved = docItem.status === "APPROVED";
                    const isAwaiting = docItem.status === "AWAITING_APPROVAL";
                    const isRejected = docItem.status === "REJECTED";
                    return (
                      <span
                        key={docItem.id}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold border ${
                          isApproved
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                            : isAwaiting
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
                            : isRejected
                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
                            : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
                        }`}
                      >
                        {isApproved ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ) : isAwaiting ? (
                          <Clock className="w-3 h-3 text-blue-600" />
                        ) : isRejected ? (
                          <XCircle className="w-3 h-3 text-rose-600" />
                        ) : (
                          <Clock className="w-3 h-3 text-amber-600" />
                        )}
                        <span>{docItem.title || docItem.type}: {isApproved ? "Aprovado" : isAwaiting ? "Em Análise" : isRejected ? "Rejeitado" : "Pendente"}</span>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SELETOR DE ABAS DO PAINEL FINANCEIRO */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-blue-900/40 pb-3">
            <button
              type="button"
              onClick={() => setAbaAtiva("visao_geral")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                abaAtiva === "visao_geral"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                  : "bg-white dark:bg-[#0c1e33] border border-slate-200 dark:border-blue-900/40 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>Visão Geral & Faturamento</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAbaAtiva("pix");
                carregarDadosPix();
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                abaAtiva === "pix"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                  : "bg-white dark:bg-[#0c1e33] border border-slate-200 dark:border-blue-900/40 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Gestão Pix & Transferências</span>
              {chavesPix.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-mono">
                  {chavesPix.length}
                </span>
              )}
            </button>
          </div>

          {abaAtiva === "visao_geral" ? (
            <div className="space-y-6">
              {/* CARDS DE SALDO & MÉTRICAS FINANCEIRAS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Saldo Disponível */}
                <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0c1e33] border border-slate-200 dark:border-blue-900/40 shadow-xs relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Saldo Disponível
                    </span>
                    <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <Coins className="w-4 h-4" />
                    </span>
                  </div>
                  <p className="mt-3 text-2xl sm:text-3xl font-montserrat font-extrabold text-slate-900 dark:text-white">
                    R$ {Number(subconta.saldo?.balance || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">Disponível para transferências imediatas</p>
                </div>

                {/* Saldo a Receber */}
                <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0c1e33] border border-slate-200 dark:border-blue-900/40 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Saldo em Processamento
                    </span>
                    <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <TrendingUp className="w-4 h-4" />
                    </span>
                  </div>
                  <p className="mt-3 text-2xl sm:text-3xl font-montserrat font-extrabold text-slate-900 dark:text-white">
                    R$ {Number(subconta.saldo?.paymentInProgressValue || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">Aguardando compensação bancária</p>
                </div>

                {/* Total Arrecadado na Plataforma */}
                <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0c1e33] border border-slate-200 dark:border-blue-900/40 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Arrecadação de Inscrições
                    </span>
                    <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                      <CreditCard className="w-4 h-4" />
                    </span>
                  </div>
                  <p className="mt-3 text-2xl sm:text-3xl font-montserrat font-extrabold text-slate-900 dark:text-white">
                    R$ {totalArrecadado.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">Soma de ingressos confirmados</p>
                </div>
              </div>

              {/* DADOS BANCÁRIOS DA CONTA ASAAS */}
              {subconta.accountNumber && (
                <div className="p-6 rounded-2xl bg-white dark:bg-[#0c1e33] border border-slate-200 dark:border-blue-900/40 shadow-xs space-y-4">
                  <div className="flex items-center gap-2">
                    <Landmark className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="font-montserrat font-bold text-sm text-slate-900 dark:text-white">
                      Dados da Conta de Recebimento Asaas
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Esta é a sua conta bancária digital exclusiva criada no Asaas. Os pagamentos realizados pelos participantes caem diretamente aqui.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#071321] border border-slate-100 dark:border-blue-900/30">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Banco</span>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">197 - Stone IP / Asaas</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#071321] border border-slate-100 dark:border-blue-900/30">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Agência</span>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">{subconta.accountNumber.agency || "0001"}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#071321] border border-slate-100 dark:border-blue-900/30">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Conta</span>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                        {subconta.accountNumber.account}-{subconta.accountNumber.accountDigit}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#071321] border border-slate-100 dark:border-blue-900/30">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Tipo</span>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">Conta Pagamento PJ/PF</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TABELA DE ARRECADAÇÃO POR EVENTO */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#0c1e33] border border-slate-200 dark:border-blue-900/40 shadow-xs space-y-4">
                <h3 className="font-montserrat font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>Recebimentos por Evento</span>
                </h3>

                {eventosFaturamento.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-[#071321] text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-blue-900/40">
                        <tr>
                          <th className="py-3 px-4">Evento</th>
                          <th className="py-3 px-4">Inscrições</th>
                          <th className="py-3 px-4 text-right">Total Recebido</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-blue-900/30">
                        {eventosFaturamento.map((ev, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-blue-950/20">
                            <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">{ev.titulo}</td>
                            <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{ev.totalInscritos} inscrições</td>
                            <td className="py-3 px-4 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                              R$ {ev.arrecadado.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-3">Nenhum evento com inscrições registradas até o momento.</p>
                )}
              </div>
            </div>
          ) : (
            /* ABA 2: GESTÃO PIX & TRANSFERÊNCIAS */
            <div className="space-y-6">
              {/* FEEDBACKS DE AÇÃO */}
              {sucessoPix && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-xs font-semibold">{sucessoPix}</span>
                  </div>
                  <button onClick={() => setSucessoPix("")} className="text-xs font-bold hover:underline cursor-pointer">Fechar</button>
                </div>
              )}

              {erroPix && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span className="text-xs font-semibold">{erroPix}</span>
                  </div>
                  <button onClick={() => setErroPix("")} className="text-xs font-bold hover:underline cursor-pointer">Fechar</button>
                </div>
              )}

              {/* ALERTA DE VALIDAÇÃO DE IDENTIDADE PARA OPERAÇÕES PIX */}
              {subconta.precisaVerificacao && (
                <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 text-amber-900 dark:text-amber-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <span className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
                      <ShieldAlert className="w-5 h-5" />
                    </span>
                    <div>
                      <h4 className="font-montserrat font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <span>Validação de Identidade Necessária para Transferências Pix</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold uppercase">
                          Exigência BACEN
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
                        Sua subconta já está apta a <strong>receber pagamentos de inscrições</strong> normalmente! Porém, para <strong>cadastrar chaves Pix</strong> e <strong>transferir saldo</strong> para sua conta pessoal, as normas bancárias exigem a verificação de identidade (selfie e foto do documento).
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalValidacaoAberto(true)}
                    className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-600/20 flex items-center gap-2 shrink-0 cursor-pointer transition-all self-start md:self-auto"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Validar Identidade (QR Code)</span>
                  </button>
                </div>
              )}

              {/* CARD DE SALDO DISPONÍVEL */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-900/25 via-indigo-900/20 to-blue-950/30 border border-blue-500/20 dark:border-blue-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Saldo Disponível para Saque Pix</span>
                  <p className="mt-1 text-2xl sm:text-3xl font-montserrat font-extrabold text-slate-900 dark:text-white">
                    R$ {Number(subconta.saldo?.balance || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Valores arrecadados disponíveis para transferir instantaneamente via Pix.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const bal = subconta.saldo?.balance || 0;
                    setValorPix(bal > 0 ? bal.toFixed(2) : "");
                    const formElem = document.getElementById("form-transferencia-pix");
                    if (formElem) formElem.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/20 flex items-center gap-2 cursor-pointer transition-all self-start sm:self-auto shrink-0"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Transferir Todo o Saldo</span>
                </button>
              </div>

              {/* GRID: MINHAS CHAVES PIX + FORMULÁRIO DE ENVIO */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* COLUNA 1: MINHAS CHAVES PIX */}
                <div className="p-6 rounded-3xl bg-white dark:bg-[#0c1e33] border border-slate-200 dark:border-blue-900/40 shadow-xs space-y-4">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-blue-900/30 pb-4">
                    <div className="flex items-center gap-2.5">
                      <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        <Key className="w-4 h-4" />
                      </span>
                      <div>
                        <h3 className="font-montserrat font-bold text-sm text-slate-900 dark:text-white">
                          Minhas Chaves Pix
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Chaves cadastradas nesta subconta
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleCriarChavePix}
                      disabled={criandoChave}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {criandoChave ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                      <span>Cadastrar Chave (EVP)</span>
                    </button>
                  </div>

                  {carregandoChaves ? (
                    <div className="py-8 flex flex-col items-center justify-center text-slate-400 text-xs">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600 mb-2" />
                      <span>Carregando chaves Pix...</span>
                    </div>
                  ) : chavesPix.length > 0 ? (
                    <div className="space-y-2.5">
                      {chavesPix.map((k: any) => (
                        <div
                          key={k.id}
                          className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#071321] border border-slate-200/80 dark:border-blue-900/40 flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 uppercase">
                                {k.type || "EVP"}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                Status: <strong className="text-emerald-500">Ativa</strong>
                              </span>
                            </div>
                            <p className="font-mono text-xs text-slate-800 dark:text-slate-200 font-semibold truncate mt-1">
                              {k.key}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleCopiarChave(k.id, k.key)}
                              className="p-2 rounded-xl bg-white dark:bg-[#0c1e33] border border-slate-200 dark:border-blue-900/40 text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors cursor-pointer"
                              title="Copiar Chave Pix"
                            >
                              {chaveCopiadaId === k.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoverChavePix(k.id)}
                              disabled={removendoChaveId === k.id}
                              className="p-2 rounded-xl bg-white dark:bg-[#0c1e33] border border-slate-200 dark:border-blue-900/40 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer disabled:opacity-50"
                              title="Excluir Chave Pix"
                            >
                              {removendoChaveId === k.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 rounded-2xl bg-slate-50 dark:bg-[#071321] border border-slate-100 dark:border-blue-900/30 text-center space-y-2">
                      <Key className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Nenhuma chave Pix cadastrada
                      </p>
                      <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                        Clique em &quot;Cadastrar Chave (EVP)&quot; acima para gerar uma chave aleatória nesta subconta.
                      </p>
                    </div>
                  )}
                </div>

                {/* COLUNA 2: FORMULÁRIO DE ENVIO PIX */}
                <div id="form-transferencia-pix" className="p-6 rounded-3xl bg-white dark:bg-[#0c1e33] border border-slate-200 dark:border-blue-900/40 shadow-xs space-y-4">
                  <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-blue-900/30 pb-4">
                    <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <Send className="w-4 h-4" />
                    </span>
                    <div>
                      <h3 className="font-montserrat font-bold text-sm text-slate-900 dark:text-white">
                        Enviar Pix (Transferência)
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Transfira para sua conta pessoal ou de fornecedor
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleEnviarTransferenciaPix} className="space-y-4">
                    {/* Tipo de Chave */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Tipo de Chave Pix do Destinatário *
                      </label>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                        {(["CPF", "CNPJ", "PHONE", "EMAIL", "EVP"] as const).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setTipoChaveDestino(t)}
                            className={`py-2 px-1 rounded-xl text-[11px] font-bold border text-center transition-all cursor-pointer ${
                              tipoChaveDestino === t
                                ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                                : "bg-slate-50 dark:bg-[#071321] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-blue-900/40 hover:border-blue-500"
                            }`}
                          >
                            {t === "PHONE" ? "Celular" : t}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Chave Destino */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Chave Pix de Destino *
                      </label>
                      <input
                        type="text"
                        required
                        value={chaveDestino}
                        onChange={(e) => setChaveDestino(e.target.value)}
                        placeholder={
                          tipoChaveDestino === "CPF"
                            ? "000.000.000-00"
                            : tipoChaveDestino === "CNPJ"
                            ? "00.000.000/0000-00"
                            : tipoChaveDestino === "PHONE"
                            ? "(99) 99999-9999"
                            : tipoChaveDestino === "EMAIL"
                            ? "destinatario@exemplo.com"
                            : "Chave aleatória EVP"
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-blue-900/50 bg-slate-50/50 dark:bg-[#071321] text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    {/* Valor e Atalho */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Valor da Transferência (R$) *
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const bal = subconta.saldo?.balance || 0;
                            setValorPix(bal > 0 ? bal.toFixed(2) : "0.00");
                          }}
                          className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                        >
                          Usar Saldo Total (R$ {Number(subconta.saldo?.balance || 0).toFixed(2).replace(".", ",")})
                        </button>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        value={valorPix}
                        onChange={(e) => setValorPix(e.target.value)}
                        placeholder="0,00"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-blue-900/50 bg-slate-50/50 dark:bg-[#071321] text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    {/* Descrição */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Descrição / Motivo (Opcional)
                      </label>
                      <input
                        type="text"
                        value={descricaoPix}
                        onChange={(e) => setDescricaoPix(e.target.value)}
                        placeholder="Ex: Resgate inscrições evento"
                        maxLength={140}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-blue-900/50 bg-slate-50/50 dark:bg-[#071321] text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={enviandoPix}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                    >
                      {enviandoPix ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Processando Envio Pix...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Confirmar Transferência Pix</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>

              {/* HISTÓRICO DE TRANSFERÊNCIAS PIX */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#0c1e33] border border-slate-200 dark:border-blue-900/40 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-blue-900/30 pb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                      <History className="w-4 h-4" />
                    </span>
                    <div>
                      <h3 className="font-montserrat font-bold text-sm text-slate-900 dark:text-white">
                        Histórico de Transferências Pix
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Envios e resgates de saldo realizados
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={carregarDadosPix}
                    disabled={carregandoTransferencias}
                    className="p-2 rounded-xl border border-slate-200 dark:border-blue-900/40 text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                    title="Atualizar Histórico"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${carregandoTransferencias ? "animate-spin" : ""}`} />
                  </button>
                </div>

                {carregandoTransferencias ? (
                  <div className="py-8 flex flex-col items-center justify-center text-slate-400 text-xs">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600 mb-2" />
                    <span>Carregando histórico...</span>
                  </div>
                ) : transferencias.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-[#071321] text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-blue-900/40">
                        <tr>
                          <th className="py-3 px-4">Destino / Chave</th>
                          <th className="py-3 px-4">Data</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Valor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-blue-900/30">
                        {transferencias.map((tr: any) => {
                          const isDone = tr.status === "DONE";
                          const isPending = tr.status === "PENDING" || tr.status === "BANK_PROCESSING";
                          const isFailed = tr.status === "CANCELLED" || tr.status === "FAILED";
                          return (
                            <tr key={tr.id} className="hover:bg-slate-50/50 dark:hover:bg-blue-950/20">
                              <td className="py-3 px-4">
                                <p className="font-semibold text-slate-800 dark:text-slate-200">
                                  {tr.bankAccount?.ownerName || tr.pixAddressKey || "Destinatário Pix"}
                                </p>
                                <p className="text-[10px] text-slate-400 font-mono">
                                  {tr.pixAddressKey || tr.id}
                                </p>
                              </td>
                              <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                                {tr.dateCreated ? new Date(tr.dateCreated).toLocaleDateString("pt-BR") : "—"}
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                    isDone
                                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                                      : isPending
                                      ? "bg-blue-500/10 text-blue-600 border-blue-500/30"
                                      : isFailed
                                      ? "bg-rose-500/10 text-rose-600 border-rose-500/30"
                                      : "bg-slate-100 text-slate-600 border-slate-200"
                                  }`}
                                >
                                  {isDone ? "Concluída" : isPending ? "Processando" : isFailed ? "Cancelada/Falha" : tr.status}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right font-extrabold text-slate-900 dark:text-white">
                                R$ {Number(tr.value || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-4 text-center">
                    Nenhuma transferência Pix realizada até o momento.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* CASO 2: O PROMOTOR AINDA NÃO TEM SUBCONTA -> ONBOARDING PROFISSIONAL */
        <div className="space-y-6">
          {/* BANNER INFORMATIVO */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#0c2340] to-[#123868] text-white border border-blue-900/50 shadow-xl relative overflow-hidden">
            <div className="max-w-2xl space-y-3 relative z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-200 border border-blue-400/30">
                <SparklesIcon className="w-3.5 h-3.5" />
                <span>Integração Asaas White Label</span>
              </span>
              <h2 className="text-xl sm:text-2xl font-montserrat font-extrabold leading-tight">
                Ative sua Conta de Recebimentos Asaas
              </h2>
              <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
                Para disponibilizar pagamentos via <strong>Pix com QR Code imediato, Cartão de Crédito e Boleto Bancário</strong> nos seus eventos, configure sua subconta no Asaas. Os valores pagos pelos congressistas caem diretamente para você.
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-blue-200 font-medium">
                <span className="flex items-center gap-1.5">✓ Pagamento Pix em tempo real</span>
                <span className="flex items-center gap-1.5">✓ Checkout integrado e seguro</span>
                <span className="flex items-center gap-1.5">✓ Sem burocracia de maquininha</span>
              </div>
            </div>
          </div>

          {/* FORMULÁRIO DE ONBOARDING */}
          <form
            onSubmit={handleCriarSubconta}
            className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0c1e33] border border-slate-200 dark:border-blue-900/40 shadow-sm space-y-6"
          >
            <div>
              <h3 className="font-montserrat font-bold text-base text-slate-900 dark:text-white">
                Cadastro de Conta do Promotor
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Preencha os dados cadastrais conforme seus registros na Receita Federal para homologação da sua conta no Asaas.
              </p>
            </div>

            {/* SELETOR: PESSOA FÍSICA OU JURÍDICA */}
            <div className="grid grid-cols-2 gap-3 max-w-md">
              <button
                type="button"
                onClick={() => {
                  setPersonType("FISICA");
                  setCpfCnpj("");
                }}
                className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  personType === "FISICA"
                    ? "bg-blue-600 text-white border-blue-600 shadow-md"
                    : "bg-slate-50 dark:bg-[#071321] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-blue-900/40 hover:border-blue-500"
                }`}
              >
                <User className="w-4 h-4" />
                <span>Pessoa Física (CPF)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPersonType("JURIDICA");
                  setCpfCnpj("");
                }}
                className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  personType === "JURIDICA"
                    ? "bg-blue-600 text-white border-blue-600 shadow-md"
                    : "bg-slate-50 dark:bg-[#071321] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-blue-900/40 hover:border-blue-500"
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Pessoa Jurídica (CNPJ)</span>
              </button>
            </div>

            {/* DADOS BÁSICOS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {personType === "FISICA" ? "Nome Completo *" : "Razão Social / Nome Fantasia *"}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={personType === "FISICA" ? "Seu nome civil" : "Nome da empresa ou associação"}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-blue-900/50 bg-slate-50/50 dark:bg-[#071321] text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  E-mail Financeiro / Notificações *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="financeiro@exemplo.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-blue-900/50 bg-slate-50/50 dark:bg-[#071321] text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {personType === "FISICA" ? "CPF *" : "CNPJ *"}
                </label>
                <input
                  type="text"
                  required
                  value={cpfCnpj}
                  onChange={(e) => handleCpfCnpjChange(e.target.value)}
                  placeholder={personType === "FISICA" ? "000.000.000-00" : "00.000.000/0000-00"}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-blue-900/50 bg-slate-50/50 dark:bg-[#071321] text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                />
              </div>

              {personType === "FISICA" ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Data de Nascimento * (Exigido pelo Asaas)
                  </label>
                  <input
                    type="date"
                    required
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-blue-900/50 bg-slate-50/50 dark:bg-[#071321] text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Tipo de Empresa *
                  </label>
                  <select
                    value={companyType}
                    onChange={(e) => setCompanyType(e.target.value as "MEI" | "LIMITED" | "INDIVIDUAL" | "ASSOCIATION")}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-blue-900/50 bg-slate-50/50 dark:bg-[#071321] text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="MEI">MEI - Microempreendedor Individual</option>
                    <option value="LIMITED">LTDA - Sociedade Limitada</option>
                    <option value="INDIVIDUAL">Empresário Individual</option>
                    <option value="ASSOCIATION">Associação / Fundação / Sem fins lucrativos</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Telefone / WhatsApp *
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(99) 99999-9999"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-blue-900/50 bg-slate-50/50 dark:bg-[#071321] text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Renda Mensal ou Faturamento Estimado (R$) *
                </label>
                <input
                  type="number"
                  required
                  min="500"
                  value={incomeValue}
                  onChange={(e) => setIncomeValue(e.target.value)}
                  placeholder="5000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-blue-900/50 bg-slate-50/50 dark:bg-[#071321] text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* ENDEREÇO */}
            <div className="pt-2 border-t border-slate-100 dark:border-blue-900/30">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Endereço de Faturamento
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    CEP *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={postalCode}
                      onChange={(e) => handleCepChange(e.target.value)}
                      placeholder="00000-000"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-blue-900/50 bg-slate-50/50 dark:bg-[#071321] text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    {buscandoCep && (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-500 absolute right-3 top-3" />
                    )}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Logradouro / Rua / Avenida *
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Av. Paulista"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-blue-900/50 bg-slate-50/50 dark:bg-[#071321] text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Número *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressNumber}
                    onChange={(e) => setAddressNumber(e.target.value)}
                    placeholder="123"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-blue-900/50 bg-slate-50/50 dark:bg-[#071321] text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Complemento
                  </label>
                  <input
                    type="text"
                    value={complement}
                    onChange={(e) => setComplement(e.target.value)}
                    placeholder="Sala 10, Bloco B (opcional)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-blue-900/50 bg-slate-50/50 dark:bg-[#071321] text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Bairro *
                  </label>
                  <input
                    type="text"
                    required
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    placeholder="Centro"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-blue-900/50 bg-slate-50/50 dark:bg-[#071321] text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    placeholder="Cidade"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-blue-900/50 bg-slate-50/50 dark:bg-[#071321] text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Estado (UF)
                  </label>
                  <input
                    type="text"
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                    placeholder="UF"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-blue-900/50 bg-slate-50/50 dark:bg-[#071321] text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none uppercase"
                  />
                </div>
              </div>
            </div>

            {/* AVISO DE CONFIANÇA */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#071321] border border-slate-200 dark:border-blue-900/40 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <span>
                Seus dados serão processados de ponta a ponta com criptografia diretamente pelos servidores autorizados do Banco Asaas. Ao criar sua conta, você concorda com as diretrizes e regras operacionais do sistema.
              </span>
            </div>

            {/* BOTÃO DE ATIVAÇÃO */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submetendo}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submetendo ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Conectando com o Asaas...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Criar Minha Subconta no Asaas</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL DE VALIDAÇÃO DE IDENTIDADE (KYC WHITE LABEL) */}
      {modalValidacaoAberto && subconta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0c1e33] border border-slate-200 dark:border-blue-900/50 rounded-3xl shadow-2xl max-w-xl w-full p-6 space-y-6 relative overflow-hidden">
            {/* Header do Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-blue-900/30">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
                  <Camera className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-montserrat font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                    Validação de Identidade Céos & Asaas
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Confirmação SMS, Foto do Documento e Biometria Facial
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalValidacaoAberto(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-blue-950/40 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* CONTEÚDO DO MODAL DE VALIDAÇÃO (SEMPRE COM QR CODE) */}
            {(() => {
              const urlValidacao = subconta.onboardingUrl || "https://www.asaas.com/login";
              const temOnboardingDireto = Boolean(subconta.onboardingUrl);

              return (
                <div className="space-y-4">
                  {/* STATUS DOS DOCUMENTOS PENDENTES */}
                  {subconta.documentos && subconta.documentos.length > 0 && (
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#071321] border border-slate-200 dark:border-blue-900/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span>Documentos Solicitados pelo Asaas:</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Conta: {subconta.accountId?.slice(0, 8)}...
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {subconta.documentos.map((d: any) => (
                          <div
                            key={d.id}
                            className="p-2.5 rounded-xl bg-white dark:bg-[#0c1e33] border border-slate-200/80 dark:border-blue-900/30 flex items-center justify-between gap-2"
                          >
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                              {d.title || d.type}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                d.status === "APPROVED"
                                  ? "bg-emerald-500/10 text-emerald-600"
                                  : d.status === "AWAITING_APPROVAL"
                                  ? "bg-blue-500/10 text-blue-600"
                                  : "bg-amber-500/10 text-amber-600"
                              }`}
                            >
                              {d.status === "APPROVED"
                                ? "Aprovado"
                                : d.status === "AWAITING_APPROVAL"
                                ? "Em Análise"
                                : "Pendente"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CARD CENTRAL DO QR CODE */}
                  <div className="p-5 rounded-3xl bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-purple-500/10 border border-blue-500/20 text-center space-y-3.5">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-600 text-white shadow-xs">
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Aponte a Câmera do Celular</span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto leading-relaxed">
                      Escaneie o QR Code abaixo com seu smartphone para abrir o fluxo de validação biométrica e fotos do documento com máxima nitidez da câmera.
                    </p>

                    {/* QR CODE GERADO */}
                    <div className="flex justify-center py-1">
                      <div className="p-3 bg-white rounded-3xl shadow-lg border border-slate-200 dark:border-white/20">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&data=${encodeURIComponent(
                            urlValidacao
                          )}`}
                          alt="QR Code para validação biométrica facial"
                          className="w-[190px] h-[190px] rounded-xl"
                        />
                      </div>
                    </div>

                    {/* BOTÕES DE AÇÃO DO QR CODE */}
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(urlValidacao);
                          setLinkCopiado(true);
                          setTimeout(() => setLinkCopiado(false), 2000);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#071321] border border-slate-200 dark:border-blue-900/40 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-blue-500 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        {linkCopiado ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-emerald-600 text-[11px]">Link Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-[11px]">Copiar Link</span>
                          </>
                        )}
                      </button>

                      <a
                        href={urlValidacao}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                      >
                        <span>Abrir no Navegador</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* PASSO A PASSO EXPLICATIVO */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#071321] border border-slate-200 dark:border-blue-900/40 text-xs text-slate-600 dark:text-slate-300 space-y-2">
                    <h5 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Instruções para Conclusão Rápida:</span>
                    </h5>
                    <div className="text-[11px] space-y-1.5 pl-1 leading-relaxed">
                      <p>
                        <strong>1. Escaneie o QR Code</strong> com a câmera do seu smartphone (ou abra o app <strong>Asaas</strong>).
                      </p>
                      <p>
                        <strong>2. Acesse com seu e-mail cadastrado:</strong>{" "}
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                          {subconta.dadosCadastrais?.email || userData?.email || "gabriel2026diasss@gmail.com"}
                        </span>
                      </p>
                      <p>
                        <strong>3. Tire a foto da sua CNH ou RG</strong> (frente e verso) e faça a <strong>selfie facial</strong> em local bem iluminado.
                      </p>
                      <p className="text-slate-400">
                        ⚡ Em até 5 minutos após o envio, a inteligência artificial do Asaas aprova a identidade e libera o Pix no Céos.
                      </p>
                    </div>
                  </div>

                  {/* NOTA SOBRE E-MAIL E BAAS */}
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                    💡 <strong>Não precisa esperar e-mail:</strong> Como este e-mail já possui cadastro ativo no Asaas, o Asaas não reenvia e-mail de primeiro acesso. A validação é feita diretamente escaneando o QR Code acima ou pelo aplicativo Asaas no seu smartphone.
                  </div>
                </div>
              );
            })()}

            {/* Footer com ação de atualização */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 dark:border-blue-900/30">
              <span className="text-[11px] text-slate-400 text-center sm:text-left">
                Após concluir a foto e biometria, clique para atualizar:
              </span>
              <button
                type="button"
                onClick={() => {
                  handleAtualizarSaldo();
                  setModalValidacaoAberto(false);
                }}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Já enviei! Atualizar Status</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  );
}
