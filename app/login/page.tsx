"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulação visual de envio
    setTimeout(() => {
      setIsLoading(false);
      setLoginSuccess(true);
    }, 1200);
  };

  return (
    <main className="relative min-h-[calc(100vh-73px)] w-full flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12 bg-[#fafafa] dark:bg-[#0a1929] text-slate-900 dark:text-slate-100 transition-colors duration-200 overflow-hidden fade-in">
      {/* Luz ambiente com blur suave no centro */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 sm:w-[480px] lg:w-[620px] h-72 sm:h-[480px] lg:h-[620px] bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-[100px] sm:blur-[140px] pointer-events-none"
      />

      <div className="relative z-10 w-full max-w-md mx-auto drop">

        {/* Card Principal de Login */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white/85 dark:bg-[#0c1e33]/90 border border-slate-200/90 dark:border-blue-900/40 shadow-xl sm:shadow-2xl shadow-blue-500/5 dark:shadow-black/40 backdrop-blur-md">
        <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          </Link>
          {/* Cabeçalho do Card */}
          <div className="flex flex-col items-center text-center space-y-2.5 mb-6 sm:mb-8">

            <h1 className="font-montserrat text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Entrar na sua conta
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300/90 leading-relaxed max-w-sm">
              Gerencie suas inscrições, certificados digitais e trabalhos submetidos na Céos System.
            </p>
          </div>

          {loginSuccess ? (
            <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-center space-y-2 fade-in">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-montserrat font-bold text-base text-emerald-800 dark:text-emerald-300">
                Acesso identificado com sucesso!
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                Redirecionando para a área do congressista...
              </p>
            </div>
          ) : (
            /* Formulário */
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {/* Campo E-mail */}
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200"
                >
                  E-mail institucional ou pessoal
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                  <input
                    type="email"
                    id="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="exemplo@universidade.edu.br"
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl bg-slate-50/70 dark:bg-[#071321]/70 border border-slate-200 dark:border-blue-900/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 dark:focus:border-blue-500 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Campo Senha */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200"
                  >
                    Senha
                  </label>
                  <Link
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      alert("Para redefinir sua senha, solicite o link de recuperação pelo seu e-mail cadastrado.");
                    }}
                    className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline transition-all cursor-pointer"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>

                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-2.5 sm:py-3 rounded-xl bg-slate-50/70 dark:bg-[#071321]/70 border border-slate-200 dark:border-blue-900/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 dark:focus:border-blue-500 transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Ocultar senha" : "Ver senha"}
                    className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Opção Lembrar de mim */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 dark:border-blue-900/60 text-blue-600 focus:ring-blue-500/30 dark:bg-[#071321] cursor-pointer accent-blue-600"
                  />
                  <span>Lembrar deste dispositivo</span>
                </label>
              </div>

              {/* Botão de Envio */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] disabled:opacity-70 text-white font-semibold text-xs sm:text-sm shadow-md hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 group"
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Autenticando...</span>
                  </span>
                ) : (
                  <>
                    <span>Acessar Plataforma</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Chamada para Cadastro */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:divide-slate-800 dark:border-blue-900/30 text-center">
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Ainda não possui uma conta?{" "}
              <Link
                href="/registro"
                className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 hover:underline transition-colors"
              >
                Cadastre-se gratuitamente
              </Link>
            </p>
          </div>
        </div>

        {/* Informação de Segurança / Rodapé */}
        <p className="mt-6 text-center text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          <span>Ambiente seguro Céos System com criptografia de ponta a ponta</span>
        </p>
      </div>
    </main>
  );
}