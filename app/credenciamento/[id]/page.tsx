"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";
import {
  QrCode,
  Search,
  CheckCircle2,
  Clock,
  Users,
  UserCheck,
  AlertCircle,
  X,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Download,
  Calendar,
  MapPin,
  Loader2,
  Laptop,
  Smartphone,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Filter,
  Printer,
  Copy,
  Check,
  ShieldAlert,
  Lock,
} from "lucide-react";

interface ParticipanteCredenciamento {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  lote: string;
  codigoIngresso: string;
  status: "Confirmada" | "Pendente" | "Cancelada";
  invoiceUrl?: string;
  credenciado: boolean;
  credenciadoEm?: string | null;
  credenciadoPor?: string | null;
  raw?: any;
}

// Síntese de som via Web Audio API (sem dependência de arquivos de áudio externos)
function playBeep(type: "success" | "warning" | "error") {
  try {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === "success") {
      // Tom duplo agradável (E5 -> A5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(659.25, ctx.currentTime);
      gain1.gain.setValueAtTime(0.15, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.18);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
      gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.12);
      osc2.stop(ctx.currentTime + 0.35);
    } else if (type === "warning") {
      // Tom de alerta duplo curto
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(370, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.28);
    } else {
      // Tom de erro grave
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch (e) {
    console.warn("Áudio não pôde ser reproduzido:", e);
  }
}

export default function CredenciamentoPage() {
  const params = useParams();
  const router = useRouter();
  const eventoId = (params?.id as string) || "";

  const { user, userData, loading: loadingAuth } = useAuth();

  // Estados do Evento e Participantes
  const [evento, setEvento] = useState<any | null>(null);
  const [loadingEvento, setLoadingEvento] = useState(true);
  const [participantes, setParticipantes] = useState<ParticipanteCredenciamento[]>([]);
  const [loadingInscritos, setLoadingInscritos] = useState(true);

  // Verificação de Autorização: Apenas Dono do Evento ou Administrador da Plataforma
  const isAdmin = Boolean(
    userData?.isAdmin ||
    userData?.role === "admin" ||
    userData?.role === "dono" ||
    userData?.role === "administrador" ||
    userData?.tipoUsuario === "admin" ||
    userData?.tipo_usuario === "admin"
  );

  const isDono = Boolean(
    user &&
    evento &&
    (
      (evento.userId && user.uid === evento.userId) ||
      (evento.promotorEmail && user.email && user.email.toLowerCase() === evento.promotorEmail.toLowerCase()) ||
      (evento.userEmail && user.email && user.email.toLowerCase() === evento.userEmail.toLowerCase()) ||
      (evento.criadoPor && user.uid === evento.criadoPor)
    )
  );

  const temPermissao = isDono || isAdmin;

  // Modo: "recepcao" (staff com monitor/laptop) vs "totem" (virado para o participante)
  const [modo, setModo] = useState<"recepcao" | "totem">("recepcao");

  // Filtros da Recepção: "aptos" (Inscrições Ativas/Pagas que aguardam credenciamento), "credenciados", "pagamento_pendente", "todos"
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroAba, setFiltroAba] = useState<"aptos" | "credenciados" | "pagamento_pendente" | "todos">("aptos");
  const [filtroLote, setFiltroLote] = useState("Todos");

  // Campo de Check-in Rápido
  const [inputCheckin, setInputCheckin] = useState("");
  const [processandoCheckin, setProcessandoCheckin] = useState(false);
  const [mensagemFeedback, setMensagemFeedback] = useState<{
    tipo: "sucesso" | "alerta" | "erro";
    texto: string;
  } | null>(null);

  // Pop-up ao vivo de último credenciamento (em destaque na tela da recepção)
  const [ultimoCredenciado, setUltimoCredenciado] = useState<ParticipanteCredenciamento | null>(null);

  // Modal com QR Code grande para o totem/banner
  const [modalQrTotemAberto, setModalQrTotemAberto] = useState(false);

  // Configurações da Recepção
  const [somHabilitado, setSomHabilitado] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // 1. Carrega dados básicos do evento
  useEffect(() => {
    if (!eventoId) return;

    const carregarEvento = async () => {
      try {
        setLoadingEvento(true);
        const evSnap = await getDoc(doc(db, "events", eventoId));
        if (evSnap.exists()) {
          setEvento({ id: evSnap.id, ...evSnap.data() });
        } else {
          setEvento(null);
        }
      } catch (err) {
        console.error("Erro ao carregar evento para credenciamento:", err);
      } finally {
        setLoadingEvento(false);
      }
    };

    carregarEvento();
  }, [eventoId]);

  // 2. Listener em tempo real (onSnapshot) nas inscrições do evento
  useEffect(() => {
    // Segurança: Somente inicia a escuta e carrega a lista se o usuário tiver permissão comprovada
    if (!eventoId || !temPermissao) return;

    setLoadingInscritos(true);

    // Queries suportando variações de chave de evento (eventoId, evento_id)
    const q1 = query(collection(db, "inscricoes"), where("eventoId", "==", eventoId));
    const q2 = query(collection(db, "inscricoes"), where("evento_id", "==", eventoId));

    const inscricoesMap = new Map<string, any>();

    const normalizarDoc = (d: any): ParticipanteCredenciamento => {
      const data = d.data();
      const rawStatus = (data.status || data.statusNormalizado || data.payment_status || "").toLowerCase().trim();

      const isCancelado =
        rawStatus === "cancelada" ||
        rawStatus === "cancelado" ||
        rawStatus === "reembolsado" ||
        rawStatus === "deleted";

      const isConfirmado =
        !isCancelado &&
        (rawStatus === "confirmado" ||
          rawStatus === "confirmada" ||
          rawStatus === "pago" ||
          rawStatus === "received" ||
          rawStatus === "confirmed" ||
          rawStatus === "aprovado" ||
          rawStatus === "approved" ||
          rawStatus === "gratuito" ||
          rawStatus === "isento" ||
          rawStatus === "active" ||
          (rawStatus === "" && (data.valor === 0 || data.valorTotal === 0 || data.gratuito === true)));

      const statusNormalizado: "Confirmada" | "Pendente" | "Cancelada" = isCancelado
        ? "Cancelada"
        : isConfirmado
        ? "Confirmada"
        : "Pendente";

      const invoiceUrl =
        data.asaasInvoiceUrl ||
        data.invoiceUrl ||
        data.checkoutUrl ||
        data.bankInvoiceUrl ||
        "";

      return {
        id: d.id,
        nome: data.nome || data.userName || data.participanteNome || "Congressista",
        email: data.email || data.userEmail || "Sem e-mail",
        cpf: data.cpf || data.userCpf || "",
        lote: data.lote || data.perfil_tipo_participante || data.categoria || "Geral",
        codigoIngresso: String(data.codigoIngresso || data.ticket_id || d.id),
        status: statusNormalizado,
        invoiceUrl,
        credenciado: Boolean(data.credenciado || data.checkinRealizado),
        credenciadoEm: data.credenciadoEm || null,
        credenciadoPor: data.credenciadoPor || null,
        raw: data,
      };
    };

    const processarDocs = () => {
      const lista: ParticipanteCredenciamento[] = Array.from(inscricoesMap.values());
      // Ordena: primeiro os que acabaram de ser credenciados, depois por nome
      lista.sort((a, b) => {
        if (a.credenciado && b.credenciado) {
          const tA = a.credenciadoEm ? new Date(a.credenciadoEm).getTime() : 0;
          const tB = b.credenciadoEm ? new Date(b.credenciadoEm).getTime() : 0;
          return tB - tA;
        }
        if (a.credenciado) return -1;
        if (b.credenciado) return 1;
        return a.nome.localeCompare(b.nome);
      });
      setParticipantes(lista);
      setLoadingInscritos(false);
    };

    const unsub1 = onSnapshot(
      q1,
      (snap) => {
        snap.docs.forEach((d) => inscricoesMap.set(d.id, normalizarDoc(d)));
        processarDocs();
      },
      (err) => console.warn("Erro no listener de inscrições (q1):", err)
    );

    const unsub2 = onSnapshot(
      q2,
      (snap) => {
        snap.docs.forEach((d) => {
          if (!inscricoesMap.has(d.id)) {
            inscricoesMap.set(d.id, normalizarDoc(d));
          }
        });
        processarDocs();
      },
      (err) => console.warn("Erro no listener de inscrições (q2):", err)
    );

    return () => {
      unsub1();
      unsub2();
    };
  }, [eventoId, temPermissao]);

  // Foco automático no input de check-in para leitura de QR Code / código de barras
  useEffect(() => {
    if (modo === "recepcao" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [modo]);

  // Métricas de Presença e Inscrições
  const metricas = useMemo(() => {
    const totalInscritos = participantes.length;
    const confirmados = participantes.filter((p) => p.status === "Confirmada");
    const credenciados = participantes.filter((p) => p.credenciado).length;
    // Aguardando credenciamento: APENAS quem está com a inscrição confirmada/paga e ainda não credenciou
    const aguardandoCredenciamento = confirmados.filter((p) => !p.credenciado).length;
    // Pagamento pendente: inscritos cujo pagamento ainda não foi confirmado
    const pagamentoPendente = participantes.filter((p) => p.status === "Pendente").length;

    // Taxa de presença calculada sobre o total de aptos/confirmados
    const totalAptos = confirmados.length;
    const porcentagem =
      totalAptos > 0 ? Math.round((credenciados / totalAptos) * 100) : 0;

    return {
      totalInscritos,
      totalAptos,
      credenciados,
      aguardandoCredenciamento,
      pagamentoPendente,
      porcentagem,
    };
  }, [participantes]);

  // Lotes disponíveis para filtro
  const lotesDisponiveis = useMemo(() => {
    const set = new Set<string>();
    participantes.forEach((p) => {
      if (p.lote) set.add(p.lote);
    });
    return Array.from(set);
  }, [participantes]);

  // Filtragem da tabela
  const participantesFiltrados = useMemo(() => {
    return participantes.filter((p) => {
      // Filtro da aba
      if (filtroAba === "aptos") {
        // A lista de credenciamento exibe APENAS inscrições ativas/pagas que ainda não foram credenciadas
        // As inscrições pendentes NÃO aparecem nesta lista!
        if (p.status !== "Confirmada" || p.credenciado) return false;
      } else if (filtroAba === "credenciados") {
        if (!p.credenciado) return false;
      } else if (filtroAba === "pagamento_pendente") {
        // Aba separada exclusivamente para inscrições com pagamento pendente
        if (p.status !== "Pendente") return false;
      }

      // Filtro de Lote
      if (filtroLote !== "Todos" && p.lote !== filtroLote) return false;

      // Busca por Nome, CPF ou Código
      const termo = searchTerm.trim().toLowerCase();
      if (!termo) return true;

      const termoLimpo = termo.replace(/\D/g, "");
      const cpfLimpo = (p.cpf || "").replace(/\D/g, "");

      const matchesNome = p.nome.toLowerCase().includes(termo);
      const matchesEmail = p.email.toLowerCase().includes(termo);
      const matchesCodigo = p.codigoIngresso.toLowerCase().includes(termo);
      const matchesCpf =
        p.cpf.toLowerCase().includes(termo) ||
        (termoLimpo.length >= 3 && cpfLimpo.includes(termoLimpo));

      return matchesNome || matchesEmail || matchesCodigo || matchesCpf;
    });
  }, [participantes, filtroAba, filtroLote, searchTerm]);

  // Executa o credenciamento de um participante
  const efetivarCredenciamento = async (
    participante: ParticipanteCredenciamento,
    origem: "manual" | "leitor" | "totem" = "manual"
  ) => {
    // 1. Bloqueio: Não credenciar quem está com pagamento pendente
    if (participante.status === "Pendente") {
      if (somHabilitado) playBeep("warning");
      setMensagemFeedback({
        tipo: "alerta",
        texto: `⚠️ BLOQUEADO: "${participante.nome}" está com a inscrição PENDENTE DE PAGAMENTO. Regularize o pagamento na recepção antes de liberar o credenciamento!`,
      });
      setFiltroAba("pagamento_pendente");
      setSearchTerm(participante.nome);
      return;
    }

    if (participante.credenciado) {
      if (somHabilitado) playBeep("warning");
      setMensagemFeedback({
        tipo: "alerta",
        texto: `${participante.nome} já foi credenciado anteriormente (${
          participante.credenciadoEm
            ? new Date(participante.credenciadoEm).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "horário não registrado"
        })!`,
      });
      return;
    }

    try {
      setProcessandoCheckin(true);

      const agora = new Date().toISOString();
      const responsavel =
        user?.displayName || user?.email || (origem === "totem" ? "Autoatendimento" : "Recepção");

      await updateDoc(doc(db, "inscricoes", participante.id), {
        credenciado: true,
        checkinRealizado: true,
        credenciadoEm: agora,
        credenciadoPor: responsavel,
      });

      const credenciadoAtualizado: ParticipanteCredenciamento = {
        ...participante,
        credenciado: true,
        credenciadoEm: agora,
        credenciadoPor: responsavel,
      };

      // Dispara Pop-up em tempo real
      setUltimoCredenciado(credenciadoAtualizado);
      if (somHabilitado) playBeep("success");

      setMensagemFeedback({
        tipo: "sucesso",
        texto: `Check-in confirmado para ${participante.nome} (${participante.lote})!`,
      });

      // Limpa input
      setInputCheckin("");
      if (inputRef.current) inputRef.current.focus();

      // Auto-dismiss do popup após 5 segundos
      setTimeout(() => {
        setUltimoCredenciado((curr) => (curr?.id === participante.id ? null : curr));
      }, 5000);
    } catch (err) {
      console.error("Erro ao registrar check-in:", err);
      if (somHabilitado) playBeep("error");
      setMensagemFeedback({
        tipo: "erro",
        texto: "Erro ao salvar credenciamento no banco de dados. Tente novamente.",
      });
    } finally {
      setProcessandoCheckin(false);
    }
  };

  // Desfazer check-in (em caso de clique por engano)
  const handleDesfazerCredenciamento = async (participante: ParticipanteCredenciamento) => {
    const confirmou = window.confirm(
      `Deseja realmente desfazer o credenciamento de "${participante.nome}"?`
    );
    if (!confirmou) return;

    try {
      await updateDoc(doc(db, "inscricoes", participante.id), {
        credenciado: false,
        checkinRealizado: false,
        credenciadoEm: null,
        credenciadoPor: null,
      });

      if (somHabilitado) playBeep("warning");
      setMensagemFeedback({
        tipo: "alerta",
        texto: `Check-in de ${participante.nome} foi desfeito.`,
      });
    } catch (err) {
      console.error("Erro ao desfazer check-in:", err);
      alert("Erro ao desfazer credenciamento.");
    }
  };

  // Busca rápida por código digitado ou lido pelo leitor de QR Code
  const handleFormCheckinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const termo = inputCheckin.trim();
    if (!termo) return;

    const termoLimpo = termo.replace(/\D/g, "");

    // Busca exata por código de ingresso ou CPF
    const match = participantes.find((p) => {
      const matchCodigo = p.codigoIngresso.toUpperCase() === termo.toUpperCase();
      const matchCpf =
        termoLimpo.length >= 8 && (p.cpf || "").replace(/\D/g, "") === termoLimpo;
      return matchCodigo || matchCpf;
    });

    if (match) {
      if (match.status === "Pendente") {
        if (somHabilitado) playBeep("warning");
        setMensagemFeedback({
          tipo: "alerta",
          texto: `⚠️ A inscrição de "${match.nome}" está com PAGAMENTO PENDENTE! Não pode ser credenciada até a regularização do pagamento.`,
        });
        setFiltroAba("pagamento_pendente");
        setSearchTerm(match.nome);
        return;
      }
      efetivarCredenciamento(match, "leitor");
    } else {
      // Se não achou exato, tenta achar um único nome
      const matchesNome = participantes.filter((p) =>
        p.nome.toLowerCase().includes(termo.toLowerCase())
      );
      if (matchesNome.length === 1) {
        const unico = matchesNome[0];
        if (unico.status === "Pendente") {
          if (somHabilitado) playBeep("warning");
          setMensagemFeedback({
            tipo: "alerta",
            texto: `⚠️ A inscrição de "${unico.nome}" está com PAGAMENTO PENDENTE! Regularize o pagamento na recepção antes de liberar o credenciamento.`,
          });
          setFiltroAba("pagamento_pendente");
          setSearchTerm(unico.nome);
          return;
        }
        efetivarCredenciamento(unico, "manual");
      } else if (matchesNome.length > 1) {
        setSearchTerm(termo);
        setMensagemFeedback({
          tipo: "alerta",
          texto: `Mais de um participante encontrado com "${termo}". Selecione na lista abaixo.`,
        });
      } else {
        if (somHabilitado) playBeep("error");
        setMensagemFeedback({
          tipo: "erro",
          texto: `Nenhuma inscrição encontrada para o código ou CPF "${termo}".`,
        });
      }
    }
  };

  // Alterna tela cheia
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Exportar lista de presença para CSV
  const exportarCSV = () => {
    if (participantes.length === 0) return;

    const colunas = [
      "Nome",
      "E-mail",
      "CPF",
      "Lote / Categoria",
      "Código Ingresso",
      "Status Inscrição",
      "Credenciado",
      "Data/Hora Check-in",
      "Responsável Check-in",
    ];

    const linhas = participantes.map((p) => [
      `"${p.nome.replace(/"/g, '""')}"`,
      `"${p.email.replace(/"/g, '""')}"`,
      `"${p.cpf}"`,
      `"${p.lote.replace(/"/g, '""')}"`,
      `"${p.codigoIngresso}"`,
      `"${p.status}"`,
      p.credenciado ? "SIM" : "NÃO",
      p.credenciadoEm
        ? `"${new Date(p.credenciadoEm).toLocaleString("pt-BR")}"`
        : '""',
      `"${p.credenciadoPor || ""}"`,
    ]);

    const csvContent =
      "\uFEFF" +
      [colunas.join(";"), ...linhas.map((l) => l.join(";"))].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `presenca_${evento?.title ? evento.title.replace(/\s+/g, "_") : "evento"}_${new Date()
        .toISOString()
        .slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // URL exclusiva do autoatendimento (Check-in rápido sem expor dados) para o QR Code do banner/totem
  // Esta URL é única, estática e PERMANENTE vinculada ao ID do evento (NUNCA expira nem muda)
  const urlAutoatendimento = typeof window !== "undefined"
    ? `${window.location.origin}/checkin/${eventoId}`
    : "";

  const [copiadoLink, setCopiadoLink] = useState(false);
  const handleCopiarLink = () => {
    if (!urlAutoatendimento) return;
    navigator.clipboard.writeText(urlAutoatendimento);
    setCopiadoLink(true);
    setTimeout(() => setCopiadoLink(false), 2500);
  };

  const handleImprimirQrCode = () => {
    const janelaPrint = window.open("", "_blank");
    if (!janelaPrint) return;
    janelaPrint.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code Portaria - ${evento?.title || "Evento"}</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 90vh;
              text-align: center;
              padding: 24px;
              color: #0f172a;
            }
            h1 { font-size: 26px; font-weight: 800; margin: 0 0 6px 0; max-width: 600px; }
            h2 { font-size: 15px; font-weight: 700; color: #059669; letter-spacing: 1px; text-transform: uppercase; margin: 0 0 20px 0; }
            .box {
              border: 3px solid #0f172a;
              padding: 20px;
              border-radius: 24px;
              display: inline-block;
              margin: 10px 0;
            }
            img { width: 300px; height: 300px; display: block; }
            .instrucao {
              font-size: 16px;
              font-weight: 700;
              margin: 16px 0 4px 0;
            }
            .sub {
              font-size: 13px;
              color: #64748b;
              margin: 0;
            }
            .link {
              font-family: monospace;
              font-size: 11px;
              color: #94a3b8;
              margin-top: 14px;
            }
          </style>
        </head>
        <body>
          <h1>${evento?.title || "Evento"}</h1>
          <h2>AUTO-CREDENCIAMENTO / CHECK-IN</h2>
          <div class="box">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(urlAutoatendimento)}" alt="QR Code de Entrada" />
          </div>
          <p class="instrucao">Aponte a câmera do seu celular para confirmar presença</p>
          <p class="sub">Tenha em mãos o seu Código da Inscrição (ex: CEOS-XXXXXX) ou CPF</p>
          <p class="link">${urlAutoatendimento}</p>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    janelaPrint.document.close();
  };

  // 1. Estado de Carregamento (Auth e Evento)
  if (loadingAuth || loadingEvento) {
    return (
      <div className="min-h-screen bg-[#070b12] text-white flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        <p className="text-sm text-slate-400">Verificando autorização de acesso ao credenciamento...</p>
      </div>
    );
  }

  // 2. Bloqueio: Usuário não logado
  if (!user) {
    return (
      <div className="min-h-screen bg-[#070b12] text-white flex flex-col items-center justify-center p-6 text-center space-y-5 animate-in fade-in">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/10">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Acesso Restrito
          </span>
          <h1 className="text-2xl font-black text-white">Identificação Necessária</h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            O painel de credenciamento e lista de presença é restrito aos <strong>organizadores</strong> e <strong>administradores</strong>. Faça login com sua conta para continuar.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <Link
            href={`/login?redirect=/credenciamento/${eventoId}`}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            <span>Fazer Login</span>
          </Link>
          <Link
            href={`/checkin/${eventoId}`}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 flex items-center justify-center gap-2"
          >
            <QrCode className="w-4 h-4 text-emerald-400" />
            <span>Sou Participante (Check-in)</span>
          </Link>
        </div>
      </div>
    );
  }

  // 3. Evento não encontrado
  if (!evento) {
    return (
      <div className="min-h-screen bg-[#070b12] text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-rose-950/60 border border-rose-800/60 text-rose-400 flex items-center justify-center">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold">Evento Não Localizado</h1>
        <p className="text-sm text-slate-400 max-w-md">
          Não encontramos o evento especificado no banco de dados. Verifique o link e tente novamente.
        </p>
        <Link
          href="/usuario/painel/meus-eventos"
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all"
        >
          Voltar aos Meus Eventos
        </Link>
      </div>
    );
  }

  // 4. Bloqueio: Usuário logado mas NÃO é o promotor/dono do evento nem administrador
  if (!temPermissao) {
    return (
      <div className="min-h-screen bg-[#070b12] text-white flex flex-col items-center justify-center p-6 text-center space-y-5 animate-in fade-in">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/10">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            Acesso Não Autorizado
          </span>
          <h1 className="text-2xl font-black text-white">Permissão Insuficiente</h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            Você está conectado como <strong className="text-white">{user.email}</strong>, porém esta conta não é a proprietária deste evento e não possui privilégios administrativos.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <Link
            href={`/checkin/${eventoId}`}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
          >
            <QrCode className="w-4 h-4" />
            <span>Ir para o Check-in do Participante</span>
          </Link>
          <Link
            href="/usuario/painel/meus-eventos"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all border border-slate-700 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar aos Meus Eventos</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b12] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* ============================================================== */}
      {/* POP-UP / ALERTA AO VIVO EM TEMPO REAL                          */}
      {/* ============================================================== */}
      {ultimoCredenciado && (
        <div className="fixed top-5 right-5 z-50 max-w-sm w-full animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-2xl shadow-emerald-950/50 border border-emerald-400/40 flex items-start gap-3 relative">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div className="space-y-0.5 flex-1 min-w-0 pr-6">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-100 tracking-wider uppercase">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                <span>Credenciamento Confirmado!</span>
              </div>
              <h4 className="font-extrabold text-sm sm:text-base leading-tight truncate">
                {ultimoCredenciado.nome}
              </h4>
              <p className="text-xs text-emerald-100 truncate">
                {ultimoCredenciado.lote} • {ultimoCredenciado.codigoIngresso}
              </p>
              <p className="text-[10px] text-emerald-200/90 pt-0.5">
                Entrada registrada às{" "}
                {ultimoCredenciado.credenciadoEm
                  ? new Date(ultimoCredenciado.credenciadoEm).toLocaleTimeString("pt-BR")
                  : "agora"}
              </p>
            </div>
            <button
              onClick={() => setUltimoCredenciado(null)}
              className="absolute top-3 right-3 text-white/70 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* HEADER EXCLUSIVO DO SISTEMA DE CREDENCIAMENTO                  */}
      {/* ============================================================== */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0c121e]/95 backdrop-blur-md border-b border-slate-200 dark:border-blue-900/30 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Info do Evento */}
        <div className="flex items-center gap-3.5 min-w-0">
          <Link
            href={`/usuario/painel/analytics?eventoId=${eventoId}`}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            title="Voltar ao Painel do Evento"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0 border border-slate-300 dark:border-blue-900/40">
            <Image
              src={evento.img || "/assets/logos/teste-anatomia.png"}
              alt={evento.title || "Evento"}
              fill
              className="object-cover"
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-300/60 dark:border-emerald-800/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Portaria Ativa
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">•</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
                {evento.dateInicio
                  ? evento.dateInicio.split("-").reverse().join("/")
                  : evento.date || "Hoje"}
              </span>
            </div>
            <h1 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate">
              {evento.title || "Credenciamento Oficial"}
            </h1>
          </div>
        </div>

        {/* Controles do Header */}
        <div className="flex items-center gap-2">
          {/* Seletor de Modo: Recepção vs Totem */}
          <div className="bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl flex items-center border border-slate-200 dark:border-blue-900/30">
            <button
              onClick={() => setModo("recepcao")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                modo === "recepcao"
                  ? "bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Recepção</span>
            </button>
            <button
              onClick={() => setModo("totem")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                modo === "totem"
                  ? "bg-white dark:bg-emerald-600 text-emerald-600 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Totem</span>
            </button>
          </div>

          {/* Botão de QR Code do Totem para Projetar/Imprimir */}
          <button
            onClick={() => setModalQrTotemAberto(true)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="Exibir QR Code grande para autoatendimento dos participantes"
          >
            <QrCode className="w-4 h-4" />
          </button>

          {/* Áudio Toggle */}
          <button
            onClick={() => setSomHabilitado(!somHabilitado)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title={somHabilitado ? "Som ativado (clique para mutar)" : "Som mudo (clique para ativar)"}
          >
            {somHabilitado ? <Volume2 className="w-4 h-4 text-emerald-500" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer hidden sm:block"
            title="Alternar Tela Cheia"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* ============================================================== */}
      {/* CONTEÚDO PRINCIPAL (CONDICIONAL POR MODO)                      */}
      {/* ============================================================== */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* ============================================================ */}
        {/* MODO 1: RECEPÇÃO & STAFF (MONITOR AO VIVO)                   */}
        {/* ============================================================ */}
        {modo === "recepcao" && (
          <div className="space-y-6 animate-in fade-in">
            {/* CARDS DE MÉTRICAS AO VIVO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Inscrições Confirmadas / Aptas */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200/80 dark:border-blue-900/30 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Inscrições Ativas / Pagas
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <p className="text-2xl font-black text-slate-900 dark:text-white">
                      {metricas.totalAptos}
                    </p>
                    <span className="text-[11px] text-slate-400 font-medium">
                      ({metricas.totalInscritos} no total)
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
              </div>

              {/* Card 2: Credenciados (Presentes) */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#0c121e] border border-emerald-200/80 dark:border-emerald-900/30 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    Credenciados (Presentes)
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      {metricas.credenciados}
                    </p>
                    <span className="text-xs font-bold text-emerald-600/80">
                      ({metricas.porcentagem}%)
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <UserCheck className="w-6 h-6" />
                </div>
              </div>

              {/* Card 3: Aguardando Entrada (Aptos / Pagos) */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#0c121e] border border-blue-200/80 dark:border-blue-900/30 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                    Aguardando Entrada (Ativos)
                  </span>
                  <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-0.5">
                    {metricas.aguardandoCredenciamento}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
              </div>

              {/* Card 4: Inscrições Pendentes de Pagamento */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#0c121e] border border-amber-200/80 dark:border-amber-900/30 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                    Pagamento Pendente
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
                      {metricas.pagamentoPendente}
                    </p>
                    <span className="text-[10px] text-amber-600/80 font-bold uppercase">
                      Não liberados
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* BARRA DE CHECK-IN RÁPIDO & LEITOR DE QR CODE */}
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-white via-white to-slate-50 dark:from-[#0c121e] dark:via-[#0c121e] dark:to-[#0f172a] border border-slate-200/90 dark:border-blue-900/40 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-emerald-500" />
                    <span>Check-in Rápido da Portaria</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Use o leitor de código de barras / QR Code ou digite o código/CPF e aperte Enter.
                  </p>
                </div>
                <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800/40 self-start sm:self-auto">
                  Leitor Ativo (Foco Automático)
                </div>
              </div>

              <form onSubmit={handleFormCheckinSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputCheckin}
                    onChange={(e) => setInputCheckin(e.target.value)}
                    placeholder="Escanear QR Code ou digitar código (Ex: CEOS-ABC123) ou CPF..."
                    disabled={processandoCheckin}
                    className="w-full pl-11 pr-4 py-3.5 text-sm sm:text-base rounded-2xl border border-slate-300 dark:border-blue-900/60 bg-white dark:bg-[#070b12] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all shadow-inner font-mono font-bold"
                  />
                </div>
                <button
                  type="submit"
                  disabled={processandoCheckin || !inputCheckin.trim()}
                  className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer shrink-0"
                >
                  {processandoCheckin ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserCheck className="w-4 h-4" />
                  )}
                  <span>Confirmar Entrada</span>
                </button>
              </form>

              {/* Mensagem de Feedback Rápido */}
              {mensagemFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between gap-3 animate-in fade-in ${
                    mensagemFeedback.tipo === "sucesso"
                      ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/40"
                      : mensagemFeedback.tipo === "alerta"
                      ? "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800/40"
                      : "bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800/40"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {mensagemFeedback.tipo === "sucesso" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{mensagemFeedback.texto}</span>
                  </div>
                  <button
                    onClick={() => setMensagemFeedback(null)}
                    className="p-1 hover:opacity-75 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* TABELA DE PARTICIPANTES & CONTROLE MANUAL */}
            <div className="bg-white dark:bg-[#0c121e] rounded-3xl border border-slate-200/90 dark:border-blue-900/30 p-5 sm:p-6 shadow-xs space-y-5">
              {/* Controles da Tabela: Abas, Busca e Exportação */}
              <div className="space-y-4 pb-4 border-b border-slate-100 dark:border-blue-900/30">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3.5">
                  {/* Segmented Control de Abas (Sem scrollbar cinza feia e com pills modernos) */}
                  <div className="inline-flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-blue-950/80 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    <button
                      onClick={() => setFiltroAba("aptos")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                        filtroAba === "aptos"
                          ? "bg-blue-600 text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Aguardando</span>
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                          filtroAba === "aptos"
                            ? "bg-white/25 text-white"
                            : "bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {metricas.aguardandoCredenciamento}
                      </span>
                    </button>

                    <button
                      onClick={() => setFiltroAba("credenciados")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                        filtroAba === "credenciados"
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Credenciados</span>
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                          filtroAba === "credenciados"
                            ? "bg-white/25 text-white"
                            : "bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {metricas.credenciados}
                      </span>
                    </button>

                    <button
                      onClick={() => setFiltroAba("pagamento_pendente")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                        filtroAba === "pagamento_pendente"
                          ? "bg-amber-500 text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Pendentes</span>
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                          filtroAba === "pagamento_pendente"
                            ? "bg-white/25 text-white"
                            : "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300"
                        }`}
                      >
                        {metricas.pagamentoPendente}
                      </span>
                    </button>

                    <button
                      onClick={() => setFiltroAba("todos")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                        filtroAba === "todos"
                          ? "bg-slate-800 dark:bg-slate-700 text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Todos</span>
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                          filtroAba === "todos"
                            ? "bg-white/25 text-white"
                            : "bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {metricas.totalInscritos}
                      </span>
                    </button>
                  </div>

                  {/* Barra de Ferramentas / Filtros (Busca, Lote e CSV perfeitamente alinhados) */}
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    {/* Busca por Nome/CPF */}
                    <div className="relative flex-1 sm:w-64">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Filtrar por nome, CPF ou código..."
                        className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-blue-900/40 bg-slate-50 dark:bg-[#070b12] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-400"
                      />
                      {searchTerm && (
                        <button
                          type="button"
                          onClick={() => setSearchTerm("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 text-[10px]"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Filtro por Lote */}
                    {lotesDisponiveis.length > 1 && (
                      <select
                        value={filtroLote}
                        onChange={(e) => setFiltroLote(e.target.value)}
                        className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-blue-900/40 bg-slate-50 dark:bg-[#070b12] text-slate-800 dark:text-slate-200 focus:outline-none shrink-0"
                      >
                        <option value="Todos">Todos os Lotes</option>
                        {lotesDisponiveis.map((lote) => (
                          <option key={lote} value={lote}>
                            {lote}
                          </option>
                        ))}
                      </select>
                    )}

                    {/* Exportar CSV */}
                    <button
                      onClick={exportarCSV}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 border border-slate-200/80 dark:border-blue-900/30"
                      title="Exportar Lista de Presença em CSV"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Exportar CSV</span> 
                    </button>
                  </div>
                </div>

              </div>

              {/* LISTA DE PARTICIPANTES */}
              {loadingInscritos ? (
                <div className="py-16 text-center space-y-2">
                  <Loader2 className="w-6 h-6 text-emerald-500 animate-spin mx-auto" />
                  <p className="text-xs text-slate-400">Carregando inscrições...</p>
                </div>
              ) : participantesFiltrados.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-blue-900/30 text-slate-400 font-semibold">
                        <th className="py-3 px-3">Participante</th>
                        <th className="py-3 px-3">CPF</th>
                        <th className="py-3 px-3">Lote / Categoria</th>
                        <th className="py-3 px-3">Código Ingresso</th>
                        <th className="py-3 px-3">Situação</th>
                        <th className="py-3 px-3">Status Entrada</th>
                        <th className="py-3 px-3 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-blue-900/20">
                      {participantesFiltrados.map((p) => {
                        const isPendente = p.status === "Pendente";
                        return (
                          <tr
                            key={p.id}
                            className={`hover:bg-slate-50 dark:hover:bg-blue-950/20 transition-colors ${
                              p.credenciado
                                ? "bg-emerald-50/30 dark:bg-emerald-950/10"
                                : isPendente
                                ? "bg-amber-50/30 dark:bg-amber-950/10"
                                : ""
                            }`}
                          >
                            <td className="py-3 px-3">
                              <p className="font-bold text-slate-900 dark:text-white">
                                {p.nome}
                              </p>
                              <p className="text-[11px] text-slate-400">{p.email}</p>
                            </td>
                            <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300">
                              {p.cpf || "—"}
                            </td>
                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40">
                                {p.lote}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                              {p.codigoIngresso}
                            </td>
                            <td className="py-3 px-3">
                              {isPendente ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 border border-amber-300/70 dark:border-amber-800/40">
                                  <AlertCircle className="w-3 h-3" />
                                  Pagamento Pendente
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Inscrição Ativa
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              {p.credenciado ? (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-300/70 dark:border-emerald-800/40">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Presente</span>
                                  {p.credenciadoEm && (
                                    <span className="text-[9px] text-emerald-600/80">
                                      (
                                      {new Date(p.credenciadoEm).toLocaleTimeString(
                                        "pt-BR",
                                        { hour: "2-digit", minute: "2-digit" }
                                      )}
                                      )
                                    </span>
                                  )}
                                </div>
                              ) : isPendente ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                  <AlertCircle className="w-3 h-3 text-amber-500" />
                                  Bloqueado
                                </span>
                              ) : (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-300/70 dark:border-blue-800/40">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>Aguardando Entrada</span>
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right">
                              {p.credenciado ? (
                                <button
                                  onClick={() => handleDesfazerCredenciamento(p)}
                                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                  title="Desfazer credenciamento deste participante"
                                >
                                  Desfazer
                                </button>
                              ) : isPendente ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  {p.invoiceUrl && (
                                    <a
                                      href={p.invoiceUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-colors"
                                      title="Abrir fatura de cobrança do Asaas"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                      Fatura
                                    </a>
                                  )}
                                  <span
                                    className="px-2.5 py-1 rounded-lg bg-amber-100/80 dark:bg-amber-950/60 border border-amber-300/60 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 font-bold text-[10px]"
                                    title="Regularize o pagamento antes de credenciar"
                                  >
                                    Regularizar
                                  </span>
                                </div>
                              ) : (
                                <button
                                  onClick={() => efetivarCredenciamento(p, "manual")}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                  <span>Credenciar</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center space-y-2">
                  <UserCheck className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">
                    Nenhum participante encontrado para os filtros selecionados.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODO 2: TOTEM / AUTOATENDIMENTO DO CONGRESSISTA             */}
        {/* ============================================================ */}
        {modo === "totem" && (
          <div className="max-w-2xl mx-auto py-6 sm:py-10 space-y-6 animate-in fade-in">
            <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-[#0c121e] border border-slate-200/90 dark:border-blue-900/40 shadow-xl text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                <QrCode className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-300/60 dark:border-emerald-800/40">
                  Autoatendimento do Congressista
                </span>
                <h2 className="font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-white mt-2">
                  Bem-vindo ao {evento.title}!
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Digite o código da sua credencial (recebido por e-mail ou na sua área de inscrições) ou seu CPF para registrar sua entrada.
                </p>
              </div>

              {/* Form do Totem */}
              <form onSubmit={handleFormCheckinSubmit} className="space-y-4 max-w-md mx-auto">
                <div className="relative">
                  <input
                    type="text"
                    value={inputCheckin}
                    onChange={(e) => setInputCheckin(e.target.value)}
                    placeholder="Ex: CEOS-ABC123 ou 000.000.000-00"
                    autoFocus
                    className="w-full px-5 py-4 text-center text-lg sm:text-xl font-mono font-extrabold rounded-2xl border-2 border-slate-200 dark:border-blue-900/60 bg-slate-50 dark:bg-[#070b12] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 transition-all shadow-inner tracking-wider uppercase"
                  />
                </div>

                <button
                  type="submit"
                  disabled={processandoCheckin || !inputCheckin.trim()}
                  className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-base shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {processandoCheckin ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5" />
                  )}
                  <span>Confirmar Minha Presença</span>
                </button>
              </form>

              {/* Feedback no Totem */}
              {mensagemFeedback && (
                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm font-semibold animate-in zoom-in-95 ${
                    mensagemFeedback.tipo === "sucesso"
                      ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800/50"
                      : mensagemFeedback.tipo === "alerta"
                      ? "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800/50"
                      : "bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800/50"
                  }`}
                >
                  <p>{mensagemFeedback.texto}</p>
                </div>
              )}

              {/* Instruções de Apoio */}
              <div className="pt-4 border-t border-slate-100 dark:border-blue-900/30 text-xs text-slate-400 space-y-1">
                <p>Está com dúvidas ou precisa de ajuda com seu crachá?</p>
                <p className="font-semibold text-slate-600 dark:text-slate-300">
                  Dirija-se ao balcão de apoio da recepção do evento.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ============================================================== */}
      {/* MODAL COM QR CODE GRANDE PARA PROJETAR NO BANNER / TOTEM      */}
      {/* ============================================================== */}
      {modalQrTotemAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#0c121e] rounded-3xl border border-slate-200 dark:border-blue-900/40 p-6 sm:p-8 text-center space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-blue-900/30">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <QrCode className="w-5 h-5" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  QR Code da Portaria
                </h3>
              </div>
              <button
                onClick={() => setModalQrTotemAberto(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Projete ou imprima este QR Code na entrada. Os congressistas poderão apontar a câmera do celular para fazer o check-in rápido.
            </p>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 inline-block shadow-inner mx-auto">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
                  urlAutoatendimento
                )}`}
                alt="QR Code Autoatendimento"
                className="w-52 h-52 mx-auto"
              />
            </div>

            <div className="space-y-1 text-xs">
              <p className="font-bold text-slate-900 dark:text-white">
                {evento.title}
              </p>
              <p className="font-mono text-[11px] text-slate-400 truncate max-w-xs mx-auto">
                {urlAutoatendimento}
              </p>
            </div>

            {/* Aviso de QR Code Permanente */}
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-[11px] text-emerald-800 dark:text-emerald-300 text-left flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>QR Code Permanente e Vitalício:</strong> Este código é único do evento e <strong>nunca expira</strong>. Pode ser impresso em banners, totens ou panfletos sem necessidade de reimpressão.
              </span>
            </div>

            {/* Ações: Imprimir, Copiar Link e Fechar */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleImprimirQrCode}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir QR Code</span>
              </button>
              <button
                onClick={handleCopiarLink}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copiadoLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Link</span>
                  </>
                )}
              </button>
            </div>

            <button
              onClick={() => setModalQrTotemAberto(false)}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
            >
              Fechar Visualização
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
