import Link from "next/link";
import {
  CheckCircle2,
  Percent,
  ArrowRight,
} from "lucide-react";

interface FuncionalidadeItem {
  nome: string;
  descricao: string;
  destaque?: boolean;
}

export default function Sobre() {
  const funcionalidades: FuncionalidadeItem[] = [
    {
      nome: "Site",
      descricao: "Página oficial do evento, moderna, personalizada e 100% responsiva para computadores e celulares.",
    },
    {
      nome: "Inscrições",
      descricao: "Gestão completa de lotes, cupons de desconto, confirmação instantânea e pagamentos seguros.",
    },
    {
      nome: "Credenciamento",
      descricao: "Check-in em tempo real, rápido e sem filas no dia do evento através de aplicativo e web.",
    },
    {
      nome: "Certificados",
      descricao: "Geração e disparo automático de certificados digitais autenticados com código de validação online.",
    },
    {
      nome: "Anais",
      descricao: "Publicação, indexação e disponibilização online dos anais do evento com suporte a ISBN e DOI.",
    },
    {
      nome: "Programação",
      descricao: "Grade de horários dinâmica, interativa e organizada por eixos temáticos, salas e palestrantes.",
    },
    {
      nome: "Impressão de etiquetas / QR Code",
      descricao: "Emissão de crachás com QR Code para leitura rápida e controle de acesso preciso aos espaços.",
    },
    {
      nome: "Divulgação Patrocinadores",
      descricao: "Espaços de destaque estratégicos para exibição de marcas apoiadoras e parceiros institucionais.",
    },
    {
      nome: "Submissão de Trabalhos",
      descricao: "Fluxo completo para envio de resumos simples, expandidos e artigos completos em PDF.",
    },
    {
      nome: "Inscrição em Minicursos",
      descricao: "Gerenciamento de vagas limitadas e inscrições exclusivas em workshops, oficinas e minicursos.",
    },
    {
      nome: "Sistema de Avaliação",
      descricao: "Painel para pareceristas com distribuição de trabalhos e avaliação duplo-cega (blind review).",
    },
  ];

  return (
    <main className="relative min-h-[calc(100vh-73px)] bg-[#fafafa] dark:bg-[#0a1929] text-slate-900 dark:text-slate-100 py-12 px-4 sm:px-6 lg:px-8 transition-colors fade-in overflow-hidden">
      
      {/* Efeito de luz ambiente azul suave */}
      <div
        aria-hidden="true"
        className="absolute top-20 left-1/2 -translate-x-1/2 w-96 sm:w-[600px] h-96 sm:h-[600px] bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-[130px] pointer-events-none"
      />

      <div className="relative z-10 max-w-5xl mx-auto space-y-12">
        
        {/* Cabeçalho da Página */}
        <header className="text-center space-y-4 max-w-3xl mx-auto">
          

          <h1 className="font-montserrat text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            Transparência e excelência para o seu{" "}
            <span className="text-blue-600 dark:text-blue-400">
              evento científico
            </span>
          </h1>

          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Tenha uma infraestrutura completa do planejamento à publicação dos anais, com a menor taxa e sem custos surpresa.
          </p>
        </header>

        {/* Destaque de Taxa da Plataforma */}
        <section className="flex justify-center items-center w-full max-w-5xl mx-auto">
          <div className="w-full max-w-2xl relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-xl shadow-blue-500/15 overflow-hidden flex flex-col items-center text-center">
            <div className="absolute top-0 right-0 -translate-y-6 translate-x-6 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-3 relative z-10 w-full flex flex-col items-center">
              <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-blue-100/90 flex items-center justify-center gap-1.5">
                <Percent className="w-4 h-4" />
                Taxa da Plataforma
              </span>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <span className="font-montserrat text-5xl sm:text-6xl font-black tracking-tight">
                  8,00%
                </span>
                <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-white/20 backdrop-blur-sm text-white border border-white/30">
                  Sem tarifa mínima
                </span>
              </div>

              <p className="text-blue-100/90 text-xs sm:text-sm max-w-md mx-auto">
                Cobrado somente sobre inscrições pagas e confirmadas. Se não vender, você não paga nada.
              </p>
            </div>
          </div>
        </section>

        {/* Tabela de Funcionalidades */}
        <section aria-label="Tabela de Funcionalidades" className="space-y-4 max-w-5xl mx-auto">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 px-1">
            <div>
              <h2 className="font-montserrat font-bold text-xl sm:text-2xl text-slate-900 dark:text-white">
                Funcionalidades da Plataforma
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Todas as ferramentas essenciais já estão incluídas no plano padrão.
              </p>
            </div>
            <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Todos os 11 módulos inclusos</span>
            </div>
          </div>

          {/* Container Estilizado da Tabela */}
          <div className="bg-white dark:bg-[#0c1e33]/90 rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-blue-900/40 shadow-xl overflow-hidden backdrop-blur-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                {/* Cabeçalho da Tabela com visual azul sólido */}
                <thead>
                  <tr className="bg-blue-600 text-white font-montserrat">
                    <th
                      scope="col"
                      className="py-4 sm:py-4.5 px-5 sm:px-8 text-sm sm:text-base font-bold tracking-wide"
                    >
                      Funcionalidade
                    </th>
                    <th
                      scope="col"
                      className="py-4 sm:py-4.5 px-5 sm:px-8 text-center text-sm sm:text-base font-bold tracking-wide w-36 sm:w-44"
                    >
                      Incluído
                    </th>
                  </tr>
                </thead>

                {/* Corpo da Tabela com Linhas Elegantes */}
                <tbody className="divide-y divide-slate-100 dark:divide-blue-900/30">
                  {funcionalidades.map((item, index) => (
                    <tr
                      key={item.nome}
                      className={`group transition-colors duration-150 ${
                        index % 2 === 0
                          ? "bg-white dark:bg-[#0c1e33]/50"
                          : "bg-slate-50/50 dark:bg-[#071321]/40"
                      } hover:bg-blue-50/70 dark:hover:bg-blue-950/60`}
                    >
                      {/* Nome e Descrição da Funcionalidade */}
                      <td className="py-4 sm:py-4.5 px-5 sm:px-8">
                        <div className="space-y-0.5">
                          <span className="font-montserrat font-bold text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors block">
                            {item.nome}
                          </span>
                          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
                            {item.descricao}
                          </p>
                        </div>
                      </td>

                      {/* Coluna "Incluído" com Ícone de Confirmação Verde */}
                      <td className="py-4 sm:py-4.5 px-5 sm:px-8 text-center align-middle">
                        <div className="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 shadow-xs group-hover:scale-110 transition-transform">
                          <CheckCircle2 className="w-5 h-5 sm:w-5 sm:h-5 fill-emerald-500 text-white dark:text-[#0c1e33]" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </section>

        {/* Banner CTA Inferior */}
        <section className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-[#0c1e33]/90 border border-slate-200/90 dark:border-blue-900/40 shadow-md text-center max-w-4xl mx-auto space-y-5">
          <div className="space-y-2 max-w-xl mx-auto">
            <h3 className="font-montserrat font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-white">
              Pronto para organizar seu congresso com a Céos System?
            </h3>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
              Junte-se a dezenas de instituições de ensino e congressistas que confiam na nossa infraestrutura científica.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/eventos"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-semibold text-sm shadow-md hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200 cursor-pointer inline-flex items-center justify-center gap-2 group"
            >
              <span>Explorar Eventos</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="/"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl border border-slate-300 dark:border-blue-900/60 bg-white/70 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/80 active:scale-95 text-slate-700 dark:text-slate-200 font-semibold text-sm transition-all duration-200 cursor-pointer backdrop-blur-sm inline-flex items-center justify-center"
            >
              <span>Voltar ao Início</span>
            </Link>
          </div>
        </section>

      </div>
    </main>
  );
}