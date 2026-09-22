"use client";

import { useState } from "react";
import Link from "next/link";
import {
  HelpCircle,
  ChevronDown,
  Mail,
  MessageSquare,
  Clock,
  ExternalLink,
  BookOpen,
  Sparkles,
  ShieldCheck,
  Send
} from "lucide-react";



export default function AjudaPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      pergunta: "Como faço para emitir meus certificados de participação?",
      resposta:
        "Os certificados ficam disponíveis na aba 'Certificados' do seu painel logo após o término do evento e confirmação de presença no credenciamento. Você pode baixar em PDF e compartilhar o código de autenticidade criptográfica diretamente com sua faculdade ou instituição.",
    },
    {
      pergunta: "Como funciona o credenciamento no dia do evento?",
      resposta:
        "Basta acessar a aba 'Inscrições' no seu painel pelo celular e clicar em 'Ver Credencial'. Apresente o QR Code gerado na recepção do evento para ter sua entrada e presença registradas instantaneamente.",
    },
    {
      pergunta: "Qual o prazo para envio e avaliação de trabalhos científicos?",
      resposta:
        "Cada congresso possui seu cronograma específico na página oficial do evento. Uma vez submetido o resumo, o parecer da banca examinadora (aprovado, correções necessárias ou oral/banner) é atualizado em tempo real na aba 'Trabalhos'.",
    },
    {
      pergunta: "Sou promotor, como crio e publico um evento científico?",
      resposta:
        "Se o seu perfil for de Promotor, você pode clicar no botão 'Criar Novo Evento' presente na barra lateral ou acessar a aba 'Meus Eventos'. O assistente intuitivo guiará você por todas as etapas (dados básicos, datas, lotes de ingressos, palestrantes e dados bancários).",
    },
    {
      pergunta: "Os certificados contam com validação oficial e registro DOI?",
      resposta:
        "Sim! Todo certificado emitido pela plataforma Céos System possui um código de identificação unívoco e QR Code com chave pública para validação de autenticidade pelas secretarias acadêmicas de qualquer universidade do Brasil.",
    },
  ];

  return (
    <div className="space-y-8">
      
      {/* Cabeçalho */}
      <div>
        <h1 className="font-montserrat text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          Ajuda & Central de Suporte
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Tire dúvidas frequentes sobre a plataforma, inscrições, certificados e entre em contato com nossa equipe.
        </p>
      </div>

      {/* Canais Rápidos de Atendimento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        <a
          href="https://api.whatsapp.com/send?phone=5511999999999&text=Ol%C3%A1%2C%20preciso%20de%20suporte%20na%20C%C3%A9os%20System"
          target="_blank"
          rel="noopener noreferrer"
          className="p-5 rounded-3xl bg-white dark:bg-[#0c1e33] border border-slate-200/90 dark:border-blue-900/40 shadow-xs hover:border-emerald-500 transition-all flex items-start gap-4 group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-montserrat font-bold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
              WhatsApp Oficial
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Atendimento ágil para congressistas e organizadores
            </p>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-2 inline-flex items-center gap-1">
              Iniciar conversa
              <ExternalLink className="w-3 h-3" />
            </span>
          </div>
        </a>

        <Link
          href="/contato"
          className="p-5 rounded-3xl bg-white dark:bg-[#0c1e33] border border-slate-200/90 dark:border-blue-900/40 shadow-xs hover:border-blue-500 transition-all flex items-start gap-4 group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-montserrat font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
              Fale Conosco
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Envie uma mensagem direta para nossa equipe
            </p>
            <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 mt-2 inline-flex items-center gap-1">
              Abrir formulário de contato
              <Send className="w-3 h-3" />
            </span>
          </div>
        </Link>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#0c1e33] border border-slate-200/90 dark:border-blue-900/40 shadow-xs flex items-start gap-4">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-montserrat font-bold text-sm text-slate-900 dark:text-white">
              Horário de Atendimento
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Segunda a Sexta, das 08h às 18h (Horário de Brasília)
            </p>
            <span className="text-[11px] font-medium text-purple-600 dark:text-purple-400 mt-2 block">
              Plantão em dias de congressos
            </span>
          </div>
        </div>
      </div>

      {/* Dúvidas Frequentes (Accordion) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0c1e33] border border-slate-200/90 dark:border-blue-900/40 shadow-xs space-y-4">
        <h2 className="font-montserrat font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          Perguntas Frequentes (FAQ)
        </h2>

        <div className="space-y-3 pt-2">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200/80 dark:border-blue-900/30 bg-slate-50/50 dark:bg-[#071321]/40 overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-4.5 text-left flex items-center justify-between gap-4 font-semibold text-xs sm:text-sm text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                >
                  <span>{faq.pergunta}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-blue-600" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-4 sm:px-4.5 pb-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-blue-900/30 pt-3">
                    {faq.resposta}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
