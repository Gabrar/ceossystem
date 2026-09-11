"use client";

import { useState } from "react";
import EventCard, { Evento } from "@/components/EventCard";
import Modal from "@/components/Modal";
import { Search, X, SlidersHorizontal } from "lucide-react";

export default function EventosPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = (evento: Evento) => {
    setSelectedEvento(evento);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const eventos: Evento[] = [
    {
      id: 1,
      titulo: "II Congresso Nordestino de Anatomia Multidisciplinar Aplicada e I Congresso Nordestino de Anatomia Veterinária e Comparada",
      subtitulo: "Avanços e práticas integradas em morfologia humana e comparada",
      descricaoCompleta:
        "O II Congresso Nordestino de Anatomia Multidisciplinar Aplicada e I Congresso Nordestino de Anatomia Veterinária e Comparada tem como objetivo congregar pesquisadores, docentes e discentes das áreas de saúde e biologia em um ambiente de debate científico de alto nível. A programação conta com conferências magnas, mesas-redondas com temas multidisciplinares, apresentações de pôsteres e publicação de resumos em anais com ISBN.",
      categoria: "Congresso",
      status: "Inscrições Abertas",
      local: "UFRN - Auditório da Reitoria",
      cidadeEstado: "NATAL - RN | 2026",
      data: "30/09 a 02/10/2026",
      palestrantes: [
        {
          nome: "Profa. Dra. Eliane Marques Duarte",
          eixo: "Eixo Ensino",
          instituicao: "UNIVERSIDADE FEDERAL DA PARAÍBA (UFPB)",
          foto: "/assets/palestrantes/1/Profa. Dra. Eliane Marques Duarte.jpeg",
        },
        {
          nome: "Profa. Dra. Anna Ferla Monteiro",
          eixo: "Eixo extensão",
          instituicao: "UNIVERSIDADE FEDERAL DA PARAÍBA (UFPB)",
          foto: "/assets/palestrantes/1/Profa. Dra. Anna Ferla Monteiro.jpeg",
        },
        {
          nome: "Prof. Dr. Frederico Sousa",
          eixo: "Eixo pesquisa",
          instituicao: "UNIVERSIDADE FEDERAL DA PARAÍBA (UFPB)",
          foto: "/assets/palestrantes/1/Prof. Dr. Frederico Sousa.jpg",
        },
      ],
      horario: "08h às 12h e 13h às 18h",
      site: "#",
      img: "/assets/logos/teste-anatomia.png",
      destaque: true,
      cargaHoraria: "40 Horas Complementares",
      publicoAlvo: "Estudantes, pesquisadores e docentes de Medicina, Veterinária, Biomedicina e Biologia",
      organizacao: "Comissão Científica UFRN & Plataforma Céos System",
    },
    {
      id: 2,
      titulo: "NEUROVET - III Simpósio de Neurologia Veterinária",
      subtitulo: "O III NEUROVET – Simpósio de Neurologia Veterinária da UFBA chega para reunir estudantes e profissionais renomados.",
      descricaoCompleta:
        "O NEUROVET é um evento de referência nacional dedicado à neurologia clínica e cirúrgica de pequenos e grandes animais. Durante os três dias, serão debatidas novas abordagens diagnósticas por imagem (ressonância e tomografia), tratamento cirúrgico de afecções da coluna e crânio, emergências neurológicas e reabilitação motora.",
      categoria: "Simpósio",
      status: "Em Breve",
      local: "UFBA - Pavilhão de Aulas Integradas",
      cidadeEstado: "SALVADOR - BA | 2026",
      data: "14/11 a 16/11/2026",
      palestrantes: [
        // Adicione aqui os palestrantes do evento 2:
        // {
        //   nome: "Nome do Palestrante",
        //   eixo: "Eixo Temático",
        //   instituicao: "Instituição ou Universidade",
        //   foto: "/assets/palestrantes/2/foto.jpg",
        // },
      ],
      horario: "09h às 17h",
      site: "#",
      img: "/assets/logos/teste-neuro.jpg",
      destaque: false,
      cargaHoraria: "30 Horas Complementares",
      publicoAlvo: "Médicos Veterinários, pós-graduandos e estudantes de Medicina Veterinária",
      organizacao: "UFBA & Céos System Congressos",
    },
    {
      id: 3,
      titulo: "Curso de Tratamento Somatovisceral e Anatomia em Cádaver",
      subtitulo: "Aulas teóricas e práticas sobre anatomia da região epigástrica, cadeias fasciais e raciocínio osteopático avançado.",
      descricaoCompleta:
        "Uma imersão teórico-prática intensiva de anatomia palpatória e dissecação cadavérica guiada para profissionais da saúde. Os participantes terão a oportunidade de correlationar aspectos neurofuncionais e fasciais das vísceras abdominais com sintomas musculoesqueléticos e abordagens manuais de alta precisão.",
      categoria: "Workshop",
      status: "Inscrições Abertas",
      local: "Instituto Paulo Veiga - Laboratório Morfológico",
      cidadeEstado: "RECIFE - PE | 2026",
      data: "05/12 a 07/12/2026",
      palestrantes: [
        // Adicione aqui os palestrantes do evento 3
      ],
      horario: "08h às 18h",
      site: "#",
      img: "/assets/logos/teste-curso.jpeg",
      destaque: false,
      cargaHoraria: "24 Horas Práticas",
      publicoAlvo: "Fisioterapeutas, Osteopatas, Quiropraxistas e Médicos",
      organizacao: "Instituto Paulo Veiga de Formação Continuada",
    },
    {
      id: 4,
      titulo: "II Encontro de Morfologia da UFPB",
      subtitulo: "O Encontro de Morfologia da UFPB (ENCOMORF) tem como finalidade constituir-se como um evento anual de integração científica.",
      descricaoCompleta:
        "O ENCOMORF visa integrar a comunidade acadêmica e incentivar a iniciação científica em anatomia, histologia e embriologia. Conta com apresentações orais de trabalhos acadêmicos premiados, minicursos de técnicas histológicas e workshops sobre microscopia eletrônica e avanços morfológicos contemporâneos.",
      categoria: "Seminário",
      status: "Inscrições Abertas",
      local: "UFPB - Centro de Ciências da Saúde (CCS)",
      cidadeEstado: "JOÃO PESSOA - PB | 2026",
      data: "05/12 a 07/12/2026",
      palestrantes: [
        // Adicione aqui os palestrantes do evento 4
      ],
      horario: "08h às 18h",
      site: "#",
      img: "/assets/logos/teste-encontro.png",
      destaque: false,
      cargaHoraria: "30 Horas de Atividades",
      publicoAlvo: "Docentes, pós-graduandos e acadêmicos da área de Ciências da Saúde",
      organizacao: "Departamento de Morfologia UFPB",
    },
  ];

  const categorias = ["Todos", "Congresso", "Simpósio", "Workshop", "Seminário"];

  // Filtro dinâmico por texto e categoria
  const eventosFiltrados = eventos.filter((evento) => {
    const matchBusca =
      evento.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evento.cidadeEstado.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evento.local.toLowerCase().includes(searchTerm.toLowerCase());

    const matchCategoria =
      selectedCategory === "Todos" || evento.categoria === selectedCategory;

    return matchBusca && matchCategoria;
  });

  return (
    <main className="min-h-[calc(100vh-73px)] bg-[#fafafa] dark:bg-[#0a1929] text-slate-900 dark:text-slate-100 py-10 px-4 sm:px-6 lg:px-8 transition-colors fade-in">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header da Página */}
        <header className="flex flex-col items-center text-center space-y-4 max-w-3xl mx-auto">
          <h1 className="font-montserrat text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            Consulte os eventos que estão{" "}
            <span className="text-blue-600 dark:text-blue-400 underline decoration-blue-500/30 underline-offset-8">
              acontecendo
            </span>
          </h1>

          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base max-w-xl">
            Descubra congressos, simpósios e jornadas científicas estruturadas com a excelência Céos System.
          </p>

          {/* Barra de Pesquisa Moderna */}
          <div className="w-full max-w-xl pt-2">
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-5 h-5 text-slate-400 dark:text-slate-500 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por evento, cidade ou local..."
                className="w-full pl-11 pr-10 py-3 rounded-2xl bg-white dark:bg-[#0c1e33]/80 border border-slate-200 dark:border-blue-900/50 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm shadow-sm hover:border-blue-400 dark:hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 dark:focus:border-blue-500 transition-all duration-200"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  aria-label="Limpar busca"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filtros de Categoria */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              {categorias.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all duration-200 ${
                    selectedCategory === cat
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-500/25"
                      : "bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-blue-900/40 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-blue-950/40"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Grid de Eventos */}
        <section aria-label="Lista de Eventos">
          {eventosFiltrados.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-7">
              {eventosFiltrados.map((evento) => (
                <EventCard
                  key={evento.id}
                  evento={evento}
                  onVerDetalhes={handleOpenModal}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white dark:bg-[#0c1e33]/40 rounded-3xl border border-dashed border-slate-200 dark:border-blue-900/40 max-w-lg mx-auto space-y-3">
              <SlidersHorizontal className="w-8 h-8 text-slate-400" />
              <h3 className="font-montserrat font-bold text-slate-800 dark:text-white text-base">
                Nenhum evento encontrado
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Não encontramos nenhum resultado para &ldquo;{searchTerm}&rdquo;. Tente buscar por outros termos ou redefina o filtro.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("Todos");
                }}
                className="mt-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Limpar filtros
              </button>
            </div>
          )}
        </section>

      </div>

      {/* Modal de Detalhes do Evento */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        evento={selectedEvento}
      />
    </main>
  );
}