"use client";

import React, { useState } from "react";
import {
  enviarCodigoVerificacao,
  enviarEmailIngressoCredenciamento,
  enviarEmailNotificacaoAvaliador,
} from "@/lib/mail";

export default function TesteEmailsPage() {
  const [emailDestino, setEmailDestino] = useState("gabriel2027diasss@gmail.com");
  const [nomeDestino, setNomeDestino] = useState("Gabriel Dias");
  const [loadingTipo, setLoadingTipo] = useState<string | null>(null);
  const [log, setLog] = useState<{ tipo: string; sucesso: boolean; mensagem: string } | null>(null);

  const testarCodigoRegistro = async () => {
    if (!emailDestino.trim()) {
      alert("Informe um e-mail válido.");
      return;
    }
    setLoadingTipo("registro");
    setLog(null);
    try {
      const codigoOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const res = await enviarCodigoVerificacao({
        para: emailDestino.trim(),
        nomeDestinatario: nomeDestino.trim() || "Gabriel",
        assunto: "Confirme seu endereço de e-mail - Céos System",
        codigo: codigoOtp,
      });

      if (res.sucesso) {
        setLog({
          tipo: "Código de Registro (OTP)",
          sucesso: true,
          mensagem: `E-mail de verificação com o código [ ${codigoOtp} ] enviado com sucesso para ${emailDestino}! Verifique sua caixa de entrada no Gmail.`,
        });
      } else {
        setLog({
          tipo: "Código de Registro (OTP)",
          sucesso: false,
          mensagem: `Falha no envio: ${res.erro || "Erro desconhecido"} (Método: ${res.metodo})`,
        });
      }
    } catch (e: any) {
      setLog({
        tipo: "Código de Registro (OTP)",
        sucesso: false,
        mensagem: e?.message || String(e),
      });
    } finally {
      setLoadingTipo(null);
    }
  };

  const testarEmailInscricao = async () => {
    if (!emailDestino.trim()) {
      alert("Informe um e-mail válido.");
      return;
    }
    setLoadingTipo("inscricao");
    setLog(null);
    try {
      const codigoIngresso = `CEOS-${Math.floor(10000 + Math.random() * 90000)}`;
      const res = await enviarEmailIngressoCredenciamento({
        para: emailDestino.trim(),
        nomeDestinatario: nomeDestino.trim() || "Gabriel",
        eventoTitulo: "Congresso Nacional de Saúde & Tecnologia 2026",
        codigoIngresso,
        lote: "Avaliador & Participante - Lote Único",
        dataEvento: "20 a 24 de Novembro de 2026",
        localEvento: "Centro de Convenções / Pavilhão A",
      });

      if (res.sucesso) {
        setLog({
          tipo: "Confirmação de Inscrição (Credencial)",
          sucesso: true,
          mensagem: `E-mail de ingresso com o código [ ${codigoIngresso} ] enviado com sucesso para ${emailDestino}! Verifique sua caixa de entrada no Gmail.`,
        });
      } else {
        setLog({
          tipo: "Confirmação de Inscrição (Credencial)",
          sucesso: false,
          mensagem: `Falha no envio: ${res.erro || "Erro desconhecido"} (Método: ${res.metodo})`,
        });
      }
    } catch (e: any) {
      setLog({
        tipo: "Confirmação de Inscrição (Credencial)",
        sucesso: false,
        mensagem: e?.message || String(e),
      });
    } finally {
      setLoadingTipo(null);
    }
  };

  const testarEmailAvaliador = async () => {
    if (!emailDestino.trim()) {
      alert("Informe um e-mail válido.");
      return;
    }
    setLoadingTipo("avaliador");
    setLog(null);
    try {
      const appUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
      const linkAvaliacao = `${appUrl}/avaliar/lorem?email=${encodeURIComponent(emailDestino.trim())}`;
      const res = await enviarEmailNotificacaoAvaliador({
        para: emailDestino.trim(),
        nomeAvaliador: nomeDestino.trim() || "Gabriel",
        eventoTitulo: "Congresso Nacional de Saúde & Tecnologia 2026",
        trabalhoTitulo: "Lorem Ipsum Dolor Sit Amet: Análise Empírica da Metodologia e Impacto Científico",
        areaTrabalho: "Ciências da Saúde & Inovação Biomédica",
        linkAvaliacao,
        prazoLimite: "28/11/2026",
      });

      if (res.sucesso) {
        setLog({
          tipo: "Designação de Avaliador (Banca)",
          sucesso: true,
          mensagem: `E-mail de avaliação com botão de acesso enviado com sucesso para ${emailDestino}! Verifique sua caixa de entrada no Gmail.`,
        });
      } else {
        setLog({
          tipo: "Designação de Avaliador (Banca)",
          sucesso: false,
          mensagem: `Falha no envio: ${res.erro || "Erro desconhecido"} (Método: ${res.metodo})`,
        });
      }
    } catch (e: any) {
      setLog({
        tipo: "Designação de Avaliador (Banca)",
        sucesso: false,
        mensagem: e?.message || String(e),
      });
    } finally {
      setLoadingTipo(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-block px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-semibold uppercase tracking-wider mb-3">
            Céos System • Testador de Templates
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Validação de E-mails com Template Único Adaptável
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Dispare os diferentes tipos de e-mails para conferir como o novo template do EmailJS se adapta automaticamente para cada mensagem.
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Seu Nome:
            </label>
            <input
              type="text"
              value={nomeDestino}
              onChange={(e) => setNomeDestino(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="Seu nome"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              E-mail de Destino (onde você vai receber):
            </label>
            <input
              type="email"
              value={emailDestino}
              onChange={(e) => setEmailDestino(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="seuemail@gmail.com"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={testarCodigoRegistro}
            disabled={loadingTipo !== null}
            className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-indigo-900/40 to-blue-900/30 hover:from-indigo-900/60 hover:to-blue-900/50 border border-indigo-700/50 rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-center group cursor-pointer"
          >
            <span className="text-2xl mb-2">🔐</span>
            <span className="font-semibold text-white text-sm">Código OTP</span>
            <span className="text-xs text-indigo-300/80 mt-1">
              {loadingTipo === "registro" ? "Enviando..." : "Registro & Login"}
            </span>
          </button>

          <button
            onClick={testarEmailInscricao}
            disabled={loadingTipo !== null}
            className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-emerald-900/40 to-teal-900/30 hover:from-emerald-900/60 hover:to-teal-900/50 border border-emerald-700/50 rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-center group cursor-pointer"
          >
            <span className="text-2xl mb-2">🎟</span>
            <span className="font-semibold text-white text-sm">Inscrição</span>
            <span className="text-xs text-emerald-300/80 mt-1">
              {loadingTipo === "inscricao" ? "Enviando..." : "Ingresso & Credencial"}
            </span>
          </button>

          <button
            onClick={testarEmailAvaliador}
            disabled={loadingTipo !== null}
            className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-violet-900/40 to-purple-900/30 hover:from-violet-900/60 hover:to-purple-900/50 border border-violet-700/50 rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-center group cursor-pointer"
          >
            <span className="text-2xl mb-2">⚖️</span>
            <span className="font-semibold text-white text-sm">Avaliador</span>
            <span className="text-xs text-violet-300/80 mt-1">
              {loadingTipo === "avaliador" ? "Enviando..." : "Comissão Científica"}
            </span>
          </button>
        </div>

        {/* Link direto para abrir a página de avaliação em tela cheia com Lorem Ipsum */}
        <div className="mt-5 p-4 rounded-xl bg-violet-950/30 border border-violet-800/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <p className="text-xs font-bold text-violet-200">
              Quer testar a página de avaliação agora no navegador?
            </p>
            <p className="text-[11px] text-violet-300/70 mt-0.5">
              Visualize a ficha completa com resumo em Lorem Ipsum, critérios com barras deslizantes e avaliação às cegas.
            </p>
          </div>
          <a
            href={`/avaliar/lorem?email=${encodeURIComponent(emailDestino.trim())}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-lg transition-colors shadow-sm inline-block"
          >
            Abrir Página com Lorem &rarr;
          </a>
        </div>

        {log && (
          <div
            className={`mt-6 p-4 rounded-xl border text-sm ${
              log.sucesso
                ? "bg-emerald-950/40 border-emerald-800 text-emerald-200"
                : "bg-red-950/40 border-red-800 text-red-200"
            }`}
          >
            <div className="font-semibold flex items-center gap-2 mb-1">
              <span>{log.sucesso ? "✅ Disparo Realizado!" : "❌ Erro no Disparo"}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {log.tipo}
              </span>
            </div>
            <p className="text-xs leading-relaxed opacity-90">{log.mensagem}</p>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-slate-800/80 text-center">
          <p className="text-xs text-slate-500">
            Todos os 3 disparos utilizam o mesmo template universal (`template_twoheg4`) adaptando seu layout via EmailJS.
          </p>
        </div>
      </div>
    </div>
  );
}
