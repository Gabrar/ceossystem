"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Mail,
  Phone,
  MessageSquare,
  Clock,
  MapPin,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Sparkles,
  Building2
} from "lucide-react";
import { sendContactEmail } from "@/lib/emailjs";

export default function ContatoPage() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [assunto, setAssunto] = useState("Dúvidas sobre Inscrições & Pagamento");
  const [mensagem, setMensagem] = useState("");

  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Verifica se as chaves do EmailJS estão configuradas no ambiente
  const emailJsConfigurado = Boolean(
    process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID &&
    process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID &&
    process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!nome.trim() || !email.trim() || !mensagem.trim()) {
      setErro("Por favor, preencha todos os campos obrigatórios (Nome, E-mail e Mensagem).");
      return;
    }

    try {
      setLoading(true);

      await sendContactEmail({
        nome,
        email,
        telefone,
        assunto,
        mensagem,
      });

      setSucesso(true);
      setNome("");
      setEmail("");
      setTelefone("");
      setMensagem("");
    } catch (err: any) {
      console.error("Erro ao enviar mensagem via EmailJS:", err);
      setErro(
        err.message ||
        "Não foi possível enviar sua mensagem no momento. Por favor, tente novamente ou entre em contato pelo nosso WhatsApp ou e-mail direto."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-[calc(100vh-73px)] bg-[#fafafa] dark:bg-[#0a1929] text-slate-900 dark:text-slate-100 py-12 px-4 sm:px-6 lg:px-8 transition-colors fade-in overflow-hidden">
      
      {/* Efeito de luz ambiente azul suave */}
      <div
        aria-hidden="true"
        className="absolute top-20 left-1/2 -translate-x-1/2 w-96 sm:w-[600px] h-96 sm:h-[600px] bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-[140px] pointer-events-none"
      />

      <div className="relative z-10 max-w-6xl mx-auto space-y-12">
        
        {/* Cabeçalho da Página */}
        <header className="text-center space-y-3.5 max-w-2xl mx-auto">
          

          <h1 className="font-montserrat text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            Fale Conosco
          </h1>

          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
            Dúvidas sobre inscrições, submissão de trabalhos, emissão de certificados ou interesse em organizar um congresso científico com nossa plataforma? Envie sua mensagem.
          </p>
        </header>

        {/* Banner Informativo se as Chaves do EmailJS ainda não estiverem no .env.local */}
        {!emailJsConfigurado && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-200 text-xs sm:text-sm flex items-start gap-3 shadow-xs">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="block font-semibold">
                Configuração do EmailJS pendente no .env.local
              </strong>
              <p className="text-amber-700 dark:text-amber-300/90 text-xs leading-relaxed">
                Para que os e-mails sejam disparados para a sua caixa de entrada, preencha as variáveis{" "}
                <code className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 font-mono text-[11px]">
                  NEXT_PUBLIC_EMAILJS_SERVICE_ID
                </code>
                ,{" "}
                <code className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 font-mono text-[11px]">
                  NEXT_PUBLIC_EMAILJS_TEMPLATE_ID
                </code>{" "}
                e{" "}
                <code className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 font-mono text-[11px]">
                  NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
                </code>{" "}
                com os dados da sua conta no EmailJS.
              </p>
            </div>
          </div>
        )}

        {/* Layout em 2 Colunas: Informações de Contato + Formulário com EmailJS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* =========================================================================
              COLUNA ESQUERDA (5 COLUNAS) - Canais Diretos & Informações
          ========================================================================== */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#0c1e33] border border-slate-200/90 dark:border-blue-900/40 shadow-xs space-y-5">
              <h2 className="font-montserrat font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Canais de Atendimento
              </h2>

              <div className="space-y-4">
                {/* E-mail */}
                <a
                  href="mailto:contato@ceossystem.com"
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-[#071321]/70 border border-slate-200/70 dark:border-blue-900/30 hover:border-blue-500 transition-colors flex items-start gap-3.5 group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block">
                      E-mail Direto
                    </span>
                    <p className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-200 group-hover:text-blue-600 transition-colors truncate">
                      contato@ceossystem.com
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Resposta em até 24 horas úteis</p>
                  </div>
                </a>

                {/* WhatsApp */}
                <a
                  href="https://api.whatsapp.com/send?phone=5511999999999&text=Ol%C3%A1%2C%20gostaria%20de%20falar%20com%20a%20equipe%20da%20C%C3%A9os%20System"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-[#071321]/70 border border-slate-200/70 dark:border-blue-900/30 hover:border-emerald-500 transition-colors flex items-start gap-3.5 group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block">
                      WhatsApp Oficial
                    </span>
                    <p className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 transition-colors">
                      +55 (11) 99999-9999
                    </p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
                      Atendimento rápido e suporte
                    </p>
                  </div>
                </a>

                {/* Horário */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#071321]/70 border border-slate-200/70 dark:border-blue-900/30 flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block">
                      Horário de Funcionamento
                    </span>
                    <p className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                      Segunda a Sexta, das 08h às 18h
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Plantão estendido durante os dias dos eventos
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card de FAQ / Dúvidas Frequentes */}
            <div className="p-6 rounded-3xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 space-y-3">
              <h3 className="font-montserrat font-bold text-sm text-blue-900 dark:text-blue-300 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Dúvidas Rápidas?
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Consulte nossa central de respostas sobre emissão de certificados, prazos de anais e credenciamento via QR Code.
              </p>
              <Link
                href="/usuario/painel/ajuda"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline pt-1"
              >
                <span>Acessar Perguntas Frequentes (FAQ)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>

          {/* =========================================================================
              COLUNA DIREITA (7 COLUNAS) - Formulário com Envio via EmailJS
          ========================================================================== */}
          <div className="lg:col-span-7">
            <div className="p-6 sm:p-9 rounded-3xl bg-white dark:bg-[#0c1e33] border border-slate-200/90 dark:border-blue-900/40 shadow-md space-y-6">
              
              <div>
                <h2 className="font-montserrat font-extrabold text-xl sm:text-2xl text-slate-900 dark:text-white">
                  Envie sua Mensagem
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Preencha os campos abaixo e nosso time entrará em contato com você o mais breve possível.
                </p>
              </div>

              {/* Mensagem de Sucesso */}
              {sucesso && (
                <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200 space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-2 font-bold text-sm text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span>Mensagem enviada com sucesso!</span>
                  </div>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300/90 leading-relaxed">
                    Agradecemos o seu contato. O formulário foi processado e nossa equipe responderá no e-mail informado.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSucesso(false)}
                    className="mt-2 text-xs font-semibold underline text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 cursor-pointer"
                  >
                    Enviar outra mensagem
                  </button>
                </div>
              )}

              {/* Mensagem de Erro */}
              {erro && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold">Erro ao enviar mensagem</strong>
                    <p className="text-xs text-rose-600 dark:text-rose-400/90 mt-0.5">{erro}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
                
                {/* Nome Completo */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nome Completo <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Dra. Mariana Albuquerque"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-blue-900/50 bg-slate-50/70 dark:bg-[#071321] text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs sm:text-sm transition-all"
                  />
                </div>

                {/* E-mail e Telefone em Linha */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      E-mail para Resposta <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="mariana@exemplo.com"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-blue-900/50 bg-slate-50/70 dark:bg-[#071321] text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs sm:text-sm transition-all"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Telefone / WhatsApp <span className="text-slate-400 font-normal">(Opcional)</span>
                    </label>
                    <input
                      type="tel"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      placeholder="(11) 99999-9999"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-blue-900/50 bg-slate-50/70 dark:bg-[#071321] text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs sm:text-sm transition-all"
                    />
                  </div>
                </div>

                {/* Assunto */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Assunto do Contato <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={assunto}
                    onChange={(e) => setAssunto(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-blue-900/50 bg-slate-50/70 dark:bg-[#071321] text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs sm:text-sm transition-all cursor-pointer"
                  >
                    <option value="Dúvidas sobre Inscrições & Pagamento">Dúvidas sobre Inscrições & Pagamento</option>
                    <option value="Submissão de Trabalhos Científicos">Submissão de Trabalhos Científicos</option>
                    <option value="Emissão e Autenticação de Certificados">Emissão e Autenticação de Certificados</option>
                    <option value="Quero Organizar meu Evento na Céos System">Quero Organizar meu Evento na Céos System</option>
                    <option value="Parcerias e Patrocínios">Parcerias e Patrocínios Institucionais</option>
                    <option value="Suporte Técnico / Outro">Suporte Técnico / Outro Assunto</option>
                  </select>
                </div>

                {/* Mensagem */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Sua Mensagem <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={mensagem}
                    onChange={(e) => setMensagem(e.target.value)}
                    placeholder="Descreva detalhadamente sua dúvida, solicitação ou proposta..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-blue-900/50 bg-slate-50/70 dark:bg-[#071321] text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs sm:text-sm transition-all resize-none"
                  />
                </div>

                {/* Botão de Envio */}
                <div className="pt-2 flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200 cursor-pointer inline-flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Enviando mensagem...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Enviar Mensagem</span>
                      </>
                    )}
                  </button>
                </div>

              </form>

            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
