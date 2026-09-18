"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { 
    Info, MapPin, AlignLeft, Users, Save, Loader2, Calendar, Ticket, 
    ShieldAlert, ImagePlus, Trash2, Plus, MessageSquare, BookOpen, 
    Landmark, Upload, X, ChevronLeft, ChevronRight, UserPlus, PlusCircle, 
    ArrowLeft, ArrowRight, Check, Sparkles, Building2, CreditCard, Clock, Map
} from "lucide-react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function CreateEventPage() {
    const router = useRouter();
    const { user, userData, loading: authLoading } = useAuth();
    const [activeTab, setActiveTab] = useState("basicas");
    const [isLoading, setIsLoading] = useState(false);

    const isPromotor = userData?.tipoUsuario === "promotor" || userData?.tipo_usuario === "promotor" || userData?.role === "promotor";

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.replace("/login");
            } else if (!isPromotor) {
                router.replace("/eventos");
            }
        }
    }, [user, isPromotor, authLoading, router]);

    // 1. Básicas
    const [nomeEvento, setNomeEvento] = useState("");
    const [categoria, setCategoria] = useState("Seminário");
    const [modalidade, setModalidade] = useState("Presencial");
    const [capacidade, setCapacidade] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>("");

    // 2. Datas
    const [dataInicio, setDataInicio] = useState("");
    const [dataFim, setDataFim] = useState("");
    const [horaInicio, setHoraInicio] = useState("");
    const [horaFim, setHoraFim] = useState("");
    const [cargaHoraria, setCargaHoraria] = useState("");

    // 3. Local
    const [localNaoSeAplica, setLocalNaoSeAplica] = useState(false);
    const [cep, setCep] = useState("");
    const [endereco, setEndereco] = useState("");
    const [numero, setNumero] = useState("");
    const [bairro, setBairro] = useState("");
    const [cidade, setCidade] = useState("");
    const [nomeLocal, setNomeLocal] = useState("");

    // 4. Ingressos
    const [ingressosNaoSeAplica, setIngressosNaoSeAplica] = useState(false);
    const [lotes, setLotes] = useState([{ 
        id: Date.now(), 
        perfil: "", 
        loteNumero: "1", 
        preco: "", 
        quantidade: "", 
        codigoDesconto: "", 
        valorPromocional: "", 
        dataInicio: "", 
        dataFim: "" 
    }]);

    // 5. Detalhes (integrados em Básicas)
    const [descricaoNaoSeAplica, setDescricaoNaoSeAplica] = useState(false);
    const [descricao, setDescricao] = useState("");
    const [instagram, setInstagram] = useState("");
    const [linkedin, setLinkedin] = useState("");
    const [facebook, setFacebook] = useState("");

    // 6. Mensagens
    const [mensagensNaoSeAplica, setMensagensNaoSeAplica] = useState(false);
    const [mensagens, setMensagens] = useState([{ id: Date.now(), texto: "" }]);

    // 7. Palestrantes
    const [palestrantesNaoSeAplica, setPalestrantesNaoSeAplica] = useState(false);
    const [palestrantes, setPalestrantes] = useState([{ 
        id: Date.now(), 
        foto: null as File | null, 
        fotoPreview: "", 
        nome: "", 
        email: "", 
        especialidade: "", 
        instituicao: "", 
        telefone: "", 
        bio: "" 
    }]);

    // 8. Minicursos
    const [minicursosNaoSeAplica, setMinicursosNaoSeAplica] = useState(false);
    const [minicursos, setMinicursos] = useState([{
        id: Date.now(), 
        nome: "", 
        tipo: "Teórico", 
        imagem: null as File | null, 
        imagemPreview: "", 
        local: "", 
        descricao: "",
        ministrantes: [{ id: Date.now(), nome: "", email: "" }],
        dias: [{ id: Date.now(), data: "", horaInicio: "", horaFim: "" }],
        ingressos: [{ 
            id: Date.now(), 
            perfil: "", 
            loteNumero: "1", 
            preco: "", 
            quantidade: "", 
            codigoDesconto: "", 
            valorPromocional: "", 
            dataInicio: "", 
            dataFim: "" 
        }]
    }]);

    // 9. Administradores
    const [adminsNaoSeAplica, setAdminsNaoSeAplica] = useState(false);
    const [administradores, setAdministradores] = useState([{ 
        id: Date.now(), 
        nome: "", 
        email: "", 
        telefone: "", 
        telefoneAlt: "", 
        senha: "", 
        repeteSenha: "", 
        permissoes: { 
            todas: false, site: false, inscricoes: false, minicursos: false, 
            trabalhos: false, programacao: false, credenciamento: false, 
            certificados: false, anais: false, financeiro: false, palestras: false 
        } 
    }]);

    // 10. Patrocínios
    const [patrociniosNaoSeAplica, setPatrociniosNaoSeAplica] = useState(false);
    const [patrocinadores, setPatrocinadores] = useState([{ id: Date.now(), file: null as File | null, fileName: "" }]);
    const [apoiadores, setApoiadores] = useState([{ id: Date.now(), file: null as File | null, fileName: "" }]);

    // 11. Financeiro
    const [bancarioNaoSeAplica, setBancarioNaoSeAplica] = useState(false);
    const [dadosBancarios, setDadosBancarios] = useState({
        banco: "", agencia: "", nomeBanco: "", conta: "", titular: "", documentoTitular: "", chavePix: ""
    });

    const tabs = [
        { id: "basicas", label: "Básicas", icon: Info, desc: "Identidade, categoria e carga horária" },
        { id: "datas", label: "Datas", icon: Calendar, desc: "Período e horários de realização" },
        { id: "local", label: "Local", icon: MapPin, desc: "Endereço e modalidade" },
        { id: "ingressos", label: "Ingressos", icon: Ticket, desc: "Lotes e valores de inscrição" },
        { id: "mensagens", label: "Mensagens", icon: MessageSquare, desc: "Carrossel de avisos rápidos" },
        { id: "palestrantes", label: "Palestrantes", icon: Users, desc: "Convidados e especialistas" },
        { id: "minicursos", label: "Minicursos", icon: BookOpen, desc: "Oficinas, workshops e aulas" },
        { id: "equipe", label: "Equipe", icon: ShieldAlert, desc: "Administradores e permissões" },
        { id: "patrocinios", label: "Patrocínios", icon: ImagePlus, desc: "Marcas parceiras e apoiadores" },
        { id: "financeiro", label: "Financeiro", icon: Landmark, desc: "Conta e chave PIX para repasses" },
    ];

    // --- Controle de rolagem das abas ---
    const tabsNavRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const checkScroll = () => {
        if (tabsNavRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = tabsNavRef.current;
            setCanScrollLeft(scrollLeft > 6);
            setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 6);
        }
    };

    useEffect(() => {
        checkScroll();
        const handleResize = () => checkScroll();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const handleScroll = (direction: "left" | "right") => {
        if (tabsNavRef.current) {
            const scrollAmount = Math.max(tabsNavRef.current.clientWidth * 0.65, 240);
            tabsNavRef.current.scrollBy({
                left: direction === "left" ? -scrollAmount : scrollAmount,
                behavior: "smooth"
            });
            setTimeout(checkScroll, 350);
        }
    };

    const currentTabIndex = tabs.findIndex(t => t.id === activeTab);
    const isFirstTab = currentTabIndex === 0;
    const isLastTab = currentTabIndex === tabs.length - 1;

    const goToTab = (index: number) => {
        if (index >= 0 && index < tabs.length) {
            const nextTab = tabs[index];
            setActiveTab(nextTab.id);
            if (tabsNavRef.current && tabsNavRef.current.children[index]) {
                const el = tabsNavRef.current.children[index] as HTMLElement;
                el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
            }
        }
    };

    // --- Helpers Genéricos ---
    const updateArray = (setter: any, array: any[], id: number, field: string, value: any) => {
        setter(array.map(item => item.id === id ? { ...item, [field]: value } : item));
    };
    const removeArray = (setter: any, array: any[], id: number) => {
        setter(array.filter(item => item.id !== id));
    };

    // --- Helpers Minicursos ---
    const updateMinicurso = (id: number, field: string, value: any) => {
        setMinicursos(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
    };
    const addMinistrante = (minicursoId: number) => {
        setMinicursos(prev => prev.map(m => m.id === minicursoId ? {
            ...m,
            ministrantes: [...m.ministrantes, { id: Date.now(), nome: "", email: "" }]
        } : m));
    };
    const updateMinistrante = (minicursoId: number, ministranteId: number, field: string, value: string) => {
        setMinicursos(prev => prev.map(m => m.id === minicursoId ? {
            ...m,
            ministrantes: m.ministrantes.map(min => min.id === ministranteId ? { ...min, [field]: value } : min)
        } : m));
    };
    const removeMinistrante = (minicursoId: number, ministranteId: number) => {
        setMinicursos(prev => prev.map(m => m.id === minicursoId ? {
            ...m,
            ministrantes: m.ministrantes.filter(min => min.id !== ministranteId)
        } : m));
    };
    const addDia = (minicursoId: number) => {
        setMinicursos(prev => prev.map(m => m.id === minicursoId ? {
            ...m,
            dias: [...m.dias, { id: Date.now(), data: "", horaInicio: "", horaFim: "" }]
        } : m));
    };
    const updateDia = (minicursoId: number, diaId: number, field: string, value: string) => {
        setMinicursos(prev => prev.map(m => m.id === minicursoId ? {
            ...m,
            dias: m.dias.map(d => d.id === diaId ? { ...d, [field]: value } : d)
        } : m));
    };
    const removeDia = (minicursoId: number, diaId: number) => {
        setMinicursos(prev => prev.map(m => m.id === minicursoId ? {
            ...m,
            dias: m.dias.filter(d => d.id !== diaId)
        } : m));
    };
    const addIngressoMinicurso = (minicursoId: number) => {
        setMinicursos(prev => prev.map(m => m.id === minicursoId ? {
            ...m,
            ingressos: [...m.ingressos, {
                id: Date.now(),
                perfil: "",
                loteNumero: String(m.ingressos.length + 1),
                preco: "",
                quantidade: "",
                codigoDesconto: "",
                valorPromocional: "",
                dataInicio: "",
                dataFim: ""
            }]
        } : m));
    };
    const updateIngressoMinicurso = (minicursoId: number, ingressoId: number, field: string, value: string) => {
        setMinicursos(prev => prev.map(m => m.id === minicursoId ? {
            ...m,
            ingressos: m.ingressos.map(ing => ing.id === ingressoId ? { ...ing, [field]: value } : ing)
        } : m));
    };
    const removeIngressoMinicurso = (minicursoId: number, ingressoId: number) => {
        setMinicursos(prev => prev.map(m => m.id === minicursoId ? {
            ...m,
            ingressos: m.ingressos.filter(ing => ing.id !== ingressoId)
        } : m));
    };
    const addMinicurso = () => {
        setMinicursos(prev => [
            ...prev,
            {
                id: Date.now(),
                nome: "",
                tipo: "Teórico",
                imagem: null,
                imagemPreview: "",
                local: "",
                descricao: "",
                ministrantes: [{ id: Date.now(), nome: "", email: "" }],
                dias: [{ id: Date.now(), data: "", horaInicio: "", horaFim: "" }],
                ingressos: [{
                    id: Date.now(),
                    perfil: "",
                    loteNumero: "1",
                    preco: "",
                    quantidade: "",
                    codigoDesconto: "",
                    valorPromocional: "",
                    dataInicio: "",
                    dataFim: ""
                }]
            }
        ]);
    };
    const removeMinicurso = (minicursoId: number) => {
        setMinicursos(prev => prev.filter(m => m.id !== minicursoId));
    };

    // --- Handlers Básicos ---
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
            setImagePreview(URL.createObjectURL(e.target.files[0]));
        }
    };

    // --- Salvamento ---
    const handleSaveEvent = async () => {
        if (!nomeEvento.trim()) {
            setActiveTab("basicas");
            return alert("Por favor, preencha ao menos o Nome do Evento na aba Básicas.");
        }

        setIsLoading(true);
        try {
            const uploadFile = async (file: File | null, folder: string) => {
                if (!file) return "";
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `${folder}/${fileName}`;
                const { error } = await supabase.storage.from('events').upload(filePath, file);
                if (error) return "";
                const { data } = supabase.storage.from('events').getPublicUrl(filePath);
                return data.publicUrl;
            };

            // 1. Imagem Principal
            const publicUrl = await uploadFile(imageFile, 'event-logos');

            // 2. Patrocínios
            const patroUrls = patrociniosNaoSeAplica ? [] : await Promise.all(patrocinadores.map(async (p) => await uploadFile(p.file, 'patrocinadores')));
            const apoiUrls = patrociniosNaoSeAplica ? [] : await Promise.all(apoiadores.map(async (a) => await uploadFile(a.file, 'apoiadores')));

            // 3. Palestrantes
            const palestrantesFinais = palestrantesNaoSeAplica ? [] : await Promise.all(palestrantes.map(async (p) => {
                const fotoUrl = await uploadFile(p.foto, 'palestrantes');
                const { id, foto, fotoPreview, ...rest } = p;
                return { ...rest, fotoUrl };
            }));

            // 4. Minicursos
            const minicursosFinais = minicursosNaoSeAplica ? [] : await Promise.all(minicursos.map(async (m) => {
                const imagemUrl = await uploadFile(m.imagem, 'minicursos');
                const { id, imagem, imagemPreview, ministrantes, dias, ingressos, ...rest } = m;
                return {
                    ...rest, imagemUrl,
                    ministrantes: ministrantes.map(({id, ...mr}) => mr),
                    dias: dias.map(({id, ...dr}) => dr),
                    ingressos: ingressos.map(({id, ...ir}) => ir)
                };
            }));

            // 5. Montar Objeto
            const novoEvento = {
                title: nomeEvento, 
                category: categoria, 
                status: "Em Breve", 
                img: publicUrl,
                modalidade, 
                capacidade, 
                dateInicio: dataInicio, 
                dateFim: dataFim, 
                horaInicio, 
                horaFim, 
                workload: cargaHoraria,
                local: localNaoSeAplica ? null : { cep, endereco, numero, bairro, cidade, nomeLocal },
                lotes: ingressosNaoSeAplica ? [] : lotes.map(({id, ...rest}) => rest),
                description: descricaoNaoSeAplica ? "" : descricao,
                redesSociais: descricaoNaoSeAplica ? null : { instagram, linkedin, facebook },
                mensagens: mensagensNaoSeAplica ? [] : mensagens.map(m => m.texto),
                palestrantes: palestrantesFinais,
                minicursos: minicursosFinais,
                administradores: adminsNaoSeAplica ? [] : administradores.map(({id, ...rest}) => rest),
                patrocinadores: patroUrls.filter(u => u !== ""),
                apoiadores: apoiUrls.filter(u => u !== ""),
                dadosBancarios: bancarioNaoSeAplica ? null : dadosBancarios,
                emphasis: false,
                userId: user?.uid || null,
                promotorEmail: user?.email || null,
                createdAt: new Date().toISOString()
            };

            await addDoc(collection(db, "events"), novoEvento);
            alert("Evento publicado com sucesso!");
            router.push("/eventos");
        } catch (error) {
            console.error("Erro ao salvar:", error);
            alert("Erro ao salvar o evento. Verifique os dados e tente novamente.");
        } finally {
            setIsLoading(false);
        }
    };

    // Componente refinado do toggle "Não se aplica"
    const NaoSeAplicaToggle = ({ label = "Não se aplica", state, setState }: any) => (
        <label className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all border select-none ${
            state 
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 shadow-sm" 
                : "bg-slate-100 dark:bg-blue-950/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-blue-900/40 hover:border-slate-300 dark:hover:border-blue-700"
        }`}>
            <input 
                type="checkbox" 
                checked={state} 
                onChange={(e) => setState(e.target.checked)} 
                className="sr-only" 
            />
            <span className={`w-3.5 h-3.5 rounded-md border flex items-center justify-center transition-all ${
                state 
                    ? "bg-amber-500 border-amber-500 text-white" 
                    : "border-slate-400 dark:border-slate-600 bg-white dark:bg-[#071321]"
            }`}>
                {state && <Check className="w-2.5 h-2.5 stroke-[3]" />}
            </span>
            <span>{label}</span>
        </label>
    );

    // Classes padronizadas de inputs e rótulos
    const inputClass = "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-blue-900/50 bg-slate-50/50 dark:bg-[#071321]/60 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-[#0c1e33] focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none";
    const labelClass = "text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block";
    const cardClass = "p-5 sm:p-6 border border-slate-200 dark:border-blue-900/40 rounded-2xl bg-white dark:bg-[#071321]/40 space-y-4 shadow-sm";

    // 1. Verificando autenticação e permissões
    if (authLoading) {
        return (
            <main className="min-h-[calc(100vh-73px)] bg-[#fafafa] dark:bg-[#0a1929] flex flex-col items-center justify-center p-4">
                <div className="flex flex-col items-center gap-3 text-center">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Verificando permissões de acesso...
                    </p>
                </div>
            </main>
        );
    }

    // 2. Não autenticado -> Acesso Restrito
    if (!user) {
        return (
            <main className="min-h-[calc(100vh-73px)] bg-[#fafafa] dark:bg-[#0a1929] flex flex-col items-center justify-center p-4">
                <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0c1e33] border border-slate-200 dark:border-blue-900/40 shadow-xl text-center space-y-4 animate-in fade-in">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-200 dark:border-amber-800/40">
                        <ShieldAlert className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Acesso Restrito</h2>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                        Você precisa estar conectado a uma conta com perfil de <strong>Promotor</strong> para acessar a criação de eventos.
                    </p>
                    <div className="pt-2 flex flex-col gap-2">
                        <Link
                            href="/login"
                            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-md shadow-blue-600/20 text-center cursor-pointer"
                        >
                            Fazer Login
                        </Link>
                        <Link
                            href="/eventos"
                            className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs sm:text-sm font-semibold transition-all text-center cursor-pointer"
                        >
                            Voltar para Eventos
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    // 3. Autenticado mas sem perfil de Promotor -> Permissão Insuficiente
    if (!isPromotor) {
        return (
            <main className="min-h-[calc(100vh-73px)] bg-[#fafafa] dark:bg-[#0a1929] flex flex-col items-center justify-center p-4">
                <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0c1e33] border border-slate-200 dark:border-blue-900/40 shadow-xl text-center space-y-4 animate-in fade-in">
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-200 dark:border-rose-800/40">
                        <ShieldAlert className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Permissão Insuficiente</h2>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                        Apenas usuários com o cargo de <strong>Promotor</strong> têm permissão para criar eventos. Seu perfil atual não possui autorização para esta funcionalidade.
                    </p>
                    <div className="pt-2">
                        <Link
                            href="/eventos"
                            className="inline-flex items-center justify-center w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-md shadow-blue-600/20 text-center cursor-pointer"
                        >
                            Voltar para Eventos
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-[calc(100vh-73px)] bg-[#fafafa] dark:bg-[#0a1929] py-8 sm:py-10 px-4 sm:px-6 lg:px-8 flex justify-center transition-colors">
            <div className="max-w-5xl w-full space-y-6">
                
                {/* Header Principal da Página */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <Link 
                            href="/eventos" 
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors mb-1 group"
                        >
                            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
                            Voltar para Eventos
                        </Link>
                        <div className="flex items-center gap-3">
                            <h1 className="font-montserrat text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                                Criar <span className="text-blue-600 dark:text-blue-400">Evento</span>
                            </h1>
                            
                        </div>
                    </div>

                    <button 
                        onClick={handleSaveEvent} 
                        disabled={isLoading} 
                        className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/30 transition-all duration-200 shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {isLoading ? "Publicando..." : "Publicar Evento"}
                    </button>
                </div>

                {/* Card Container Geral */}
                <div className="bg-white dark:bg-[#0c1e33]/90 rounded-3xl border border-slate-200/80 dark:border-blue-900/40 shadow-xl shadow-slate-200/40 dark:shadow-black/30 overflow-hidden flex flex-col">
                    
                    {/* Barra de Navegação Horizontal das Abas */}
                    <div className="w-full bg-slate-50/80 dark:bg-[#071321]/60 border-b border-slate-200 dark:border-blue-900/40 px-3 py-2.5 sm:px-4 shrink-0 backdrop-blur-sm">
                        <div className="relative flex items-center gap-2">
                            {/* Botão Seta Esquerda */}
                            <button
                                type="button"
                                onClick={() => handleScroll("left")}
                                disabled={!canScrollLeft}
                                aria-label="Rolar abas para a esquerda"
                                title="Rolar abas para a esquerda"
                                className={`p-2 rounded-xl border border-slate-200 dark:border-blue-900/50 bg-white dark:bg-[#0c1e33] text-slate-600 dark:text-slate-300 transition-all shrink-0 flex items-center justify-center ${
                                    canScrollLeft
                                        ? "hover:text-blue-600 hover:border-blue-300 dark:hover:border-blue-500 shadow-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-[#0f2742]"
                                        : "opacity-30 cursor-not-allowed"
                                }`}
                            >
                                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>

                            {/* Navegação de Abas */}
                            <nav
                                ref={tabsNavRef}
                                onScroll={checkScroll}
                                className="flex gap-2 overflow-x-auto scroll-smooth hide-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-1 flex-1"
                            >
                                {tabs.map((tab) => {
                                    const Icon = tab.icon;
                                    const isActive = activeTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            onClick={(e) => {
                                                setActiveTab(tab.id);
                                                e.currentTarget.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
                                            }}
                                            className={`flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl border shrink-0 whitespace-nowrap transition-all duration-200 cursor-pointer select-none text-xs sm:text-sm font-semibold ${
                                                isActive
                                                    ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/25"
                                                    : "bg-white/60 dark:bg-[#0c1e33]/50 border-slate-200/80 dark:border-blue-900/40 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 hover:border-blue-300 dark:hover:border-blue-700/60"
                                            }`}
                                        >
                                            <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400 dark:text-slate-500"}`} />
                                            <span>{tab.label}</span>
                                        </button>
                                    );
                                })}
                            </nav>

                            {/* Botão Seta Direita */}
                            <button
                                type="button"
                                onClick={() => handleScroll("right")}
                                disabled={!canScrollRight}
                                aria-label="Rolar abas para a direita"
                                title="Rolar abas para a direita"
                                className={`p-2 rounded-xl border border-slate-200 dark:border-blue-900/50 bg-white dark:bg-[#0c1e33] text-slate-600 dark:text-slate-300 transition-all shrink-0 flex items-center justify-center ${
                                    canScrollRight
                                        ? "hover:text-blue-600 hover:border-blue-300 dark:hover:border-blue-500 shadow-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-[#0f2742]"
                                        : "opacity-30 cursor-not-allowed"
                                }`}
                            >
                                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Conteúdo Dinâmico da Sessão Ativa */}
                    <div className="p-5 sm:p-8 space-y-6">
                        
                        {/* 1. Básicas */}
                        {activeTab === "basicas" && (
                            <div className="space-y-6 animate-in fade-in">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-blue-900/40">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
                                            <Info className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Informações Básicas</h2>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Defina o nome, formato, imagem de capa e detalhes do evento.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className={labelClass}>Nome do Evento <span className="text-blue-600">*</span></label>
                                    <input 
                                        type="text" 
                                        placeholder="Ex: I Congresso Internacional de Tecnologia e Saúde"
                                        value={nomeEvento} 
                                        onChange={e=>setNomeEvento(e.target.value)} 
                                        className={inputClass} 
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="space-y-1.5">
                                        <label className={labelClass}>Modalidade</label>
                                        <select value={modalidade} onChange={e=>setModalidade(e.target.value)} className={inputClass}>
                                            <option>Presencial</option>
                                            <option>Online</option>
                                            <option>Híbrido</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className={labelClass}>Categoria</label>
                                        <select value={categoria} onChange={e=>setCategoria(e.target.value)} className={inputClass}>
                                            <option value="Congresso">Congresso</option>
                                            <option value="Simpósio">Simpósio</option>
                                            <option value="Workshop">Workshop</option>
                                            <option value="Seminário">Seminário</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className={labelClass}>Capacidade Estimada</label>
                                        <input 
                                            type="number" 
                                            placeholder="Ex: 500" 
                                            value={capacidade} 
                                            onChange={e=>setCapacidade(e.target.value)} 
                                            className={inputClass} 
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className={labelClass}>Carga Horária (Horas Certificadas)</label>
                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                placeholder="Ex: 40" 
                                                value={cargaHoraria} 
                                                onChange={e=>setCargaHoraria(e.target.value)} 
                                                className={inputClass} 
                                            />
                                            <span className="absolute right-4 top-2.5 text-xs text-slate-400 font-semibold pointer-events-none">horas</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Imagem de Capa */}
                                <div className="space-y-2">
                                    <label className={labelClass}>Imagem de Capa / Banner do Evento</label>
                                    <div className="p-4 border-2 border-dashed border-slate-200 dark:border-blue-900/50 rounded-2xl bg-slate-50/40 dark:bg-[#071321]/30 hover:border-blue-400 dark:hover:border-blue-700 transition-colors">
                                        <div className="flex flex-col sm:flex-row items-center gap-4">
                                            <input 
                                                id="capaInput" 
                                                type="file" 
                                                accept="image/*"
                                                onChange={handleImageChange} 
                                                className="w-full text-xs text-slate-500 dark:text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-600 dark:file:bg-blue-950 dark:file:text-blue-300 hover:file:bg-blue-100 cursor-pointer"
                                            />
                                            {imagePreview && (
                                                <div className="relative group shrink-0">
                                                    <img src={imagePreview} alt="Preview" className="h-20 w-36 rounded-xl object-cover border border-slate-200 dark:border-blue-900 shadow-sm" />
                                                    <button 
                                                        type="button"
                                                        onClick={() => { setImageFile(null); setImagePreview(""); (document.getElementById('capaInput') as HTMLInputElement).value = ''; }} 
                                                        className="absolute -top-2 -right-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full p-1 shadow-md transition-all cursor-pointer"
                                                        title="Remover imagem"
                                                    >
                                                        <X className="w-3.5 h-3.5"/>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Detalhes & Redes Sociais */}
                                <div className="pt-6 border-t border-slate-200 dark:border-blue-900/40 space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <AlignLeft className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Descrição e Redes Sociais</h3>
                                        </div>
                                        <NaoSeAplicaToggle state={descricaoNaoSeAplica} setState={setDescricaoNaoSeAplica} />
                                    </div>

                                    {!descricaoNaoSeAplica && (
                                        <div className="space-y-4">
                                            <div className="space-y-1.5">
                                                <label className={labelClass}>Descrição Completa do Evento</label>
                                                <textarea 
                                                    rows={5} 
                                                    value={descricao} 
                                                    onChange={e=>setDescricao(e.target.value)} 
                                                    className={inputClass} 
                                                    placeholder="Apresente os objetivos, eixos temáticos, público-alvo e diferenciais do seu evento..." 
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className={labelClass}>Redes Sociais Oficiais</label>
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                    <input 
                                                        type="text" 
                                                        placeholder="Instagram (ex: @meuevento)" 
                                                        value={instagram} 
                                                        onChange={e=>setInstagram(e.target.value)} 
                                                        className={inputClass} 
                                                    />
                                                    <input 
                                                        type="text" 
                                                        placeholder="LinkedIn (ex: /in/meuevento)" 
                                                        value={linkedin} 
                                                        onChange={e=>setLinkedin(e.target.value)} 
                                                        className={inputClass} 
                                                    />
                                                    <input 
                                                        type="text" 
                                                        placeholder="Facebook (ex: /meuevento)" 
                                                        value={facebook} 
                                                        onChange={e=>setFacebook(e.target.value)} 
                                                        className={inputClass} 
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 2. Datas */}
                        {activeTab === "datas" && (
                            <div className="space-y-6 animate-in fade-in">
                                <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-blue-900/40">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Datas e Horários</h2>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Estabeleça o período de realização e os horários do evento.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className={labelClass}>Data de Início</label>
                                        <input type="date" value={dataInicio} onChange={e=>setDataInicio(e.target.value)} className={inputClass} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className={labelClass}>Data de Término</label>
                                        <input type="date" value={dataFim} onChange={e=>setDataFim(e.target.value)} className={inputClass} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className={labelClass}>Horário de Início</label>
                                        <input type="time" value={horaInicio} onChange={e=>setHoraInicio(e.target.value)} className={inputClass} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className={labelClass}>Horário de Término</label>
                                        <input type="time" value={horaFim} onChange={e=>setHoraFim(e.target.value)} className={inputClass} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 3. Local */}
                        {activeTab === "local" && (
                            <div className="space-y-6 animate-in fade-in">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-blue-900/40">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
                                            <MapPin className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Localização e Espaço Físico</h2>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Informe o endereço ou centro de convenções onde ocorrerá o evento.</p>
                                        </div>
                                    </div>
                                    <NaoSeAplicaToggle state={localNaoSeAplica} setState={setLocalNaoSeAplica} />
                                </div>

                                {!localNaoSeAplica && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div className="space-y-1.5">
                                                <label className={labelClass}>CEP</label>
                                                <input type="text" placeholder="00000-000" value={cep} onChange={e=>setCep(e.target.value)} className={inputClass} />
                                            </div>
                                            <div className="space-y-1.5 sm:col-span-2">
                                                <label className={labelClass}>Nome do Local / Pavilhão</label>
                                                <input type="text" placeholder="Ex: Centro de Convenções Ulysses Guimarães" value={nomeLocal} onChange={e=>setNomeLocal(e.target.value)} className={inputClass} />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                            <div className="space-y-1.5 sm:col-span-3">
                                                <label className={labelClass}>Endereço Completo (Rua/Avenida)</label>
                                                <input type="text" placeholder="Ex: Av. Central, Bloco B" value={endereco} onChange={e=>setEndereco(e.target.value)} className={inputClass} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className={labelClass}>Número</label>
                                                <input type="text" placeholder="Ex: 1020" value={numero} onChange={e=>setNumero(e.target.value)} className={inputClass} />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className={labelClass}>Bairro</label>
                                                <input type="text" placeholder="Ex: Asa Sul" value={bairro} onChange={e=>setBairro(e.target.value)} className={inputClass} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className={labelClass}>Cidade / Estado</label>
                                                <input type="text" placeholder="Ex: Brasília - DF" value={cidade} onChange={e=>setCidade(e.target.value)} className={inputClass} />
                                            </div>
                                        </div>

                                        {/* Card Estilizado de Visualização de Local */}
                                        <div className="relative h-44 rounded-2xl overflow-hidden border border-slate-200 dark:border-blue-900/50 bg-gradient-to-br from-slate-100 via-blue-50/20 to-slate-200/80 dark:from-[#071321] dark:via-[#0c1e33] dark:to-[#071321] flex flex-col items-center justify-center p-4 text-center">
                                            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/30 mb-2">
                                                <MapPin className="w-5 h-5" />
                                            </div>
                                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                                {nomeLocal || endereco ? `${nomeLocal ? nomeLocal + " — " : ""}${endereco || ""}` : "Prévia de Localização"}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                {cidade || bairro || cep ? `${bairro ? bairro + ", " : ""}${cidade ? cidade + " " : ""}${cep ? "• CEP " + cep : ""}` : "Os dados de endereço preenchidos serão apresentados no mapa e na página do evento."}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 4. Ingressos */}
                        {activeTab === "ingressos" && (
                            <div className="space-y-6 animate-in fade-in">
                                <div className="relative flex items-center justify-center pb-2">
                                    <div className="flex items-center gap-2.5">
                                        <Ticket className="w-5 h-5 text-slate-800 dark:text-slate-100 fill-slate-800 dark:fill-slate-100" />
                                        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                                            Ingressos por Lotes
                                        </h2>
                                    </div>
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2">
                                        <NaoSeAplicaToggle state={ingressosNaoSeAplica} setState={setIngressosNaoSeAplica} />
                                    </div>
                                </div>

                                {!ingressosNaoSeAplica && (
                                    <div className="space-y-4">
                                        {lotes.map((lote, index) => (
                                            <div key={lote.id} className="p-5 sm:p-6 border border-slate-200 dark:border-blue-900/40 rounded-2xl bg-white dark:bg-[#0c1e33] space-y-4 shadow-sm relative">
                                                {lotes.length > 1 && (
                                                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-blue-900/30">
                                                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                                            Lote #{lote.loteNumero || index + 1}
                                                        </span>
                                                        <button 
                                                            type="button"
                                                            onClick={()=>removeArray(setLotes, lotes, lote.id)} 
                                                            className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs"
                                                            title="Remover este lote"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5"/>
                                                            <span>Remover Lote</span>
                                                        </button>
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                                    {/* Linha 1 */}
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                                                            Perfil do Participante
                                                        </label>
                                                        <select 
                                                            value={lote.perfil} 
                                                            onChange={e=>updateArray(setLotes, lotes, lote.id, 'perfil', e.target.value)} 
                                                            className={inputClass}
                                                        >
                                                            <option value="">Selecione</option>
                                                            <option value="aluno">Aluno</option>
                                                            <option value="aluno-pos">Aluno Pós</option>
                                                            <option value="professor">Professor</option>
                                                            <option value="profissional">Profissional</option>
                                                            <option value="outros">Outros</option>
                                                        </select>
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                                                            Lote Nº
                                                        </label>
                                                        <input 
                                                            type="text" 
                                                            placeholder="1"
                                                            value={lote.loteNumero} 
                                                            onChange={e=>updateArray(setLotes, lotes, lote.id, 'loteNumero', e.target.value)} 
                                                            className={inputClass} 
                                                        />
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                                                            Preço (R$)
                                                        </label>
                                                        <input 
                                                            type="text" 
                                                            placeholder="0,00" 
                                                            value={lote.preco} 
                                                            onChange={e=>updateArray(setLotes, lotes, lote.id, 'preco', e.target.value)} 
                                                            className={inputClass} 
                                                        />
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                                                            Quantidade
                                                        </label>
                                                        <input 
                                                            type="number" 
                                                            placeholder="100" 
                                                            value={lote.quantidade} 
                                                            onChange={e=>updateArray(setLotes, lotes, lote.id, 'quantidade', e.target.value)} 
                                                            className={inputClass} 
                                                        />
                                                    </div>

                                                    {/* Linha 2 */}
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                                                            Código Desconto
                                                        </label>
                                                        <input 
                                                            type="text" 
                                                            placeholder="PROMO10" 
                                                            value={lote.codigoDesconto} 
                                                            onChange={e=>updateArray(setLotes, lotes, lote.id, 'codigoDesconto', e.target.value)} 
                                                            className={inputClass} 
                                                        />
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                                                            Valor Promocional (R$)
                                                        </label>
                                                        <input 
                                                            type="text" 
                                                            placeholder="0,00" 
                                                            value={lote.valorPromocional} 
                                                            onChange={e=>updateArray(setLotes, lotes, lote.id, 'valorPromocional', e.target.value)} 
                                                            className={inputClass} 
                                                        />
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                                                            Data Início
                                                        </label>
                                                        <input 
                                                            type="date" 
                                                            value={lote.dataInicio} 
                                                            onChange={e=>updateArray(setLotes, lotes, lote.id, 'dataInicio', e.target.value)} 
                                                            className={inputClass} 
                                                        />
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                                                            Data Fim
                                                        </label>
                                                        <input 
                                                            type="date" 
                                                            value={lote.dataFim} 
                                                            onChange={e=>updateArray(setLotes, lotes, lote.id, 'dataFim', e.target.value)} 
                                                            className={inputClass} 
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Botão Verde Full-Width */}
                                        <button 
                                            type="button"
                                            onClick={()=>setLotes([...lotes, { 
                                                id: Date.now(), 
                                                perfil: "", 
                                                loteNumero: String(lotes.length + 1), 
                                                preco: "", 
                                                quantidade: "", 
                                                codigoDesconto: "", 
                                                valorPromocional: "", 
                                                dataInicio: "", 
                                                dataFim: "" 
                                            }])} 
                                            className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-600/30 transition-all cursor-pointer"
                                        >
                                            <Plus className="w-5 h-5 stroke-[2.5]" />
                                            Adicionar Outro Lote
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 5. Mensagens */}
                        {activeTab === "mensagens" && (
                            <div className="space-y-6 animate-in fade-in">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-blue-900/40">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
                                            <MessageSquare className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Mensagens em Destaque (Carrossel)</h2>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Avisos rápidos exibidos na parte superior da página oficial do evento.</p>
                                        </div>
                                    </div>
                                    <NaoSeAplicaToggle state={mensagensNaoSeAplica} setState={setMensagensNaoSeAplica} />
                                </div>

                                {!mensagensNaoSeAplica && (
                                    <div className="space-y-4">
                                        {mensagens.map((m, index) => (
                                            <div key={m.id} className="relative flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40 flex items-center justify-center text-xs font-bold shrink-0">
                                                    {index + 1}
                                                </div>
                                                <input 
                                                    type="text" 
                                                    value={m.texto} 
                                                    onChange={e=>updateArray(setMensagens, mensagens, m.id, 'texto', e.target.value)} 
                                                    className={inputClass} 
                                                    placeholder="Ex: Submissões de resumos prorrogadas até 20 de Outubro!" 
                                                />
                                                {mensagens.length > 1 && (
                                                    <button 
                                                        type="button"
                                                        onClick={()=>removeArray(setMensagens, mensagens, m.id)} 
                                                        className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-2 rounded-xl transition-colors shrink-0 cursor-pointer"
                                                        title="Remover mensagem"
                                                    >
                                                        <Trash2 className="w-4 h-4"/>
                                                    </button>
                                                )}
                                            </div>
                                        ))}

                                        <button 
                                            type="button"
                                            onClick={()=>setMensagens([...mensagens, {id: Date.now(), texto: ""}])} 
                                            className="w-full py-2.5 px-4 rounded-xl border border-dashed border-blue-300 dark:border-blue-800/80 hover:border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Adicionar Mensagem ao Carrossel
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 6. Palestrantes */}
                        {activeTab === "palestrantes" && (
                            <div className="space-y-6 animate-in fade-in">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-blue-900/40">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
                                            <Users className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Palestrantes e Convidados</h2>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Apresente os especialistas com foto, titulação e minibiografia.</p>
                                        </div>
                                    </div>
                                    <NaoSeAplicaToggle state={palestrantesNaoSeAplica} setState={setPalestrantesNaoSeAplica} />
                                </div>

                                {!palestrantesNaoSeAplica && (
                                    <div className="space-y-4">
                                        {palestrantes.map((p, idx) => (
                                            <div key={p.id} className={cardClass}>
                                                <div className="flex items-center justify-between border-b border-slate-100 dark:border-blue-900/40 pb-2">
                                                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                                                        <Users className="w-3.5 h-3.5" /> Palestrante {idx + 1}
                                                    </span>
                                                    {palestrantes.length > 1 && (
                                                        <button 
                                                            type="button"
                                                            onClick={()=>removeArray(setPalestrantes, palestrantes, p.id)} 
                                                            className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-1.5 rounded-lg transition-colors cursor-pointer"
                                                        >
                                                            <Trash2 className="w-4 h-4"/>
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="space-y-1 sm:col-span-2">
                                                        <label className={labelClass}>Foto do Palestrante</label>
                                                        <div className="flex items-center gap-3">
                                                            <input 
                                                                id={`foto-${p.id}`} 
                                                                type="file" 
                                                                accept="image/*" 
                                                                onChange={e=>{
                                                                    const f = e.target.files?.[0];
                                                                    if(f) {
                                                                        updateArray(setPalestrantes, palestrantes, p.id, 'foto', f);
                                                                        updateArray(setPalestrantes, palestrantes, p.id, 'fotoPreview', URL.createObjectURL(f));
                                                                    }
                                                                }} 
                                                                className="w-full text-xs text-slate-500 dark:text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-600 dark:file:bg-blue-950 dark:file:text-blue-300 hover:file:bg-blue-100 cursor-pointer" 
                                                            />
                                                            {p.foto && (
                                                                <button 
                                                                    type="button"
                                                                    onClick={()=>{ 
                                                                        updateArray(setPalestrantes, palestrantes, p.id, 'foto', null); 
                                                                        updateArray(setPalestrantes, palestrantes, p.id, 'fotoPreview', '');
                                                                        (document.getElementById(`foto-${p.id}`) as HTMLInputElement).value = ''; 
                                                                    }} 
                                                                    className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg shrink-0 cursor-pointer"
                                                                    title="Remover foto"
                                                                >
                                                                    <X className="w-4 h-4"/>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1">
                                                        <label className={labelClass}>Nome Completo</label>
                                                        <input type="text" placeholder="Ex: Dra. Maria Clara Silva" value={p.nome} onChange={e=>updateArray(setPalestrantes, palestrantes, p.id, 'nome', e.target.value)} className={inputClass} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className={labelClass}>Especialidade / Titulação</label>
                                                        <input type="text" placeholder="Ex: PhD em Neurociências" value={p.especialidade} onChange={e=>updateArray(setPalestrantes, palestrantes, p.id, 'especialidade', e.target.value)} className={inputClass} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className={labelClass}>Instituição / Universidade</label>
                                                        <input type="text" placeholder="Ex: Universidade de São Paulo (USP)" value={p.instituicao} onChange={e=>updateArray(setPalestrantes, palestrantes, p.id, 'instituicao', e.target.value)} className={inputClass} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className={labelClass}>E-mail de Contato</label>
                                                        <input type="email" placeholder="Ex: contato@palestrante.com" value={p.email} onChange={e=>updateArray(setPalestrantes, palestrantes, p.id, 'email', e.target.value)} className={inputClass} />
                                                    </div>
                                                </div>

                                                <div className="space-y-1">
                                                    <label className={labelClass}>Mini Biografia</label>
                                                    <textarea rows={3} value={p.bio} onChange={e=>updateArray(setPalestrantes, palestrantes, p.id, 'bio', e.target.value)} placeholder="Breve resumo da trajetória acadêmica e profissional..." className={inputClass} />
                                                </div>
                                            </div>
                                        ))}

                                        <button 
                                            type="button"
                                            onClick={()=>setPalestrantes([...palestrantes, { id: Date.now(), foto: null, fotoPreview: "", nome: "", email: "", especialidade: "", instituicao: "", telefone: "", bio: "" }])} 
                                            className="w-full py-2.5 px-4 rounded-xl border border-dashed border-blue-300 dark:border-blue-800/80 hover:border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Adicionar Palestrante
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 7. Minicursos */}
                        {activeTab === "minicursos" && (
                            <div className="space-y-6 animate-in fade-in">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-blue-900/40">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
                                            <BookOpen className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Cadastro de Minicursos</h2>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Cadastre oficinas práticas, workshops e cursos temáticos com vagas limitadas.</p>
                                        </div>
                                    </div>
                                    <NaoSeAplicaToggle state={minicursosNaoSeAplica} setState={setMinicursosNaoSeAplica} />
                                </div>

                                {!minicursosNaoSeAplica && (
                                    <div className="space-y-8">
                                        {minicursos.map((m, mIndex) => (
                                            <div key={m.id} className="p-5 sm:p-7 border border-slate-200/90 dark:border-blue-900/50 rounded-2xl bg-white dark:bg-[#071321]/40 space-y-6 shadow-sm">
                                                
                                                {/* Cabeçalho do Minicurso */}
                                                <div className="flex items-center justify-between border-b-2 border-slate-200 dark:border-blue-800/50 pb-2.5">
                                                    <h3 className="font-bold text-base text-blue-900 dark:text-blue-300 flex items-center gap-2">
                                                        <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                        Minicurso {mIndex + 1}
                                                    </h3>
                                                    {minicursos.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeMinicurso(m.id)}
                                                            title="Remover Minicurso"
                                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Nome e Tipo */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                                    <div className="space-y-1">
                                                        <label className={labelClass}>Nome do Minicurso</label>
                                                        <input
                                                            type="text"
                                                            placeholder="Ex: Introdução ao Python para Análise de Dados"
                                                            value={m.nome}
                                                            onChange={e => updateMinicurso(m.id, 'nome', e.target.value)}
                                                            className={inputClass}
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className={labelClass}>Tipo</label>
                                                        <select
                                                            value={m.tipo || "Teórico"}
                                                            onChange={e => updateMinicurso(m.id, 'tipo', e.target.value)}
                                                            className={inputClass}
                                                        >
                                                            <option value="Teórico">Teórico</option>
                                                            <option value="Prático">Prático</option>
                                                            <option value="Teórico/Prático">Teórico/Prático</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                {/* Ministrantes */}
                                                <div className="space-y-3">
                                                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">Ministrantes</h4>
                                                    <div className="space-y-2.5">
                                                        {m.ministrantes.map((ministrante) => (
                                                            <div key={ministrante.id} className="flex items-center gap-3">
                                                                <input
                                                                    type="text"
                                                                    placeholder="Nome do Ministrante"
                                                                    value={ministrante.nome}
                                                                    onChange={e => updateMinistrante(m.id, ministrante.id, 'nome', e.target.value)}
                                                                    className={`flex-1 ${inputClass}`}
                                                                />
                                                                <input
                                                                    type="email"
                                                                    placeholder="E-mail do Ministrante"
                                                                    value={ministrante.email}
                                                                    onChange={e => updateMinistrante(m.id, ministrante.id, 'email', e.target.value)}
                                                                    className={`flex-1 ${inputClass}`}
                                                                />
                                                                {m.ministrantes.length > 1 && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeMinistrante(m.id, ministrante.id)}
                                                                        title="Remover Ministrante"
                                                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors shrink-0 cursor-pointer"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => addMinistrante(m.id)}
                                                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer"
                                                    >
                                                        <UserPlus className="w-3.5 h-3.5" />
                                                        Adicionar Ministrante
                                                    </button>
                                                </div>

                                                {/* Dias do Minicurso */}
                                                <div className="border border-blue-100 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20 rounded-2xl p-4 sm:p-5 space-y-3">
                                                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                        Dias do Minicurso
                                                    </h4>
                                                    <div className="space-y-3">
                                                        {m.dias.map((dia) => (
                                                            <div key={dia.id} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                                                                <div className="space-y-1">
                                                                    <label className={labelClass}>Data</label>
                                                                    <input
                                                                        type="date"
                                                                        value={dia.data}
                                                                        onChange={e => updateDia(m.id, dia.id, 'data', e.target.value)}
                                                                        className={inputClass}
                                                                    />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <label className={labelClass}>Horário de Início</label>
                                                                    <input
                                                                        type="time"
                                                                        value={dia.horaInicio}
                                                                        onChange={e => updateDia(m.id, dia.id, 'horaInicio', e.target.value)}
                                                                        className={inputClass}
                                                                    />
                                                                </div>
                                                                <div className="space-y-1 flex items-end gap-2">
                                                                    <div className="flex-1">
                                                                        <label className={labelClass}>Horário de Fim</label>
                                                                        <input
                                                                            type="time"
                                                                            value={dia.horaFim}
                                                                            onChange={e => updateDia(m.id, dia.id, 'horaFim', e.target.value)}
                                                                            className={inputClass}
                                                                        />
                                                                    </div>
                                                                    {m.dias.length > 1 && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => removeDia(m.id, dia.id)}
                                                                            title="Remover Dia"
                                                                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors shrink-0 mb-0.5 cursor-pointer"
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => addDia(m.id)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-slate-300 dark:border-slate-600 hover:border-slate-400 bg-white dark:bg-[#0c1e33] text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                                                    >
                                                        <Plus className="w-3.5 h-3.5" />
                                                        Adicionar Dia
                                                    </button>
                                                </div>

                                                {/* Local e Imagem */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                                    <div className="space-y-1">
                                                        <label className={labelClass}>Local / Sala</label>
                                                        <input
                                                            type="text"
                                                            placeholder="Ex: Laboratório de Informática 03"
                                                            value={m.local}
                                                            onChange={e => updateMinicurso(m.id, 'local', e.target.value)}
                                                            className={inputClass}
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className={labelClass}>Imagem de Divulgação do Minicurso</label>
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                id={`img-mini-${m.id}`}
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={e => {
                                                                    const f = e.target.files?.[0];
                                                                    if (f) {
                                                                        updateMinicurso(m.id, 'imagem', f);
                                                                        updateMinicurso(m.id, 'imagemPreview', URL.createObjectURL(f));
                                                                    }
                                                                }}
                                                                className="w-full text-xs text-slate-500 dark:text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-600 dark:file:bg-blue-950 dark:file:text-blue-300 hover:file:bg-blue-100 cursor-pointer"
                                                            />
                                                            {m.imagem && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        updateMinicurso(m.id, 'imagem', null);
                                                                        updateMinicurso(m.id, 'imagemPreview', '');
                                                                        const el = document.getElementById(`img-mini-${m.id}`) as HTMLInputElement;
                                                                        if (el) el.value = '';
                                                                    }}
                                                                    className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg shrink-0 cursor-pointer"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Descrição */}
                                                <div className="space-y-1">
                                                    <label className={labelClass}>Descrição e Ementa</label>
                                                    <textarea
                                                        rows={3}
                                                        value={m.descricao}
                                                        placeholder="Descreva o conteúdo programático, pré-requisitos e metodologia do minicurso..."
                                                        onChange={e => updateMinicurso(m.id, 'descricao', e.target.value)}
                                                        className={inputClass}
                                                    />
                                                </div>

                                                {/* Ingressos para Minicurso */}
                                                <div className="space-y-4">
                                                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                                        <Ticket className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                        Ingressos para Minicurso
                                                    </h4>
                                                    <div className="space-y-3">
                                                        {m.ingressos.map((ingresso, ingIdx) => (
                                                            <div key={ingresso.id} className="p-4 sm:p-5 border border-slate-200 dark:border-blue-900/40 rounded-xl bg-slate-50/50 dark:bg-[#071321]/40 space-y-3.5 relative">
                                                                {m.ingressos.length > 1 && (
                                                                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-blue-900/30">
                                                                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                                                            Lote #{ingresso.loteNumero || ingIdx + 1}
                                                                        </span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => removeIngressoMinicurso(m.id, ingresso.id)}
                                                                            title="Remover Lote"
                                                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs"
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                            <span>Remover Lote</span>
                                                                        </button>
                                                                    </div>
                                                                )}

                                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                                                                    {/* Linha 1 */}
                                                                    <div className="space-y-1.5">
                                                                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Perfil do Participante</label>
                                                                        <select
                                                                            value={ingresso.perfil}
                                                                            onChange={e => updateIngressoMinicurso(m.id, ingresso.id, 'perfil', e.target.value)}
                                                                            className={inputClass}
                                                                        >
                                                                            <option value="">Selecione</option>
                                                                            <option value="aluno">Aluno</option>
                                                                            <option value="aluno-pos">Aluno Pós</option>
                                                                            <option value="professor">Professor</option>
                                                                            <option value="profissional">Profissional</option>
                                                                            <option value="outros">Outros</option>
                                                                        </select>
                                                                    </div>
                                                                    <div className="space-y-1.5">
                                                                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Lote Nº</label>
                                                                        <input
                                                                            type="text"
                                                                            placeholder="1"
                                                                            value={ingresso.loteNumero}
                                                                            onChange={e => updateIngressoMinicurso(m.id, ingresso.id, 'loteNumero', e.target.value)}
                                                                            className={inputClass}
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1.5">
                                                                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Preço (R$)</label>
                                                                        <input
                                                                            type="text"
                                                                            placeholder="0,00"
                                                                            value={ingresso.preco}
                                                                            onChange={e => updateIngressoMinicurso(m.id, ingresso.id, 'preco', e.target.value)}
                                                                            className={inputClass}
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1.5">
                                                                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Quantidade</label>
                                                                        <input
                                                                            type="number"
                                                                            placeholder="100"
                                                                            value={ingresso.quantidade}
                                                                            onChange={e => updateIngressoMinicurso(m.id, ingresso.id, 'quantidade', e.target.value)}
                                                                            className={inputClass}
                                                                        />
                                                                    </div>

                                                                    {/* Linha 2 */}
                                                                    <div className="space-y-1.5">
                                                                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Código Desconto</label>
                                                                        <input
                                                                            type="text"
                                                                            placeholder="PROMO10"
                                                                            value={ingresso.codigoDesconto}
                                                                            onChange={e => updateIngressoMinicurso(m.id, ingresso.id, 'codigoDesconto', e.target.value)}
                                                                            className={inputClass}
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1.5">
                                                                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Valor Promocional (R$)</label>
                                                                        <input
                                                                            type="text"
                                                                            placeholder="0,00"
                                                                            value={ingresso.valorPromocional}
                                                                            onChange={e => updateIngressoMinicurso(m.id, ingresso.id, 'valorPromocional', e.target.value)}
                                                                            className={inputClass}
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1.5">
                                                                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Data Início</label>
                                                                        <input
                                                                            type="date"
                                                                            value={ingresso.dataInicio}
                                                                            onChange={e => updateIngressoMinicurso(m.id, ingresso.id, 'dataInicio', e.target.value)}
                                                                            className={inputClass}
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1.5">
                                                                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Data Fim</label>
                                                                        <input
                                                                            type="date"
                                                                            value={ingresso.dataFim}
                                                                            onChange={e => updateIngressoMinicurso(m.id, ingresso.id, 'dataFim', e.target.value)}
                                                                            className={inputClass}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => addIngressoMinicurso(m.id)}
                                                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 dark:bg-blue-950 dark:hover:bg-blue-900 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm cursor-pointer"
                                                    >
                                                        <Plus className="w-3.5 h-3.5" />
                                                        Adicionar Outro Lote
                                                    </button>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Botão de Adicionar Minicurso Geral */}
                                        <button
                                            type="button"
                                            onClick={addMinicurso}
                                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                                        >
                                            <PlusCircle className="w-4 h-4" />
                                            Adicionar Minicurso
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 8. Equipe */}
                        {activeTab === "equipe" && (
                            <div className="space-y-6 animate-in fade-in">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-blue-900/40">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
                                            <ShieldAlert className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Equipe e Administradores</h2>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Atribua permissões e acessos a outros membros da comissão organizadora.</p>
                                        </div>
                                    </div>
                                    <NaoSeAplicaToggle state={adminsNaoSeAplica} setState={setAdminsNaoSeAplica} />
                                </div>

                                {!adminsNaoSeAplica && (
                                    <div className="space-y-4">
                                        {administradores.map((admin, idx) => (
                                            <div key={admin.id} className={cardClass}>
                                                <div className="flex items-center justify-between border-b border-slate-100 dark:border-blue-900/40 pb-2">
                                                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                                                        <ShieldAlert className="w-3.5 h-3.5" /> Administrador {idx + 1}
                                                    </span>
                                                    {administradores.length > 1 && (
                                                        <button 
                                                            type="button"
                                                            onClick={()=>removeArray(setAdministradores, administradores, admin.id)} 
                                                            className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-1.5 rounded-lg transition-colors cursor-pointer"
                                                        >
                                                            <Trash2 className="w-4 h-4"/>
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <label className={labelClass}>Nome</label>
                                                        <input type="text" placeholder="Nome do Administrador" value={admin.nome} onChange={e=>updateArray(setAdministradores, administradores, admin.id, 'nome', e.target.value)} className={inputClass} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className={labelClass}>E-mail</label>
                                                        <input type="email" placeholder="admin@evento.com" value={admin.email} onChange={e=>updateArray(setAdministradores, administradores, admin.id, 'email', e.target.value)} className={inputClass} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className={labelClass}>Telefone / WhatsApp</label>
                                                        <input type="text" placeholder="(00) 00000-0000" value={admin.telefone} onChange={e=>updateArray(setAdministradores, administradores, admin.id, 'telefone', e.target.value)} className={inputClass} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className={labelClass}>Senha de Acesso</label>
                                                        <input type="password" placeholder="••••••••" value={admin.senha} onChange={e=>updateArray(setAdministradores, administradores, admin.id, 'senha', e.target.value)} className={inputClass} />
                                                    </div>
                                                </div>

                                                <div className="space-y-2 pt-2">
                                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Permissões do Módulo</label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {Object.keys(admin.permissoes).map(perm => {
                                                            const isChecked = admin.permissoes[perm as keyof typeof admin.permissoes];
                                                            return (
                                                                <button 
                                                                    key={perm} 
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const newPerms = {...admin.permissoes, [perm]: !isChecked};
                                                                        updateArray(setAdministradores, administradores, admin.id, 'permissoes', newPerms);
                                                                    }}
                                                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer capitalize flex items-center gap-1.5 ${
                                                                        isChecked 
                                                                            ? "bg-blue-600 text-white border-blue-600 shadow-sm" 
                                                                            : "bg-slate-50 dark:bg-[#071321]/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-blue-900/40 hover:border-slate-300"
                                                                    }`}
                                                                >
                                                                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                                                    {perm}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        <button 
                                            type="button"
                                            onClick={()=>setAdministradores([...administradores, { id: Date.now(), nome: "", email: "", telefone: "", telefoneAlt: "", senha: "", repeteSenha: "", permissoes: { todas: false, site: false, inscricoes: false, minicursos: false, trabalhos: false, programacao: false, credenciamento: false, certificados: false, anais: false, financeiro: false, palestras: false } }])} 
                                            className="w-full py-2.5 px-4 rounded-xl border border-dashed border-blue-300 dark:border-blue-800/80 hover:border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Adicionar Administrador
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 9. Patrocínios */}
                        {activeTab === "patrocinios" && (
                            <div className="space-y-6 animate-in fade-in">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-blue-900/40">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
                                            <ImagePlus className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Patrocinadores e Apoiadores</h2>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Insira as logomarcas para exibição nos banners e rodapés oficiais.</p>
                                        </div>
                                    </div>
                                    <NaoSeAplicaToggle state={patrociniosNaoSeAplica} setState={setPatrociniosNaoSeAplica} />
                                </div>

                                {!patrociniosNaoSeAplica && (
                                    <div className="space-y-6">
                                        {/* Patrocinadores */}
                                        <div className={cardClass}>
                                            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">Patrocinadores Oficiais</h3>
                                            <div className="space-y-3">
                                                {patrocinadores.map(p => (
                                                    <div key={p.id} className="flex items-center gap-3">
                                                        <input 
                                                            id={`patro-${p.id}`} 
                                                            type="file" 
                                                            accept="image/*" 
                                                            onChange={e=>updateArray(setPatrocinadores, patrocinadores, p.id, 'file', e.target.files?.[0] || null)} 
                                                            className="flex-1 text-xs text-slate-500 dark:text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-600 dark:file:bg-blue-950 dark:file:text-blue-300 hover:file:bg-blue-100 cursor-pointer" 
                                                        />
                                                        {p.file && (
                                                            <button 
                                                                type="button"
                                                                onClick={()=>{ updateArray(setPatrocinadores, patrocinadores, p.id, 'file', null); (document.getElementById(`patro-${p.id}`) as HTMLInputElement).value = ''; }} 
                                                                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg cursor-pointer"
                                                            >
                                                                <X className="w-4 h-4"/>
                                                            </button>
                                                        )}
                                                        {patrocinadores.length > 1 && (
                                                            <button 
                                                                type="button"
                                                                onClick={()=>removeArray(setPatrocinadores, patrocinadores, p.id)} 
                                                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                                                            >
                                                                <Trash2 className="w-4 h-4"/>
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            <button 
                                                type="button"
                                                onClick={()=>setPatrocinadores([...patrocinadores, {id: Date.now(), file: null, fileName: ""}])} 
                                                className="inline-flex items-center gap-1.5 py-1.5 px-3 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                                            >
                                                <Plus className="w-3.5 h-3.5" /> Adicionar Logo de Patrocinador
                                            </button>
                                        </div>

                                        {/* Apoiadores */}
                                        <div className={cardClass}>
                                            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">Apoiadores Institucionais</h3>
                                            <div className="space-y-3">
                                                {apoiadores.map(a => (
                                                    <div key={a.id} className="flex items-center gap-3">
                                                        <input 
                                                            id={`apoi-${a.id}`} 
                                                            type="file" 
                                                            accept="image/*" 
                                                            onChange={e=>updateArray(setApoiadores, apoiadores, a.id, 'file', e.target.files?.[0] || null)} 
                                                            className="flex-1 text-xs text-slate-500 dark:text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-600 dark:file:bg-blue-950 dark:file:text-blue-300 hover:file:bg-blue-100 cursor-pointer" 
                                                        />
                                                        {a.file && (
                                                            <button 
                                                                type="button"
                                                                onClick={()=>{ updateArray(setApoiadores, apoiadores, a.id, 'file', null); (document.getElementById(`apoi-${a.id}`) as HTMLInputElement).value = ''; }} 
                                                                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg cursor-pointer"
                                                            >
                                                                <X className="w-4 h-4"/>
                                                            </button>
                                                        )}
                                                        {apoiadores.length > 1 && (
                                                            <button 
                                                                type="button"
                                                                onClick={()=>removeArray(setApoiadores, apoiadores, a.id)} 
                                                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                                                            >
                                                                <Trash2 className="w-4 h-4"/>
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            <button 
                                                type="button"
                                                onClick={()=>setApoiadores([...apoiadores, {id: Date.now(), file: null, fileName: ""}])} 
                                                className="inline-flex items-center gap-1.5 py-1.5 px-3 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                                            >
                                                <Plus className="w-3.5 h-3.5" /> Adicionar Logo de Apoiador
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 10. Financeiro */}
                        {activeTab === "financeiro" && (
                            <div className="space-y-6 animate-in fade-in">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-blue-900/40">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
                                            <Landmark className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Dados Bancários e Repasses</h2>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Dados da conta para liquidação e repasse dos valores das inscrições.</p>
                                        </div>
                                    </div>
                                    <NaoSeAplicaToggle state={bancarioNaoSeAplica} setState={setBancarioNaoSeAplica} />
                                </div>

                                {!bancarioNaoSeAplica && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className={labelClass}>Nome do Banco</label>
                                                <input type="text" placeholder="Ex: Banco do Brasil" value={dadosBancarios.banco} onChange={e=>setDadosBancarios({...dadosBancarios, banco: e.target.value})} className={inputClass} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className={labelClass}>Agência</label>
                                                <input type="text" placeholder="0000-0" value={dadosBancarios.agencia} onChange={e=>setDadosBancarios({...dadosBancarios, agencia: e.target.value})} className={inputClass} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className={labelClass}>Conta Corrente</label>
                                                <input type="text" placeholder="0000000-0" value={dadosBancarios.conta} onChange={e=>setDadosBancarios({...dadosBancarios, conta: e.target.value})} className={inputClass} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className={labelClass}>Chave PIX</label>
                                                <input type="text" placeholder="CNPJ, E-mail ou Telefone" value={dadosBancarios.chavePix} onChange={e=>setDadosBancarios({...dadosBancarios, chavePix: e.target.value})} className={inputClass} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className={labelClass}>Nome Completo do Titular</label>
                                                <input type="text" placeholder="Nome conforme cadastro bancário" value={dadosBancarios.titular} onChange={e=>setDadosBancarios({...dadosBancarios, titular: e.target.value})} className={inputClass} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className={labelClass}>CPF ou CNPJ do Titular</label>
                                                <input type="text" placeholder="000.000.000-00 ou 00.000.000/0000-00" value={dadosBancarios.documentoTitular} onChange={e=>setDadosBancarios({...dadosBancarios, documentoTitular: e.target.value})} className={inputClass} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                    </div>

                    {/* Rodapé de Navegação / Ações */}
                    <div className="bg-slate-50/90 dark:bg-[#071321]/80 border-t border-slate-200 dark:border-blue-900/40 px-5 sm:px-8 py-4 flex items-center justify-between gap-3">
                        <button
                            type="button"
                            onClick={() => goToTab(currentTabIndex - 1)}
                            disabled={isFirstTab}
                            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
                                !isFirstTab 
                                    ? "bg-white dark:bg-[#0c1e33] border-slate-200 dark:border-blue-900/50 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer shadow-sm" 
                                    : "opacity-40 cursor-not-allowed border-transparent text-slate-400"
                            }`}
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Anterior
                        </button>

                        <div className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                            Etapa <span className="font-bold text-slate-800 dark:text-slate-200">{currentTabIndex + 1}</span> de <span className="font-bold">{tabs.length}</span> — {tabs[currentTabIndex].label}
                        </div>

                        {isLastTab ? (
                            <button
                                type="button"
                                onClick={handleSaveEvent}
                                disabled={isLoading}
                                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Publicar Evento
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => goToTab(currentTabIndex + 1)}
                                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20 hover:shadow-blue-600/30 transition-all cursor-pointer"
                            >
                                Próxima Etapa
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                </div>
            </div>
        </main>
    );
}