import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BookOpen, Award, Users } from "lucide-react";

export default function Home() {
  return (
    <main className="relative bg-[#fafafa] dark:bg-[#0a1929] w-full h-[calc(100vh-73px)] flex items-center justify-center px-4 sm:px-6 lg:px-12 lg:pt-24 py-2 overflow-hidden transition-colors fade-in">

      <div
        aria-hidden="true"
        className="absolute top-1/3 lg:top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 sm:w-[450px] lg:w-[550px] h-72 sm:h-[450px] lg:h-[550px] bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-[100px] sm:blur-[140px] pointer-events-none"
      />

      <div className="relative z-10 max-w-7xl w-full mx-auto flex flex-col-reverse lg:flex-row items-center justify-between gap-6 sm:gap-8 lg:gap-12 -translate-y-4 sm:-translate-y-6 lg:-translate-y-8">

        <div className="font-montserrat flex-1 w-full max-w-2xl flex flex-col items-center text-center lg:items-start lg:text-left space-y-4 lg:space-y-5 lg:mx-10">

          <h1 className="drop font-montserrat text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12]">
            Seja bem-vindo<span className="text-blue-600 dark:text-blue-400">!</span>
          </h1>
          <p className="drop text-xs sm:text-sm md:text-lg text-slate-600 dark:text-slate-300/90 leading-relaxed max-w-xl mx-auto lg:mx-0 ">
            Formada por professores com ampla experiência na realização de congressos científicos, a Céos System entende os desafios do seu evento. Por isso, criamos uma plataforma integrada que acompanha você desde a formatação até a publicação dos anais, assegurando o mais alto padrão de qualidade.
          </p>

          <div className="drop pt-1 flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3 w-full sm:w-auto">
            <Link
              href="/eventos"
              className="px-6 sm:px-7 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-semibold text-center text-xs sm:text-sm shadow-md hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200 cursor-pointer inline-flex items-center justify-center gap-2 group"
            >
              <span>Eventos</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="/sobre"
              className="px-6 sm:px-7 py-3 rounded-xl border border-slate-300 dark:border-blue-900/60 bg-white/70 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/80 active:scale-95 text-slate-700 dark:text-slate-200 font-semibold text-center text-xs sm:text-sm transition-all duration-200 cursor-pointer backdrop-blur-sm inline-flex items-center justify-center"
            >
              <span>Saiba mais</span>
            </Link>
          </div>

          {/* Os Três Cards mantidos com espaçamento vertical compacto */}
          <div className="drop pt-2 grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 w-full max-w-lg lg:max-w-none">
            <div className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl bg-white/80 dark:bg-[#0c1e33]/70 border border-slate-200/80 dark:border-blue-900/30 text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium shadow-xs">
              <Users className="w-4 h-4 text-blue-500 shrink-0" />
              <span>Gestão de Congressos</span>
            </div>
            <div className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl bg-white/80 dark:bg-[#0c1e33]/70 border border-slate-200/80 dark:border-blue-900/30 text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium shadow-xs">
              <BookOpen className="w-4 h-4 text-blue-500 shrink-0" />
              <span>Publicação de Anais</span>
            </div>
            <div className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl bg-white/80 dark:bg-[#0c1e33]/70 border border-slate-200/80 dark:border-blue-900/30 text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium shadow-xs">
              <Award className="w-4 h-4 text-blue-500 shrink-0" />
              <span>Certificados Digitais</span>
            </div>
          </div>

        </div>

        {/* Coluna da Imagem dos Palestrantes com Controle de Altura */}
        <div className="flex-1 w-full flex justify-center items-center">
          <div className="relative w-full max-w-[240px] sm:max-w-[320px] md:max-w-[380px] lg:max-w-[480px]">
            <Image
              src="/assets/palestrantes-removebg-preview.png"
              alt="Palestrantes e Eventos Científicos"
              width={480}
              height={440}
              priority
              className="w-full h-auto max-h-[280px] sm:max-h-[350px] lg:max-h-[440px] lg:pl-25 object-contain drop pointer-events-none drop-shadow-2xl"
            />
          </div>
        </div>

      </div>
    </main>
  );
}
