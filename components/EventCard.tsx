import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  Share2,
  Tag,
} from "lucide-react";
import { getStatusBadgeConfig } from "@/lib/eventStatus";

export interface Palestrante {
  nome: string;
  eixo?: string;
  instituicao?: string;
  foto?: string;
  fotoUrl?: string;
  cargo?: string;
  especialidade?: string;
  bio?: string;
}

export interface Minicurso {
  nome: string;
  tipo: string;
  imagemUrl?: string;
  local?: string;
  descricao?: string;
}

export interface Evento {
  id: string | number;
  titulo: string;
  subtitulo?: string;
  descricaoCompleta?: string;
  categoria: string;
  status: string;
  dataInscricaoInicio?: string;
  dataInscricaoFim?: string;
  horaInscricaoInicio?: string;
  horaInscricaoFim?: string;
  local: string;
  cidadeEstado: string;
  data: string;
  horario: string;
  site?: string;
  img: string;
  destaque?: boolean;
  publicoAlvo?: string;
  cargaHoraria?: string;
  modalidade?: string;
  organizacao?: string;
  valorOuInscricao?: string;
  palestrantes?: (string | Palestrante)[];
  palestrantes_img?: string[];
  minicursos?: Minicurso[];
}

interface EventCardProps {
  evento: Evento;
  onVerDetalhes?: (evento: Evento) => void;
}

export default function EventCard({ evento, onVerDetalhes }: EventCardProps) {
  const router = useRouter();

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const eventUrl = typeof window !== "undefined"
      ? `${window.location.origin}/eventos/${evento.id}`
      : `/eventos/${evento.id}`;

    if (navigator.share) {
      navigator
        .share({
          title: evento.titulo,
          text: `${evento.titulo} em ${evento.cidadeEstado} (${evento.data})`,
          url: eventUrl,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(eventUrl);
      alert("Link do evento copiado para a área de transferência!");
    }
  };

  const handleCardClick = () => {
    if (onVerDetalhes) {
      onVerDetalhes(evento);
    } else {
      router.push(`/eventos/${evento.id}`);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative flex flex-col bg-white dark:bg-[#0c1e33]/90 rounded-2xl overflow-hidden border border-slate-200/90 dark:border-blue-900/40 shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1.5 transition-all duration-300 w-full cursor-pointer"
    >
      {/* Container da Imagem com Badges Flutuantes */}
      <div className="relative w-full aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-800">
        <Image
          src={evento.img}
          alt={evento.titulo}
          fill
          className="object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Gradiente escuro para legibilidade */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent pointer-events-none" />

        {/* Status Badge */}
        {(() => {
          const badge = getStatusBadgeConfig(evento.status);
          return (
            <div className={`absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide backdrop-blur-md shadow-sm border ${badge.badgeClass}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`} />
              <span>{evento.status}</span>
            </div>
          );
        })()}

        {/* Badge de Categoria / Tag */}
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium tracking-wide bg-slate-900/75 text-slate-200 backdrop-blur-md border border-white/10">
          <Tag className="w-3 h-3 text-blue-400" />
          <span>{evento.categoria}</span>
        </div>

        {/* Local destacado sobre a base da imagem */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center gap-1.5 text-xs font-semibold text-white/95 drop-shadow-sm">
          <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span className="truncate">{evento.cidadeEstado}</span>
        </div>
      </div>

      {/* Conteúdo do Card */}
      <div className="p-5 flex flex-col flex-1 justify-between gap-4">
        <div className="space-y-2.5">
          {/* Título com clamp e destaque no hover */}
          <h3
            className="font-montserrat font-bold text-slate-900 dark:text-white text-base sm:text-[1.05rem] leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
            title={evento.titulo}
          >
            {evento.titulo}
          </h3>

          {/* Subtítulo / Descrição complementar se existir */}
          {evento.subtitulo && (
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
              {evento.subtitulo}
            </p>
          )}

          {/* Metadados estruturados com ícones */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400">
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <span className="font-medium">{evento.data}</span>
            </div>

            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <span className="font-medium">{evento.horario}</span>
            </div>

            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <span className="font-medium truncate">{evento.local}</span>
            </div>
          </div>
        </div>

        {/* Rodapé do Card com Ações */}
        <div className="pt-3.5 border-t border-slate-100 dark:border-blue-900/30 flex items-center gap-2">
          <Link
            href={`/eventos/${evento.id}`}
            onClick={(e) => {
              if (onVerDetalhes) {
                e.preventDefault();
                e.stopPropagation();
                onVerDetalhes(evento);
              }
            }}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white text-xs sm:text-sm font-semibold shadow-sm hover:shadow-md hover:shadow-blue-500/25 transition-all duration-200 cursor-pointer group/btn"
          >
            <span>Ver Detalhes</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
          </Link>

          <button
            type="button"
            onClick={handleShare}
            title="Compartilhar evento"
            aria-label="Compartilhar evento"
            className="p-2.5 rounded-xl border border-slate-200 dark:border-blue-900/50 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-blue-950/50 active:scale-95 transition-all duration-200 cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
