"use client";

import { useState, useEffect } from "react";
import EventCard, { Evento } from "@/components/EventCard";
import { Search, X, SlidersHorizontal, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

export default function EventosPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const { userData } = useAuth();

  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loadingEventos, setLoadingEventos] = useState(true);

  useEffect(() => {
    const fetchEventos = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "events"));
        const eventosData: Evento[] = querySnapshot.docs.map(doc => {
          const data = doc.data();

          // Formatação inteligente para aceitar os dois esquemas de banco (antigo e novo)
          const formatarData = (d: string) => d ? d.split('-').reverse().join('/') : "";
          const dInicio = data.dateInicio ? formatarData(data.dateInicio) : "";
          const dFim = data.dateFim ? formatarData(data.dateFim) : "";
          const dataFinal = dInicio ? (dFim ? `${dInicio} a ${dFim}` : dInicio) : (data.date || "");

          const horaFinal = data.horaInicio ? (data.horaFim ? `${data.horaInicio} às ${data.horaFim}` : data.horaInicio) : (data.hour || "");
          
          const localNome = data.local?.nomeLocal || data.localization || "";
          const localCidade = data.local?.cidade || data["city-state"] || "";

          return {
            id: doc.id,
            titulo: data.title || "",
            subtitulo: data.subtitle || "",
            descricaoCompleta: data.description || "",
            categoria: data.category || "Geral",
            status: data.status || "Em Breve",
            local: localNome,
            cidadeEstado: localCidade,
            data: dataFinal,
            palestrantes: data.palestrantes || [],
            minicursos: data.minicursos || [],
            horario: horaFinal,
            site: data.website || "#",
            img: data.img || "/assets/logos/teste-anatomia.png",
            destaque: data.emphasis || false,
            cargaHoraria: data.workload || "",
            publicoAlvo: data.target || "",
            organizacao: data.org || ""
          };
        });
        setEventos(eventosData);
      } catch (error) {
        console.error("Erro ao buscar eventos:", error);
      } finally {
        setLoadingEventos(false);
      }
    };

    fetchEventos();
  }, []);

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

          {/* Barra de Pesquisa Moderna e Ações */}
          <div className="w-full max-w-xl pt-2">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full flex items-center">
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

              {(userData?.tipoUsuario === "promotor" || userData?.tipo_usuario === "promotor" || userData?.role === "promotor") && (
                <Link href="/eventos/createEvent">
                  <button
                    type="button"
                    className="w-full sm:w-auto px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Criar evento
                  </button>
                </Link>
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
          {loadingEventos ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-500 font-medium">Carregando eventos...</p>
            </div>
          ) : eventosFiltrados.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-7">
              {eventosFiltrados.map((evento) => (
                <EventCard
                  key={evento.id}
                  evento={evento}
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
    </main>
  );
}