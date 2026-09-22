"use client";

import { useEffect } from "react";
import Image from "next/image";
import {
  X,
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
  AlertCircle,
} from "lucide-react";
import { Evento } from "@/components/EventCard";
import { getStatusBadgeConfig, getEventRegistrationStatus } from "@/lib/eventStatus";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  evento: Evento | null;
}

export default function Modal({ isOpen, onClose, evento }: ModalProps) {
  // Fechar ao pressionar a tecla ESC
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

  if (!isOpen || !evento) return null;

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    if (navigator.share) {
      navigator
        .share({
          title: evento.titulo,
          text: `${evento.titulo} - ${evento.cidadeEstado}`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link do evento copiado para a área de transferência!");
    }
  };

  return (
    <div
      className="w-screen h-screen fade-in fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/75 backdrop-blur-sm transition-opacity duration-300 overflow-y-auto"
      onClick={onClose}
      aria-labelledby="modal-event-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Container Principal do Modal com proporções amplas */}
      <div
        className="relative w-full max-w-4xl lg:max-w-5xl my-auto bg-white dark:bg-[#0c1e33] border border-slate-200 dark:border-blue-900/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-all transform duration-300 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão de Fechar */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar modal"
          className="absolute top-4 right-4 z-30 p-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all shadow-sm cursor-pointer hover:scale-105 active:scale-95"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Topo do Evento: Imagem Compacta Lado a Lado com Informações Chave */}
        <div className="p-5 sm:p-6 bg-slate-50/80 dark:bg-[#071321]/60 border-b border-slate-200/80 dark:border-blue-900/40 flex flex-col sm:flex-row items-start gap-4 sm:gap-6 shrink-0">
          
          {/* Imagem Proporcional e Equilibrada */}
          <div className="relative w-full sm:w-56 md:w-64 lg:w-72 aspect-[16/10] sm:aspect-[4/3] rounded-2xl overflow-hidden shrink-0 shadow-md bg-slate-200 dark:bg-slate-800">
            <Image
              src={evento.img}
              alt={evento.titulo}
              fill
              className="object-cover object-center"
            />
            {/* Status Badge sobre a imagem */}
            {(() => {
              const status = getEventRegistrationStatus(evento);
              const badge = getStatusBadgeConfig(status);
              return (
                <div className={`absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold backdrop-blur-md shadow-sm border ${badge.badgeClass}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`} />
                  <span>{status}</span>
                </div>
              );
            })()}
          </div>

          {/* Dados Principais do Evento ao lado da imagem */}
          <div className="flex-1 min-w-0 space-y-2.5 sm:pr-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
                <Tag className="w-3 h-3 text-blue-500" />
                <span>{evento.categoria}</span>
              </span>
            </div>

            <h2
              id="modal-event-title"
              className="font-montserrat text-lg sm:text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white leading-snug"
            >
              {evento.titulo}
            </h2>

            {evento.subtitulo && (
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300/90 line-clamp-2">
                {evento.subtitulo}
              </p>
            )}

            {/* Grid 2x2 de Metadados Chave Compactos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="font-medium truncate">{evento.data}</span>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                <Clock className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="font-medium truncate">{evento.horario}</span>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="font-medium truncate">{evento.local} • {evento.cidadeEstado}</span>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                <Award className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="font-medium truncate">
                  {evento.cargaHoraria ? `${evento.cargaHoraria} Horas Complementares` : "Certificado Incluso"}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Conteúdo com Rolagem Fluida e Espaçosa */}
        <div className="p-5 sm:p-7 space-y-6 overflow-y-auto flex-1 text-slate-800 dark:text-slate-100">
          
          {/* Palestrantes em Destaque */}
          {evento.palestrantes && evento.palestrantes.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-montserrat text-lg sm:text-xl font-bold text-[#0c1e33] dark:text-blue-400">
                Palestrantes
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {evento.palestrantes.map((palestrante, idx) => {
                  const isObj = typeof palestrante === "object" && palestrante !== null;
                  const nome = isObj ? palestrante.nome : palestrante;
                  const especialidade = isObj ? palestrante.especialidade : undefined;
                  const instituicao = isObj ? (palestrante.instituicao || palestrante.cargo) : undefined;
                  const foto = isObj && (palestrante.fotoUrl || palestrante.foto)
                    ? (palestrante.fotoUrl || palestrante.foto)
                    : evento.palestrantes_img && evento.palestrantes_img[idx]
                    ? evento.palestrantes_img[idx]
                    : undefined;

                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white dark:bg-[#071321]/80 border border-slate-200/90 dark:border-blue-900/40 shadow-xs hover:shadow-md transition-shadow"
                    >
                      {foto ? (
                        <div className="relative w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-full border border-slate-100 dark:border-slate-800 shadow-xs overflow-hidden">
                          <Image
                            src={foto}
                            alt={nome}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-base shrink-0 border border-blue-200/60 dark:border-blue-800/50">
                          {nome ? nome.charAt(0).toUpperCase() : "P"}
                        </div>
                      )}

                      <div className="min-w-0 flex flex-col justify-center">
                        <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm leading-snug">
                          {nome}
                        </h4>
                        {especialidade && (
                          <p className="text-blue-600 dark:text-blue-400 text-xs font-medium leading-tight mt-0.5">
                            {especialidade}
                          </p>
                        )}
                        {instituicao && (
                          <p className="text-[10px] sm:text-[11px] uppercase tracking-wide text-slate-700 dark:text-slate-300 font-semibold leading-tight mt-0.5">
                            {instituicao}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Minicursos */}
          {evento.minicursos && evento.minicursos.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="font-montserrat text-lg sm:text-xl font-bold text-[#0c1e33] dark:text-blue-400">
                Minicursos Associados
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {evento.minicursos.map((minicurso, idx) => (
                  <div key={idx} className="flex gap-4 p-3 rounded-2xl bg-white dark:bg-[#071321]/80 border border-slate-200/90 dark:border-blue-900/40 hover:shadow-md transition-shadow">
                    {minicurso.imagemUrl && (
                      <div className="relative w-20 h-20 shrink-0 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-xs">
                        <Image src={minicurso.imagemUrl} alt={minicurso.nome} fill className="object-cover" />
                      </div>
                    )}
                    <div className="flex flex-col justify-center min-w-0">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-snug truncate">{minicurso.nome}</h4>
                      <p className="text-blue-600 dark:text-blue-400 text-xs font-semibold mt-0.5">{minicurso.tipo}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Seção Sobre o Evento */}
          <div className="space-y-2.5">
            <h3 className="font-montserrat text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              Sobre o Evento
            </h3>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              {evento.descricaoCompleta ||
                evento.subtitulo ||
                "Este evento reúne os principais especialistas, pesquisadores e estudantes para compartilhar inovações científicas, discussões temáticas aprofundadas e networking acadêmico de alto impacto."}
            </p>
          </div>

          {/* Destaques e Benefícios */}
          <div className="space-y-2.5">
            <h3 className="font-montserrat text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              O que está incluso
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Acesso a todas as palestras e painéis</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Certificado digital com verificação online</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Submissão e publicação de resumos/anais</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Material de apoio oficial do evento</span>
              </div>
            </div>
          </div>

          {/* Informações Institucionais */}
          <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
              <div>
                <span className="font-semibold text-slate-900 dark:text-white block">
                  Organização & Gestão
                </span>
                <span className="text-slate-600 dark:text-slate-300">
                  {evento.organizacao || "Plataforma Céos System"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
              <div>
                <span className="font-semibold text-slate-900 dark:text-white block">
                  Público-Alvo
                </span>
                <span className="text-slate-600 dark:text-slate-300">
                  {evento.publicoAlvo || "Estudantes e Profissionais"}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Rodapé Fixo com Ações */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-blue-900/40 bg-slate-50/90 dark:bg-[#071321]/95 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-blue-900/50 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-blue-950/60 transition-colors text-xs sm:text-sm font-semibold cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Compartilhar</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors text-xs sm:text-sm font-medium cursor-pointer"
            >
              Fechar
            </button>
          </div>

          {(() => {
            const status = getEventRegistrationStatus(evento);
            if (status === "Inscrições Abertas") {
              return (
                <a
                  href={evento.site || "#"}
                  target={evento.site && evento.site !== "#" ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200 cursor-pointer"
                >
                  <Ticket className="w-4 h-4" />
                  <span>Garantir Inscrição</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>
              );
            }
            if (status === "Em Breve") {
              return (
                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-xs sm:text-sm font-semibold border border-slate-200 dark:border-slate-700/60 cursor-not-allowed select-none"
                >
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>Inscrições em Breve</span>
                </button>
              );
            }
            return (
              <button
                type="button"
                disabled
                aria-disabled="true"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-xs sm:text-sm font-semibold border border-slate-200 dark:border-slate-700/60 cursor-not-allowed select-none"
              >
                <AlertCircle className="w-4 h-4 text-slate-400" />
                <span>Inscrições Encerradas</span>
              </button>
            );
          })()}
        </div>
      </div>
    </div>
  );
}