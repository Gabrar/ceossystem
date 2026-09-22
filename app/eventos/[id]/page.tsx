"use client";

import { use, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  Calendar,
  Clock,
  MapPin,
  Tag,
  Award,
  Users,
  Building2,
  ExternalLink,
  Share2,
  CheckCircle2,
  Ticket,
  ArrowLeft,
  ChevronRight,
  Globe,
  Sparkles,
  Navigation,
  MessageCircle,
  Copy,
  Check,
  AlertCircle,
  BookOpen,
  GraduationCap,
  Pencil,
  Trash2,
  AlertTriangle,
  ShieldCheck,
  Loader2
} from "lucide-react";

function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function LinkedinIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function FacebookIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

interface PalestranteItem {
  nome: string;
  especialidade?: string;
  instituicao?: string;
  cargo?: string;
  fotoUrl?: string;
  foto?: string;
  bio?: string;
}

interface MinicursoItem {
  nome: string;
  tipo: string;
  imagemUrl?: string;
  local?: string;
  descricao?: string;
  ministrantes?: Array<{ nome: string; email?: string }>;
  dias?: Array<{ data: string; horaInicio: string; horaFim: string }>;
  ingressos?: Array<{ perfil: string; preco: string; loteNumero?: string }>;
}

interface LoteItem {
  perfil?: string;
  loteNumero?: string;
  preco?: string;
  quantidade?: string;
  codigoDesconto?: string;
  valorPromocional?: string;
  dataInicio?: string;
  dataFim?: string;
}

interface EventoDetalhes {
  id: string;
  titulo: string;
  subtitulo?: string;
  descricaoCompleta?: string;
  categoria: string;
  status: string;
  modalidade?: string;
  capacidade?: string;
  localNome: string;
  cidadeEstado: string;
  enderecoCompleto?: {
    cep?: string;
    endereco?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    nomeLocal?: string;
  } | null;
  data: string;
  horario: string;
  site?: string;
  img: string;
  destaque?: boolean;
  cargaHoraria?: string;
  publicoAlvo?: string;
  organizacao?: string;
  palestrantes: PalestranteItem[];
  minicursos: MinicursoItem[];
  lotes: LoteItem[];
  patrocinadores: string[];
  apoiadores: string[];
  redesSociais?: {
    instagram?: string;
    linkedin?: string;
    facebook?: string;
  } | null;
  mensagens: string[];
  userId?: string | null;
  promotorEmail?: string | null;
}

export default function EventoDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const [evento, setEvento] = useState<EventoDetalhes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [modalExcluir, setModalExcluir] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  useEffect(() => {
    async function carregarEvento() {
      try {
        setLoading(true);
        setError(null);

        const docRef = doc(db, "events", id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          setError("Evento não encontrado ou indisponível.");
          return;
        }

        const data = docSnap.data();

        // Tratamento e formatação de datas (suportando novo e antigo esquema)
        const formatarData = (d: string) => (d ? d.split("-").reverse().join("/") : "");
        const dInicio = data.dateInicio ? formatarData(data.dateInicio) : "";
        const dFim = data.dateFim ? formatarData(data.dateFim) : "";
        const dataFinal = dInicio ? (dFim ? `${dInicio} a ${dFim}` : dInicio) : data.date || "Data a confirmar";

        // Formatação de horários
        const horaFinal = data.horaInicio
          ? data.horaFim
            ? `${data.horaInicio} às ${data.horaFim}`
            : data.horaInicio
          : data.hour || "Horário a definir";

        // Localização
        const localObj = typeof data.local === "object" && data.local !== null ? data.local : null;
        const localNome = localObj?.nomeLocal || data.localization || "Local a confirmar";
        const localCidade = localObj?.cidade || data["city-state"] || "Brasil";

        // Palestrantes normalizados
        const rawPalestrantes = data.palestrantes || [];
        const palestrantesFormatados: PalestranteItem[] = rawPalestrantes.map((p: any, idx: number) => {
          if (typeof p === "string") {
            return {
              nome: p,
              fotoUrl: data.palestrantes_img?.[idx] || undefined,
            };
          }
          return {
            nome: p.nome || "Palestrante Convidado",
            especialidade: p.especialidade || p.eixo,
            instituicao: p.instituicao || p.cargo,
            fotoUrl: p.fotoUrl || p.foto || data.palestrantes_img?.[idx],
            bio: p.bio,
          };
        });

        // Minicursos
        const minicursosFormatados: MinicursoItem[] = (data.minicursos || []).map((m: any) => ({
          nome: m.nome || "",
          tipo: m.tipo || "Teórico / Prático",
          imagemUrl: m.imagemUrl,
          local: m.local,
          descricao: m.descricao,
          ministrantes: m.ministrantes || [],
          dias: m.dias || [],
          ingressos: m.ingressos || [],
        }));

        setEvento({
          id: docSnap.id,
          titulo: data.title || "Evento Científico",
          subtitulo: data.subtitle || "",
          descricaoCompleta: data.description || "",
          categoria: data.category || "Geral",
          status: data.status || "Em Breve",
          modalidade: data.modalidade || "Presencial",
          capacidade: data.capacidade || "",
          localNome,
          cidadeEstado: localCidade,
          enderecoCompleto: localObj,
          data: dataFinal,
          horario: horaFinal,
          site: data.website || "#",
          img: data.img || "/assets/logos/teste-anatomia.png",
          destaque: data.emphasis || false,
          cargaHoraria: data.workload || "",
          publicoAlvo: data.target || "",
          organizacao: data.org || "",
          palestrantes: palestrantesFormatados,
          minicursos: minicursosFormatados,
          lotes: data.lotes || [],
          patrocinadores: data.patrocinadores || [],
          apoiadores: data.apoiadores || [],
          redesSociais: data.redesSociais || null,
          mensagens: data.mensagens || [],
          userId: data.userId || null,
          promotorEmail: data.promotorEmail || null,
        });
      } catch (err: any) {
        console.error("Erro ao carregar detalhes do evento:", err);
        setError("Não foi possível carregar as informações deste evento no momento.");
      } finally {
        setLoading(false);
      }
    }

    carregarEvento();
  }, [id]);

  const isOwner = Boolean(
    user &&
    evento &&
    (user.uid === evento.userId || (user.email && user.email === evento.promotorEmail))
  );

  const handleExcluirEvento = async () => {
    if (!evento) return;
    try {
      setExcluindo(true);
      await deleteDoc(doc(db, "events", evento.id));
      alert("Evento excluído com sucesso!");
      router.push("/usuario/painel/meus-eventos");
    } catch (e) {
      console.error("Erro ao excluir evento:", e);
      alert("Erro ao excluir o evento. Tente novamente.");
    } finally {
      setExcluindo(false);
    }
  };

  const handleShare = () => {
    if (!evento) return;
    if (navigator.share) {
      navigator
        .share({
          title: evento.titulo,
          text: `${evento.titulo} - ${evento.cidadeEstado} (${evento.data})`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Google Maps URL generator
  const getMapsUrl = () => {
    if (!evento) return "#";
    const end = evento.enderecoCompleto;
    if (end && end.endereco) {
      const query = encodeURIComponent(
        `${end.nomeLocal ? end.nomeLocal + ", " : ""}${end.endereco}, ${end.numero || ""} ${end.bairro || ""} ${end.cidade || ""} ${end.cep || ""}`
      );
      return `https://www.google.com/maps/search/?api=1&query=${query}`;
    }
    const query = encodeURIComponent(`${evento.localNome}, ${evento.cidadeEstado}`);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  };

  // 1. Estado de Carregamento (Skeleton moderno espaçoso)
  if (loading) {
    return (
      <main className="min-h-[calc(100vh-73px)] bg-[#fafafa] dark:bg-[#0a1929] text-slate-900 dark:text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
          {/* Skeleton Breadcrumb */}
          <div className="h-5 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />

          {/* Skeleton Hero Banner */}
          <div className="w-full h-72 sm:h-96 bg-slate-200 dark:bg-slate-800 rounded-3xl" />

          {/* Skeleton Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
              <div className="h-10 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              <div className="h-5 w-full bg-slate-200 dark:bg-slate-800 rounded-lg" />
              <div className="h-5 w-5/6 bg-slate-200 dark:bg-slate-800 rounded-lg" />
              <div className="h-48 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl" />
            </div>
            <div className="lg:col-span-4 space-y-4">
              <div className="h-64 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl" />
              <div className="h-44 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  // 2. Estado de Erro ou Evento Não Encontrado
  if (error || !evento) {
    return (
      <main className="min-h-[calc(100vh-73px)] bg-[#fafafa] dark:bg-[#0a1929] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-[#0c1e33] border border-slate-200 dark:border-blue-900/40 shadow-xl text-center space-y-5 animate-in fade-in">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-200 dark:border-amber-800/40">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold font-montserrat text-slate-900 dark:text-white">
            Evento não encontrado
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {error || "O evento que você está procurando não existe, foi encerrado ou o link está incorreto."}
          </p>
          <div className="pt-2">
            <Link
              href="/eventos"
              className="inline-flex items-center justify-center gap-2 w-full py-3 px-5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-blue-600/20 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para todos os eventos
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-73px)] bg-[#fafafa] dark:bg-[#0a1929] text-slate-900 dark:text-slate-100 py-8 sm:py-12 px-4 sm:px-6 lg:px-8 transition-colors fade-in">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Breadcrumb e Ações Superiores */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <nav aria-label="Navegação estrutural" className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Início
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/eventos" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Eventos
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-[200px] sm:max-w-xs">
              {evento.titulo}
            </span>
          </nav>

          <Link
            href="/eventos"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#0c1e33] border border-slate-200 dark:border-blue-900/40 shadow-xs hover:shadow-sm transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para eventos</span>
          </Link>
        </div>

        {/* Barra de Gestão do Promotor Proprietário */}
        {isOwner && (
          <div className="p-4 sm:p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-amber-700 dark:text-amber-300">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="font-montserrat font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  Você é o organizador deste evento
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  Como promotor responsável, você pode editar todas as informações cadastradas ou excluir este evento.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <Link
                href={`/eventos/createEvent?id=${evento.id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Editar Evento</span>
              </Link>

              <button
                type="button"
                onClick={() => setModalExcluir(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-[#0c1e33] text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir Evento</span>
              </button>
            </div>
          </div>
        )}

        {/* Hero Banner do Evento com Imagem e Identificação */}
        <section className="relative w-full rounded-3xl overflow-hidden border border-slate-200/90 dark:border-blue-900/40 bg-white dark:bg-[#0c1e33] shadow-lg">
          <div className="relative w-full h-64 sm:h-80 md:h-96 lg:h-[420px] bg-slate-900">
            <Image
              src={evento.img}
              alt={evento.titulo}
              fill
              priority
              className="object-cover object-center"
            />
            {/* Gradientes elegantes para legibilidade superior */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/40 to-transparent" />

            {/* Conteúdo sobreposto na imagem */}
            <div className="absolute inset-0 p-6 sm:p-8 md:p-10 flex flex-col justify-end text-white">
              {/* Badges Flutuantes */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-600 text-white shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {evento.status}
                </span>

                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-slate-900/80 text-slate-200 backdrop-blur-md border border-white/10">
                  <Tag className="w-3.5 h-3.5 text-blue-400" />
                  {evento.categoria}
                </span>

                {evento.modalidade && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-indigo-950/80 text-indigo-200 backdrop-blur-md border border-indigo-400/20">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    {evento.modalidade}
                  </span>
                )}
              </div>

              {/* Título Principal Amplo */}
              <h1 className="font-montserrat text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-white max-w-4xl drop-shadow-md">
                {evento.titulo}
              </h1>

              {/* Subtítulo se houver */}
              {evento.subtitulo && (
                <p className="mt-2 text-sm sm:text-base md:text-lg text-slate-200/90 max-w-3xl line-clamp-2 drop-shadow-sm">
                  {evento.subtitulo}
                </p>
              )}

              {/* Barra Rápida de Destaques Sobre a Imagem */}
              <div className="mt-6 pt-5 border-t border-white/15 flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm text-slate-200">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="font-semibold">{evento.data}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="font-semibold">{evento.horario}</span>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="font-semibold truncate max-w-[240px] sm:max-w-none">
                    {evento.localNome} • {evento.cidadeEstado}
                  </span>
                </div>

                {evento.cargaHoraria && (
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-blue-400 shrink-0" />
                    <span className="font-semibold">{evento.cargaHoraria} Horas</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Layout Principal de 2 Colunas com Espaço Amplo */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* =========================================================================
              COLUNA PRINCIPAL (ESQUERDA - 8 COLUNAS)
          ========================================================================== */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* 1. Mensagens da Organização (se houver) */}
            {evento.mensagens && evento.mensagens.length > 0 && (
              <div className="p-5 sm:p-6 rounded-3xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/50 space-y-3">
                <h3 className="font-montserrat font-bold text-base text-blue-900 dark:text-blue-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Comunicado Oficial da Organização
                </h3>
                <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {evento.mensagens.map((msg, idx) => (
                    <p key={idx} className="bg-white/60 dark:bg-[#071321]/60 p-3.5 rounded-xl border border-blue-100 dark:border-blue-900/40">
                      {msg}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Sobre o Evento */}
            <section className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0c1e33] border border-slate-200/80 dark:border-blue-900/40 shadow-xs space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-montserrat text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                    Sobre o Evento
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Conheça a proposta e os pilares desta edição científica
                  </p>
                </div>
              </div>

              <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed space-y-4">
                {evento.descricaoCompleta ? (
                  evento.descricaoCompleta.split("\n\n").map((paragrafo, idx) => (
                    <p key={idx}>{paragrafo}</p>
                  ))
                ) : (
                  <p>
                    {evento.subtitulo ||
                      "Este evento reúne especialistas de destaque, pesquisadores, acadêmicos e profissionais para debater temas emergentes, compartilhar descobertas científicas e promover networking estruturado com o padrão de qualidade Céos System."}
                  </p>
                )}
              </div>

              {/* O que está incluso */}
              <div className="pt-6 border-t border-slate-100 dark:border-blue-900/40">
                <h3 className="font-montserrat font-bold text-slate-900 dark:text-white text-base mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  O que está incluso na sua inscrição
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-[#071321]/60 border border-slate-200/60 dark:border-blue-900/30">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Acesso a todas as palestras magnas e mesas</span>
                  </div>
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-[#071321]/60 border border-slate-200/60 dark:border-blue-900/30">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Certificado oficial com autenticação digital</span>
                  </div>
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-[#071321]/60 border border-slate-200/60 dark:border-blue-900/30">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Submissão e publicação de anais científicos</span>
                  </div>
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-[#071321]/60 border border-slate-200/60 dark:border-blue-900/30">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Kit oficial do congressista e material de apoio</span>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. Palestrantes e Convidados de Honra */}
            {evento.palestrantes && evento.palestrantes.length > 0 && (
              <section className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0c1e33] border border-slate-200/80 dark:border-blue-900/40 shadow-xs space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-montserrat text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                        Palestrantes & Convidados
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Pesquisadores e referências confirmados no evento
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/40">
                    {evento.palestrantes.length} Especialistas
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                  {evento.palestrantes.map((palestrante, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl bg-slate-50/70 dark:bg-[#071321]/70 border border-slate-200/80 dark:border-blue-900/40 hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-200 flex flex-col justify-between gap-4"
                    >
                      <div className="flex items-start gap-4">
                        {palestrante.fotoUrl ? (
                          <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-2xl overflow-hidden border-2 border-white dark:border-slate-800 shadow-md">
                            <Image
                              src={palestrante.fotoUrl}
                              alt={palestrante.nome}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl sm:text-2xl shrink-0 shadow-md">
                            {palestrante.nome ? palestrante.nome.charAt(0).toUpperCase() : "P"}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <h3 className="font-montserrat font-bold text-slate-900 dark:text-white text-base leading-snug">
                            {palestrante.nome}
                          </h3>
                          {palestrante.especialidade && (
                            <p className="text-blue-600 dark:text-blue-400 text-xs sm:text-sm font-semibold mt-1">
                              {palestrante.especialidade}
                            </p>
                          )}
                          {palestrante.instituicao && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                              {palestrante.instituicao}
                            </p>
                          )}
                        </div>
                      </div>

                      {palestrante.bio && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed pt-2 border-t border-slate-200/60 dark:border-blue-900/30">
                          {palestrante.bio}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 4. Minicursos e Atividades Associadas */}
            {evento.minicursos && evento.minicursos.length > 0 && (
              <section className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0c1e33] border border-slate-200/80 dark:border-blue-900/40 shadow-xs space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Ticket className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-montserrat text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                        Minicursos & Workshops
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Atividades complementares práticas e teóricas com vagas limitadas
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5">
                  {evento.minicursos.map((minicurso, idx) => (
                    <div
                      key={idx}
                      className="p-5 sm:p-6 rounded-2xl bg-slate-50/70 dark:bg-[#071321]/70 border border-slate-200/80 dark:border-blue-900/40 flex flex-col md:flex-row gap-5 items-start"
                    >
                      {minicurso.imagemUrl && (
                        <div className="relative w-full md:w-48 aspect-[16/10] md:aspect-[4/3] rounded-xl overflow-hidden shrink-0 shadow-sm border border-slate-200 dark:border-blue-900/30">
                          <Image
                            src={minicurso.imagemUrl}
                            alt={minicurso.nome}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}

                      <div className="flex-1 space-y-2.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300">
                            {minicurso.tipo}
                          </span>
                          {minicurso.local && (
                            <span className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                              <MapPin className="w-3 h-3 text-blue-500" />
                              {minicurso.local}
                            </span>
                          )}
                        </div>

                        <h3 className="font-montserrat font-bold text-slate-900 dark:text-white text-base sm:text-lg">
                          {minicurso.nome}
                        </h3>

                        {minicurso.descricao && (
                          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                            {minicurso.descricao}
                          </p>
                        )}

                        {minicurso.ministrantes && minicurso.ministrantes.length > 0 && (
                          <div className="pt-2 text-xs text-slate-700 dark:text-slate-300">
                            <span className="font-semibold text-slate-900 dark:text-white">Ministrante(s): </span>
                            {minicurso.ministrantes.map((m) => m.nome).filter(Boolean).join(", ")}
                          </div>
                        )}

                        {minicurso.dias && minicurso.dias.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {minicurso.dias.map((d, dIdx) => (
                              <span
                                key={dIdx}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-[#0c1e33] border border-slate-200 dark:border-blue-900/40 text-[11px] font-medium text-slate-700 dark:text-slate-300"
                              >
                                <Calendar className="w-3 h-3 text-blue-500" />
                                {d.data} ({d.horaInicio} - {d.horaFim})
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 5. Patrocinadores e Apoiadores */}
            {((evento.patrocinadores && evento.patrocinadores.length > 0) ||
              (evento.apoiadores && evento.apoiadores.length > 0)) && (
              <section className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0c1e33] border border-slate-200/80 dark:border-blue-900/40 shadow-xs space-y-6">
                <h2 className="font-montserrat text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Realização & Parcerias
                </h2>

                {evento.patrocinadores && evento.patrocinadores.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Patrocínio Oficial
                    </h3>
                    <div className="flex flex-wrap items-center gap-4">
                      {evento.patrocinadores.map((logoUrl, idx) => (
                        <div
                          key={idx}
                          className="relative w-28 h-16 rounded-xl bg-slate-50 dark:bg-[#071321] border border-slate-200 dark:border-blue-900/40 p-2 flex items-center justify-center overflow-hidden"
                        >
                          <Image src={logoUrl} alt={`Patrocinador ${idx + 1}`} fill className="object-contain p-2" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {evento.apoiadores && evento.apoiadores.length > 0 && (
                  <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-blue-900/40">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Apoio Institucional
                    </h3>
                    <div className="flex flex-wrap items-center gap-4">
                      {evento.apoiadores.map((logoUrl, idx) => (
                        <div
                          key={idx}
                          className="relative w-24 h-14 rounded-xl bg-slate-50 dark:bg-[#071321] border border-slate-200 dark:border-blue-900/40 p-2 flex items-center justify-center overflow-hidden"
                        >
                          <Image src={logoUrl} alt={`Apoiador ${idx + 1}`} fill className="object-contain p-2" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

          </div>

          {/* =========================================================================
              COLUNA LATERAL FIXA (DIREITA - 4 COLUNAS)
          ========================================================================== */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            
            {/* Card de Inscrição e Lotes */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#0c1e33] border border-slate-200/90 dark:border-blue-900/50 shadow-md space-y-5">
              <div className="space-y-1">
                <span className="text-xs uppercase tracking-wider font-bold text-blue-600 dark:text-blue-400">
                  Participação & Inscrições
                </span>
                <h3 className="font-montserrat text-xl font-extrabold text-slate-900 dark:text-white">
                  Garanta sua vaga
                </h3>
              </div>

              {/* Lotes disponíveis */}
              {evento.lotes && evento.lotes.length > 0 ? (
                <div className="space-y-3">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Lotes Disponíveis:
                  </span>
                  <div className="space-y-2">
                    {evento.lotes.map((lote, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-[#071321]/80 border border-slate-200/70 dark:border-blue-900/40 flex items-center justify-between gap-2"
                      >
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm">
                            {lote.perfil || `Lote ${lote.loteNumero || idx + 1}`}
                          </p>
                          {lote.dataFim && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              Válido até {lote.dataFim.split("-").reverse().join("/")}
                            </p>
                          )}
                        </div>

                        <div className="text-right">
                          <span className="font-bold text-blue-600 dark:text-blue-400 text-sm sm:text-base">
                            {lote.preco ? (lote.preco.includes("R$") ? lote.preco : `R$ ${lote.preco}`) : "Gratuito"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  Inscrições abertas para estudantes, pesquisadores e profissionais da área.
                </div>
              )}

              {/* Botão de Ação Principal */}
              <div className="pt-2 space-y-3">
                <a
                  href={evento.site && evento.site !== "#" ? evento.site : "#"}
                  target={evento.site && evento.site !== "#" ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-bold text-sm shadow-lg shadow-blue-600/25 hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Ticket className="w-5 h-5" />
                  <span>Realizar Inscrição</span>
                  <ExternalLink className="w-4 h-4 opacity-80" />
                </a>

                {evento.capacidade && (
                  <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                    Capacidade limitada para <strong>{evento.capacidade}</strong> participantes.
                  </p>
                )}
              </div>
            </div>

            {/* Card de Localização Detalhada */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#0c1e33] border border-slate-200/90 dark:border-blue-900/50 shadow-xs space-y-4">
              <h3 className="font-montserrat font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Local do Evento
              </h3>

              <div className="space-y-1.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                <p className="font-bold text-slate-900 dark:text-white text-sm">
                  {evento.localNome}
                </p>

                {evento.enderecoCompleto?.endereco && (
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {evento.enderecoCompleto.endereco}
                    {evento.enderecoCompleto.numero ? `, nº ${evento.enderecoCompleto.numero}` : ""}
                    {evento.enderecoCompleto.bairro ? ` - ${evento.enderecoCompleto.bairro}` : ""}
                  </p>
                )}

                <p className="text-slate-500 dark:text-slate-400">
                  {evento.cidadeEstado}
                  {evento.enderecoCompleto?.cep ? ` • CEP ${evento.enderecoCompleto.cep}` : ""}
                </p>
              </div>

              <a
                href={getMapsUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-blue-900/60 bg-slate-50/80 dark:bg-[#071321]/60 hover:bg-white dark:hover:bg-[#0c1e33] text-blue-600 dark:text-blue-400 text-xs font-semibold transition-all cursor-pointer"
              >
                <Navigation className="w-4 h-4" />
                <span>Como Chegar no Google Maps</span>
              </a>
            </div>

            {/* Card de Organização & Contatos */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#0c1e33] border border-slate-200/90 dark:border-blue-900/50 shadow-xs space-y-4">
              <h3 className="font-montserrat font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Organização & Gestão
              </h3>

              <div className="space-y-2 text-xs sm:text-sm">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px] uppercase tracking-wider">
                    Promotor Responsável
                  </span>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {evento.organizacao || "Céos System Eventos Científicos"}
                  </p>
                </div>

                {evento.publicoAlvo && (
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px] uppercase tracking-wider">
                      Público-Alvo
                    </span>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {evento.publicoAlvo}
                    </p>
                  </div>
                )}
              </div>

              {/* Redes Sociais */}
              {evento.redesSociais && (
                <div className="pt-3 border-t border-slate-100 dark:border-blue-900/40">
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 block mb-2">
                    Siga o Evento
                  </span>
                  <div className="flex items-center gap-2">
                    {evento.redesSociais.instagram && (
                      <a
                        href={
                          evento.redesSociais.instagram.startsWith("http")
                            ? evento.redesSociais.instagram
                            : `https://instagram.com/${evento.redesSociais.instagram.replace("@", "")}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-slate-100 dark:bg-[#071321] text-slate-600 dark:text-slate-300 hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-950/40 transition-colors"
                        title="Instagram"
                      >
                        <InstagramIcon className="w-4 h-4" />
                      </a>
                    )}

                    {evento.redesSociais.linkedin && (
                      <a
                        href={
                          evento.redesSociais.linkedin.startsWith("http")
                            ? evento.redesSociais.linkedin
                            : `https://linkedin.com/in/${evento.redesSociais.linkedin}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-slate-100 dark:bg-[#071321] text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                        title="LinkedIn"
                      >
                        <LinkedinIcon className="w-4 h-4" />
                      </a>
                    )}

                    {evento.redesSociais.facebook && (
                      <a
                        href={
                          evento.redesSociais.facebook.startsWith("http")
                            ? evento.redesSociais.facebook
                            : `https://facebook.com/${evento.redesSociais.facebook}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-slate-100 dark:bg-[#071321] text-slate-600 dark:text-slate-300 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                        title="Facebook"
                      >
                        <FacebookIcon className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Card de Compartilhamento */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#0c1e33] border border-slate-200/90 dark:border-blue-900/50 shadow-xs space-y-4">
              <h3 className="font-montserrat font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Share2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Compartilhe com Colegas
              </h3>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleShare}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#071321] dark:hover:bg-blue-950/60 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Share2 className="w-4 h-4 text-blue-500" />
                  <span>Compartilhar Evento</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-blue-900/50 hover:bg-slate-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        Link copiado com sucesso!
                      </span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-400" />
                      <span>Copiar link da página</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>

        </div>

        

      </div>

      {/* Modal de Confirmação de Exclusão */}
      {modalExcluir && evento && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#0c1e33] border border-slate-200 dark:border-blue-900/40 rounded-3xl p-6 sm:p-7 space-y-4 shadow-2xl animate-in fade-in">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-montserrat font-bold text-base text-slate-900 dark:text-white">
                  Excluir Evento
                </h3>
                <p className="text-xs text-slate-500">Ação irreversível</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Você tem certeza de que deseja excluir permanentemente o evento{" "}
              <strong>&ldquo;{evento.titulo}&rdquo;</strong>? Todas as informações, ingressos e programações associadas serão removidos do banco de dados.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={excluindo}
                onClick={() => setModalExcluir(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-blue-900/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={excluindo}
                onClick={handleExcluirEvento}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {excluindo ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Sim, Excluir Evento</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
    
  );
}
