"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import ThemeToggle from "@/components/ThemeToggle";
import {
  QrCode,
  CheckCircle2,
  AlertCircle,
  Calendar,
  MapPin,
  Loader2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

// Síntese de som via Web Audio API (sem dependência de assets externos)
function playBeep(type: "success" | "warning" | "error") {
  try {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "success") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } else if (type === "warning") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(370, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch {
    // Silencia erros de áudio se política do navegador bloquear
  }
}

interface EventoInfo {
  id: string;
  title?: string;
  nome?: string;
  img?: string;
  image?: string;
  dateInicio?: string;
  dateFim?: string;
  localNome?: string;
  cidade?: string;
  estado?: string;
}

interface CheckinSucesso {
  nome: string;
  lote: string;
  codigoIngresso: string;
  hora: string;
}

export default function CheckinParticipantePage() {
  const params = useParams();
  const rawId = params?.id;
  const eventoId = Array.isArray(rawId) ? rawId[0] : (rawId as string);

  const [evento, setEvento] = useState<EventoInfo | null>(null);
  const [loadingEvento, setLoadingEvento] = useState(true);
  const [eventoNaoEncontrado, setEventoNaoEncontrado] = useState(false);

  const [identificador, setIdentificador] = useState("");
  const [processando, setProcessando] = useState(false);
  const [sucesso, setSucesso] = useState<CheckinSucesso | null>(null);
  const [aviso, setAviso] = useState<{ tipo: "warning" | "error"; msg: string } | null>(null);
  const [contadorReset, setContadorReset] = useState<number | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Carrega informações públicas do evento
  useEffect(() => {
    if (!eventoId) return;

    async function loadEvento() {
      try {
        setLoadingEvento(true);
        const docRef = doc(db, "events", eventoId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setEvento({ id: docSnap.id, ...docSnap.data() } as EventoInfo);
        } else {
          setEventoNaoEncontrado(true);
        }
      } catch (err) {
        console.error("Erro ao carregar dados do evento:", err);
        setEventoNaoEncontrado(true);
      } finally {
        setLoadingEvento(false);
      }
    }

    loadEvento();
  }, [eventoId]);

  // Foco automático no input ao carregar
  useEffect(() => {
    if (!loadingEvento && !sucesso) {
      inputRef.current?.focus();
    }
  }, [loadingEvento, sucesso]);

  // Contagem regressiva para auto-reset após sucesso (6 segundos)
  useEffect(() => {
    if (!sucesso) {
      setContadorReset(null);
      return;
    }

    setContadorReset(6);
    const interval = setInterval(() => {
      setContadorReset((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          setSucesso(null);
          setIdentificador("");
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sucesso]);

  // Realizar check-in do participante
  const handleCheckin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const termo = identificador.trim();
    if (!termo || processando || !eventoId) return;

    setAviso(null);
    setProcessando(true);

    try {
      const termoNormalizado = termo.toUpperCase();
      const apenasNumeros = termo.replace(/\D/g, "");

      // 1. Busca inscrições do evento
      const inscRef = collection(db, "inscricoes");
      const q = query(inscRef, where("eventoId", "==", eventoId));
      const snapshot = await getDocs(q);

      let foundDoc: any = null;
      let docData: any = null;

      // Localiza por código do ingresso (CEOS-XXXXXX) ou CPF
      snapshot.forEach((d) => {
        if (foundDoc) return;
        const data = d.data();
        const cod = (data.codigoIngresso || data.codigo || "").toString().toUpperCase().trim();
        const cpfRaw = (data.cpf || data.userCpf || "").toString().replace(/\D/g, "");

        if (cod && cod === termoNormalizado) {
          foundDoc = d;
          docData = data;
        } else if (apenasNumeros.length >= 7 && cpfRaw && (cpfRaw === apenasNumeros || cpfRaw.endsWith(apenasNumeros))) {
          foundDoc = d;
          docData = data;
        }
      });

      // Se não encontrou pelo eventoId, busca também por evento_id como fallback
      if (!foundDoc) {
        const qAlt = query(inscRef, where("evento_id", "==", eventoId));
        const snapAlt = await getDocs(qAlt);
        snapAlt.forEach((d) => {
          if (foundDoc) return;
          const data = d.data();
          const cod = (data.codigoIngresso || data.codigo || "").toString().toUpperCase().trim();
          const cpfRaw = (data.cpf || data.userCpf || "").toString().replace(/\D/g, "");

          if (cod && cod === termoNormalizado) {
            foundDoc = d;
            docData = data;
          } else if (apenasNumeros.length >= 7 && cpfRaw && (cpfRaw === apenasNumeros || cpfRaw.endsWith(apenasNumeros))) {
            foundDoc = d;
            docData = data;
          }
        });
      }

      // Se não encontrou nenhuma inscrição válida
      if (!foundDoc || !docData) {
        playBeep("error");
        setAviso({
          tipo: "error",
          msg: "Inscrição não encontrada. Verifique se o código ou CPF foi digitado corretamente ou procure a recepção.",
        });
        setProcessando(false);
        return;
      }

      // Verifica status de pagamento
      const st = (docData.status || "").toLowerCase();
      const isPago = ["pago", "approved", "confirmado", "gratuito", "isento", "active"].includes(st);

      if (!isPago && st !== "") {
        playBeep("warning");
        setAviso({
          tipo: "warning",
          msg: "Sua inscrição consta como pendente de pagamento. Por favor, procure a recepção do evento para regularização.",
        });
        setProcessando(false);
        return;
      }

      // Verifica se já realizou o credenciamento
      if (docData.credenciado === true || docData.checkinRealizado === true) {
        playBeep("warning");
        const horaAnterior = docData.credenciadoEm
          ? new Date(docData.credenciadoEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
          : "";
        setAviso({
          tipo: "warning",
          msg: `Você já realizou o credenciamento ${horaAnterior ? `hoje às ${horaAnterior}` : "anteriormente"}. Bom evento!`,
        });
        setProcessando(false);
        return;
      }

      // Registra o credenciamento
      const agoraIso = new Date().toISOString();
      await updateDoc(doc(db, "inscricoes", foundDoc.id), {
        credenciado: true,
        checkinRealizado: true,
        credenciadoEm: agoraIso,
        credenciadoPor: "autoatendimento_totem",
      });

      playBeep("success");
      const nomeExibicao = docData.nome || docData.userName || docData.nomeCompleto || "Participante";
      const loteExibicao = docData.lote || docData.categoria || "Geral";
      const codigoExibicao = docData.codigoIngresso || docData.codigo || termoNormalizado;

      setSucesso({
        nome: nomeExibicao,
        lote: loteExibicao,
        codigoIngresso: codigoExibicao,
        hora: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      });
      setIdentificador("");
    } catch (err) {
      console.error("Erro ao registrar credenciamento:", err);
      playBeep("error");
      setAviso({
        tipo: "error",
        msg: "Ocorreu uma falha temporária ao registrar sua presença. Por favor, tente novamente ou procure a recepção.",
      });
    } finally {
      setProcessando(false);
    }
  };

  const handleResetManual = () => {
    setSucesso(null);
    setAviso(null);
    setIdentificador("");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  if (loadingEvento) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-3" />
        <p className="text-sm text-slate-400 font-medium">Carregando auto-credenciamento...</p>
      </div>
    );
  }

  if (eventoNaoEncontrado || !evento) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-14 h-14 text-rose-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Evento não encontrado</h1>
        <p className="text-slate-400 max-w-md text-sm">
          Não foi possível localizar as informações deste evento. Por favor, verifique se o link ou QR Code está correto.
        </p>
      </div>
    );
  }

  const tituloEvento = evento.title || evento.nome || "Evento";
  const imagemEvento = evento.img || evento.image;
  const localEvento = evento.localNome || (evento.cidade ? `${evento.cidade} - ${evento.estado || ""}` : "");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* Barra Superior Discreta */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <QrCode className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold tracking-wider uppercase text-emerald-400 block leading-tight">
              Auto-Credenciamento
            </span>
            <span className="text-xs text-slate-400">Portal do Participante</span>
          </div>
        </div>
        <ThemeToggle />
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-lg w-full mx-auto">
        {/* Card do Evento */}
        <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-5 mb-6 text-center shadow-xl backdrop-blur">
          {imagemEvento && (
            <div className="relative w-full h-28 rounded-xl overflow-hidden mb-4 border border-slate-800">
              <Image src={imagemEvento} alt={tituloEvento} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
            </div>
          )}
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight leading-snug">
            {tituloEvento}
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-3 text-xs text-slate-400">
            {evento.dateInicio && (
              <span className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700/60">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                {evento.dateInicio}
              </span>
            )}
            {localEvento && (
              <span className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700/60">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                {localEvento}
              </span>
            )}
          </div>
        </div>

        {/* TELA DE SUCESSO / BEM-VINDO */}
        {sucesso ? (
          <div className="w-full bg-gradient-to-b from-emerald-950/60 to-slate-900 border border-emerald-500/40 rounded-3xl p-8 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto mb-5 text-emerald-400 shadow-lg shadow-emerald-500/20 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-3 border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              Presença Confirmada
            </div>

            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-2">
              Seja bem-vindo(a)!
            </h2>
            <p className="text-xl font-bold text-emerald-400 mb-4 capitalize">
              {sucesso.nome.toLowerCase()}
            </p>

            <div className="bg-slate-950/70 border border-emerald-500/20 rounded-2xl p-4 text-xs space-y-2 text-slate-300 mb-6">
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span className="text-slate-400">Credencial / Código:</span>
                <span className="font-mono font-bold text-white">{sucesso.codigoIngresso}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span className="text-slate-400">Categoria / Lote:</span>
                <span className="font-medium text-emerald-300">{sucesso.lote}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Horário do Check-in:</span>
                <span className="font-medium text-white">{sucesso.hora}</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 mb-5">
              Apresente esta tela caso solicitado na recepção do evento.
            </p>

            <button
              onClick={handleResetManual}
              className="w-full py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition flex items-center justify-center gap-2 border border-slate-700"
            >
              <RefreshCw className="w-4 h-4" />
              Próximo Participante {contadorReset !== null && `(${contadorReset}s)`}
            </button>
          </div>
        ) : (
          /* FORMULÁRIO DE AUTO-CHECK-IN */
          <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur">
            <div className="text-center mb-6">
              <h2 className="text-lg md:text-xl font-bold text-white tracking-tight mb-1">
                Confirme sua Entrada
              </h2>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Digite o <strong className="text-slate-300">Código da Inscrição</strong> recebido por e-mail (Ex: <span className="font-mono text-emerald-400">CEOS-ABC123</span>) ou o seu <strong className="text-slate-300">CPF</strong>.
              </p>
            </div>

            <form onSubmit={handleCheckin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Código do Ingresso ou CPF
                </label>
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={identificador}
                    onChange={(e) => setIdentificador(e.target.value)}
                    placeholder="Ex: CEOS-ABC123 ou 000.000.000-00"
                    disabled={processando}
                    className="w-full px-4 py-3.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 font-medium text-base tracking-wide focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition disabled:opacity-60"
                  />
                  {identificador && (
                    <button
                      type="button"
                      onClick={() => setIdentificador("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white px-2 py-1"
                    >
                      Limpar
                    </button>
                  )}
                </div>
              </div>

              {/* Mensagem de Erro / Aviso */}
              {aviso && (
                <div
                  className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 animate-in fade-in duration-200 ${
                    aviso.tipo === "error"
                      ? "bg-rose-950/60 border border-rose-500/40 text-rose-200"
                      : "bg-amber-950/60 border border-amber-500/40 text-amber-200"
                  }`}
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex-1 leading-relaxed">{aviso.msg}</div>
                </div>
              )}

              <button
                type="submit"
                disabled={processando || !identificador.trim()}
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.99] text-white font-bold text-sm tracking-wide shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {processando ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Validando sua inscrição...
                  </>
                ) : (
                  <>
                    Confirmar Presença
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-800 text-center">
              <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                Seus dados são protegidos e confidenciais. Em caso de dúvidas, procure a recepção.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Rodapé */}
      <footer className="py-4 text-center text-xs text-slate-600 border-t border-slate-900">
        © {new Date().getFullYear()} CeosSystem • Plataforma Inteligente de Eventos
      </footer>
    </div>
  );
}
