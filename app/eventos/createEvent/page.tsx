"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
    Info, MapPin, AlignLeft, Users, Save, Loader2, Calendar, Ticket,
    ShieldAlert, ImagePlus, Trash2, Plus, MessageSquare, BookOpen,
    Upload, X, ChevronLeft, ChevronRight, UserPlus, PlusCircle,
    ArrowLeft, ArrowRight, Check, Sparkles, Building2, CreditCard, Clock, Map,
    CalendarCheck, AlertCircle, GripVertical, Wallet, FileText, Layers, FileCheck,
    Paperclip, Download, Settings, SlidersHorizontal, User, GraduationCap,
    CloudUpload, Link2, Mail, Send, Mic, Star, Presentation, ListChecks,
    Pencil, Tag, Trophy, Award, CheckCircle2, AlertTriangle, RefreshCw, BookMarked
} from "lucide-react";
import { collection, addDoc, doc, getDoc, updateDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Suspense } from "react";
import { getEventRegistrationStatus, getStatusBadgeConfig, formatDateTimeFriendly } from "@/lib/eventStatus";
import { verificarStatusSubconta } from "@/lib/subcontaUtils";
import {
    AvaliadorEvento,
    AvaliacaoDiaEvento,
    HorarioOcupadoParticipante,
    distribuirTrabalhosNosPeriodos,
    calcularNotaRanking,
    isTrabalhoAceito,
} from "@/lib/trabalhos";

function CreateEventContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get("id");
    const isEditing = Boolean(editId);

    const { user, userData, loading: authLoading } = useAuth();
    const [activeTab, setActiveTab] = useState("basicas");
    const [isLoading, setIsLoading] = useState(false);
    const [existingImg, setExistingImg] = useState("");
    const [loadingExisting, setLoadingExisting] = useState(false);

    const statusSubconta = verificarStatusSubconta(userData);
    const isAdmin = statusSubconta.isAdmin;
    const isPromotor = userData?.tipoUsuario === "promotor" || userData?.tipo_usuario === "promotor" || userData?.role === "promotor";
    const podeCriarEvento = isPromotor || isAdmin;

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.replace("/login");
            } else if (!podeCriarEvento) {
                router.replace("/eventos");
            }
        }
    }, [user, podeCriarEvento, authLoading, router]);

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

    // 2.1 Período de Inscrições
    const [dataInscricaoInicio, setDataInscricaoInicio] = useState("");
    const [dataInscricaoFim, setDataInscricaoFim] = useState("");
    const [horaInscricaoInicio, setHoraInscricaoInicio] = useState("");
    const [horaInscricaoFim, setHoraInscricaoFim] = useState("");

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

    // 11. Programação
    const [programacaoNaoSeAplica, setProgramacaoNaoSeAplica] = useState(false);
    const [programacao, setProgramacao] = useState([{
        id: Date.now(),
        data: "",
        atividades: [{ id: Date.now(), horaInicio: "", horaFim: "", titulo: "", local: "", palestrante: "" }]
    }]);
    const [draggedAtividadeIndex, setDraggedAtividadeIndex] = useState<{ diaId: number, index: number } | null>(null);

    const reorderAtividades = (diaId: number, startIndex: number, endIndex: number) => {
        setProgramacao(prev => prev.map(d => {
            if (d.id !== diaId) return d;
            const result = Array.from(d.atividades);
            const [removed] = result.splice(startIndex, 1);
            result.splice(endIndex, 0, removed);
            return { ...d, atividades: result };
        }));
    };

    // 13. Trabalhos & Submissão
    const [trabalhosNaoSeAplica, setTrabalhosNaoSeAplica] = useState(false);
    const [subTabTrabalhos, setSubTabTrabalhos] = useState<"configurar" | "areas" | "avaliacao_dia">("configurar");

    // Sub-área 1: Configurar Submissão
    const [inicioSubmissaoDateTime, setInicioSubmissaoDateTime] = useState("");
    const [fimSubmissaoDateTime, setFimSubmissaoDateTime] = useState("");
    const [instrucoesSubmissao, setInstrucoesSubmissao] = useState("");
    const [limiteTrabalhosAutor, setLimiteTrabalhosAutor] = useState("10");
    const [limiteTrabalhosCoautor, setLimiteTrabalhosCoautor] = useState("10");
    const [limiteTrabalhosOrientador, setLimiteTrabalhosOrientador] = useState("10");
    const [limiteCoautoresPorTrabalho, setLimiteCoautoresPorTrabalho] = useState("10");
    const [limiteOrientadoresPorTrabalho, setLimiteOrientadoresPorTrabalho] = useState("10");
    const [qtdAvaliadoresPorResumo, setQtdAvaliadoresPorResumo] = useState<"1" | "2" | "3">("1");
    const [limiteCaracteresSimples, setLimiteCaracteresSimples] = useState("2500");
    const [limiteCaracteresExpandido, setLimiteCaracteresExpandido] = useState("10000");
    const [regraPublicacaoAnais, setRegraPublicacaoAnais] = useState<"todos_aprovados" | "apresentados">("todos_aprovados");
    const [modoCalculoRanking, setModoCalculoRanking] = useState<
        "apenas_apresentacao" | "media_pre_e_apresentacao" | "soma_pre_e_apresentacao" | "apenas_pre_congresso"
    >("media_pre_e_apresentacao");
    const [tipoRegulamento, setTipoRegulamento] = useState<"pdf" | "url">("pdf");
    const [regulamentoFile, setRegulamentoFile] = useState<File | null>(null);
    const [regulamentoUrl, setRegulamentoUrl] = useState("");
    const [regulamentoNome, setRegulamentoNome] = useState("");
    const regulamentoInputRef = useRef<HTMLInputElement>(null);

    // Sub-área 2: Gerenciar Áreas de Avaliação & Avaliadores por Área
    interface AreaAvaliacaoItem {
        id: number;
        nome: string;
    }
    const [areasAvaliacao, setAreasAvaliacao] = useState<AreaAvaliacaoItem[]>([]);
    const [novaAreaNome, setNovaAreaNome] = useState("");
    const [erroArea, setErroArea] = useState("");
    const areaInputRef = useRef<HTMLInputElement>(null);
    const [editandoAreaId, setEditandoAreaId] = useState<number | null>(null);
    const [editandoAreaNome, setEditandoAreaNome] = useState("");
    const [enviandoNotificacao, setEnviandoNotificacao] = useState(false);

    // Avaliadores/Professores com áreas de interesse (mesma lista das áreas de avaliação)
    const [avaliadoresComissao, setAvaliadoresComissao] = useState<AvaliadorEvento[]>([]);
    const [novoAvaliadorNome, setNovoAvaliadorNome] = useState("");
    const [novoAvaliadorEmail, setNovoAvaliadorEmail] = useState("");
    const [novoAvaliadorAreas, setNovoAvaliadorAreas] = useState<string[]>([]);
    const [erroAvaliador, setErroAvaliador] = useState("");

    // Sub-área 3: Avaliação do Dia do Evento
    const [tempoApresentacaoOral, setTempoApresentacaoOral] = useState("15");
    const [notaMaximaOral, setNotaMaximaOral] = useState("10");
    const [qtdBannersPorPeriodo, setQtdBannersPorPeriodo] = useState("50");

    interface PeriodoItem {
        id: number;
        inicio: string;
        fim: string;
        local: string;
    }
    interface DiaPeriodos {
        id: number;
        label: string;
        data: string;
        periodosOral: PeriodoItem[];
        periodosBanner: PeriodoItem[];
    }
    const [diasAvaliacao, setDiasAvaliacao] = useState<DiaPeriodos[]>([]);
    const [novaDataApresentacao, setNovaDataApresentacao] = useState("");
    const [diasPersonalizadosManual, setDiasPersonalizadosManual] = useState(false);

    // Formulário inline/modal de adição de período
    const [modalPeriodo, setModalPeriodo] = useState<{
        diaId: number;
        tipo: "oral" | "banner";
        diaLabel: string;
    } | null>(null);
    const [periodoFormInicio, setPeriodoFormInicio] = useState("08:00");
    const [periodoFormFim, setPeriodoFormFim] = useState("12:00");
    const [periodoFormLocal, setPeriodoFormLocal] = useState("");

    // Critérios de Avaliação
    interface CriterioAvaliacaoItem {
        id: number;
        nome: string;
        peso: number;
    }
    const [criteriosAvaliacao, setCriteriosAvaliacao] = useState<CriterioAvaliacaoItem[]>([]);
    const [novoCriterioNome, setNovoCriterioNome] = useState("");
    const [novoCriterioPeso, setNovoCriterioPeso] = useState("1");
    const [erroCriterio, setErroCriterio] = useState("");
    const criterioInputRef = useRef<HTMLInputElement>(null);
    const [editandoCriterioId, setEditandoCriterioId] = useState<number | null>(null);
    const [editandoCriterioNome, setEditandoCriterioNome] = useState("");
    const [editandoCriterioPeso, setEditandoCriterioPeso] = useState("");

    // Helpers de Datas de Apresentação (compatíveis com os dias do evento)
    const formatarLabelDiaEvento = (dataIso: string, idxFallback?: number): string => {
        if (!dataIso || !dataIso.includes("-")) {
            return idxFallback !== undefined ? `Dia ${idxFallback + 1}` : "Dia do Evento";
        }
        const partes = dataIso.split("-");
        if (partes.length === 3) {
            return `Dia ${partes[2]}/${partes[1]}`;
        }
        return dataIso;
    };

    const gerarDiasDoIntervaloEvento = (inicio: string, fim: string, atuais: DiaPeriodos[] = []): DiaPeriodos[] => {
        const startStr = (inicio || "").trim();
        const endStr = (fim || "").trim() || startStr;
        if (!startStr) return atuais;

        const startDate = new Date(`${startStr}T12:00:00`);
        const endDate = new Date(`${endStr}T12:00:00`);
        if (isNaN(startDate.getTime())) return atuais;

        const finalEnd = !isNaN(endDate.getTime()) && endDate >= startDate ? endDate : startDate;
        const datasIso: string[] = [];
        const cursor = new Date(startDate);
        let count = 0;
        while (cursor <= finalEnd && count < 31) {
            const yyyy = cursor.getFullYear();
            const mm = String(cursor.getMonth() + 1).padStart(2, "0");
            const dd = String(cursor.getDate()).padStart(2, "0");
            datasIso.push(`${yyyy}-${mm}-${dd}`);
            cursor.setDate(cursor.getDate() + 1);
            count++;
        }

        return datasIso.map((dataStr, idx) => {
            const label = formatarLabelDiaEvento(dataStr, idx);
            const existente = atuais.find(d => d.data === dataStr || d.label === label);
            return {
                id: existente ? existente.id : Date.now() + idx + 1,
                label,
                data: dataStr,
                periodosOral: existente ? (existente.periodosOral || []) : [],
                periodosBanner: existente ? (existente.periodosBanner || []) : [],
            };
        });
    };

    // Sincroniza automaticamente os dias de apresentação quando o promotor preenche/altera as datas do evento na aba "Datas"
    useEffect(() => {
        if (!dataInicio) return;
        if (diasPersonalizadosManual && diasAvaliacao.length > 0) return;
        setDiasAvaliacao(prev => gerarDiasDoIntervaloEvento(dataInicio, dataFim || dataInicio, prev));
    }, [dataInicio, dataFim]);

    // Trabalhos submetidos e aceitos para distribuição e ranking
    const [todosTrabalhosEvento, setTodosTrabalhosEvento] = useState<any[]>([]);
    const [trabalhosAceitos, setTrabalhosAceitos] = useState<any[]>([]);
    const [carregandoTrabalhosAceitos, setCarregandoTrabalhosAceitos] = useState(false);
    const [avaliadoresInscritosEvento, setAvaliadoresInscritosEvento] = useState<AvaliadorEvento[]>([]);

    // Modal de avaliação no dia por múltiplos avaliadores (Admin / Comissão)
    const [modalAvaliarDiaAdmin, setModalAvaliarDiaAdmin] = useState<any | null>(null);
    const [adminAvaliadorNome, setAdminAvaliadorNome] = useState("");
    const [adminNotaDia, setAdminNotaDia] = useState("9.5");
    const [adminObservacaoDia, setAdminObservacaoDia] = useState("");
    const [salvandoNotaDiaAdmin, setSalvandoNotaDiaAdmin] = useState(false);

    // Modal de avaliação pré-congresso rápida pelo Admin
    const [modalAvaliarPreAdmin, setModalAvaliarPreAdmin] = useState<any | null>(null);
    const [adminDecisaoPre, setAdminDecisaoPre] = useState<"Aceito" | "Aceito com ressalvas" | "Recusado">("Aceito");
    const [adminNotaPre, setAdminNotaPre] = useState("9.0");
    const [adminParecerPre, setAdminParecerPre] = useState("");
    const [salvandoPreAdmin, setSalvandoPreAdmin] = useState(false);

    // Modal de Pendência / Ação Obrigatória (Preencher ou Marcar "Não se aplica")
    interface PendenciaSecao {
        tabId: string;
        secaoKey: "nome" | "descricao" | "datas_evento" | "datas_inscricao" | "local" | "ingressos" | "mensagens" | "palestrantes" | "minicursos" | "programacao" | "trabalhos" | "equipe" | "patrocinios";
        titulo: string;
        subtitulo: string;
        descricao: string;
        subTabTrabalhos?: "configurar" | "areas" | "avaliacao_dia";
        temNaoSeAplica: boolean;
    }
    const [modalPendencia, setModalPendencia] = useState<PendenciaSecao | null>(null);

    useEffect(() => {
        async function carregarEventoParaEdicao() {
            if (!editId || !user) return;
            try {
                setLoadingExisting(true);
                const docRef = doc(db, "events", editId);
                const snap = await getDoc(docRef);
                if (!snap.exists()) {
                    alert("Evento não encontrado para edição.");
                    router.replace("/usuario/painel/meus-eventos");
                    return;
                }
                const data = snap.data();
                if (data.userId && data.userId !== user.uid) {
                    alert("Você não possui permissão para editar este evento.");
                    router.replace("/usuario/painel/meus-eventos");
                    return;
                }

                setNomeEvento(data.title || "");
                setCategoria(data.category || "Seminário");
                setModalidade(data.modalidade || "Presencial");
                setCapacidade(data.capacidade || "");
                if (data.img) {
                    setExistingImg(data.img);
                    setImagePreview(data.img);
                }

                setDataInicio(data.dateInicio || "");
                setDataFim(data.dateFim || "");
                setHoraInicio(data.horaInicio || "");
                setHoraFim(data.horaFim || "");
                setCargaHoraria(data.workload || "");

                setDataInscricaoInicio(data.dataInscricaoInicio || "");
                setDataInscricaoFim(data.dataInscricaoFim || "");
                setHoraInscricaoInicio(data.horaInscricaoInicio || "");
                setHoraInscricaoFim(data.horaInscricaoFim || "");

                if (data.local) {
                    setLocalNaoSeAplica(false);
                    setCep(data.local.cep || "");
                    setEndereco(data.local.endereco || "");
                    setNumero(data.local.numero || "");
                    setBairro(data.local.bairro || "");
                    setCidade(data.local.cidade || "");
                    setNomeLocal(data.local.nomeLocal || "");
                } else {
                    setLocalNaoSeAplica(true);
                }

                if (data.lotes && data.lotes.length > 0) {
                    setIngressosNaoSeAplica(false);
                    setLotes(data.lotes.map((l: any, i: number) => ({ id: Date.now() + i, ...l })));
                } else {
                    setIngressosNaoSeAplica(true);
                }

                if (data.description) {
                    setDescricaoNaoSeAplica(false);
                    setDescricao(data.description);
                } else {
                    setDescricaoNaoSeAplica(true);
                }
                if (data.redesSociais) {
                    setInstagram(data.redesSociais.instagram || "");
                    setLinkedin(data.redesSociais.linkedin || "");
                    setFacebook(data.redesSociais.facebook || "");
                }

                if (data.mensagens && data.mensagens.length > 0) {
                    setMensagensNaoSeAplica(false);
                    setMensagens(data.mensagens.map((texto: string, i: number) => ({ id: Date.now() + i, texto })));
                } else {
                    setMensagensNaoSeAplica(true);
                }

                if (data.palestrantes && data.palestrantes.length > 0) {
                    setPalestrantesNaoSeAplica(false);
                    setPalestrantes(data.palestrantes.map((p: any, i: number) => ({
                        id: Date.now() + i,
                        foto: null,
                        fotoPreview: p.fotoUrl || p.foto || "",
                        nome: p.nome || "",
                        email: p.email || "",
                        especialidade: p.especialidade || "",
                        instituicao: p.instituicao || "",
                        telefone: p.telefone || "",
                        bio: p.bio || ""
                    })));
                } else {
                    setPalestrantesNaoSeAplica(true);
                }

                if (data.minicursos && data.minicursos.length > 0) {
                    setMinicursosNaoSeAplica(false);
                    setMinicursos(data.minicursos.map((m: any, i: number) => ({
                        id: Date.now() + i,
                        nome: m.nome || "",
                        tipo: m.tipo || "Teórico",
                        imagem: null,
                        imagemPreview: m.imagemUrl || "",
                        local: m.local || "",
                        descricao: m.descricao || "",
                        ministrantes: m.ministrantes?.map((mr: any, mi: number) => ({ id: Date.now() + mi, ...mr })) || [{ id: Date.now(), nome: "", email: "" }],
                        dias: m.dias?.map((d: any, di: number) => ({ id: Date.now() + di, ...d })) || [{ id: Date.now(), data: "", horaInicio: "", horaFim: "" }],
                        ingressos: m.ingressos?.map((ir: any, ii: number) => ({ id: Date.now() + ii, ...ir })) || [{ id: Date.now(), perfil: "", loteNumero: "1", preco: "", quantidade: "", codigoDesconto: "", valorPromocional: "", dataInicio: "", dataFim: "" }]
                    })));
                } else {
                    setMinicursosNaoSeAplica(true);
                }

                if (data.administradores && data.administradores.length > 0) {
                    setAdminsNaoSeAplica(false);
                    setAdministradores(data.administradores.map((a: any, i: number) => ({ id: Date.now() + i, ...a })));
                } else {
                    setAdminsNaoSeAplica(true);
                }

                const temPatro = (data.patrocinadores && data.patrocinadores.length > 0) || (data.apoiadores && data.apoiadores.length > 0);
                if (temPatro) {
                    setPatrociniosNaoSeAplica(false);
                    if (data.patrocinadores && data.patrocinadores.length > 0) {
                        setPatrocinadores(data.patrocinadores.map((url: string, i: number) => ({ id: Date.now() + i, file: null, fileName: url })));
                    }
                    if (data.apoiadores && data.apoiadores.length > 0) {
                        setApoiadores(data.apoiadores.map((url: string, i: number) => ({ id: Date.now() + i, file: null, fileName: url })));
                    }
                } else {
                    setPatrociniosNaoSeAplica(true);
                }

                if (data.programacao && Array.isArray(data.programacao) && data.programacao.length > 0) {
                    setProgramacaoNaoSeAplica(false);
                    setProgramacao(data.programacao.map((d: any, index: number) => ({
                        id: Date.now() + index,
                        data: d.data || "",
                        atividades: d.atividades ? d.atividades.map((a: any, aIndex: number) => ({
                            id: Date.now() + 1000 + aIndex,
                            horaInicio: a.horaInicio || "",
                            horaFim: a.horaFim || "",
                            titulo: a.titulo || "",
                            local: a.local || "",
                            palestrante: a.palestrante || ""
                        })) : []
                    })));
                } else {
                    setProgramacaoNaoSeAplica(true);
                }

                if (data.submissaoTrabalhos) {
                    const st = data.submissaoTrabalhos;
                    setTrabalhosNaoSeAplica(Boolean(st.naoSeAplica));

                    // Sub-área 1: Configurar Submissão
                    setInicioSubmissaoDateTime(st.dataInicioDateTime || (st.dataInicio ? `${st.dataInicio}T${st.horaInicio || "08:00"}` : ""));
                    setFimSubmissaoDateTime(st.dataFimDateTime || (st.dataFim ? `${st.dataFim}T${st.horaFim || "23:59"}` : ""));
                    setInstrucoesSubmissao(st.instrucoes || st.normas || "");

                    if (st.limitesCategoria) {
                        setLimiteTrabalhosAutor(String(st.limitesCategoria.autor ?? 10));
                        setLimiteTrabalhosCoautor(String(st.limitesCategoria.coautor ?? 10));
                        setLimiteTrabalhosOrientador(String(st.limitesCategoria.orientador ?? 10));
                    } else if (st.limiteTrabalhos) {
                        setLimiteTrabalhosAutor(String(st.limiteTrabalhos));
                    }

                    if (st.limitesPorTrabalho) {
                        setLimiteCoautoresPorTrabalho(String(st.limitesPorTrabalho.coautores ?? 10));
                        setLimiteOrientadoresPorTrabalho(String(st.limitesPorTrabalho.orientadores ?? 10));
                    } else if (st.limiteAutores) {
                        setLimiteCoautoresPorTrabalho(String(st.limiteAutores));
                    }

                    if (st.qtdAvaliadoresPorResumo) {
                        const qVal = String(st.qtdAvaliadoresPorResumo);
                        if (qVal === "1" || qVal === "2" || qVal === "3") {
                            setQtdAvaliadoresPorResumo(qVal);
                        }
                    }
                    if (st.limiteCaracteresSimples) {
                        setLimiteCaracteresSimples(String(st.limiteCaracteresSimples));
                    }
                    if (st.limiteCaracteresExpandido) {
                        setLimiteCaracteresExpandido(String(st.limiteCaracteresExpandido));
                    }
                    if (st.regraPublicacaoAnais === "apresentados" || st.regraPublicacaoAnais === "todos_aprovados") {
                        setRegraPublicacaoAnais(st.regraPublicacaoAnais);
                    }
                    if (
                        st.modoCalculoRanking === "apenas_apresentacao" ||
                        st.modoCalculoRanking === "media_pre_e_apresentacao" ||
                        st.modoCalculoRanking === "soma_pre_e_apresentacao" ||
                        st.modoCalculoRanking === "apenas_pre_congresso"
                    ) {
                        setModoCalculoRanking(st.modoCalculoRanking);
                    }
                    if (Array.isArray(st.avaliadoresComissao)) {
                        setAvaliadoresComissao(
                            st.avaliadoresComissao.map((av: any, idx: number) => ({
                                id: av.id || String(Date.now() + idx),
                                nome: av.nome || "",
                                email: av.email || "",
                                areasInteresse: Array.isArray(av.areasInteresse) ? av.areasInteresse : [],
                            }))
                        );
                    }

                    if (st.regulamento) {
                        setTipoRegulamento(st.regulamento.tipo || "pdf");
                        setRegulamentoUrl(st.regulamento.url || "");
                        setRegulamentoNome(st.regulamento.nome || "");
                    } else if (st.editalUrl) {
                        setTipoRegulamento("pdf");
                        setRegulamentoUrl(st.editalUrl);
                        setRegulamentoNome(st.editalNome || "Regulamento.pdf");
                    }

                    // Verifica se os dias salvos eram apenas o antigo mock estático (Dia 10/11, 11/11, 12/11 sem data e sem períodos)
                    const diasSalvos = st.avaliacaoDia?.dias;
                    const eraMockAntigo =
                        Array.isArray(diasSalvos) &&
                        diasSalvos.length === 3 &&
                        diasSalvos[0]?.label === "Dia 10/11" &&
                        diasSalvos[1]?.label === "Dia 11/11" &&
                        diasSalvos[2]?.label === "Dia 12/11" &&
                        !diasSalvos[0]?.data &&
                        (diasSalvos[0]?.periodosOral?.length || 0) === 0 &&
                        (diasSalvos[0]?.periodosBanner?.length || 0) === 0;

                    // Sub-área 2: Áreas de Avaliação
                    const listaAreasBruta =
                        st.areasAvaliacao && Array.isArray(st.areasAvaliacao)
                            ? st.areasAvaliacao
                            : st.eixosTematicos && Array.isArray(st.eixosTematicos)
                                ? st.eixosTematicos
                                : [];
                    const areasLimpas = listaAreasBruta
                        .map((a: any, i: number) => ({
                            id: Date.now() + i,
                            nome: (typeof a === "string" ? a : (a?.nome || "")).trim(),
                        }))
                        .filter((a: AreaAvaliacaoItem) => a.nome !== "");

                    if (eraMockAntigo && areasLimpas.length === 1 && areasLimpas[0].nome === "Ciências Exatas") {
                        setAreasAvaliacao([]);
                    } else {
                        setAreasAvaliacao(areasLimpas);
                    }

                    // Sub-área 3: Avaliação do Dia do Evento
                    if (st.avaliacaoDia) {
                        const ad = st.avaliacaoDia;
                        if (ad.oral) {
                            setTempoApresentacaoOral(String(ad.oral.tempoMinutos ?? 15));
                            setNotaMaximaOral(String(ad.oral.notaMaxima ?? 10));
                        }
                        if (ad.banner) {
                            setQtdBannersPorPeriodo(String(ad.banner.qtdPorPeriodo ?? 50));
                        }
                        if (!eraMockAntigo && ad.dias && Array.isArray(ad.dias) && ad.dias.length > 0) {
                            setDiasAvaliacao(
                                ad.dias.map((d: any, idx: number) => ({
                                    id: d.id || Date.now() + idx + 1,
                                    label: d.label || formatarLabelDiaEvento(d.data || "", idx),
                                    data: d.data || "",
                                    periodosOral: Array.isArray(d.periodosOral)
                                        ? d.periodosOral.map((p: any, pIdx: number) => ({
                                            id: p.id || Date.now() + pIdx + 100,
                                            inicio: p.inicio || "08:00",
                                            fim: p.fim || "12:00",
                                            local: p.local || "",
                                        }))
                                        : [],
                                    periodosBanner: Array.isArray(d.periodosBanner)
                                        ? d.periodosBanner.map((p: any, pIdx: number) => ({
                                            id: p.id || Date.now() + pIdx + 200,
                                            inicio: p.inicio || "08:00",
                                            fim: p.fim || "12:00",
                                            local: p.local || "",
                                        }))
                                        : [],
                                }))
                            );
                        } else {
                            setDiasAvaliacao(gerarDiasDoIntervaloEvento(data.dateInicio || "", data.dateFim || ""));
                        }
                        if (ad.criterios && Array.isArray(ad.criterios)) {
                            setCriteriosAvaliacao(
                                ad.criterios.map((c: any, cIdx: number) => ({
                                    id: c.id || Date.now() + cIdx + 300,
                                    nome: c.nome || "",
                                    peso: Number(c.peso) || 1,
                                }))
                            );
                        }
                    } else {
                        setDiasAvaliacao(gerarDiasDoIntervaloEvento(data.dateInicio || "", data.dateFim || ""));
                    }
                } else {
                    setTrabalhosNaoSeAplica(true);
                    setAreasAvaliacao([]);
                    setDiasAvaliacao(gerarDiasDoIntervaloEvento(data.dateInicio || "", data.dateFim || ""));
                }

                // Buscar todos os trabalhos submetidos e inscritos avaliadores se estiver editando
                try {
                    const q = query(
                        collection(db, "trabalhos"),
                        where("eventoId", "==", editId)
                    );
                    const snapTrabalhos = await getDocs(q);
                    const todos = snapTrabalhos.docs.map(d => ({ id: d.id, ...d.data() }));
                    setTodosTrabalhosEvento(todos);
                    const aceitos = todos.filter((t: any) => isTrabalhoAceito(t.status));
                    setTrabalhosAceitos(aceitos);

                    const qInsc = query(
                        collection(db, "inscricoes"),
                        where("eventoId", "==", editId)
                    );
                    const snapInsc = await getDocs(qInsc);
                    const avsInscritos: AvaliadorEvento[] = [];
                    snapInsc.docs.forEach(docSnap => {
                        const d = docSnap.data();
                        if (d.desejoAvaliador === true && d.participanteEmail) {
                            avsInscritos.push({
                                id: docSnap.id,
                                nome: d.participanteNome || d.participanteEmail,
                                email: d.participanteEmail,
                                areasInteresse: Array.isArray(d.areasInteresseAvaliador) ? d.areasInteresseAvaliador : [],
                            });
                        }
                    });
                    setAvaliadoresInscritosEvento(avsInscritos);
                } catch (e) {
                    console.log("Nenhum trabalho carregado:", e);
                }

            } catch (e) {
                console.error("Erro ao carregar dados do evento para edição:", e);
            } finally {
                setLoadingExisting(false);
            }
        }

        if (!authLoading && user && editId) {
            carregarEventoParaEdicao();
        }
    }, [editId, user, authLoading, router]);

    const tabs = [
        { id: "basicas", label: "Básicas", icon: Info, desc: "Identidade, categoria e carga horária" },
        { id: "datas", label: "Datas", icon: Calendar, desc: "Período e horários de realização" },
        { id: "local", label: "Local", icon: MapPin, desc: "Endereço e modalidade" },
        { id: "ingressos", label: "Ingressos", icon: Ticket, desc: "Lotes e valores de inscrição" },
        { id: "mensagens", label: "Mensagens", icon: MessageSquare, desc: "Carrossel de avisos rápidos" },
        { id: "palestrantes", label: "Palestrantes", icon: Users, desc: "Convidados e especialistas" },
        { id: "minicursos", label: "Minicursos", icon: BookOpen, desc: "Oficinas, workshops e aulas" },
        { id: "programacao", label: "Programação", icon: Clock, desc: "Grade de atividades por dia" },
        { id: "trabalhos", label: "Trabalhos & Submissão", icon: FileText, desc: "Prazos, eixos temáticos e regras" },
        { id: "equipe", label: "Equipe", icon: ShieldAlert, desc: "Administradores e permissões" },
        { id: "patrocinios", label: "Patrocínios", icon: ImagePlus, desc: "Marcas parceiras e apoiadores" },
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

    // --- Validação Obrigatória de Seções e "Não se aplica" ---
    const obterPendenciasEvento = (): PendenciaSecao[] => {
        const pendencias: PendenciaSecao[] = [];

        // 1. Básicas - Nome do Evento
        if (!nomeEvento.trim()) {
            pendencias.push({
                tabId: "basicas",
                secaoKey: "nome",
                titulo: "Nome do Evento Obrigatório",
                subtitulo: "Aba Básicas",
                descricao: "Por favor, informe o nome do seu evento antes de prosseguir.",
                temNaoSeAplica: false,
            });
        }

        // 1.1 Básicas - Descrição do Evento
        if (!descricaoNaoSeAplica && !descricao.trim()) {
            pendencias.push({
                tabId: "basicas",
                secaoKey: "descricao",
                titulo: "Descrição do Evento",
                subtitulo: "Aba Básicas • Descrição e Redes Sociais",
                descricao: "A descrição do evento não foi preenchida. Caso seu evento não necessite de uma descrição detalhada, você deve voltar a este campo e habilitar a opção 'Não se aplica'.",
                temNaoSeAplica: true,
            });
        }

        // 2. Datas - Realização do Evento
        if (!dataInicio || !dataFim) {
            pendencias.push({
                tabId: "datas",
                secaoKey: "datas_evento",
                titulo: "Datas de Realização do Evento",
                subtitulo: "Aba Datas • Período do Evento",
                descricao: "As datas de início e término do evento são obrigatórias para que a programação e o calendário funcionem corretamente.",
                temNaoSeAplica: false,
            });
        }

        // 2.1 Datas - Inscrições
        if (!dataInscricaoInicio || !dataInscricaoFim) {
            pendencias.push({
                tabId: "datas",
                secaoKey: "datas_inscricao",
                titulo: "Período das Inscrições",
                subtitulo: "Aba Datas • Período das Inscrições",
                descricao: "Informe as datas de início e término das inscrições para permitir que o público possa se inscrever.",
                temNaoSeAplica: false,
            });
        }

        // 3. Local
        const temLocalPreenchido = Boolean(nomeLocal.trim() || endereco.trim() || cidade.trim() || cep.trim());
        if (!localNaoSeAplica && !temLocalPreenchido) {
            pendencias.push({
                tabId: "local",
                secaoKey: "local",
                titulo: "Localização e Espaço Físico",
                subtitulo: "Aba Local",
                descricao: "Os dados de localização não foram informados. Preencha o local do evento ou, caso seja um evento 100% online ou sem local fixo, você deve habilitar a opção 'Não se aplica'.",
                temNaoSeAplica: true,
            });
        }

        // 4. Ingressos
        const temLoteValido = lotes.length > 0 && lotes.some(l => Boolean(l.perfil?.trim() && l.preco !== "" && l.preco !== undefined));
        if (!ingressosNaoSeAplica && !temLoteValido) {
            pendencias.push({
                tabId: "ingressos",
                secaoKey: "ingressos",
                titulo: "Ingressos por Lotes",
                subtitulo: "Aba Ingressos",
                descricao: "Nenhum lote de ingresso foi configurado. Configure ao menos um perfil de ingresso com seu valor ou, caso as inscrições sejam externas ou gratuitas sem controle de lotes, você deve habilitar a opção 'Não se aplica'.",
                temNaoSeAplica: true,
            });
        }

        // 5. Mensagens
        const temMensagemValida = mensagens.length > 0 && mensagens.some(m => m.texto.trim().length > 0);
        if (!mensagensNaoSeAplica && !temMensagemValida) {
            pendencias.push({
                tabId: "mensagens",
                secaoKey: "mensagens",
                titulo: "Mensagens e Avisos Rápidos",
                subtitulo: "Aba Mensagens",
                descricao: "O carrossel de avisos não possui nenhuma mensagem cadastrada. Adicione ao menos um aviso rápido ou você deve habilitar a opção 'Não se aplica'.",
                temNaoSeAplica: true,
            });
        }

        // 6. Palestrantes
        const temPalestranteValido = palestrantes.length > 0 && palestrantes.some(p => p.nome.trim().length > 0);
        if (!palestrantesNaoSeAplica && !temPalestranteValido) {
            pendencias.push({
                tabId: "palestrantes",
                secaoKey: "palestrantes",
                titulo: "Palestrantes e Convidados",
                subtitulo: "Aba Palestrantes",
                descricao: "Nenhum palestrante foi cadastrado. Adicione os palestrantes do evento ou você deve habilitar a opção 'Não se aplica'.",
                temNaoSeAplica: true,
            });
        }

        // 7. Minicursos
        const temMinicursoValido = minicursos.length > 0 && minicursos.some(m => m.nome.trim().length > 0);
        if (!minicursosNaoSeAplica && !temMinicursoValido) {
            pendencias.push({
                tabId: "minicursos",
                secaoKey: "minicursos",
                titulo: "Minicursos e Workshops",
                subtitulo: "Aba Minicursos",
                descricao: "Nenhum minicurso foi cadastrado. Adicione os minicursos/oficinas ou você deve habilitar a opção 'Não se aplica'.",
                temNaoSeAplica: true,
            });
        }

        // 8. Programação
        const temProgramacaoValida = programacao.length > 0 && programacao.some(d => Boolean(d.data?.trim() || (d.atividades && d.atividades.some(a => a.titulo?.trim().length > 0))));
        if (!programacaoNaoSeAplica && !temProgramacaoValida) {
            pendencias.push({
                tabId: "programacao",
                secaoKey: "programacao",
                titulo: "Grade de Programação",
                subtitulo: "Aba Programação",
                descricao: "A grade de programação do evento está em branco. Monte as atividades da programação ou você deve habilitar a opção 'Não se aplica'.",
                temNaoSeAplica: true,
            });
        }

        // 9. Trabalhos & Submissão
        if (!trabalhosNaoSeAplica) {
            if (!inicioSubmissaoDateTime || !fimSubmissaoDateTime) {
                pendencias.push({
                    tabId: "trabalhos",
                    subTabTrabalhos: "configurar",
                    secaoKey: "trabalhos",
                    titulo: "Prazos de Submissão de Trabalhos",
                    subtitulo: "Aba Trabalhos & Submissão • Configurar Submissão",
                    descricao: "A submissão de trabalhos científicos está ativa, mas os prazos de início e término não foram preenchidos. Preencha as datas ou você deve habilitar a opção 'Não se aplica'.",
                    temNaoSeAplica: true,
                });
            } else if (areasAvaliacao.length === 0) {
                pendencias.push({
                    tabId: "trabalhos",
                    subTabTrabalhos: "areas",
                    secaoKey: "trabalhos",
                    titulo: "Áreas Temáticas de Avaliação",
                    subtitulo: "Aba Trabalhos & Submissão • Áreas de Avaliação",
                    descricao: "A submissão de trabalhos científicos está ativa, mas nenhuma Área de Avaliação foi cadastrada. Cadastre as áreas temáticas ou você deve habilitar a opção 'Não se aplica'.",
                    temNaoSeAplica: true,
                });
            }
        }

        // 10. Equipe e Administradores
        const temAdminValido = administradores.length > 0 && administradores.some(a => a.nome.trim().length > 0 || a.email.trim().length > 0);
        if (!adminsNaoSeAplica && !temAdminValido) {
            pendencias.push({
                tabId: "equipe",
                secaoKey: "equipe",
                titulo: "Equipe e Administradores",
                subtitulo: "Aba Equipe",
                descricao: "Nenhum administrador adicional foi incluído. Adicione membros à comissão organizadora ou você deve habilitar a opção 'Não se aplica'.",
                temNaoSeAplica: true,
            });
        }

        // 11. Patrocínios e Apoiadores
        const temPatrocinioValido = patrocinadores.some(p => p.file || (p.fileName && p.fileName.trim().length > 0)) ||
            apoiadores.some(a => a.file || (a.fileName && a.fileName.trim().length > 0));
        if (!patrociniosNaoSeAplica && !temPatrocinioValido) {
            pendencias.push({
                tabId: "patrocinios",
                secaoKey: "patrocinios",
                titulo: "Patrocinadores e Apoiadores",
                subtitulo: "Aba Patrocínios",
                descricao: "Nenhuma logomarca de patrocinador ou apoiador foi adicionada. Faça o upload das imagens ou você deve habilitar a opção 'Não se aplica'.",
                temNaoSeAplica: true,
            });
        }

        return pendencias;
    };

    const handleHabilitarNaoSeAplica = (secaoKey: string, autoAvancar: boolean = false) => {
        switch (secaoKey) {
            case "descricao": setDescricaoNaoSeAplica(true); break;
            case "local": setLocalNaoSeAplica(true); break;
            case "ingressos": setIngressosNaoSeAplica(true); break;
            case "mensagens": setMensagensNaoSeAplica(true); break;
            case "palestrantes": setPalestrantesNaoSeAplica(true); break;
            case "minicursos": setMinicursosNaoSeAplica(true); break;
            case "programacao": setProgramacaoNaoSeAplica(true); break;
            case "trabalhos": setTrabalhosNaoSeAplica(true); break;
            case "equipe": setAdminsNaoSeAplica(true); break;
            case "patrocinios": setPatrociniosNaoSeAplica(true); break;
        }
        setModalPendencia(null);
        if (autoAvancar && currentTabIndex < tabs.length - 1) {
            goToTab(currentTabIndex + 1);
        }
    };

    const handleAvancarEtapa = () => {
        const pendenciasAbaAtual = obterPendenciasEvento().filter(p => p.tabId === activeTab);
        if (pendenciasAbaAtual.length > 0) {
            setModalPendencia(pendenciasAbaAtual[0]);
            return;
        }
        goToTab(currentTabIndex + 1);
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

    // --- Helpers Programação ---
    const addDiaProgramacao = () => {
        setProgramacao(prev => [...prev, {
            id: Date.now(),
            data: "",
            atividades: [{ id: Date.now(), horaInicio: "", horaFim: "", titulo: "", local: "", palestrante: "" }]
        }]);
    };
    const removeDiaProgramacao = (diaId: number) => {
        setProgramacao(prev => prev.filter(d => d.id !== diaId));
    };
    const updateDiaProgramacao = (diaId: number, field: string, value: string) => {
        setProgramacao(prev => prev.map(d => d.id === diaId ? { ...d, [field]: value } : d));
    };
    const addAtividadeProgramacao = (diaId: number) => {
        setProgramacao(prev => prev.map(d => d.id === diaId ? {
            ...d,
            atividades: [...d.atividades, { id: Date.now(), horaInicio: "", horaFim: "", titulo: "", local: "", palestrante: "" }]
        } : d));
    };
    const removeAtividadeProgramacao = (diaId: number, ativId: number) => {
        setProgramacao(prev => prev.map(d => d.id === diaId ? {
            ...d,
            atividades: d.atividades.filter(a => a.id !== ativId)
        } : d));
    };
    const updateAtividadeProgramacao = (diaId: number, ativId: number, field: string, value: string) => {
        setProgramacao(prev => prev.map(d => d.id === diaId ? {
            ...d,
            atividades: d.atividades.map(a => a.id === ativId ? { ...a, [field]: value } : a)
        } : d));
    };

    // --- Helpers de Persistência Rápida da Aba Trabalhos (quando editando evento) ---
    const sincronizarSubmissaoFirestore = async (override?: {
        areas?: AreaAvaliacaoItem[];
        dias?: DiaPeriodos[];
        criterios?: CriterioAvaliacaoItem[];
        regulamentoUrlOverride?: string;
        avaliadoresOverride?: AvaliadorEvento[];
        regraAnaisOverride?: "todos_aprovados" | "apresentados";
        modoRankingOverride?: "apenas_apresentacao" | "media_pre_e_apresentacao" | "soma_pre_e_apresentacao" | "apenas_pre_congresso";
    }) => {
        if (!isEditing || !editId) return;
        try {
            const areasFinais = override?.areas ?? areasAvaliacao;
            const urlRegFinal = override?.regulamentoUrlOverride ?? regulamentoUrl ?? "";
            const avaliadoresFinais = override?.avaliadoresOverride ?? avaliadoresComissao;
            const regraAnaisFinal = override?.regraAnaisOverride ?? regraPublicacaoAnais;
            const modoRankingFinal = override?.modoRankingOverride ?? modoCalculoRanking;
            const diasFinais = (override?.dias ?? diasAvaliacao).map(d => ({
                id: d.id,
                label: d.label || "Dia do Evento",
                data: d.data || "",
                periodosOral: (d.periodosOral || []).map(p => ({
                    id: p.id,
                    inicio: p.inicio || "08:00",
                    fim: p.fim || "12:00",
                    local: p.local || "",
                })),
                periodosBanner: (d.periodosBanner || []).map(p => ({
                    id: p.id,
                    inicio: p.inicio || "08:00",
                    fim: p.fim || "12:00",
                    local: p.local || "",
                })),
            }));
            const criteriosFinais = (override?.criterios ?? criteriosAvaliacao).map(c => ({
                id: c.id,
                nome: c.nome,
                peso: Number(c.peso) || 1,
            }));

            const payloadSubmissao = trabalhosNaoSeAplica
                ? { naoSeAplica: true }
                : {
                    naoSeAplica: false,
                    dataInicioDateTime: inicioSubmissaoDateTime || "",
                    dataFimDateTime: fimSubmissaoDateTime || "",
                    instrucoes: instrucoesSubmissao || "",
                    qtdAvaliadoresPorResumo: Number(qtdAvaliadoresPorResumo) || 1,
                    limiteCaracteresSimples: Number(limiteCaracteresSimples) || 2500,
                    limiteCaracteresExpandido: Number(limiteCaracteresExpandido) || 10000,
                    regraPublicacaoAnais: regraAnaisFinal,
                    modoCalculoRanking: modoRankingFinal,
                    avaliadoresComissao: avaliadoresFinais,
                    limitesCategoria: {
                        autor: Number(limiteTrabalhosAutor) || 10,
                        coautor: Number(limiteTrabalhosCoautor) || 10,
                        orientador: Number(limiteTrabalhosOrientador) || 10,
                    },
                    limitesPorTrabalho: {
                        coautores: Number(limiteCoautoresPorTrabalho) || 10,
                        orientadores: Number(limiteOrientadoresPorTrabalho) || 10,
                    },
                    regulamento: {
                        tipo: tipoRegulamento,
                        url: urlRegFinal,
                        nome: regulamentoFile ? regulamentoFile.name : (regulamentoNome || ""),
                    },
                    areasAvaliacao: areasFinais.map(a => a.nome),
                    avaliacaoDia: {
                        oral: {
                            tempoMinutos: Number(tempoApresentacaoOral) || 15,
                            notaMaxima: Number(notaMaximaOral) || 10,
                        },
                        banner: {
                            qtdPorPeriodo: Number(qtdBannersPorPeriodo) || 50,
                        },
                        dias: diasFinais,
                        criterios: criteriosFinais,
                    },
                    dataInicio: inicioSubmissaoDateTime ? inicioSubmissaoDateTime.split("T")[0] : "",
                    horaInicio: inicioSubmissaoDateTime ? (inicioSubmissaoDateTime.split("T")[1] || "") : "",
                    dataFim: fimSubmissaoDateTime ? fimSubmissaoDateTime.split("T")[0] : "",
                    horaFim: fimSubmissaoDateTime ? (fimSubmissaoDateTime.split("T")[1] || "") : "",
                    eixosTematicos: areasFinais.map(a => ({ nome: a.nome, descricao: "" })),
                    normas: instrucoesSubmissao || "",
                    editalUrl: urlRegFinal,
                    editalNome: regulamentoFile ? regulamentoFile.name : (regulamentoNome || ""),
                    limiteAutores: Number(limiteCoautoresPorTrabalho) || 10,
                    limiteTrabalhos: Number(limiteTrabalhosAutor) || 10,
                };

            await updateDoc(doc(db, "events", editId), {
                submissaoTrabalhos: payloadSubmissao,
                updatedAt: new Date().toISOString(),
            });
        } catch (err) {
            console.error("Erro ao sincronizar configurações de submissão:", err);
        }
    };

    // --- Helpers Sub-área 2: Áreas de Avaliação & Avaliadores ---
    const handleAddAreaAvaliacao = () => {
        const nomeTrim = novaAreaNome.trim();
        if (!nomeTrim) {
            setErroArea("Por favor, digite o nome da área no campo acima antes de clicar em Adicionar Área.");
            areaInputRef.current?.focus();
            return;
        }
        if (areasAvaliacao.some(a => a.nome.toLowerCase() === nomeTrim.toLowerCase())) {
            setErroArea("Esta área de avaliação já foi adicionada.");
            areaInputRef.current?.focus();
            return;
        }
        const novaLista = [
            ...areasAvaliacao,
            { id: Date.now() + Math.floor(Math.random() * 10000), nome: nomeTrim },
        ];
        setAreasAvaliacao(novaLista);
        setNovaAreaNome("");
        setErroArea("");
        void sincronizarSubmissaoFirestore({ areas: novaLista });
    };

    const handleSalvarEdicaoArea = (id: number) => {
        const nomeTrim = editandoAreaNome.trim();
        if (!nomeTrim) return;
        const novaLista = areasAvaliacao.map(a => (a.id === id ? { ...a, nome: nomeTrim } : a));
        setAreasAvaliacao(novaLista);
        setEditandoAreaId(null);
        setEditandoAreaNome("");
        void sincronizarSubmissaoFirestore({ areas: novaLista });
    };

    const handleRemoveAreaAvaliacao = (id: number) => {
        const novaLista = areasAvaliacao.filter(a => a.id !== id);
        setAreasAvaliacao(novaLista);
        void sincronizarSubmissaoFirestore({ areas: novaLista });
    };

    const handleAddAvaliadorComissao = () => {
        const nomeTrim = novoAvaliadorNome.trim();
        const emailTrim = novoAvaliadorEmail.trim().toLowerCase();
        if (!nomeTrim || !emailTrim || !emailTrim.includes("@")) {
            setErroAvaliador("Informe o nome e um e-mail válido para o avaliador/professor.");
            return;
        }
        if (areasAvaliacao.length > 0 && novoAvaliadorAreas.length === 0) {
            setErroAvaliador("Selecione pelo menos uma área de interesse para este avaliador/professor.");
            return;
        }
        if (avaliadoresComissao.some(av => av.email.toLowerCase() === emailTrim)) {
            setErroAvaliador("Este e-mail já está cadastrado na comissão avaliadora.");
            return;
        }
        const novoAv: AvaliadorEvento = {
            id: String(Date.now() + Math.floor(Math.random() * 10000)),
            nome: nomeTrim,
            email: emailTrim,
            areasInteresse: novoAvaliadorAreas,
        };
        const novaLista = [...avaliadoresComissao, novoAv];
        setAvaliadoresComissao(novaLista);
        setNovoAvaliadorNome("");
        setNovoAvaliadorEmail("");
        setNovoAvaliadorAreas([]);
        setErroAvaliador("");
        void sincronizarSubmissaoFirestore({ avaliadoresOverride: novaLista });
    };

    const handleRemoveAvaliadorComissao = (id: string) => {
        const novaLista = avaliadoresComissao.filter(av => av.id !== id);
        setAvaliadoresComissao(novaLista);
        void sincronizarSubmissaoFirestore({ avaliadoresOverride: novaLista });
    };

    const handleToggleAreaAvaliadorComissao = (id: string, areaNome: string) => {
        const novaLista = avaliadoresComissao.map(av => {
            if (av.id !== id) return av;
            const areasAtuais = av.areasInteresse || [];
            const jaTem = areasAtuais.includes(areaNome);
            const novasAreas = jaTem
                ? areasAtuais.filter(a => a !== areaNome)
                : [...areasAtuais, areaNome];
            return { ...av, areasInteresse: novasAreas };
        });
        setAvaliadoresComissao(novaLista);
        void sincronizarSubmissaoFirestore({ avaliadoresOverride: novaLista });
    };

    const handleNotificarInscritos = async () => {
        if (areasAvaliacao.length === 0) {
            alert("Cadastre pelo menos uma área de avaliação antes de enviar a notificação.");
            return;
        }
        setEnviandoNotificacao(true);
        try {
            await new Promise(r => setTimeout(r, 900));
            alert("Notificação de novas áreas de avaliação enviada com sucesso para os avaliadores e alunos inscritos neste evento!");
        } catch (e) {
            alert("Erro ao enviar notificações.");
        } finally {
            setEnviandoNotificacao(false);
        }
    };

    // --- Helpers Sub-área 3: Avaliação do Dia do Evento ---
    const handleAddDiaApresentacaoManual = () => {
        const dataTrim = novaDataApresentacao.trim();
        if (!dataTrim) {
            alert("Selecione uma data no calendário para adicionar o dia de apresentação.");
            return;
        }
        if (dataInicio && dataTrim < dataInicio) {
            alert(`A data selecionada deve ser a partir do início do evento (${dataInicio.split("-").reverse().join("/")}).`);
            return;
        }
        if (dataFim && dataTrim > dataFim) {
            alert(`A data selecionada deve ser até o término do evento (${dataFim.split("-").reverse().join("/")}).`);
            return;
        }
        const label = formatarLabelDiaEvento(dataTrim);
        if (diasAvaliacao.some(d => d.data === dataTrim || d.label === label)) {
            alert("Este dia já está na lista de períodos de apresentação.");
            return;
        }
        setDiasPersonalizadosManual(true);
        const novaListaDias = [
            ...diasAvaliacao,
            {
                id: Date.now() + Math.floor(Math.random() * 10000),
                label,
                data: dataTrim,
                periodosOral: [],
                periodosBanner: [],
            },
        ].sort((a, b) => (a.data || "").localeCompare(b.data || ""));
        setDiasAvaliacao(novaListaDias);
        setNovaDataApresentacao("");
        void sincronizarSubmissaoFirestore({ dias: novaListaDias });
    };

    const handleSincronizarDiasComEvento = () => {
        if (!dataInicio) {
            alert("Preencha a Data de Início do Evento na aba 'Datas' ou adicione uma data manualmente ao lado.");
            return;
        }
        setDiasPersonalizadosManual(false);
        const sincronizados = gerarDiasDoIntervaloEvento(dataInicio, dataFim || dataInicio, diasAvaliacao);
        setDiasAvaliacao(sincronizados);
        void sincronizarSubmissaoFirestore({ dias: sincronizados });
    };

    const handleRemoveDiaAvaliacao = (diaId: number) => {
        setDiasPersonalizadosManual(true);
        const novaListaDias = diasAvaliacao.filter(d => d.id !== diaId);
        setDiasAvaliacao(novaListaDias);
        void sincronizarSubmissaoFirestore({ dias: novaListaDias });
    };

    const handleSalvarNovoPeriodo = () => {
        if (!modalPeriodo) return;
        if (!periodoFormInicio || !periodoFormFim) {
            alert("Informe o horário de início e de término do período.");
            return;
        }
        const { diaId, tipo } = modalPeriodo;
        const novo: PeriodoItem = {
            id: Date.now() + Math.floor(Math.random() * 10000),
            inicio: periodoFormInicio,
            fim: periodoFormFim,
            local: periodoFormLocal.trim() || "",
        };
        const novaListaDias = diasAvaliacao.map(d => {
            if (d.id !== diaId) return d;
            if (tipo === "oral") {
                return { ...d, periodosOral: [...d.periodosOral, novo] };
            } else {
                return { ...d, periodosBanner: [...d.periodosBanner, novo] };
            }
        });
        setDiasAvaliacao(novaListaDias);
        setModalPeriodo(null);
        setPeriodoFormLocal("");
        void sincronizarSubmissaoFirestore({ dias: novaListaDias });
    };

    const handleRemovePeriodo = (diaId: number, tipo: "oral" | "banner", periodoId: number) => {
        const novaListaDias = diasAvaliacao.map(d => {
            if (d.id !== diaId) return d;
            if (tipo === "oral") {
                return { ...d, periodosOral: d.periodosOral.filter(p => p.id !== periodoId) };
            } else {
                return { ...d, periodosBanner: d.periodosBanner.filter(p => p.id !== periodoId) };
            }
        });
        setDiasAvaliacao(novaListaDias);
        void sincronizarSubmissaoFirestore({ dias: novaListaDias });
    };

    const handleAddCriterio = () => {
        const nomeTrim = novoCriterioNome.trim();
        if (!nomeTrim) {
            setErroCriterio("Por favor, digite o nome do critério antes de clicar no botão (+).");
            criterioInputRef.current?.focus();
            return;
        }
        const pesoNum = parseFloat(String(novoCriterioPeso).replace(",", "."));
        if (isNaN(pesoNum) || pesoNum <= 0) {
            setErroCriterio("Informe um peso numérico válido maior que zero.");
            return;
        }
        const notaMax = Number(notaMaximaOral) || 10;
        const somaAtual = criteriosAvaliacao.reduce((acc, c) => acc + (Number(c.peso) || 0), 0);
        if (somaAtual + pesoNum > notaMax + 0.0001) {
            setErroCriterio(`O peso informado (${pesoNum}) ultrapassa o saldo disponível (${Math.max(0, notaMax - somaAtual).toFixed(3).replace(".", ",")}).`);
            return;
        }
        const novaLista = [
            ...criteriosAvaliacao,
            {
                id: Date.now() + Math.floor(Math.random() * 10000),
                nome: nomeTrim,
                peso: pesoNum,
            },
        ];
        setCriteriosAvaliacao(novaLista);
        setNovoCriterioNome("");
        setNovoCriterioPeso("1");
        setErroCriterio("");
        void sincronizarSubmissaoFirestore({ criterios: novaLista });
    };

    const handleSalvarEdicaoCriterio = (id: number) => {
        const nomeTrim = editandoCriterioNome.trim();
        const pesoNum = parseFloat(String(editandoCriterioPeso).replace(",", "."));
        if (!nomeTrim || isNaN(pesoNum) || pesoNum <= 0) return;
        const novaLista = criteriosAvaliacao.map(c =>
            c.id === id ? { ...c, nome: nomeTrim, peso: pesoNum } : c
        );
        setCriteriosAvaliacao(novaLista);
        setEditandoCriterioId(null);
        setEditandoCriterioNome("");
        setEditandoCriterioPeso("");
        void sincronizarSubmissaoFirestore({ criterios: novaLista });
    };

    const handleRemoveCriterio = (id: number) => {
        const novaLista = criteriosAvaliacao.filter(c => c.id !== id);
        setCriteriosAvaliacao(novaLista);
        void sincronizarSubmissaoFirestore({ criterios: novaLista });
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
        // Bloqueio obrigatório: Promotor (não administrador) deve possuir subconta Asaas ativa para criar novo evento
        if (!isEditing && !isAdmin && isPromotor && !statusSubconta.isAtiva) {
            alert(
                "Para poder criar evento, a sua conta no Asaas tem que ser criada primeiro. A criação de eventos só é liberada quando a situação do cadastro estiver completa (conta ativa)."
            );
            router.push("/usuario/painel/financeiro");
            return;
        }

        // Validação obrigatória de todas as etapas e seções ("Não se aplica" explícito ou preenchimento)
        const pendencias = obterPendenciasEvento();
        if (pendencias.length > 0) {
            const primeira = pendencias[0];
            setActiveTab(primeira.tabId);
            if (primeira.subTabTrabalhos) {
                setSubTabTrabalhos(primeira.subTabTrabalhos);
            }
            const tabIdx = tabs.findIndex(t => t.id === primeira.tabId);
            if (tabIdx !== -1 && tabsNavRef.current?.children[tabIdx]) {
                (tabsNavRef.current.children[tabIdx] as HTMLElement).scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
            }
            setModalPendencia(primeira);
            return;
        }

        setIsLoading(true);
        try {
            const uploadFile = async (file: File | null, folder: string) => {
                if (!file) return "";
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `${folder}/${fileName}`;
                const { error } = await supabase.storage.from('events').upload(filePath, file);
                if (error) {
                    console.error("Erro ao fazer upload da imagem para o Supabase (pasta " + folder + "):", error);
                    return "";
                }
                const { data } = supabase.storage.from('events').getPublicUrl(filePath);
                return data.publicUrl;
            };

            // 1. Imagem Principal
            const publicUrl = imageFile ? await uploadFile(imageFile, 'event-logos') : existingImg;

            // 2. Patrocínios
            const patroUrls = patrociniosNaoSeAplica ? [] : await Promise.all(patrocinadores.map(async (p) => {
                if (p.file) return await uploadFile(p.file, 'patrocinadores');
                return p.fileName && p.fileName.startsWith("http") ? p.fileName : "";
            }));
            const apoiUrls = patrociniosNaoSeAplica ? [] : await Promise.all(apoiadores.map(async (a) => {
                if (a.file) return await uploadFile(a.file, 'apoiadores');
                return a.fileName && a.fileName.startsWith("http") ? a.fileName : "";
            }));

            // 3. Palestrantes
            const palestrantesFinais = palestrantesNaoSeAplica ? [] : await Promise.all(palestrantes.map(async (p) => {
                const fotoUrl = p.foto ? await uploadFile(p.foto, 'palestrantes') : (p.fotoPreview && p.fotoPreview.startsWith("http") ? p.fotoPreview : "");
                const { id, foto, fotoPreview, ...rest } = p;
                return { ...rest, fotoUrl };
            }));

            // 4. Minicursos
            const minicursosFinais = minicursosNaoSeAplica ? [] : await Promise.all(minicursos.map(async (m) => {
                const imagemUrl = m.imagem ? await uploadFile(m.imagem, 'minicursos') : (m.imagemPreview && m.imagemPreview.startsWith("http") ? m.imagemPreview : "");
                const { id, imagem, imagemPreview, ministrantes, dias, ingressos, ...rest } = m;
                return {
                    ...rest, imagemUrl,
                    ministrantes: ministrantes.map(({ id, ...mr }) => mr),
                    dias: dias.map(({ id, ...dr }) => dr),
                    ingressos: ingressos.map(({ id, ...ir }) => ir)
                };
            }));

            // 4.1 Regulamento / Edital de Trabalhos
            let finalRegulamentoUrl = regulamentoUrl;
            if (tipoRegulamento === "pdf" && regulamentoFile) {
                finalRegulamentoUrl = await uploadFile(regulamentoFile, 'trabalhos-editais');
            }

            const submissaoTrabalhosObj = trabalhosNaoSeAplica ? { naoSeAplica: true } : {
                naoSeAplica: false,
                // Sub-área 1: Configurar Submissão
                dataInicioDateTime: inicioSubmissaoDateTime,
                dataFimDateTime: fimSubmissaoDateTime,
                instrucoes: instrucoesSubmissao,
                qtdAvaliadoresPorResumo: Number(qtdAvaliadoresPorResumo) || 1,
                limiteCaracteresSimples: Number(limiteCaracteresSimples) || 2500,
                limiteCaracteresExpandido: Number(limiteCaracteresExpandido) || 10000,
                regraPublicacaoAnais,
                modoCalculoRanking,
                avaliadoresComissao,
                limitesCategoria: {
                    autor: Number(limiteTrabalhosAutor) || 10,
                    coautor: Number(limiteTrabalhosCoautor) || 10,
                    orientador: Number(limiteTrabalhosOrientador) || 10,
                },
                limitesPorTrabalho: {
                    coautores: Number(limiteCoautoresPorTrabalho) || 10,
                    orientadores: Number(limiteOrientadoresPorTrabalho) || 10,
                },
                regulamento: {
                    tipo: tipoRegulamento,
                    url: finalRegulamentoUrl,
                    nome: regulamentoFile ? regulamentoFile.name : regulamentoNome,
                },
                // Sub-área 2: Áreas de Avaliação
                areasAvaliacao: areasAvaliacao.map(a => a.nome),
                // Sub-área 3: Avaliação do Dia do Evento
                avaliacaoDia: {
                    oral: {
                        tempoMinutos: Number(tempoApresentacaoOral) || 15,
                        notaMaxima: Number(notaMaximaOral) || 10,
                    },
                    banner: {
                        qtdPorPeriodo: Number(qtdBannersPorPeriodo) || 50,
                    },
                    dias: diasAvaliacao.map(d => ({
                        id: d.id,
                        label: d.label || "Dia do Evento",
                        data: d.data || "",
                        periodosOral: (d.periodosOral || []).map(p => ({
                            id: p.id,
                            inicio: p.inicio || "08:00",
                            fim: p.fim || "12:00",
                            local: p.local || "",
                        })),
                        periodosBanner: (d.periodosBanner || []).map(p => ({
                            id: p.id,
                            inicio: p.inicio || "08:00",
                            fim: p.fim || "12:00",
                            local: p.local || "",
                        })),
                    })),
                    criterios: criteriosAvaliacao.map(c => ({
                        id: c.id,
                        nome: c.nome,
                        peso: Number(c.peso) || 1,
                    })),
                },
                // Campos de compatibilidade
                dataInicio: inicioSubmissaoDateTime ? inicioSubmissaoDateTime.split("T")[0] : "",
                horaInicio: inicioSubmissaoDateTime ? (inicioSubmissaoDateTime.split("T")[1] || "") : "",
                dataFim: fimSubmissaoDateTime ? fimSubmissaoDateTime.split("T")[0] : "",
                horaFim: fimSubmissaoDateTime ? (fimSubmissaoDateTime.split("T")[1] || "") : "",
                eixosTematicos: areasAvaliacao.map(a => ({ nome: a.nome, descricao: "" })),
                normas: instrucoesSubmissao,
                editalUrl: finalRegulamentoUrl,
                editalNome: regulamentoFile ? regulamentoFile.name : regulamentoNome,
                limiteAutores: Number(limiteCoautoresPorTrabalho) || 10,
                limiteTrabalhos: Number(limiteTrabalhosAutor) || 10,
            };

            const statusCalculado = getEventRegistrationStatus({
                dataInscricaoInicio,
                dataInscricaoFim,
                horaInscricaoInicio,
                horaInscricaoFim,
                dateInicio: dataInicio,
                dateFim: dataFim,
            });

            // 5. Montar Objeto
            const eventoObj = {
                title: nomeEvento,
                category: categoria,
                status: statusCalculado,
                dataInscricaoInicio,
                dataInscricaoFim,
                horaInscricaoInicio,
                horaInscricaoFim,
                img: publicUrl,
                modalidade,
                capacidade,
                dateInicio: dataInicio,
                dateFim: dataFim,
                horaInicio,
                horaFim,
                workload: cargaHoraria,
                local: localNaoSeAplica ? null : { cep, endereco, numero, bairro, cidade, nomeLocal },
                lotes: ingressosNaoSeAplica ? [] : lotes.map(({ id, ...rest }) => rest),
                description: descricaoNaoSeAplica ? "" : descricao,
                redesSociais: descricaoNaoSeAplica ? null : { instagram, linkedin, facebook },
                mensagens: mensagensNaoSeAplica ? [] : mensagens.map(m => m.texto),
                palestrantes: palestrantesFinais,
                minicursos: minicursosFinais,
                programacao: programacaoNaoSeAplica ? [] : programacao.map(({ id, ...rest }) => ({
                    ...rest,
                    atividades: rest.atividades.map(({ id, ...aRest }) => aRest)
                })),
                administradores: adminsNaoSeAplica ? [] : administradores.map(({ id, ...rest }) => rest),
                patrocinadores: patroUrls.filter(u => u !== ""),
                apoiadores: apoiUrls.filter(u => u !== ""),
                dadosBancarios: null,
                submissaoTrabalhos: submissaoTrabalhosObj,
                emphasis: false,
                userId: user?.uid || null,
                promotorEmail: user?.email || null,
            };

            if (isEditing && editId) {
                await updateDoc(doc(db, "events", editId), {
                    ...eventoObj,
                    updatedAt: new Date().toISOString()
                });
                alert("Evento atualizado com sucesso!");
                router.push(`/eventos/${editId}`);
            } else {
                // Ao criar novo evento, herda automaticamente a taxa Céos negociada do perfil do promotor ou o padrão (8%)
                const taxaCeosHerdada =
                    userData?.taxaCeos !== undefined && userData?.taxaCeos !== null && !isNaN(Number(userData.taxaCeos))
                        ? Number(userData.taxaCeos)
                        : 8;

                await addDoc(collection(db, "events"), {
                    ...eventoObj,
                    taxaCeos: taxaCeosHerdada,
                    createdAt: new Date().toISOString()
                });
                alert("Evento publicado com sucesso!");
                router.push("/eventos");
            }
        } catch (error) {
            console.error("Erro ao salvar:", error);
            alert("Erro ao salvar o evento. Verifique os dados e tente novamente.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSalvarSubmissao = async () => {
        if (isEditing && editId) {
            setIsLoading(true);
            try {
                let urlUploaded = regulamentoUrl;
                if (tipoRegulamento === "pdf" && regulamentoFile) {
                    const fileExt = regulamentoFile.name.split(".").pop();
                    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                    const filePath = `trabalhos-editais/${fileName}`;
                    const { error } = await supabase.storage.from("events").upload(filePath, regulamentoFile);
                    if (!error) {
                        const { data } = supabase.storage.from("events").getPublicUrl(filePath);
                        urlUploaded = data.publicUrl;
                        setRegulamentoUrl(urlUploaded);
                        setRegulamentoFile(null);
                    }
                }
                await sincronizarSubmissaoFirestore({ regulamentoUrlOverride: urlUploaded });
                alert("Configurações de submissão salvas com sucesso!");
            } catch (e) {
                console.error(e);
                alert("Erro ao salvar configurações de submissão.");
            } finally {
                setIsLoading(false);
            }
        } else {
            alert("Configurações de submissão salvas no formulário! Clique em 'Publicar Evento' ao finalizar o cadastro.");
        }
    };

    const handleMudarModalidadeTrabalho = async (trabalhoId: string, modalidadeAp: "Oral" | "Banner") => {
        setTrabalhosAceitos(prev =>
            prev.map(t => (t.id === trabalhoId ? { ...t, modalidadeApresentacao: modalidadeAp } : t))
        );
        setTodosTrabalhosEvento(prev =>
            prev.map(t => (t.id === trabalhoId ? { ...t, modalidadeApresentacao: modalidadeAp } : t))
        );
        try {
            await updateDoc(doc(db, "trabalhos", trabalhoId), {
                modalidadeApresentacao: modalidadeAp,
                updatedAt: new Date().toISOString(),
            });
        } catch (e) {
            console.error("Erro ao atualizar modalidade de apresentação:", e);
        }
    };

    const handleToggleApresentadoEvento = async (trabalhoId: string, valorAtual: boolean) => {
        const novoValor = !valorAtual;
        setTrabalhosAceitos(prev =>
            prev.map(t => (t.id === trabalhoId ? { ...t, apresentadoNoEvento: novoValor } : t))
        );
        setTodosTrabalhosEvento(prev =>
            prev.map(t => (t.id === trabalhoId ? { ...t, apresentadoNoEvento: novoValor } : t))
        );
        try {
            await updateDoc(doc(db, "trabalhos", trabalhoId), {
                apresentadoNoEvento: novoValor,
                updatedAt: new Date().toISOString(),
            });
        } catch (e) {
            console.error("Erro ao atualizar presença de apresentação:", e);
        }
    };

    const handleSalvarPreCongressoAdmin = async () => {
        if (!modalAvaliarPreAdmin) return;
        const notaNum =
            adminDecisaoPre === "Aceito" && adminNotaPre.trim() !== ""
                ? parseFloat(adminNotaPre.replace(",", "."))
                : null;
        if (adminDecisaoPre === "Aceito" && notaNum !== null && (isNaN(notaNum) || notaNum < 0 || notaNum > 10)) {
            alert("Informe uma nota válida entre 0 e 10 para o resumo aceito.");
            return;
        }
        setSalvandoPreAdmin(true);
        try {
            const payloadUpdate: any = {
                status: adminDecisaoPre,
                parecerAvaliador: adminParecerPre.trim(),
                notaPreCongresso: notaNum,
                avaliadoEm: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            if (adminDecisaoPre === "Aceito com ressalvas") {
                payloadUpdate.avaliadorRessalvaEmail =
                    modalAvaliarPreAdmin.avaliadorEmail || user?.email || "";
                payloadUpdate.avaliadorRessalvaNome =
                    modalAvaliarPreAdmin.avaliadorNome || userData?.nome || "Comissão Científica";
            }
            await updateDoc(doc(db, "trabalhos", modalAvaliarPreAdmin.id), payloadUpdate);

            const atualizados = todosTrabalhosEvento.map(t =>
                t.id === modalAvaliarPreAdmin.id ? { ...t, ...payloadUpdate } : t
            );
            setTodosTrabalhosEvento(atualizados);
            setTrabalhosAceitos(atualizados.filter(t => isTrabalhoAceito(t.status)));
            setModalAvaliarPreAdmin(null);
        } catch (e) {
            console.error("Erro ao avaliar resumo:", e);
            alert("Erro ao salvar avaliação pré-congresso.");
        } finally {
            setSalvandoPreAdmin(false);
        }
    };

    const handleSalvarNotaDiaAdmin = async () => {
        if (!modalAvaliarDiaAdmin) return;
        const notaNum = parseFloat(String(adminNotaDia).replace(",", "."));
        const maxNota = Number(notaMaximaOral) || 10;
        if (isNaN(notaNum) || notaNum < 0 || notaNum > maxNota) {
            alert(`Informe uma nota válida entre 0 e ${maxNota}.`);
            return;
        }
        const nomeAv = adminAvaliadorNome.trim() || userData?.nome || "Avaliador da Comissão";
        setSalvandoNotaDiaAdmin(true);
        try {
            const listaAtual: AvaliacaoDiaEvento[] = Array.isArray(modalAvaliarDiaAdmin.avaliacoesDia)
                ? [...modalAvaliarDiaAdmin.avaliacoesDia]
                : [];
            const novaAv: AvaliacaoDiaEvento = {
                avaliadorEmail: `${nomeAv.toLowerCase().replace(/\s+/g, ".")}@comissao`,
                avaliadorNome: nomeAv,
                notaFinal: Number(notaNum.toFixed(2)),
                observacao: adminObservacaoDia.trim(),
                avaliadoEm: new Date().toISOString(),
            };
            listaAtual.push(novaAv);
            const mediaDia =
                listaAtual.reduce((acc, a) => acc + (Number(a.notaFinal) || 0), 0) / listaAtual.length;
            const mediaArredondada = Number(mediaDia.toFixed(2));

            const payloadUpdate = {
                avaliacoesDia: listaAtual,
                notaDiaMedia: mediaArredondada,
                apresentadoNoEvento: true,
                updatedAt: new Date().toISOString(),
            };
            await updateDoc(doc(db, "trabalhos", modalAvaliarDiaAdmin.id), payloadUpdate);

            const atualizados = todosTrabalhosEvento.map(t =>
                t.id === modalAvaliarDiaAdmin.id ? { ...t, ...payloadUpdate } : t
            );
            setTodosTrabalhosEvento(atualizados);
            setTrabalhosAceitos(atualizados.filter(t => isTrabalhoAceito(t.status)));
            setModalAvaliarDiaAdmin(null);
            setAdminAvaliadorNome("");
            setAdminObservacaoDia("");
        } catch (e) {
            console.error("Erro ao registrar avaliação do dia:", e);
            alert("Erro ao registrar nota do avaliador.");
        } finally {
            setSalvandoNotaDiaAdmin(false);
        }
    };

    const handleSalvarEDistribuir = async () => {
        if (isEditing && editId) {
            setIsLoading(true);
            try {
                await sincronizarSubmissaoFirestore();

                // Se houver trabalhos aceitos, executa a distribuição real nas duas listas (Oral e Banner) evitando choque com minicursos
                if (trabalhosAceitos.length > 0 && diasAvaliacao.length > 0) {
                    const ocupacoesPorEmail: Record<string, HorarioOcupadoParticipante[]> = {};

                    // Buscar inscrições do evento para verificar minicursos inscritos de cada apresentador
                    try {
                        const qInsc = query(collection(db, "inscricoes"), where("eventoId", "==", editId));
                        const snapInsc = await getDocs(qInsc);
                        snapInsc.docs.forEach(docSnap => {
                            const d = docSnap.data();
                            const emailPart = (d.participanteEmail || "").trim().toLowerCase();
                            const cursosInscritos: string[] = Array.isArray(d.minicursosSelecionados)
                                ? d.minicursosSelecionados
                                : [];
                            if (emailPart && cursosInscritos.length > 0) {
                                cursosInscritos.forEach(nomeCurso => {
                                    const cursoObj = minicursos.find(
                                        m => (m.nome || "").trim().toLowerCase() === nomeCurso.trim().toLowerCase()
                                    );
                                    if (cursoObj && Array.isArray(cursoObj.dias)) {
                                        cursoObj.dias.forEach(diaCurso => {
                                            if (diaCurso.data && diaCurso.horaInicio && diaCurso.horaFim) {
                                                if (!ocupacoesPorEmail[emailPart]) {
                                                    ocupacoesPorEmail[emailPart] = [];
                                                }
                                                ocupacoesPorEmail[emailPart].push({
                                                    data: diaCurso.data,
                                                    horaInicio: diaCurso.horaInicio,
                                                    horaFim: diaCurso.horaFim,
                                                    descricao: `Minicurso: ${cursoObj.nome}`,
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    } catch (errInsc) {
                        console.warn("Aviso ao verificar minicursos para distribuição:", errInsc);
                    }

                    const distribuicao = distribuirTrabalhosNosPeriodos(
                        trabalhosAceitos,
                        diasAvaliacao,
                        Number(tempoApresentacaoOral) || 15,
                        Number(qtdBannersPorPeriodo) || 50,
                        ocupacoesPorEmail
                    );

                    const mapaAtualizados: Record<string, any> = {};
                    for (const item of distribuicao.atualizados) {
                        mapaAtualizados[item.id] = item;
                        await updateDoc(doc(db, "trabalhos", item.id), {
                            modalidadeApresentacao: item.modalidadeApresentacao,
                            apresentacaoDiaId: item.apresentacaoDiaId,
                            apresentacaoDiaLabel: item.apresentacaoDiaLabel,
                            apresentacaoData: item.apresentacaoData,
                            apresentacaoHoraInicio: item.apresentacaoHoraInicio,
                            apresentacaoHoraFim: item.apresentacaoHoraFim,
                            apresentacaoLocal: item.apresentacaoLocal,
                            conflitoMinicursoEvitado: item.conflitoMinicursoEvitado,
                            updatedAt: new Date().toISOString(),
                        });
                    }

                    setTrabalhosAceitos(prev =>
                        prev.map(t => (mapaAtualizados[t.id] ? { ...t, ...mapaAtualizados[t.id] } : t))
                    );
                    setTodosTrabalhosEvento(prev =>
                        prev.map(t => (mapaAtualizados[t.id] ? { ...t, ...mapaAtualizados[t.id] } : t))
                    );

                    alert(
                        `Configurações salvas e ${distribuicao.atualizados.length} trabalho(s) distribuído(s) (${distribuicao.listaOral.length} Oral e ${distribuicao.listaBanner.length} Banner) evitando choques de horário com cursos!`
                    );
                } else {
                    alert("Configurações da avaliação do dia e períodos de apresentação salvos com sucesso!");
                }
            } catch (e) {
                console.error(e);
                alert("Erro ao salvar configurações da avaliação do dia.");
            } finally {
                setIsLoading(false);
            }
        } else {
            alert("Configurações da avaliação do dia registradas! Elas serão salvas junto com o evento ao clicar em 'Publicar Evento'.");
        }
    };

    // Componente minimalista do toggle "Não se aplica" harmonizado com o tema
    const NaoSeAplicaToggle = ({ label = "Não se aplica", state, setState }: any) => (
        <label className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all border select-none ${state
            ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-600/25"
            : "bg-slate-100/80 dark:bg-[#071321]/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-blue-900/40 hover:border-blue-400 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-300"
            }`}>
            <input
                type="checkbox"
                checked={state}
                onChange={(e) => setState(e.target.checked)}
                className="sr-only"
            />
            <span className={`w-3.5 h-3.5 rounded-md border flex items-center justify-center transition-all ${state
                ? "bg-white text-blue-600 border-white"
                : "border-slate-400 dark:border-slate-600 bg-white dark:bg-[#0c1e33]"
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
    if (authLoading || loadingExisting) {
        return (
            <main className="min-h-[calc(100vh-73px)] bg-[#fafafa] dark:bg-[#0a1929] flex flex-col items-center justify-center p-4">
                <div className="flex flex-col items-center gap-3 text-center">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        {loadingExisting ? "Carregando dados do evento para edição..." : "Verificando permissões de acesso..."}
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

    // 3. Autenticado mas sem perfil de Promotor ou Admin -> Permissão Insuficiente
    if (!podeCriarEvento) {
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

    // 4. Promotor (não administrador) sem subconta Asaas ativa tentando CRIAR novo evento
    if (!isEditing && !isAdmin && isPromotor && !statusSubconta.isAtiva) {
        return (
            <main className="min-h-[calc(100vh-73px)] bg-[#fafafa] dark:bg-[#0a1929] flex flex-col items-center justify-center p-4">
                <div className="max-w-lg w-full p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0c1e33] border border-slate-200/90 dark:border-blue-900/50 shadow-2xl shadow-blue-500/10 text-center space-y-5 animate-in fade-in">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto border border-blue-200 dark:border-blue-800/40 shadow-xs">
                        <Wallet className="w-7 h-7" />
                    </div>

                    <div className="space-y-1">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
                            Etapa Obrigatória para Promotores
                        </span>
                        <h2 className="text-xl sm:text-2xl font-montserrat font-bold text-slate-900 dark:text-white">
                            Subconta Asaas Obrigatória
                        </h2>
                    </div>

                    <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/50 text-slate-900 dark:text-slate-100 text-xs sm:text-sm text-left space-y-2">
                        <p className="font-semibold leading-relaxed text-blue-950 dark:text-blue-100">
                            Para poder criar evento a conta tem que ser criada no Asaas primeiro.
                        </p>
                        <p className="text-[11px] sm:text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                            A criação de novos eventos só é liberada quando a situação do cadastro da conta estiver completa (<strong>conta ativa</strong>).
                        </p>
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-400 text-left space-y-2 bg-slate-50 dark:bg-[#071321]/60 p-3.5 rounded-xl border border-slate-200 dark:border-blue-900/40">
                        <p className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                            <span>Recebimento direto das inscrições na sua conta</span>
                        </p>
                        <p className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                            <span>Ativação simples e rápida através do painel financeiro</span>
                        </p>
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                        <Link
                            href="/usuario/painel/meus-eventos"
                            className="w-full sm:w-1/2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs sm:text-sm font-semibold transition-all text-center cursor-pointer"
                        >
                            Voltar para Painel
                        </Link>
                        <Link
                            href="/usuario/painel/financeiro"
                            className="w-full sm:w-1/2 inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20 text-center cursor-pointer transition-all"
                        >
                            <Wallet className="w-4 h-4" />
                            <span>Criar Subconta Asaas</span>
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-[calc(100vh-73px)] bg-[#fafafa] dark:bg-[#0a1929] py-5 sm:py-10 px-3 sm:px-6 lg:px-8 flex justify-center transition-colors">
            <div className="max-w-5xl w-full space-y-6">

                {/* Header Principal da Página */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <Link
                            href="/usuario/painel/meus-eventos"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors mb-1 group"
                        >
                            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
                            Voltar para Meus Eventos
                        </Link>
                        <div className="flex items-center gap-3">
                            <h1 className="font-montserrat text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                                {isEditing ? "Editar" : "Criar"} <span className="text-blue-600 dark:text-blue-400">Evento</span>
                            </h1>
                        </div>
                    </div>

                    <button
                        onClick={handleSaveEvent}
                        disabled={isLoading}
                        className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/30 transition-all duration-200 shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {isLoading ? "Salvando..." : (isEditing ? "Salvar Alterações" : "Publicar Evento")}
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
                                className={`p-2 rounded-xl border border-slate-200 dark:border-blue-900/50 bg-white dark:bg-[#0c1e33] text-slate-600 dark:text-slate-300 transition-all shrink-0 flex items-center justify-center ${canScrollLeft
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
                                            className={`flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl border shrink-0 whitespace-nowrap transition-all duration-200 cursor-pointer select-none text-xs sm:text-sm font-semibold ${isActive
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
                                className={`p-2 rounded-xl border border-slate-200 dark:border-blue-900/50 bg-white dark:bg-[#0c1e33] text-slate-600 dark:text-slate-300 transition-all shrink-0 flex items-center justify-center ${canScrollRight
                                    ? "hover:text-blue-600 hover:border-blue-300 dark:hover:border-blue-500 shadow-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-[#0f2742]"
                                    : "opacity-30 cursor-not-allowed"
                                    }`}
                            >
                                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Conteúdo Dinâmico da Sessão Ativa */}
                    <div className="p-4 sm:p-6 md:p-8 space-y-6">

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
                                        onChange={e => setNomeEvento(e.target.value)}
                                        className={inputClass}
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="space-y-1.5">
                                        <label className={labelClass}>Modalidade</label>
                                        <select value={modalidade} onChange={e => setModalidade(e.target.value)} className={inputClass}>
                                            <option>Presencial</option>
                                            <option>Online</option>
                                            <option>Híbrido</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className={labelClass}>Categoria</label>
                                        <select value={categoria} onChange={e => setCategoria(e.target.value)} className={inputClass}>
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
                                            onChange={e => setCapacidade(e.target.value)}
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
                                                onChange={e => setCargaHoraria(e.target.value)}
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
                                                        <X className="w-3.5 h-3.5" />
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
                                                    onChange={e => setDescricao(e.target.value)}
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
                                                        onChange={e => setInstagram(e.target.value)}
                                                        className={inputClass}
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="LinkedIn (ex: /in/meuevento)"
                                                        value={linkedin}
                                                        onChange={e => setLinkedin(e.target.value)}
                                                        className={inputClass}
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="Facebook (ex: /meuevento)"
                                                        value={facebook}
                                                        onChange={e => setFacebook(e.target.value)}
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
                        {activeTab === "datas" && (() => {
                            const statusPreview = getEventRegistrationStatus({
                                dataInscricaoInicio,
                                dataInscricaoFim,
                                horaInscricaoInicio,
                                horaInscricaoFim,
                            });
                            const badgeConfig = getStatusBadgeConfig(statusPreview);

                            return (
                                <div className="space-y-8 animate-in fade-in">
                                    {/* 2.1 Período do Evento */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-blue-900/40">
                                            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
                                                <Calendar className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Datas e Horários do Evento</h2>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Estabeleça o período de realização e os horários em que o evento acontecerá.</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className={labelClass}>Data de Início do Evento</label>
                                                <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className={inputClass} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className={labelClass}>Data de Término do Evento</label>
                                                <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className={inputClass} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className={labelClass}>Horário de Início do Evento</label>
                                                <input type="time" value={horaInicio} onChange={e => setHoraInicio(e.target.value)} className={inputClass} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className={labelClass}>Horário de Término do Evento</label>
                                                <input type="time" value={horaFim} onChange={e => setHoraFim(e.target.value)} className={inputClass} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* 2.2 Período das Inscrições */}
                                    <div className="space-y-4 pt-2">
                                        <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-blue-900/40">
                                            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
                                                <Ticket className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Período das Inscrições</h2>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    Defina a janela de datas em que os participantes poderão se inscrever.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className={labelClass}>Data de Início das Inscrições</label>
                                                <input type="date" value={dataInscricaoInicio} onChange={e => setDataInscricaoInicio(e.target.value)} className={inputClass} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className={labelClass}>Horário de Início das Inscrições</label>
                                                <input type="time" value={horaInscricaoInicio} onChange={e => setHoraInscricaoInicio(e.target.value)} className={inputClass} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className={labelClass}>Data de Término das Inscrições</label>
                                                <input type="date" value={dataInscricaoFim} onChange={e => setDataInscricaoFim(e.target.value)} className={inputClass} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className={labelClass}>Horário de Término das Inscrições</label>
                                                <input type="time" value={horaInscricaoFim} onChange={e => setHoraInscricaoFim(e.target.value)} className={inputClass} />
                                            </div>
                                        </div>

                                        {/* Card de Demonstração e Status em Tempo Real */}
                                        <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-blue-900/50 bg-gradient-to-r from-slate-50 via-blue-50/20 to-slate-50 dark:from-[#071321] dark:via-[#0c1e33] dark:to-[#071321] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                            <div className="space-y-1">
                                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                    Status Calculado do Evento
                                                </span>
                                                <div className="flex items-center gap-2 pt-0.5">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${badgeConfig.badgeClass}`}>
                                                        <span className={`w-2 h-2 rounded-full ${badgeConfig.dotClass}`} />
                                                        {statusPreview}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-xl leading-relaxed">
                                                    {statusPreview === "Em Breve" && (
                                                        dataInscricaoInicio
                                                            ? `O evento será exibido como "Em Breve" e o botão de inscrição ficará indisponível até ${formatDateTimeFriendly(dataInscricaoInicio, horaInscricaoInicio)}.`
                                                            : "Preencha a data de início das inscrições para programar a abertura automática."
                                                    )}
                                                    {statusPreview === "Inscrições Abertas" && (
                                                        `O evento está no período ativo de inscrições! O status exibirá "Inscrições Abertas" e o botão de inscrição estará liberado para o público.${dataInscricaoFim ? ` Encerra em ${formatDateTimeFriendly(dataInscricaoFim, horaInscricaoFim)}.` : ""}`
                                                    )}
                                                    {statusPreview === "Inscrições Encerradas" && (
                                                        `O período de inscrições encerrou${dataInscricaoFim ? ` em ${formatDateTimeFriendly(dataInscricaoFim, horaInscricaoFim)}` : ""}. O status exibirá "Inscrições Encerradas" e o botão de inscrição ficará indisponível.`
                                                    )}
                                                </p>
                                            </div>

                                            <div className="text-xs text-slate-500 dark:text-slate-400 shrink-0 self-start sm:self-center bg-white dark:bg-[#0c1e33] px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-blue-900/40 shadow-xs">
                                                {statusPreview === "Inscrições Abertas" ? (
                                                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                                                        <Check className="w-4 h-4" /> Botão Liberado
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                                                        <Clock className="w-4 h-4 text-amber-500" /> Botão Indisponível
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

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
                                                <input type="text" placeholder="00000-000" value={cep} onChange={e => setCep(e.target.value)} className={inputClass} />
                                            </div>
                                            <div className="space-y-1.5 sm:col-span-2">
                                                <label className={labelClass}>Nome do Local / Pavilhão</label>
                                                <input type="text" placeholder="Ex: Centro de Convenções Ulysses Guimarães" value={nomeLocal} onChange={e => setNomeLocal(e.target.value)} className={inputClass} />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                            <div className="space-y-1.5 sm:col-span-3">
                                                <label className={labelClass}>Endereço Completo (Rua/Avenida)</label>
                                                <input type="text" placeholder="Ex: Av. Central, Bloco B" value={endereco} onChange={e => setEndereco(e.target.value)} className={inputClass} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className={labelClass}>Número</label>
                                                <input type="text" placeholder="Ex: 1020" value={numero} onChange={e => setNumero(e.target.value)} className={inputClass} />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className={labelClass}>Bairro</label>
                                                <input type="text" placeholder="Ex: Asa Sul" value={bairro} onChange={e => setBairro(e.target.value)} className={inputClass} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className={labelClass}>Cidade / Estado</label>
                                                <input type="text" placeholder="Ex: Brasília - DF" value={cidade} onChange={e => setCidade(e.target.value)} className={inputClass} />
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
                                                            onClick={() => removeArray(setLotes, lotes, lote.id)}
                                                            className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs"
                                                            title="Remover este lote"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
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
                                                            onChange={e => updateArray(setLotes, lotes, lote.id, 'perfil', e.target.value)}
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
                                                            onChange={e => updateArray(setLotes, lotes, lote.id, 'loteNumero', e.target.value)}
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
                                                            onChange={e => updateArray(setLotes, lotes, lote.id, 'preco', e.target.value)}
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
                                                            onChange={e => updateArray(setLotes, lotes, lote.id, 'quantidade', e.target.value)}
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
                                                            onChange={e => updateArray(setLotes, lotes, lote.id, 'codigoDesconto', e.target.value)}
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
                                                            onChange={e => updateArray(setLotes, lotes, lote.id, 'valorPromocional', e.target.value)}
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
                                                            onChange={e => updateArray(setLotes, lotes, lote.id, 'dataInicio', e.target.value)}
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
                                                            onChange={e => updateArray(setLotes, lotes, lote.id, 'dataFim', e.target.value)}
                                                            className={inputClass}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Botão Verde Full-Width */}
                                        <button
                                            type="button"
                                            onClick={() => setLotes([...lotes, {
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
                                                    onChange={e => updateArray(setMensagens, mensagens, m.id, 'texto', e.target.value)}
                                                    className={inputClass}
                                                    placeholder="Ex: Submissões de resumos prorrogadas até 20 de Outubro!"
                                                />
                                                {mensagens.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeArray(setMensagens, mensagens, m.id)}
                                                        className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-2 rounded-xl transition-colors shrink-0 cursor-pointer"
                                                        title="Remover mensagem"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}

                                        <button
                                            type="button"
                                            onClick={() => setMensagens([...mensagens, { id: Date.now(), texto: "" }])}
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
                                                            onClick={() => removeArray(setPalestrantes, palestrantes, p.id)}
                                                            className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-1.5 rounded-lg transition-colors cursor-pointer"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
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
                                                                onChange={e => {
                                                                    const f = e.target.files?.[0];
                                                                    if (f) {
                                                                        setPalestrantes(prev => prev.map(item =>
                                                                            item.id === p.id
                                                                                ? { ...item, foto: f, fotoPreview: URL.createObjectURL(f) }
                                                                                : item
                                                                        ));
                                                                    }
                                                                }}
                                                                className="w-full text-xs text-slate-500 dark:text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-600 dark:file:bg-blue-950 dark:file:text-blue-300 hover:file:bg-blue-100 cursor-pointer"
                                                            />
                                                            {p.foto && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setPalestrantes(prev => prev.map(item =>
                                                                            item.id === p.id ? { ...item, foto: null, fotoPreview: '' } : item
                                                                        ));
                                                                        (document.getElementById(`foto-${p.id}`) as HTMLInputElement).value = '';
                                                                    }}
                                                                    className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg shrink-0 cursor-pointer"
                                                                    title="Remover foto"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1">
                                                        <label className={labelClass}>Nome Completo</label>
                                                        <input type="text" placeholder="Ex: Dra. Maria Clara Silva" value={p.nome} onChange={e => updateArray(setPalestrantes, palestrantes, p.id, 'nome', e.target.value)} className={inputClass} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className={labelClass}>Especialidade / Titulação</label>
                                                        <input type="text" placeholder="Ex: PhD em Neurociências" value={p.especialidade} onChange={e => updateArray(setPalestrantes, palestrantes, p.id, 'especialidade', e.target.value)} className={inputClass} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className={labelClass}>Instituição / Universidade</label>
                                                        <input type="text" placeholder="Ex: Universidade de São Paulo (USP)" value={p.instituicao} onChange={e => updateArray(setPalestrantes, palestrantes, p.id, 'instituicao', e.target.value)} className={inputClass} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className={labelClass}>E-mail de Contato</label>
                                                        <input type="email" placeholder="Ex: contato@palestrante.com" value={p.email} onChange={e => updateArray(setPalestrantes, palestrantes, p.id, 'email', e.target.value)} className={inputClass} />
                                                    </div>
                                                </div>

                                                <div className="space-y-1">
                                                    <label className={labelClass}>Mini Biografia</label>
                                                    <textarea rows={3} value={p.bio} onChange={e => updateArray(setPalestrantes, palestrantes, p.id, 'bio', e.target.value)} placeholder="Breve resumo da trajetória acadêmica e profissional..." className={inputClass} />
                                                </div>
                                            </div>
                                        ))}

                                        <button
                                            type="button"
                                            onClick={() => setPalestrantes([...palestrantes, { id: Date.now(), foto: null, fotoPreview: "", nome: "", email: "", especialidade: "", instituicao: "", telefone: "", bio: "" }])}
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
                                                                        setMinicursos(prev => prev.map(item =>
                                                                            item.id === m.id
                                                                                ? { ...item, imagem: f, imagemPreview: URL.createObjectURL(f) }
                                                                                : item
                                                                        ));
                                                                    }
                                                                }}
                                                                className="w-full text-xs text-slate-500 dark:text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-600 dark:file:bg-blue-950 dark:file:text-blue-300 hover:file:bg-blue-100 cursor-pointer"
                                                            />
                                                            {m.imagem && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setMinicursos(prev => prev.map(item =>
                                                                            item.id === m.id ? { ...item, imagem: null, imagemPreview: '' } : item
                                                                        ));
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
                                                            onClick={() => removeArray(setAdministradores, administradores, admin.id)}
                                                            className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-1.5 rounded-lg transition-colors cursor-pointer"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <label className={labelClass}>Nome</label>
                                                        <input type="text" placeholder="Nome do Administrador" value={admin.nome} onChange={e => updateArray(setAdministradores, administradores, admin.id, 'nome', e.target.value)} className={inputClass} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className={labelClass}>E-mail</label>
                                                        <input type="email" placeholder="admin@evento.com" value={admin.email} onChange={e => updateArray(setAdministradores, administradores, admin.id, 'email', e.target.value)} className={inputClass} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className={labelClass}>Telefone / WhatsApp</label>
                                                        <input type="text" placeholder="(00) 00000-0000" value={admin.telefone} onChange={e => updateArray(setAdministradores, administradores, admin.id, 'telefone', e.target.value)} className={inputClass} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className={labelClass}>Senha de Acesso</label>
                                                        <input type="password" placeholder="••••••••" value={admin.senha} onChange={e => updateArray(setAdministradores, administradores, admin.id, 'senha', e.target.value)} className={inputClass} />
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
                                                                        const newPerms = { ...admin.permissoes, [perm]: !isChecked };
                                                                        updateArray(setAdministradores, administradores, admin.id, 'permissoes', newPerms);
                                                                    }}
                                                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer capitalize flex items-center gap-1.5 ${isChecked
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
                                            onClick={() => setAdministradores([...administradores, { id: Date.now(), nome: "", email: "", telefone: "", telefoneAlt: "", senha: "", repeteSenha: "", permissoes: { todas: false, site: false, inscricoes: false, minicursos: false, trabalhos: false, programacao: false, credenciamento: false, certificados: false, anais: false, financeiro: false, palestras: false } }])}
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
                                                            onChange={e => updateArray(setPatrocinadores, patrocinadores, p.id, 'file', e.target.files?.[0] || null)}
                                                            className="flex-1 text-xs text-slate-500 dark:text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-600 dark:file:bg-blue-950 dark:file:text-blue-300 hover:file:bg-blue-100 cursor-pointer"
                                                        />
                                                        {p.file && (
                                                            <button
                                                                type="button"
                                                                onClick={() => { updateArray(setPatrocinadores, patrocinadores, p.id, 'file', null); (document.getElementById(`patro-${p.id}`) as HTMLInputElement).value = ''; }}
                                                                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg cursor-pointer"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        {patrocinadores.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => removeArray(setPatrocinadores, patrocinadores, p.id)}
                                                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setPatrocinadores([...patrocinadores, { id: Date.now(), file: null, fileName: "" }])}
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
                                                            onChange={e => updateArray(setApoiadores, apoiadores, a.id, 'file', e.target.files?.[0] || null)}
                                                            className="flex-1 text-xs text-slate-500 dark:text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-600 dark:file:bg-blue-950 dark:file:text-blue-300 hover:file:bg-blue-100 cursor-pointer"
                                                        />
                                                        {a.file && (
                                                            <button
                                                                type="button"
                                                                onClick={() => { updateArray(setApoiadores, apoiadores, a.id, 'file', null); (document.getElementById(`apoi-${a.id}`) as HTMLInputElement).value = ''; }}
                                                                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg cursor-pointer"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        {apoiadores.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => removeArray(setApoiadores, apoiadores, a.id)}
                                                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setApoiadores([...apoiadores, { id: Date.now(), file: null, fileName: "" }])}
                                                className="inline-flex items-center gap-1.5 py-1.5 px-3 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                                            >
                                                <Plus className="w-3.5 h-3.5" /> Adicionar Logo de Apoiador
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 11. Programação */}
                        {activeTab === "programacao" && (
                            <div className="space-y-6 animate-in fade-in">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-blue-900/40">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
                                            <Clock className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Programação do Evento</h2>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Monte a grade de atividades diárias, com horários e locais.</p>
                                        </div>
                                    </div>
                                    <NaoSeAplicaToggle state={programacaoNaoSeAplica} setState={setProgramacaoNaoSeAplica} />
                                </div>

                                {!programacaoNaoSeAplica && (
                                    <div className="space-y-6">
                                        {programacao.map((dia, dIdx) => (
                                            <div key={dia.id} className="bg-slate-50/50 dark:bg-[#0c1e33]/50 border border-slate-200 dark:border-blue-900/40 rounded-2xl p-5 relative">
                                                <button
                                                    type="button"
                                                    onClick={() => removeDiaProgramacao(dia.id)}
                                                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer"
                                                    title="Remover Dia"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>

                                                <div className="mb-4 pr-12">
                                                    <label className={labelClass}>Data do Evento</label>
                                                    <input
                                                        type="date"
                                                        value={dia.data}
                                                        onChange={e => updateDiaProgramacao(dia.id, 'data', e.target.value)}
                                                        className={`${inputClass} w-full sm:w-auto mt-1.5`}
                                                    />
                                                </div>

                                                <div className="space-y-3">
                                                    {dia.atividades.map((ativ, aIdx) => (
                                                        <div
                                                            key={ativ.id}
                                                            draggable
                                                            onDragStart={() => setDraggedAtividadeIndex({ diaId: dia.id, index: aIdx })}
                                                            onDragOver={(e) => e.preventDefault()}
                                                            onDrop={(e) => {
                                                                e.preventDefault();
                                                                if (draggedAtividadeIndex && draggedAtividadeIndex.diaId === dia.id && draggedAtividadeIndex.index !== aIdx) {
                                                                    reorderAtividades(dia.id, draggedAtividadeIndex.index, aIdx);
                                                                }
                                                            }}
                                                            onDragEnd={() => setDraggedAtividadeIndex(null)}
                                                            className={`bg-white dark:bg-[#071321] border border-slate-200 dark:border-blue-900/50 rounded-xl p-4 relative group transition-all duration-200 ${draggedAtividadeIndex?.diaId === dia.id && draggedAtividadeIndex?.index === aIdx ? 'opacity-40 scale-[0.98]' : 'opacity-100'}`}
                                                        >
                                                            <button
                                                                type="button"
                                                                onClick={() => removeAtividadeProgramacao(dia.id, ativ.id)}
                                                                className="absolute top-3 right-3 p-1.5 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all cursor-pointer z-10"
                                                                title="Remover Atividade"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>

                                                            <div className="flex gap-2.5 sm:gap-4 items-center sm:items-start">
                                                                <div className="flex items-center justify-center cursor-grab active:cursor-grabbing text-slate-300 dark:text-slate-600 hover:text-slate-500 transition-colors h-full sm:pt-4">
                                                                    <GripVertical className="w-5 h-5" />
                                                                </div>
                                                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-4">
                                                                    <div className="sm:col-span-3 grid grid-cols-2 gap-2">
                                                                        <div>
                                                                            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Início</label>
                                                                            <input type="time" value={ativ.horaInicio} onChange={e => updateAtividadeProgramacao(dia.id, ativ.id, 'horaInicio', e.target.value)} className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-blue-900/50 bg-slate-50 dark:bg-[#0c1e33] dark:text-white" />
                                                                        </div>
                                                                        <div>
                                                                            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Fim</label>
                                                                            <input type="time" value={ativ.horaFim} onChange={e => updateAtividadeProgramacao(dia.id, ativ.id, 'horaFim', e.target.value)} className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-blue-900/50 bg-slate-50 dark:bg-[#0c1e33] dark:text-white" />
                                                                        </div>
                                                                    </div>

                                                                    <div className="sm:col-span-9 grid grid-cols-1 sm:grid-cols-3 gap-3 pr-8">
                                                                        <div className="sm:col-span-3">
                                                                            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Título da Atividade</label>
                                                                            <input type="text" placeholder="Ex: Credenciamento, Palestra Magna, etc." value={ativ.titulo} onChange={e => updateAtividadeProgramacao(dia.id, ativ.id, 'titulo', e.target.value)} className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-blue-900/50 bg-slate-50 dark:bg-[#0c1e33] dark:text-white" />
                                                                        </div>
                                                                        <div className="sm:col-span-2">
                                                                            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Professor / Palestrante</label>
                                                                            <input type="text" placeholder="Nome do responsável" value={ativ.palestrante} onChange={e => updateAtividadeProgramacao(dia.id, ativ.id, 'palestrante', e.target.value)} className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-blue-900/50 bg-slate-50 dark:bg-[#0c1e33] dark:text-white" />
                                                                        </div>
                                                                        <div className="sm:col-span-1">
                                                                            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Local</label>
                                                                            <input type="text" placeholder="Ex: Auditório A" value={ativ.local} onChange={e => updateAtividadeProgramacao(dia.id, ativ.id, 'local', e.target.value)} className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-blue-900/50 bg-slate-50 dark:bg-[#0c1e33] dark:text-white" />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <button
                                                        type="button"
                                                        onClick={() => addAtividadeProgramacao(dia.id)}
                                                        className="inline-flex items-center gap-1.5 py-2 px-3 mt-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-800/40 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                                                    >
                                                        <Plus className="w-3.5 h-3.5" /> Adicionar Atividade
                                                    </button>
                                                </div>
                                            </div>
                                        ))}

                                        <button
                                            type="button"
                                            onClick={addDiaProgramacao}
                                            className="w-full py-4 border-2 border-dashed border-slate-300 dark:border-blue-900/60 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all cursor-pointer font-semibold"
                                        >
                                            <CalendarCheck className="w-6 h-6" />
                                            <span>Adicionar Novo Dia na Programação</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 11. Trabalhos & Submissão */}
                        {activeTab === "trabalhos" && (
                            <div className="space-y-6 animate-in fade-in">
                                {/* Cabeçalho da Seção */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-blue-900/40">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Trabalhos & Submissão</h2>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Configure submissão, áreas temáticas de avaliação e organização das apresentações do dia.</p>
                                        </div>
                                    </div>
                                    <NaoSeAplicaToggle state={trabalhosNaoSeAplica} setState={setTrabalhosNaoSeAplica} />
                                </div>

                                {trabalhosNaoSeAplica ? (
                                    <div className="p-8 text-center bg-white dark:bg-[#071321]/40 rounded-2xl border border-dashed border-slate-200 dark:border-blue-900/40 space-y-2">
                                        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto border border-blue-100 dark:border-blue-900/40">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                            Submissão de trabalhos científicos desativada
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                                            Este evento não receberá artigos ou resumos científicos. Caso queira abrir submissões para os participantes, desmarque a opção &quot;Não se aplica&quot; acima.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {/* Barra de Seleção das 3 Sub-Áreas */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-[#071321] border border-slate-200 dark:border-blue-900/40">
                                            <button
                                                type="button"
                                                onClick={() => setSubTabTrabalhos("configurar")}
                                                className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${subTabTrabalhos === "configurar"
                                                    ? "bg-[#1e40af] text-white shadow-md shadow-blue-900/20"
                                                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/5"
                                                    }`}
                                            >
                                                <Settings className="w-4 h-4 shrink-0" />
                                                <span>Configurar Submissão</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setSubTabTrabalhos("areas")}
                                                className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${subTabTrabalhos === "areas"
                                                    ? "bg-[#1e40af] text-white shadow-md shadow-blue-900/20"
                                                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/5"
                                                    }`}
                                            >
                                                <Layers className="w-4 h-4 shrink-0" />
                                                <span>Áreas de Avaliação</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setSubTabTrabalhos("avaliacao_dia")}
                                                className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${subTabTrabalhos === "avaliacao_dia"
                                                    ? "bg-[#1e40af] text-white shadow-md shadow-blue-900/20"
                                                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/5"
                                                    }`}
                                            >
                                                <Presentation className="w-4 h-4 shrink-0" />
                                                <span>Avaliação do Dia do Evento</span>
                                            </button>
                                        </div>

                                        {/* =========================================================
                                            SUB-ÁREA 1: CONFIGURAR SUBMISSÃO (Print 1)
                                        ========================================================== */}
                                        {subTabTrabalhos === "configurar" && (
                                            <div className="space-y-6 animate-in fade-in">
                                                {/* Card Principal de Configuração com Header Azul Integrado */}
                                                <div className="border border-slate-200 dark:border-blue-900/40 rounded-2xl bg-white dark:bg-[#0c1e33] overflow-hidden shadow-sm">
                                                    {/* Header Azul Integrado */}
                                                    <div className="bg-[#1e3a8a] text-white px-4 py-4 sm:px-6 sm:py-5 flex items-start sm:items-center gap-3.5">
                                                        <div className="w-10 h-10 rounded-xl bg-white/15 text-white flex items-center justify-center shrink-0">
                                                            <Settings className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-extrabold text-base sm:text-lg tracking-tight text-white">
                                                                Configurar Submissão
                                                            </h3>
                                                            <p className="text-xs text-blue-100/90 mt-0.5">
                                                                Defina os prazos, instruções, limites por categoria e o regulamento para envio de trabalhos.
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="p-4 sm:p-6 md:p-7 space-y-6">
                                                        {/* Datas de Início e Fim */}
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                            <div className="space-y-1.5">
                                                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                                                    <Calendar className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
                                                                    <span>Início das Submissões</span>
                                                                </label>
                                                                <input
                                                                    type="datetime-local"
                                                                    value={inicioSubmissaoDateTime}
                                                                    onChange={e => setInicioSubmissaoDateTime(e.target.value)}
                                                                    className={inputClass}
                                                                />
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                                                    <Calendar className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
                                                                    <span>Fim das Submissões</span>
                                                                </label>
                                                                <input
                                                                    type="datetime-local"
                                                                    value={fimSubmissaoDateTime}
                                                                    onChange={e => setFimSubmissaoDateTime(e.target.value)}
                                                                    className={inputClass}
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Informações/Instruções */}
                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                                                <Info className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
                                                                <span>Informações/Instruções</span>
                                                            </label>
                                                            <textarea
                                                                rows={4}
                                                                placeholder="Insira informações importantes sobre a submissão de trabalhos..."
                                                                value={instrucoesSubmissao}
                                                                onChange={e => setInstrucoesSubmissao(e.target.value)}
                                                                className={inputClass}
                                                            />
                                                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                                Estas informações serão exibidas no formulário de submissão de trabalhos.
                                                            </p>
                                                        </div>

                                                        {/* Limites de Trabalhos por Categoria */}
                                                        <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-blue-900/30">
                                                            <div className="flex items-center gap-2">
                                                                <SlidersHorizontal className="w-4 h-4 text-slate-800 dark:text-slate-200" />
                                                                <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                                                                    Limites de Trabalhos por Categoria
                                                                </h4>
                                                            </div>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                                Defina o limite de trabalhos que cada participante pode publicar por categoria no evento.
                                                            </p>

                                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                                                                <div>
                                                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
                                                                        <User className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
                                                                        <span>Autor</span>
                                                                    </label>
                                                                    <div className="flex items-stretch rounded-xl border border-slate-200 dark:border-blue-900/50 bg-white dark:bg-[#071321] overflow-hidden text-xs h-[40px]">
                                                                        <span className="px-3 flex items-center bg-slate-100 dark:bg-blue-950/50 text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-blue-900/50 select-none shrink-0 whitespace-nowrap font-medium">
                                                                            Até
                                                                        </span>
                                                                        <input
                                                                            type="number"
                                                                            min="1"
                                                                            value={limiteTrabalhosAutor}
                                                                            onChange={e => setLimiteTrabalhosAutor(e.target.value)}
                                                                            className="w-full min-w-[50px] px-2.5 bg-transparent text-slate-900 dark:text-white outline-none font-semibold"
                                                                        />
                                                                        <span className="px-3 flex items-center bg-slate-100 dark:bg-blue-950/50 text-slate-600 dark:text-slate-300 border-l border-slate-200 dark:border-blue-900/50 select-none shrink-0 whitespace-nowrap">
                                                                            trabalho(s)
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                <div>
                                                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
                                                                        <Users className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
                                                                        <span>Coautor</span>
                                                                    </label>
                                                                    <div className="flex items-stretch rounded-xl border border-slate-200 dark:border-blue-900/50 bg-white dark:bg-[#071321] overflow-hidden text-xs h-[40px]">
                                                                        <span className="px-3 flex items-center bg-slate-100 dark:bg-blue-950/50 text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-blue-900/50 select-none shrink-0 whitespace-nowrap font-medium">
                                                                            Até
                                                                        </span>
                                                                        <input
                                                                            type="number"
                                                                            min="1"
                                                                            value={limiteTrabalhosCoautor}
                                                                            onChange={e => setLimiteTrabalhosCoautor(e.target.value)}
                                                                            className="w-full min-w-[50px] px-2.5 bg-transparent text-slate-900 dark:text-white outline-none font-semibold"
                                                                        />
                                                                        <span className="px-3 flex items-center bg-slate-100 dark:bg-blue-950/50 text-slate-600 dark:text-slate-300 border-l border-slate-200 dark:border-blue-900/50 select-none shrink-0 whitespace-nowrap">
                                                                            trabalho(s)
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                <div>
                                                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
                                                                        <GraduationCap className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
                                                                        <span>Orientador</span>
                                                                    </label>
                                                                    <div className="flex items-stretch rounded-xl border border-slate-200 dark:border-blue-900/50 bg-white dark:bg-[#071321] overflow-hidden text-xs h-[40px]">
                                                                        <span className="px-3 flex items-center bg-slate-100 dark:bg-blue-950/50 text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-blue-900/50 select-none shrink-0 whitespace-nowrap font-medium">
                                                                            Até
                                                                        </span>
                                                                        <input
                                                                            type="number"
                                                                            min="1"
                                                                            value={limiteTrabalhosOrientador}
                                                                            onChange={e => setLimiteTrabalhosOrientador(e.target.value)}
                                                                            className="w-full min-w-[50px] px-2.5 bg-transparent text-slate-900 dark:text-white outline-none font-semibold"
                                                                        />
                                                                        <span className="px-3 flex items-center bg-slate-100 dark:bg-blue-950/50 text-slate-600 dark:text-slate-300 border-l border-slate-200 dark:border-blue-900/50 select-none shrink-0 whitespace-nowrap">
                                                                            trabalho(s)
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Limites de Coautores e Orientadores por Trabalho */}
                                                        <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-blue-900/30">
                                                            <div className="flex items-center gap-2">
                                                                <Users className="w-4 h-4 text-slate-800 dark:text-slate-200" />
                                                                <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                                                                    Limites de Coautores e Orientadores por Trabalho
                                                                </h4>
                                                            </div>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                                Defina o número máximo de coautores e orientadores que podem ser adicionados em cada trabalho.
                                                            </p>

                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                                                                <div>
                                                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
                                                                        <Users className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
                                                                        <span>Coautores por trabalho</span>
                                                                    </label>
                                                                    <div className="flex items-stretch rounded-xl border border-slate-200 dark:border-blue-900/50 bg-white dark:bg-[#071321] overflow-hidden text-xs h-[40px]">
                                                                        <span className="px-3 flex items-center bg-slate-100 dark:bg-blue-950/50 text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-blue-900/50 select-none shrink-0 whitespace-nowrap font-medium">
                                                                            Até
                                                                        </span>
                                                                        <input
                                                                            type="number"
                                                                            min="1"
                                                                            value={limiteCoautoresPorTrabalho}
                                                                            onChange={e => setLimiteCoautoresPorTrabalho(e.target.value)}
                                                                            className="w-full min-w-[50px] px-2.5 bg-transparent text-slate-900 dark:text-white outline-none font-semibold"
                                                                        />
                                                                        <span className="px-3 flex items-center bg-slate-100 dark:bg-blue-950/50 text-slate-600 dark:text-slate-300 border-l border-slate-200 dark:border-blue-900/50 select-none shrink-0 whitespace-nowrap">
                                                                            coautores
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                <div>
                                                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
                                                                        <GraduationCap className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
                                                                        <span>Orientadores por trabalho</span>
                                                                    </label>
                                                                    <div className="flex items-stretch rounded-xl border border-slate-200 dark:border-blue-900/50 bg-white dark:bg-[#071321] overflow-hidden text-xs h-[40px]">
                                                                        <span className="px-3 flex items-center bg-slate-100 dark:bg-blue-950/50 text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-blue-900/50 select-none shrink-0 whitespace-nowrap font-medium">
                                                                            Até
                                                                        </span>
                                                                        <input
                                                                            type="number"
                                                                            min="1"
                                                                            value={limiteOrientadoresPorTrabalho}
                                                                            onChange={e => setLimiteOrientadoresPorTrabalho(e.target.value)}
                                                                            className="w-full min-w-[50px] px-2.5 bg-transparent text-slate-900 dark:text-white outline-none font-semibold"
                                                                        />
                                                                        <span className="px-3 flex items-center bg-slate-100 dark:bg-blue-950/50 text-slate-600 dark:text-slate-300 border-l border-slate-200 dark:border-blue-900/50 select-none shrink-0 whitespace-nowrap">
                                                                            orientadores
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Formatos de Resumo (Simples vs. Expandido) e Envio para Avaliadores (1, 2 ou 3) */}
                                                        <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-blue-900/30">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                {/* Limite de Letras: Simples vs. Expandido */}
                                                                <div className="p-4 rounded-xl border border-slate-200 dark:border-blue-900/40 bg-slate-50/50 dark:bg-[#071321]/60 space-y-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <AlignLeft className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                                                                            Formatos de Resumo (Simples e Expandido)
                                                                        </h4>
                                                                    </div>
                                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                                        O formulário do autor exibirá duas opções com caixas de texto proporcionais ao limite de letras de cada formato.
                                                                    </p>
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                        <div>
                                                                            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                                                                                Resumo Simples (letras)
                                                                            </label>
                                                                            <input
                                                                                type="number"
                                                                                min="300"
                                                                                value={limiteCaracteresSimples}
                                                                                onChange={e => setLimiteCaracteresSimples(e.target.value)}
                                                                                className={inputClass}
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                                                                                Resumo Expandido (letras)
                                                                            </label>
                                                                            <input
                                                                                type="number"
                                                                                min="1000"
                                                                                value={limiteCaracteresExpandido}
                                                                                onChange={e => setLimiteCaracteresExpandido(e.target.value)}
                                                                                className={inputClass}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Pergunta: Para quantos avaliadores enviar? (1, 2 ou 3) */}
                                                                <div className="p-4 rounded-xl border border-slate-200 dark:border-blue-900/40 bg-slate-50/50 dark:bg-[#071321]/60 space-y-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                                                                            Para quantos avaliadores enviar?
                                                                        </h4>
                                                                    </div>
                                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                                        Cada resumo submetido será encaminhado automaticamente para avaliadores/professores que marcaram a mesma área de interesse.
                                                                    </p>
                                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-0.5">
                                                                        {(["1", "2", "3"] as const).map(qtd => {
                                                                            const ativo = qtdAvaliadoresPorResumo === qtd;
                                                                            return (
                                                                                <button
                                                                                    key={qtd}
                                                                                    type="button"
                                                                                    onClick={() => setQtdAvaliadoresPorResumo(qtd)}
                                                                                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                                                                                        ativo
                                                                                            ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                                                                                            : "border-slate-200 dark:border-blue-900/50 bg-white dark:bg-[#0c1e33] text-slate-700 dark:text-slate-300 hover:border-blue-400"
                                                                                    }`}
                                                                                >
                                                                                    {qtd} {qtd === "1" ? "Avaliador" : "Avaliadores"}
                                                                                </button>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Regra de Publicação nos Anais (Todos os aprovados vs. Só os apresentados) */}
                                                            <div className="p-4 rounded-xl border border-slate-200 dark:border-blue-900/40 bg-slate-50/50 dark:bg-[#071321]/60 space-y-2.5">
                                                                <div className="flex items-center gap-2">
                                                                    <BookMarked className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                                                                        Publicação nos Anais do Evento
                                                                    </h4>
                                                                </div>
                                                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                                    Escolha quais trabalhos científicos devem compor os Anais oficiais do evento:
                                                                </p>
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setRegraPublicacaoAnais("todos_aprovados");
                                                                            void sincronizarSubmissaoFirestore({ regraAnaisOverride: "todos_aprovados" });
                                                                        }}
                                                                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                                                                            regraPublicacaoAnais === "todos_aprovados"
                                                                                ? "border-blue-600 bg-blue-50/80 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20"
                                                                                : "border-slate-200 dark:border-blue-900/50 bg-white dark:bg-[#0c1e33] text-slate-700 dark:text-slate-300"
                                                                        }`}
                                                                    >
                                                                        <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${regraPublicacaoAnais === "todos_aprovados" ? "text-blue-600" : "text-slate-400"}`} />
                                                                        <div>
                                                                            <span className="font-bold text-xs block">Todos os trabalhos aprovados</span>
                                                                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                                                                Inclui nos Anais todos os resumos com status Aceito/Aprovado.
                                                                            </span>
                                                                        </div>
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setRegraPublicacaoAnais("apresentados");
                                                                            void sincronizarSubmissaoFirestore({ regraAnaisOverride: "apresentados" });
                                                                        }}
                                                                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                                                                            regraPublicacaoAnais === "apresentados"
                                                                                ? "border-blue-600 bg-blue-50/80 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20"
                                                                                : "border-slate-200 dark:border-blue-900/50 bg-white dark:bg-[#0c1e33] text-slate-700 dark:text-slate-300"
                                                                        }`}
                                                                    >
                                                                        <Award className={`w-4 h-4 shrink-0 mt-0.5 ${regraPublicacaoAnais === "apresentados" ? "text-blue-600" : "text-slate-400"}`} />
                                                                        <div>
                                                                            <span className="font-bold text-xs block">Apenas os trabalhos apresentados</span>
                                                                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                                                                Inclui nos Anais somente os trabalhos aprovados que tiveram presença/apresentação confirmada no dia.
                                                                            </span>
                                                                        </div>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* URL do Regulamento */}
                                                        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-blue-900/30">
                                                            <div className="flex items-center gap-2">
                                                                <FileText className="w-4 h-4 text-slate-800 dark:text-slate-200" />
                                                                <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                                                                    URL do Regulamento
                                                                </h4>
                                                            </div>

                                                            {/* Abas estilo pasta igual à Print 1 */}
                                                            <div className="flex items-center border-b border-slate-200 dark:border-blue-900/40">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setTipoRegulamento("pdf")}
                                                                    className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border-t border-x rounded-t-xl -mb-px transition-all cursor-pointer ${tipoRegulamento === "pdf"
                                                                        ? "bg-white dark:bg-[#0c1e33] border-slate-200 dark:border-blue-900/40 text-slate-900 dark:text-white"
                                                                        : "bg-transparent border-transparent text-blue-600 dark:text-blue-400 hover:text-blue-700"
                                                                        }`}
                                                                >
                                                                    <Upload className="w-3.5 h-3.5" />
                                                                    <span>Enviar PDF</span>
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setTipoRegulamento("url")}
                                                                    className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border-t border-x rounded-t-xl -mb-px transition-all cursor-pointer ${tipoRegulamento === "url"
                                                                        ? "bg-white dark:bg-[#0c1e33] border-slate-200 dark:border-blue-900/40 text-slate-900 dark:text-white"
                                                                        : "bg-transparent border-transparent text-blue-600 dark:text-blue-400 hover:text-blue-700"
                                                                        }`}
                                                                >
                                                                    <Link2 className="w-3.5 h-3.5" />
                                                                    <span>Informar URL</span>
                                                                </button>
                                                            </div>

                                                            {tipoRegulamento === "pdf" ? (
                                                                <div className="space-y-2 pt-1">
                                                                    <div
                                                                        onClick={() => regulamentoInputRef.current?.click()}
                                                                        className="p-8 rounded-xl border border-dashed border-slate-300 dark:border-blue-900/60 hover:border-blue-500 bg-slate-50/70 dark:bg-[#071321]/50 flex flex-col items-center justify-center gap-2.5 cursor-pointer text-center transition-all"
                                                                    >
                                                                        <CloudUpload className="w-10 h-10 text-slate-500 dark:text-slate-400" />
                                                                        <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">
                                                                            Arraste o PDF aqui ou clique para selecionar
                                                                        </p>
                                                                        <button
                                                                            type="button"
                                                                            className="px-3.5 py-1.5 rounded-lg border border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
                                                                        >
                                                                            <FileText className="w-3.5 h-3.5" />
                                                                            <span>Selecionar arquivo</span>
                                                                        </button>
                                                                        <p className="text-[11px] text-slate-400">Formato: PDF. Tamanho máximo: 10MB.</p>
                                                                        <input
                                                                            ref={regulamentoInputRef}
                                                                            type="file"
                                                                            accept=".pdf"
                                                                            onChange={e => {
                                                                                if (e.target.files && e.target.files[0]) {
                                                                                    const f = e.target.files[0];
                                                                                    if (f.size > 10 * 1024 * 1024) {
                                                                                        alert("O arquivo não pode exceder 10MB.");
                                                                                        return;
                                                                                    }
                                                                                    setRegulamentoFile(f);
                                                                                    setRegulamentoNome(f.name);
                                                                                }
                                                                            }}
                                                                            className="hidden"
                                                                        />
                                                                    </div>

                                                                    {(regulamentoFile || regulamentoNome || regulamentoUrl) && (
                                                                        <div className="flex items-center justify-between p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 text-xs">
                                                                            <div className="flex items-center gap-2 truncate pr-2">
                                                                                <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                                                                                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                                                                    {regulamentoFile ? regulamentoFile.name : (regulamentoNome || "Regulamento.pdf")}
                                                                                </span>
                                                                            </div>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setRegulamentoFile(null);
                                                                                    setRegulamentoNome("");
                                                                                    setRegulamentoUrl("");
                                                                                }}
                                                                                className="text-slate-400 hover:text-rose-500 p-1"
                                                                                title="Remover arquivo"
                                                                            >
                                                                                <Trash2 className="w-4 h-4" />
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-1.5 pt-1">
                                                                    <input
                                                                        type="url"
                                                                        placeholder="https://exemplo.com/regulamento-oficial.pdf"
                                                                        value={regulamentoUrl}
                                                                        onChange={e => setRegulamentoUrl(e.target.value)}
                                                                        className={inputClass}
                                                                    />
                                                                    <p className="text-[11px] text-slate-400">Insira o link público do regulamento do evento.</p>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Botão Salvar Submissão */}
                                                        <div className="pt-2">
                                                            <button
                                                                type="button"
                                                                onClick={handleSalvarSubmissao}
                                                                disabled={isLoading}
                                                                className="w-full py-3 rounded-xl bg-[#1e3a8a] hover:bg-[#172e6e] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-colors"
                                                            >
                                                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                                <span>Salvar</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* =========================================================
                                            SUB-ÁREA 2: ÁREAS DE AVALIAÇÃO (Print 2)
                                        ========================================================== */}
                                        {subTabTrabalhos === "areas" && (
                                            <div className="space-y-6 animate-in fade-in">
                                                {/* Card Principal: Gerenciar Áreas de Avaliação com Header Azul Integrado */}
                                                <div className="border border-slate-200 dark:border-blue-900/40 rounded-2xl bg-white dark:bg-[#0c1e33] overflow-hidden shadow-sm">
                                                    {/* Header Azul Integrado */}
                                                    <div className="bg-[#1e3a8a] text-white px-4 py-4 sm:px-6 sm:py-5 flex items-start sm:items-center gap-3.5">
                                                        <div className="w-10 h-10 rounded-xl bg-white/15 text-white flex items-center justify-center shrink-0">
                                                            <Layers className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-extrabold text-base sm:text-lg tracking-tight text-white">
                                                                Gerenciar Áreas de Avaliação
                                                            </h3>
                                                            <p className="text-xs text-blue-100/90 mt-0.5">
                                                                Cadastre as áreas temáticas ou eixos de avaliação disponíveis para submissão neste evento.
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="p-4 sm:p-6 md:p-7 space-y-6">
                                                        {/* Input Nome da Área + Botão Adicionar */}
                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                                                                Nome da Área
                                                            </label>
                                                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                                                <input
                                                                    ref={areaInputRef}
                                                                    type="text"
                                                                    placeholder="Ex: Ciências Exatas, Ciências Humanas, etc."
                                                                    value={novaAreaNome}
                                                                    onChange={e => {
                                                                        setNovaAreaNome(e.target.value);
                                                                        if (erroArea) setErroArea("");
                                                                    }}
                                                                    onKeyDown={e => {
                                                                        if (e.key === "Enter") {
                                                                            e.preventDefault();
                                                                            handleAddAreaAvaliacao();
                                                                        }
                                                                    }}
                                                                    className={`flex-1 h-[42px] ${inputClass} ${erroArea ? "border-rose-400 focus:border-rose-500" : ""}`}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={handleAddAreaAvaliacao}
                                                                    className="h-[42px] px-5 rounded-xl bg-[#1e3a8a] hover:bg-[#172e6e] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shrink-0 shadow-sm cursor-pointer transition-colors"
                                                                >
                                                                    <Plus className="w-4 h-4" />
                                                                    <span>Adicionar Área</span>
                                                                </button>
                                                            </div>
                                                            {erroArea && (
                                                                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium pt-1">
                                                                    {erroArea}
                                                                </p>
                                                            )}
                                                        </div>

                                                        {/* Áreas Cadastradas */}
                                                        <div className="pt-4 border-t border-slate-200 dark:border-blue-900/30 space-y-3">
                                                            <h4 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                                                <ListChecks className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                                                                <span>Áreas Cadastradas ({areasAvaliacao.length})</span>
                                                            </h4>

                                                            {areasAvaliacao.length === 0 ? (
                                                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#071321]/60 border border-dashed border-slate-200 dark:border-blue-900/40 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2.5">
                                                                    <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                                                                    <span>Nenhuma área de avaliação cadastrada. Digite o nome da área acima e clique em &quot;+ Adicionar Área&quot;.</span>
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-2">
                                                                    {areasAvaliacao.map(area => (
                                                                        <div
                                                                            key={area.id}
                                                                            className="flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 dark:border-blue-900/40 bg-slate-50/70 dark:bg-[#071321] transition-all"
                                                                        >
                                                                            {editandoAreaId === area.id ? (
                                                                                <div className="flex items-center gap-2 flex-1 mr-2">
                                                                                    <input
                                                                                        type="text"
                                                                                        value={editandoAreaNome}
                                                                                        onChange={e => setEditandoAreaNome(e.target.value)}
                                                                                        onKeyDown={e => {
                                                                                            if (e.key === "Enter") {
                                                                                                e.preventDefault();
                                                                                                handleSalvarEdicaoArea(area.id);
                                                                                            }
                                                                                        }}
                                                                                        className={`flex-1 ${inputClass}`}
                                                                                        autoFocus
                                                                                    />
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => handleSalvarEdicaoArea(area.id)}
                                                                                        className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg cursor-pointer"
                                                                                        title="Salvar"
                                                                                    >
                                                                                        <Check className="w-4 h-4" />
                                                                                    </button>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => setEditandoAreaId(null)}
                                                                                        className="p-2 bg-slate-400 hover:bg-slate-500 text-white rounded-lg cursor-pointer"
                                                                                        title="Cancelar"
                                                                                    >
                                                                                        <X className="w-4 h-4" />
                                                                                    </button>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                                                                    <Tag className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                                                                                    <span className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                                                                                        {area.nome}
                                                                                    </span>
                                                                                </div>
                                                                            )}

                                                                            {editandoAreaId !== area.id && (
                                                                                <div className="flex items-center gap-1.5 shrink-0">
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => {
                                                                                            setEditandoAreaId(area.id);
                                                                                            setEditandoAreaNome(area.nome);
                                                                                        }}
                                                                                        className="p-2 rounded-lg border border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                                                                                        title="Editar Área"
                                                                                    >
                                                                                        <Pencil className="w-3.5 h-3.5" />
                                                                                    </button>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => handleRemoveAreaAvaliacao(area.id)}
                                                                                        className="p-2 rounded-lg border border-rose-500 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                                                                        title="Remover Área"
                                                                                    >
                                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                                    </button>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Card: Avaliadores / Professores por Área de Interesse */}
                                                <div className="p-6 border border-slate-200 dark:border-blue-900/40 rounded-2xl bg-white dark:bg-[#0c1e33] space-y-5 shadow-sm">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-blue-900/30">
                                                        <div>
                                                            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                                                                <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                                <span>Avaliadores / Professores por Área de Interesse</span>
                                                            </h3>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                                Tanto o autor quanto o avaliador/professor escolhem dentre as mesmas áreas elencadas acima. Os resumos são encaminhados automaticamente para {qtdAvaliadoresPorResumo} avaliador(es) da mesma área.
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Formulário para cadastrar avaliador/professor na comissão */}
                                                    <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-[#071321]/60 border border-slate-200 dark:border-blue-900/40 space-y-3">
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            <div>
                                                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                                                                    Nome do Avaliador / Professor
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    placeholder="Ex: Prof. Dr. Carlos Mendes"
                                                                    value={novoAvaliadorNome}
                                                                    onChange={e => {
                                                                        setNovoAvaliadorNome(e.target.value);
                                                                        if (erroAvaliador) setErroAvaliador("");
                                                                    }}
                                                                    className={`h-[40px] ${inputClass}`}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                                                                    E-mail do Avaliador / Professor
                                                                </label>
                                                                <input
                                                                    type="email"
                                                                    placeholder="professor@universidade.edu.br"
                                                                    value={novoAvaliadorEmail}
                                                                    onChange={e => {
                                                                        setNovoAvaliadorEmail(e.target.value);
                                                                        if (erroAvaliador) setErroAvaliador("");
                                                                    }}
                                                                    className={`h-[40px] ${inputClass}`}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                                                                Marcar Área(s) de Interesse deste Avaliador:
                                                            </label>
                                                            {areasAvaliacao.length === 0 ? (
                                                                <p className="text-xs text-amber-600 dark:text-amber-400">
                                                                    Cadastre pelo menos uma área de avaliação acima para marcar as áreas do avaliador.
                                                                </p>
                                                            ) : (
                                                                <div className="flex flex-wrap gap-2 pt-0.5">
                                                                    {areasAvaliacao.map(a => {
                                                                        const marcada = novoAvaliadorAreas.includes(a.nome);
                                                                        return (
                                                                            <button
                                                                                key={a.id}
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setNovoAvaliadorAreas(prev =>
                                                                                        prev.includes(a.nome)
                                                                                            ? prev.filter(x => x !== a.nome)
                                                                                            : [...prev, a.nome]
                                                                                    );
                                                                                    if (erroAvaliador) setErroAvaliador("");
                                                                                }}
                                                                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                                                                                    marcada
                                                                                        ? "border-blue-600 bg-blue-600 text-white shadow-xs"
                                                                                        : "border-slate-200 dark:border-blue-900/50 bg-white dark:bg-[#0c1e33] text-slate-700 dark:text-slate-300 hover:border-blue-400"
                                                                                }`}
                                                                            >
                                                                                <Check className={`w-3.5 h-3.5 ${marcada ? "opacity-100" : "opacity-30"}`} />
                                                                                <span>{a.nome}</span>
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {erroAvaliador && (
                                                            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                                                                {erroAvaliador}
                                                            </p>
                                                        )}

                                                        <div className="flex justify-end">
                                                            <button
                                                                type="button"
                                                                onClick={handleAddAvaliadorComissao}
                                                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1e3a8a] hover:bg-[#172e6e] text-white text-xs font-bold transition-colors cursor-pointer"
                                                            >
                                                                <UserPlus className="w-3.5 h-3.5" />
                                                                <span>Cadastrar Avaliador na Área</span>
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Lista de Avaliadores Cadastrados + Avaliadores Inscritos */}
                                                    <div className="space-y-2.5">
                                                        <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300">
                                                            Avaliadores Disponíveis ({avaliadoresComissao.length + avaliadoresInscritosEvento.length})
                                                        </h4>
                                                        {avaliadoresComissao.length === 0 && avaliadoresInscritosEvento.length === 0 ? (
                                                            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#071321]/50 border border-dashed border-slate-200 dark:border-blue-900/40 text-xs text-slate-500">
                                                                Nenhum avaliador cadastrado ainda. Você pode cadastrar professores acima ou os próprios participantes podem marcar interesse e suas áreas ao se inscreverem no evento.
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-2">
                                                                {avaliadoresComissao.map(av => (
                                                                    <div
                                                                        key={av.id}
                                                                        className="p-3.5 rounded-xl border border-slate-200 dark:border-blue-900/40 bg-slate-50/60 dark:bg-[#071321] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                                                    >
                                                                        <div className="space-y-1">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                                                                                    {av.nome}
                                                                                </span>
                                                                                <span className="text-xs text-slate-500">({av.email})</span>
                                                                            </div>
                                                                            <div className="flex flex-wrap gap-1.5">
                                                                                {areasAvaliacao.map(areaObj => {
                                                                                    const ativo = (av.areasInteresse || []).includes(areaObj.nome);
                                                                                    return (
                                                                                        <button
                                                                                            key={areaObj.id}
                                                                                            type="button"
                                                                                            onClick={() => handleToggleAreaAvaliadorComissao(av.id, areaObj.nome)}
                                                                                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
                                                                                                ativo
                                                                                                    ? "bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700"
                                                                                                    : "bg-white dark:bg-[#0c1e33] text-slate-400 border-slate-200 dark:border-blue-900/40"
                                                                                            }`}
                                                                                            title="Clique para alternar área de interesse"
                                                                                        >
                                                                                            {ativo ? "✓ " : "+ "}{areaObj.nome}
                                                                                        </button>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleRemoveAvaliadorComissao(av.id)}
                                                                            className="p-2 rounded-lg border border-rose-500 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer self-end sm:self-center"
                                                                            title="Remover Avaliador"
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    </div>
                                                                ))}

                                                                {avaliadoresInscritosEvento.map(av => (
                                                                    <div
                                                                        key={`insc-${av.id}`}
                                                                        className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                                                                    >
                                                                        <div className="space-y-1">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                                                                                    {av.nome}
                                                                                </span>
                                                                                <span className="text-xs text-slate-500">({av.email})</span>
                                                                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                                                                                    Inscrito no Evento
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex flex-wrap gap-1.5">
                                                                                {(av.areasInteresse || []).length > 0 ? (
                                                                                    (av.areasInteresse || []).map((ar, idx) => (
                                                                                        <span
                                                                                            key={idx}
                                                                                            className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[10px] font-bold"
                                                                                        >
                                                                                            {ar}
                                                                                        </span>
                                                                                    ))
                                                                                ) : (
                                                                                    <span className="text-[11px] text-slate-400">
                                                                                        Todas as áreas / definindo no painel
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Card Notificar Inscritos */}
                                                <div className="p-6 border border-slate-200 dark:border-blue-900/40 rounded-2xl bg-white dark:bg-[#0c1e33] space-y-3 shadow-sm">
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="w-4 h-4 text-slate-800 dark:text-slate-200" />
                                                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">Notificar Inscritos</h3>
                                                    </div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                                        Envie um e-mail para todos os avaliadores e alunos inscritos neste evento informando que novas áreas de avaliação estão disponíveis.
                                                    </p>
                                                    <div>
                                                        <button
                                                            type="button"
                                                            onClick={handleNotificarInscritos}
                                                            disabled={enviandoNotificacao}
                                                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer disabled:opacity-50"
                                                        >
                                                            {enviandoNotificacao ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                                            <span>{enviandoNotificacao ? "Enviando..." : "Enviar Notificação de Novas Áreas"}</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* =========================================================
                                            SUB-ÁREA 3: AVALIAÇÃO DO DIA DO EVENTO (Print 3)
                                        ========================================================== */}
                                        {subTabTrabalhos === "avaliacao_dia" && (
                                            <div className="space-y-6 animate-in fade-in">
                                                {/* Barra de Gerenciamento dos Dias de Apresentação (Compatível com as Datas do Evento ou escolha do Promotor) */}
                                                <div className="p-4 sm:p-5 rounded-2xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-[#0c1e33] space-y-3 shadow-xs">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                        <div className="space-y-0.5">
                                                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                                                <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                                <span>Dias de Apresentação do Evento</span>
                                                            </h4>
                                                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                                {dataInicio
                                                                    ? `Datas configuradas no evento: ${dataInicio.split("-").reverse().join("/")}${dataFim && dataFim !== dataInicio ? ` até ${dataFim.split("-").reverse().join("/")}` : ""}. Você pode usar todos os dias do evento ou escolher datas específicas abaixo.`
                                                                    : "Defina as datas de início e término na aba 'Datas' para gerar os dias automaticamente, ou escolha abaixo os dias de apresentação."}
                                                            </p>
                                                        </div>

                                                        <div className="flex flex-wrap items-center gap-2">
                                                            {dataInicio && (
                                                                <button
                                                                    type="button"
                                                                    onClick={handleSincronizarDiasComEvento}
                                                                    className="px-3 py-2 rounded-xl border border-blue-600/40 bg-white dark:bg-[#071321] hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-bold transition-colors cursor-pointer shrink-0"
                                                                >
                                                                    Sincronizar com Datas do Evento
                                                                </button>
                                                            )}
                                                            <div className="flex items-center gap-1.5">
                                                                <input
                                                                    type="date"
                                                                    min={dataInicio || undefined}
                                                                    max={dataFim || undefined}
                                                                    value={novaDataApresentacao}
                                                                    onChange={e => setNovaDataApresentacao(e.target.value)}
                                                                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-blue-900/50 bg-white dark:bg-[#071321] text-xs text-slate-800 dark:text-slate-200 outline-none"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={handleAddDiaApresentacaoManual}
                                                                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-[#1e3a8a] hover:bg-[#172e6e] text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
                                                                >
                                                                    <Plus className="w-3.5 h-3.5" />
                                                                    <span>Adicionar Dia</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Card 1: Apresentação Oral */}
                                                <div className="rounded-2xl border border-slate-200 dark:border-blue-900/40 bg-white dark:bg-[#0c1e33] overflow-hidden shadow-sm">
                                                    <div className="bg-[#24292e] dark:bg-[#081524] text-white px-5 py-3.5 font-bold text-sm flex items-center gap-2">
                                                        <Mic className="w-4 h-4 text-slate-200" />
                                                        <span>Apresentação Oral</span>
                                                    </div>
                                                    <div className="p-6 space-y-5">
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                            <div className="space-y-1.5">
                                                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                                                                    Tempo de apresentação
                                                                </label>
                                                                <div className="flex items-stretch rounded-xl border border-slate-200 dark:border-blue-900/50 bg-white dark:bg-[#071321] overflow-hidden text-xs h-[42px]">
                                                                    <input
                                                                        type="number"
                                                                        min="1"
                                                                        value={tempoApresentacaoOral}
                                                                        onChange={e => setTempoApresentacaoOral(e.target.value)}
                                                                        className="w-full px-3 bg-transparent text-slate-900 dark:text-white outline-none font-semibold"
                                                                    />
                                                                    <span className="px-3.5 flex items-center bg-slate-100 dark:bg-blue-950/50 text-slate-600 dark:text-slate-300 border-l border-slate-200 dark:border-blue-900/50 select-none shrink-0 font-medium">
                                                                        min
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                                                    <Star className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
                                                                    <span>Nota Máxima</span>
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    value={notaMaximaOral}
                                                                    onChange={e => setNotaMaximaOral(e.target.value)}
                                                                    className={`h-[42px] ${inputClass}`}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-blue-900/30">
                                                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                                                Período para apresentação:
                                                            </label>

                                                            {diasAvaliacao.length === 0 ? (
                                                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#071321]/60 border border-dashed border-slate-200 dark:border-blue-900/40 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between gap-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                                                                        <span>Nenhum dia de apresentação selecionado. Informe as datas do evento na aba &quot;Datas&quot; ou adicione um dia no seletor acima.</span>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-3">
                                                                    {diasAvaliacao.map(dia => {
                                                                        const isAddingThisOral = modalPeriodo?.diaId === dia.id && modalPeriodo?.tipo === "oral";
                                                                        return (
                                                                            <div key={dia.id} className="p-4 rounded-xl border border-slate-200 dark:border-blue-900/40 bg-slate-50/40 dark:bg-[#071321]/50 space-y-3">
                                                                                <div className="flex items-center justify-between gap-2">
                                                                                    <div className="space-y-1.5">
                                                                                        <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 block">
                                                                                            {dia.label}
                                                                                        </span>
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => {
                                                                                                if (isAddingThisOral) {
                                                                                                    setModalPeriodo(null);
                                                                                                } else {
                                                                                                    setModalPeriodo({ diaId: dia.id, tipo: "oral", diaLabel: dia.label });
                                                                                                }
                                                                                            }}
                                                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e3a8a] hover:bg-[#172e6e] text-white text-xs font-bold transition-colors cursor-pointer"
                                                                                        >
                                                                                            <Plus className="w-3.5 h-3.5" />
                                                                                            <span>Adicionar novo período</span>
                                                                                        </button>
                                                                                    </div>

                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => handleRemoveDiaAvaliacao(dia.id)}
                                                                                        className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                                                                                        title="Remover este dia de apresentação"
                                                                                    >
                                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                                    </button>
                                                                                </div>

                                                                                {/* Formulário Inline para Adicionar Período Oral */}
                                                                                {isAddingThisOral && (
                                                                                    <div className="p-3.5 rounded-xl bg-white dark:bg-[#0c1e33] border border-blue-200 dark:border-blue-800/60 space-y-3">
                                                                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                                                                            <div className="space-y-1">
                                                                                                <label className="font-semibold text-slate-700 dark:text-slate-300 block">Início</label>
                                                                                                <input
                                                                                                    type="time"
                                                                                                    value={periodoFormInicio}
                                                                                                    onChange={e => setPeriodoFormInicio(e.target.value)}
                                                                                                    className={inputClass}
                                                                                                />
                                                                                            </div>
                                                                                            <div className="space-y-1">
                                                                                                <label className="font-semibold text-slate-700 dark:text-slate-300 block">Término</label>
                                                                                                <input
                                                                                                    type="time"
                                                                                                    value={periodoFormFim}
                                                                                                    onChange={e => setPeriodoFormFim(e.target.value)}
                                                                                                    className={inputClass}
                                                                                                />
                                                                                            </div>
                                                                                            <div className="space-y-1">
                                                                                                <label className="font-semibold text-slate-700 dark:text-slate-300 block">Sala / Local (Opcional)</label>
                                                                                                <input
                                                                                                    type="text"
                                                                                                    placeholder="Ex: Sala 101, Auditório..."
                                                                                                    value={periodoFormLocal}
                                                                                                    onChange={e => setPeriodoFormLocal(e.target.value)}
                                                                                                    className={inputClass}
                                                                                                />
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="flex items-center justify-end gap-2">
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => setModalPeriodo(null)}
                                                                                                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
                                                                                            >
                                                                                                Cancelar
                                                                                            </button>
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={handleSalvarNovoPeriodo}
                                                                                                className="px-3.5 py-1.5 rounded-lg bg-[#1e3a8a] hover:bg-[#172e6e] text-white text-xs font-bold cursor-pointer"
                                                                                            >
                                                                                                Salvar Período
                                                                                            </button>
                                                                                        </div>
                                                                                    </div>
                                                                                )}

                                                                                {dia.periodosOral.length > 0 && (
                                                                                    <div className="space-y-1.5 pt-1">
                                                                                        {dia.periodosOral.map(p => (
                                                                                            <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-[#0c1e33] border border-slate-200 dark:border-blue-900/40 text-xs">
                                                                                                <div className="flex items-center gap-2">
                                                                                                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                                                                                                    <span className="font-bold text-slate-800 dark:text-slate-200">{p.inicio} às {p.fim}</span>
                                                                                                    {p.local && <span className="text-slate-500">• {p.local}</span>}
                                                                                                </div>
                                                                                                <button
                                                                                                    type="button"
                                                                                                    onClick={() => handleRemovePeriodo(dia.id, "oral", p.id)}
                                                                                                    className="text-slate-400 hover:text-rose-500 p-1"
                                                                                                    title="Remover período"
                                                                                                >
                                                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                                                </button>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Card 2: Apresentação Banner */}
                                                <div className="rounded-2xl border border-slate-200 dark:border-blue-900/40 bg-white dark:bg-[#0c1e33] overflow-hidden shadow-sm">
                                                    <div className="bg-[#24292e] dark:bg-[#081524] text-white px-5 py-3.5 font-bold text-sm flex items-center gap-2">
                                                        <Presentation className="w-4 h-4 text-slate-200" />
                                                        <span>Apresentação Banner</span>
                                                    </div>
                                                    <div className="p-6 space-y-5">
                                                        <div className="space-y-1.5 max-w-xs">
                                                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                                                                Quantidade de banners por período
                                                            </label>
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                value={qtdBannersPorPeriodo}
                                                                onChange={e => setQtdBannersPorPeriodo(e.target.value)}
                                                                className={`h-[42px] ${inputClass}`}
                                                            />
                                                        </div>

                                                        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-blue-900/30">
                                                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                                                Período para apresentação:
                                                            </label>

                                                            {diasAvaliacao.length === 0 ? (
                                                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#071321]/60 border border-dashed border-slate-200 dark:border-blue-900/40 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                                                    <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                                                                    <span>Nenhum dia de apresentação selecionado. Informe as datas do evento na aba &quot;Datas&quot; ou adicione um dia no seletor acima.</span>
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-3">
                                                                    {diasAvaliacao.map(dia => {
                                                                        const isAddingThisBanner = modalPeriodo?.diaId === dia.id && modalPeriodo?.tipo === "banner";
                                                                        return (
                                                                            <div key={dia.id} className="p-4 rounded-xl border border-slate-200 dark:border-blue-900/40 bg-slate-50/40 dark:bg-[#071321]/50 space-y-3">
                                                                                <div className="flex items-center justify-between gap-2">
                                                                                    <div className="space-y-1.5">
                                                                                        <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 block">
                                                                                            {dia.label}
                                                                                        </span>
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => {
                                                                                                if (isAddingThisBanner) {
                                                                                                    setModalPeriodo(null);
                                                                                                } else {
                                                                                                    setModalPeriodo({ diaId: dia.id, tipo: "banner", diaLabel: dia.label });
                                                                                                }
                                                                                            }}
                                                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e3a8a] hover:bg-[#172e6e] text-white text-xs font-bold transition-colors cursor-pointer"
                                                                                        >
                                                                                            <Plus className="w-3.5 h-3.5" />
                                                                                            <span>Adicionar novo período</span>
                                                                                        </button>
                                                                                    </div>

                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => handleRemoveDiaAvaliacao(dia.id)}
                                                                                        className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                                                                                        title="Remover este dia de apresentação"
                                                                                    >
                                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                                    </button>
                                                                                </div>

                                                                                {/* Formulário Inline para Adicionar Período Banner */}
                                                                                {isAddingThisBanner && (
                                                                                    <div className="p-3.5 rounded-xl bg-white dark:bg-[#0c1e33] border border-blue-200 dark:border-blue-800/60 space-y-3">
                                                                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                                                                            <div className="space-y-1">
                                                                                                <label className="font-semibold text-slate-700 dark:text-slate-300 block">Início</label>
                                                                                                <input
                                                                                                    type="time"
                                                                                                    value={periodoFormInicio}
                                                                                                    onChange={e => setPeriodoFormInicio(e.target.value)}
                                                                                                    className={inputClass}
                                                                                                />
                                                                                            </div>
                                                                                            <div className="space-y-1">
                                                                                                <label className="font-semibold text-slate-700 dark:text-slate-300 block">Término</label>
                                                                                                <input
                                                                                                    type="time"
                                                                                                    value={periodoFormFim}
                                                                                                    onChange={e => setPeriodoFormFim(e.target.value)}
                                                                                                    className={inputClass}
                                                                                                />
                                                                                            </div>
                                                                                            <div className="space-y-1">
                                                                                                <label className="font-semibold text-slate-700 dark:text-slate-300 block">Hall / Local (Opcional)</label>
                                                                                                <input
                                                                                                    type="text"
                                                                                                    placeholder="Ex: Hall Principal, Corredor B..."
                                                                                                    value={periodoFormLocal}
                                                                                                    onChange={e => setPeriodoFormLocal(e.target.value)}
                                                                                                    className={inputClass}
                                                                                                />
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="flex items-center justify-end gap-2">
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => setModalPeriodo(null)}
                                                                                                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
                                                                                            >
                                                                                                Cancelar
                                                                                            </button>
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={handleSalvarNovoPeriodo}
                                                                                                className="px-3.5 py-1.5 rounded-lg bg-[#1e3a8a] hover:bg-[#172e6e] text-white text-xs font-bold cursor-pointer"
                                                                                            >
                                                                                                Salvar Período
                                                                                            </button>
                                                                                        </div>
                                                                                    </div>
                                                                                )}

                                                                                {dia.periodosBanner.length > 0 && (
                                                                                    <div className="space-y-1.5 pt-1">
                                                                                        {dia.periodosBanner.map(p => (
                                                                                            <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-[#0c1e33] border border-slate-200 dark:border-blue-900/40 text-xs">
                                                                                                <div className="flex items-center gap-2">
                                                                                                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                                                                                                    <span className="font-bold text-slate-800 dark:text-slate-200">{p.inicio} às {p.fim}</span>
                                                                                                    {p.local && <span className="text-slate-500">• {p.local}</span>}
                                                                                                </div>
                                                                                                <button
                                                                                                    type="button"
                                                                                                    onClick={() => handleRemovePeriodo(dia.id, "banner", p.id)}
                                                                                                    className="text-slate-400 hover:text-rose-500 p-1"
                                                                                                    title="Remover período"
                                                                                                >
                                                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                                                </button>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Botão de Salvar e Distribuir */}
                                                <div className="space-y-2">
                                                    <button
                                                        type="button"
                                                        onClick={handleSalvarEDistribuir}
                                                        disabled={isLoading}
                                                        className="w-full py-3.5 rounded-xl bg-[#1e3a8a] hover:bg-[#172e6e] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-colors"
                                                    >
                                                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                        <span>Salvar Configurações e Distribuir Trabalhos</span>
                                                    </button>
                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5 text-center">
                                                        <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                                        <span>Ao salvar, os trabalhos são distribuídos automaticamente nos períodos configurados, evitando choques com minicursos e outras atividades.</span>
                                                    </p>
                                                </div>

                                                {/* Card 3: Critérios de Avaliação */}
                                                <div className="p-6 border border-slate-200 dark:border-blue-900/40 rounded-2xl bg-white dark:bg-[#0c1e33] space-y-5 shadow-sm">
                                                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-blue-900/30">
                                                        <ListChecks className="w-4 h-4 text-slate-800 dark:text-slate-200" />
                                                        <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">Critérios de Avaliação</h3>
                                                    </div>

                                                    {/* Linha alinhada pelo topo (items-start) com alturas fixas h-[42px] */}
                                                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                                                        <div className="sm:col-span-7 space-y-1.5">
                                                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                                                                Nome do Critério
                                                            </label>
                                                            <input
                                                                ref={criterioInputRef}
                                                                type="text"
                                                                placeholder="Ex: Clareza na apresentação"
                                                                value={novoCriterioNome}
                                                                onChange={e => {
                                                                    setNovoCriterioNome(e.target.value);
                                                                    if (erroCriterio) setErroCriterio("");
                                                                }}
                                                                onKeyDown={e => {
                                                                    if (e.key === "Enter") {
                                                                        e.preventDefault();
                                                                        handleAddCriterio();
                                                                    }
                                                                }}
                                                                className={`h-[42px] ${inputClass} ${erroCriterio ? "border-rose-400 focus:border-rose-500" : ""}`}
                                                            />
                                                        </div>

                                                        <div className="sm:col-span-3 space-y-1.5">
                                                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                                                                Peso
                                                            </label>
                                                            <input
                                                                type="number"
                                                                step="0.1"
                                                                min="0.1"
                                                                value={novoCriterioPeso}
                                                                onChange={e => {
                                                                    setNovoCriterioPeso(e.target.value);
                                                                    if (erroCriterio) setErroCriterio("");
                                                                }}
                                                                onKeyDown={e => {
                                                                    if (e.key === "Enter") {
                                                                        e.preventDefault();
                                                                        handleAddCriterio();
                                                                    }
                                                                }}
                                                                className={`h-[42px] ${inputClass}`}
                                                            />
                                                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                                                                Disponível: {Math.max(0, (Number(notaMaximaOral) || 10) - criteriosAvaliacao.reduce((acc, c) => acc + (Number(c.peso) || 0), 0)).toFixed(3).replace(".", ",")}
                                                            </span>
                                                        </div>

                                                        <div className="sm:col-span-2 space-y-1.5">
                                                            <span className="text-xs font-semibold block select-none opacity-0 hidden sm:block">
                                                                Ação
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={handleAddCriterio}
                                                                className="w-full h-[42px] rounded-xl bg-[#1e3a8a] hover:bg-[#172e6e] text-white font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-sm"
                                                                title="Adicionar Critério"
                                                            >
                                                                <Plus className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {erroCriterio && (
                                                        <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                                                            {erroCriterio}
                                                        </p>
                                                    )}

                                                    <div className="pt-3 border-t border-slate-100 dark:border-blue-900/30 space-y-3">
                                                        <h4 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                                            <ListChecks className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                                                            <span>Critérios Cadastrados ({criteriosAvaliacao.length})</span>
                                                        </h4>

                                                        {criteriosAvaliacao.length === 0 ? (
                                                            <div className="p-4 rounded-xl bg-sky-100/70 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/40 text-xs text-sky-900 dark:text-sky-200 flex items-center gap-2.5">
                                                                <Info className="w-4 h-4 text-sky-700 dark:text-sky-400 shrink-0" />
                                                                <span>Nenhum critério cadastrado. Adicione os critérios que serão usados para avaliar os trabalhos no dia do evento.</span>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-2">
                                                                {criteriosAvaliacao.map(crit => (
                                                                    <div
                                                                        key={crit.id}
                                                                        className="flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 dark:border-blue-900/40 bg-slate-50/70 dark:bg-[#071321]"
                                                                    >
                                                                        {editandoCriterioId === crit.id ? (
                                                                            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 flex-1 mr-2">
                                                                                <input
                                                                                    type="text"
                                                                                    value={editandoCriterioNome}
                                                                                    onChange={e => setEditandoCriterioNome(e.target.value)}
                                                                                    className={`flex-1 ${inputClass}`}
                                                                                    autoFocus
                                                                                />
                                                                                <input
                                                                                    type="number"
                                                                                    step="0.1"
                                                                                    min="0.1"
                                                                                    value={editandoCriterioPeso}
                                                                                    onChange={e => setEditandoCriterioPeso(e.target.value)}
                                                                                    className={`w-24 ${inputClass}`}
                                                                                />
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => handleSalvarEdicaoCriterio(crit.id)}
                                                                                    className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg cursor-pointer"
                                                                                    title="Salvar"
                                                                                >
                                                                                    <Check className="w-4 h-4" />
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => setEditandoCriterioId(null)}
                                                                                    className="p-2 bg-slate-400 hover:bg-slate-500 text-white rounded-lg cursor-pointer"
                                                                                    title="Cancelar"
                                                                                >
                                                                                    <X className="w-4 h-4" />
                                                                                </button>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="flex items-center gap-3">
                                                                                <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">{crit.nome}</span>
                                                                                <span className="px-2.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                                                                                    Peso: {crit.peso}
                                                                                </span>
                                                                            </div>
                                                                        )}

                                                                        {editandoCriterioId !== crit.id && (
                                                                            <div className="flex items-center gap-1.5">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        setEditandoCriterioId(crit.id);
                                                                                        setEditandoCriterioNome(crit.nome);
                                                                                        setEditandoCriterioPeso(String(crit.peso));
                                                                                    }}
                                                                                    className="p-2 rounded-lg border border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                                                                                    title="Editar Critério"
                                                                                >
                                                                                    <Pencil className="w-3.5 h-3.5" />
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => handleRemoveCriterio(crit.id)}
                                                                                    className="p-2 rounded-lg border border-rose-500 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                                                                    title="Remover Critério"
                                                                                >
                                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Card 4: Avaliação Pré-Congresso (Todos os Resumos Submetidos) */}
                                                {todosTrabalhosEvento.length > 0 && (
                                                    <div className="rounded-2xl border border-slate-200 dark:border-blue-900/40 bg-white dark:bg-[#0c1e33] overflow-hidden shadow-sm">
                                                        <div className="bg-[#1e3a8a] text-white px-5 py-3.5 font-bold text-sm flex items-center justify-between gap-2">
                                                            <div className="flex items-center gap-2">
                                                                <FileCheck className="w-4 h-4 text-blue-200" />
                                                                <span>Resumos Submetidos — Avaliação Pré-Congresso ({todosTrabalhosEvento.length})</span>
                                                            </div>
                                                            <span className="text-[11px] font-medium text-blue-100">
                                                                Aceito (com nota), Aceito com ressalvas ou Recusado
                                                            </span>
                                                        </div>
                                                        <div className="p-5 overflow-x-auto">
                                                            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                                                                <thead className="bg-slate-50 dark:bg-[#071321] text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200 dark:border-blue-900/40">
                                                                    <tr>
                                                                        <th className="py-2.5 px-3">Título / Formato</th>
                                                                        <th className="py-2.5 px-3">Autor</th>
                                                                        <th className="py-2.5 px-3">Área</th>
                                                                        <th className="py-2.5 px-3">Avaliador(es)</th>
                                                                        <th className="py-2.5 px-3">Nota Pré</th>
                                                                        <th className="py-2.5 px-3">Status</th>
                                                                        <th className="py-2.5 px-3 text-right">Avaliar</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-slate-100 dark:divide-blue-900/30">
                                                                    {todosTrabalhosEvento.map(t => (
                                                                        <tr key={t.id} className="hover:bg-slate-50/60 dark:hover:bg-[#071321]/60">
                                                                            <td className="py-2.5 px-3 max-w-xs">
                                                                                <p className="font-bold text-slate-900 dark:text-white truncate">{t.titulo}</p>
                                                                                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                                                                                    {t.tipoResumo === "expandido" ? "Resumo Expandido" : "Resumo Simples"}
                                                                                    {t.reenviadoAposRessalva ? " • Reenviado após correção" : ""}
                                                                                </span>
                                                                            </td>
                                                                            <td className="py-2.5 px-3">{t.autorPrincipal || t.userEmail}</td>
                                                                            <td className="py-2.5 px-3">{t.areaAvaliacao || t.eixoTematico || "-"}</td>
                                                                            <td className="py-2.5 px-3">
                                                                                {Array.isArray(t.avaliadoresDesignadosNomes) && t.avaliadoresDesignadosNomes.length > 0
                                                                                    ? t.avaliadoresDesignadosNomes.join(", ")
                                                                                    : t.avaliadorNome || t.avaliadorEmail || "Aguardando"}
                                                                            </td>
                                                                            <td className="py-2.5 px-3 font-bold">
                                                                                {t.notaPreCongresso !== null && t.notaPreCongresso !== undefined
                                                                                    ? Number(t.notaPreCongresso).toFixed(1)
                                                                                    : "-"}
                                                                            </td>
                                                                            <td className="py-2.5 px-3">
                                                                                <span
                                                                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                                                        isTrabalhoAceito(t.status)
                                                                                            ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                                                                                            : (t.status || "").toLowerCase().includes("ressalva")
                                                                                              ? "bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300"
                                                                                              : (t.status || "").toLowerCase().includes("recusado") || (t.status || "").toLowerCase().includes("reprovado")
                                                                                                ? "bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300"
                                                                                                : "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300"
                                                                                    }`}
                                                                                >
                                                                                    {t.status || "Em análise"}
                                                                                </span>
                                                                            </td>
                                                                            <td className="py-2.5 px-3 text-right">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        setModalAvaliarPreAdmin(t);
                                                                                        setAdminDecisaoPre(
                                                                                            (t.status || "").toLowerCase().includes("ressalva")
                                                                                                ? "Aceito com ressalvas"
                                                                                                : (t.status || "").toLowerCase().includes("recusado")
                                                                                                  ? "Recusado"
                                                                                                  : "Aceito"
                                                                                        );
                                                                                        setAdminNotaPre(
                                                                                            t.notaPreCongresso !== null && t.notaPreCongresso !== undefined
                                                                                                ? String(t.notaPreCongresso)
                                                                                                : "9.0"
                                                                                        );
                                                                                        setAdminParecerPre(t.parecerAvaliador || "");
                                                                                    }}
                                                                                    className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold cursor-pointer"
                                                                                >
                                                                                    Parecer / Nota
                                                                                </button>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Card 5: Tabela de Resumos Aceitos + Definição de Oral ou Banner + Duas Listas */}
                                                <div className="rounded-2xl border border-slate-200 dark:border-blue-900/40 bg-white dark:bg-[#0c1e33] overflow-hidden shadow-sm">
                                                    <div className="bg-[#24292e] dark:bg-[#081524] text-white px-5 py-3.5 font-bold text-sm flex flex-wrap items-center justify-between gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <Users className="w-4 h-4 text-slate-200" />
                                                            <span>Tabela de Resumos Aceitos &amp; Distribuição para o Dia ({trabalhosAceitos.length})</span>
                                                        </div>
                                                        <span className="text-[11px] font-normal text-slate-300">
                                                            Defina quem será Oral ou Banner e clique em &quot;Salvar Configurações e Distribuir Trabalhos&quot;
                                                        </span>
                                                    </div>
                                                    <div className="p-6 space-y-6">
                                                        {trabalhosAceitos.length === 0 ? (
                                                            <div className="p-4 rounded-xl bg-sky-100/70 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/40 text-xs text-sky-900 dark:text-sky-200 flex items-center gap-2.5">
                                                                <Info className="w-4 h-4 text-sky-700 dark:text-sky-400 shrink-0" />
                                                                <span>Nenhum trabalho aceito encontrado para este evento. Os trabalhos precisam ter status &quot;aceito&quot; ou &quot;aprovado&quot;.</span>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                {/* Tabela Geral de Resumos Aceitos com Seletor Oral/Banner e Avaliação por Múltiplos Avaliadores */}
                                                                <div className="overflow-x-auto">
                                                                    <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                                                                        <thead className="bg-slate-50 dark:bg-[#071321] text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200 dark:border-blue-900/40">
                                                                            <tr>
                                                                                <th className="py-2.5 px-3">Título</th>
                                                                                <th className="py-2.5 px-3">Apresentador</th>
                                                                                <th className="py-2.5 px-3">Área</th>
                                                                                <th className="py-2.5 px-3">Modalidade (Oral / Banner)</th>
                                                                                <th className="py-2.5 px-3">Horário Distribuído</th>
                                                                                <th className="py-2.5 px-3">Avaliações no Dia</th>
                                                                                <th className="py-2.5 px-3">Apresentado?</th>
                                                                                <th className="py-2.5 px-3 text-right">Ações</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-slate-100 dark:divide-blue-900/30">
                                                                            {trabalhosAceitos.map(t => {
                                                                                const modAtual =
                                                                                    (t.modalidadeApresentacao || t.modalidade || "Banner") === "Oral"
                                                                                        ? "Oral"
                                                                                        : "Banner";
                                                                                const qtdAvsDia = Array.isArray(t.avaliacoesDia) ? t.avaliacoesDia.length : 0;
                                                                                return (
                                                                                    <tr key={t.id} className="hover:bg-slate-50/60 dark:hover:bg-[#071321]/60">
                                                                                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white max-w-xs truncate">
                                                                                            {t.titulo}
                                                                                        </td>
                                                                                        <td className="py-2.5 px-3">{t.autorPrincipal || t.userEmail}</td>
                                                                                        <td className="py-2.5 px-3">{t.areaAvaliacao || t.eixoTematico || "-"}</td>
                                                                                        <td className="py-2.5 px-3">
                                                                                            <div className="inline-flex rounded-lg border border-slate-200 dark:border-blue-900/50 overflow-hidden">
                                                                                                <button
                                                                                                    type="button"
                                                                                                    onClick={() => handleMudarModalidadeTrabalho(t.id, "Oral")}
                                                                                                    className={`px-2.5 py-1 text-[11px] font-bold transition-colors cursor-pointer ${
                                                                                                        modAtual === "Oral"
                                                                                                            ? "bg-[#1e3a8a] text-white"
                                                                                                            : "bg-white dark:bg-[#071321] text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                                                                                                    }`}
                                                                                                >
                                                                                                    Oral
                                                                                                </button>
                                                                                                <button
                                                                                                    type="button"
                                                                                                    onClick={() => handleMudarModalidadeTrabalho(t.id, "Banner")}
                                                                                                    className={`px-2.5 py-1 text-[11px] font-bold transition-colors cursor-pointer ${
                                                                                                        modAtual === "Banner"
                                                                                                            ? "bg-[#1e3a8a] text-white"
                                                                                                            : "bg-white dark:bg-[#071321] text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                                                                                                    }`}
                                                                                                >
                                                                                                    Banner
                                                                                                </button>
                                                                                            </div>
                                                                                        </td>
                                                                                        <td className="py-2.5 px-3">
                                                                                            {t.apresentacaoDiaLabel ? (
                                                                                                <div className="space-y-0.5">
                                                                                                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                                                                                                        {t.apresentacaoDiaLabel} • {t.apresentacaoHoraInicio} às {t.apresentacaoHoraFim}
                                                                                                    </span>
                                                                                                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block">
                                                                                                        {t.apresentacaoLocal ? `${t.apresentacaoLocal} • ` : ""}Sem choque com cursos
                                                                                                    </span>
                                                                                                </div>
                                                                                            ) : (
                                                                                                <span className="text-[11px] text-slate-400">
                                                                                                    Clique em Distribuir
                                                                                                </span>
                                                                                            )}
                                                                                        </td>
                                                                                        <td className="py-2.5 px-3">
                                                                                            {qtdAvsDia > 0 ? (
                                                                                                <div>
                                                                                                    <span className="font-bold text-blue-600 dark:text-blue-400">
                                                                                                        Média: {Number(t.notaDiaMedia).toFixed(2)}
                                                                                                    </span>
                                                                                                    <span className="text-[10px] text-slate-500 block">
                                                                                                        ({qtdAvsDia} {qtdAvsDia === 1 ? "avaliador" : "avaliadores"})
                                                                                                    </span>
                                                                                                </div>
                                                                                            ) : (
                                                                                                <span className="text-[11px] text-slate-400">Sem notas ainda</span>
                                                                                            )}
                                                                                        </td>
                                                                                        <td className="py-2.5 px-3">
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => handleToggleApresentadoEvento(t.id, Boolean(t.apresentadoNoEvento))}
                                                                                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                                                                                    t.apresentadoNoEvento
                                                                                                        ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300"
                                                                                                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700"
                                                                                                }`}
                                                                                            >
                                                                                                {t.apresentadoNoEvento ? "✓ Apresentado" : "Marcar Presença"}
                                                                                            </button>
                                                                                        </td>
                                                                                        <td className="py-2.5 px-3 text-right">
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => {
                                                                                                    setModalAvaliarDiaAdmin(t);
                                                                                                    setAdminAvaliadorNome("");
                                                                                                    setAdminNotaDia("9.5");
                                                                                                    setAdminObservacaoDia("");
                                                                                                }}
                                                                                                className="px-2.5 py-1 rounded-lg bg-[#1e3a8a] hover:bg-[#172e6e] text-white text-[11px] font-bold cursor-pointer"
                                                                                            >
                                                                                                + Nota Avaliador
                                                                                            </button>
                                                                                        </td>
                                                                                    </tr>
                                                                                );
                                                                            })}
                                                                        </tbody>
                                                                    </table>
                                                                </div>

                                                                {/* Duas Listas Separadas: Lista 1 (Apresentação Oral) e Lista 2 (Apresentação Banner) */}
                                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-blue-900/30">
                                                                    {/* Lista 1: Oral */}
                                                                    <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/30 dark:bg-[#071321]/60 space-y-3">
                                                                        <div className="flex items-center justify-between">
                                                                            <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
                                                                                <Mic className="w-4 h-4 text-blue-600" />
                                                                                <span>
                                                                                    Lista 1: Apresentação Oral (
                                                                                    {trabalhosAceitos.filter(t => (t.modalidadeApresentacao || t.modalidade) === "Oral").length}
                                                                                    )
                                                                                </span>
                                                                            </h4>
                                                                        </div>
                                                                        {trabalhosAceitos.filter(t => (t.modalidadeApresentacao || t.modalidade) === "Oral").length === 0 ? (
                                                                            <p className="text-xs text-slate-500">
                                                                                Nenhum trabalho marcado como Oral na tabela acima.
                                                                            </p>
                                                                        ) : (
                                                                            <div className="space-y-2">
                                                                                {trabalhosAceitos
                                                                                    .filter(t => (t.modalidadeApresentacao || t.modalidade) === "Oral")
                                                                                    .map((t, idx) => (
                                                                                        <div
                                                                                            key={t.id}
                                                                                            className="p-3 rounded-xl bg-white dark:bg-[#0c1e33] border border-slate-200 dark:border-blue-900/40 text-xs space-y-1"
                                                                                        >
                                                                                            <div className="flex items-center justify-between gap-2">
                                                                                                <span className="font-bold text-slate-900 dark:text-white truncate">
                                                                                                    {idx + 1}. {t.titulo}
                                                                                                </span>
                                                                                                <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold shrink-0">
                                                                                                    Oral
                                                                                                </span>
                                                                                            </div>
                                                                                            <p className="text-[11px] text-slate-500">
                                                                                                Apresentador: <strong>{t.autorPrincipal || t.userEmail}</strong> • Área: {t.areaAvaliacao || t.eixoTematico || "-"}
                                                                                            </p>
                                                                                            {t.apresentacaoDiaLabel ? (
                                                                                                <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                                                                                                    📅 {t.apresentacaoDiaLabel} das {t.apresentacaoHoraInicio} às {t.apresentacaoHoraFim}
                                                                                                    {t.apresentacaoLocal ? ` • Local: ${t.apresentacaoLocal}` : ""} (Sem choque de curso)
                                                                                                </p>
                                                                                            ) : (
                                                                                                <p className="text-[11px] text-amber-600">
                                                                                                    Aguardando distribuição nos períodos configurados
                                                                                                </p>
                                                                                            )}
                                                                                        </div>
                                                                                    ))}
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {/* Lista 2: Banner */}
                                                                    <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/30 dark:bg-[#071321]/60 space-y-3">
                                                                        <div className="flex items-center justify-between">
                                                                            <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
                                                                                <Presentation className="w-4 h-4 text-indigo-600" />
                                                                                <span>
                                                                                    Lista 2: Apresentação em Banner (
                                                                                    {trabalhosAceitos.filter(t => (t.modalidadeApresentacao || t.modalidade || "Banner") !== "Oral").length}
                                                                                    )
                                                                                </span>
                                                                            </h4>
                                                                        </div>
                                                                        {trabalhosAceitos.filter(t => (t.modalidadeApresentacao || t.modalidade || "Banner") !== "Oral").length === 0 ? (
                                                                            <p className="text-xs text-slate-500">
                                                                                Nenhum trabalho marcado como Banner na tabela acima.
                                                                            </p>
                                                                        ) : (
                                                                            <div className="space-y-2">
                                                                                {trabalhosAceitos
                                                                                    .filter(t => (t.modalidadeApresentacao || t.modalidade || "Banner") !== "Oral")
                                                                                    .map((t, idx) => (
                                                                                        <div
                                                                                            key={t.id}
                                                                                            className="p-3 rounded-xl bg-white dark:bg-[#0c1e33] border border-slate-200 dark:border-blue-900/40 text-xs space-y-1"
                                                                                        >
                                                                                            <div className="flex items-center justify-between gap-2">
                                                                                                <span className="font-bold text-slate-900 dark:text-white truncate">
                                                                                                    {idx + 1}. {t.titulo}
                                                                                                </span>
                                                                                                <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold shrink-0">
                                                                                                    Banner
                                                                                                </span>
                                                                                            </div>
                                                                                            <p className="text-[11px] text-slate-500">
                                                                                                Apresentador: <strong>{t.autorPrincipal || t.userEmail}</strong> • Área: {t.areaAvaliacao || t.eixoTematico || "-"}
                                                                                            </p>
                                                                                            {t.apresentacaoDiaLabel ? (
                                                                                                <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                                                                                                    📅 {t.apresentacaoDiaLabel} das {t.apresentacaoHoraInicio} às {t.apresentacaoHoraFim}
                                                                                                    {t.apresentacaoLocal ? ` • Local: ${t.apresentacaoLocal}` : ""} (Sem choque de curso)
                                                                                                </p>
                                                                                            ) : (
                                                                                                <p className="text-[11px] text-amber-600">
                                                                                                    Aguardando distribuição nos períodos configurados
                                                                                                </p>
                                                                                            )}
                                                                                        </div>
                                                                                    ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Card 6: Tabela com Ranking de Notas em Ordem Decrescente */}
                                                <div className="rounded-2xl border border-slate-200 dark:border-blue-900/40 bg-white dark:bg-[#0c1e33] overflow-hidden shadow-sm">
                                                    <div className="bg-gradient-to-r from-[#1e3a8a] to-indigo-900 text-white px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                        <div className="flex items-center gap-2.5">
                                                            <Trophy className="w-5 h-5 text-amber-300 shrink-0" />
                                                            <div>
                                                                <h3 className="font-bold text-sm sm:text-base">
                                                                    Ranking de Notas por Ordem Decrescente
                                                                </h3>
                                                                <p className="text-[11px] text-blue-100/90">
                                                                    As maiores notas ficam no topo. Você pode incluir ou combinar a nota da avaliação pré-congresso.
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Opção para usar também a nota da avaliação pré-congresso */}
                                                        <div className="flex items-center gap-2">
                                                            <label className="text-[11px] font-semibold text-blue-100 whitespace-nowrap">
                                                                Composição da Nota:
                                                            </label>
                                                            <select
                                                                value={modoCalculoRanking}
                                                                onChange={e => {
                                                                    const novoModo = e.target.value as any;
                                                                    setModoCalculoRanking(novoModo);
                                                                    void sincronizarSubmissaoFirestore({ modoRankingOverride: novoModo });
                                                                }}
                                                                className="px-3 py-1.5 rounded-xl bg-white/15 text-white border border-white/25 text-xs font-bold outline-none cursor-pointer"
                                                            >
                                                                <option value="media_pre_e_apresentacao" className="text-slate-900">
                                                                    Média (Pré-Congresso + Apresentação)
                                                                </option>
                                                                <option value="soma_pre_e_apresentacao" className="text-slate-900">
                                                                    Soma (Pré-Congresso + Apresentação)
                                                                </option>
                                                                <option value="apenas_apresentacao" className="text-slate-900">
                                                                    Apenas Nota da Apresentação no Dia
                                                                </option>
                                                                <option value="apenas_pre_congresso" className="text-slate-900">
                                                                    Apenas Nota Pré-Congresso
                                                                </option>
                                                            </select>
                                                        </div>
                                                    </div>

                                                    <div className="p-6">
                                                        {trabalhosAceitos.length === 0 ? (
                                                            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#071321]/50 border border-dashed border-slate-200 dark:border-blue-900/40 text-xs text-slate-500">
                                                                O ranking de notas será exibido automaticamente assim que houver trabalhos aceitos e avaliados.
                                                            </div>
                                                        ) : (
                                                            <div className="overflow-x-auto">
                                                                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                                                                    <thead className="bg-slate-50 dark:bg-[#071321] text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200 dark:border-blue-900/40">
                                                                        <tr>
                                                                            <th className="py-2.5 px-3">Posição</th>
                                                                            <th className="py-2.5 px-3">Trabalho</th>
                                                                            <th className="py-2.5 px-3">Autor</th>
                                                                            <th className="py-2.5 px-3">Modalidade</th>
                                                                            <th className="py-2.5 px-3">Nota Pré-Congresso</th>
                                                                            <th className="py-2.5 px-3">Média do Dia (Múltiplos Avaliadores)</th>
                                                                            <th className="py-2.5 px-3">Nota Final (Ranking)</th>
                                                                            <th className="py-2.5 px-3">Status nos Anais</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-slate-100 dark:divide-blue-900/30">
                                                                        {[...trabalhosAceitos]
                                                                            .map(t => ({
                                                                                ...t,
                                                                                notaCalculada: calcularNotaRanking(t, modoCalculoRanking),
                                                                            }))
                                                                            .sort((a, b) => b.notaCalculada - a.notaCalculada)
                                                                            .map((t, index) => {
                                                                                const vaiParaAnais =
                                                                                    regraPublicacaoAnais === "todos_aprovados"
                                                                                        ? true
                                                                                        : Boolean(t.apresentadoNoEvento);
                                                                                return (
                                                                                    <tr key={t.id} className="hover:bg-slate-50/60 dark:hover:bg-[#071321]/60">
                                                                                        <td className="py-2.5 px-3 font-extrabold text-slate-900 dark:text-white">
                                                                                            <span
                                                                                                className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] ${
                                                                                                    index === 0
                                                                                                        ? "bg-amber-400/20 text-amber-700 dark:text-amber-300 border border-amber-400/40"
                                                                                                        : index === 1
                                                                                                          ? "bg-slate-300/30 text-slate-700 dark:text-slate-200 border border-slate-400/40"
                                                                                                          : index === 2
                                                                                                            ? "bg-orange-400/20 text-orange-700 dark:text-orange-300 border border-orange-400/40"
                                                                                                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                                                                                }`}
                                                                                            >
                                                                                                {index + 1}º
                                                                                            </span>
                                                                                        </td>
                                                                                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white max-w-xs truncate">
                                                                                            {t.titulo}
                                                                                        </td>
                                                                                        <td className="py-2.5 px-3">{t.autorPrincipal || t.userEmail}</td>
                                                                                        <td className="py-2.5 px-3">
                                                                                            {t.modalidadeApresentacao || t.modalidade || "Banner"}
                                                                                        </td>
                                                                                        <td className="py-2.5 px-3 font-semibold">
                                                                                            {t.notaPreCongresso !== null && t.notaPreCongresso !== undefined
                                                                                                ? Number(t.notaPreCongresso).toFixed(2)
                                                                                                : "-"}
                                                                                        </td>
                                                                                        <td className="py-2.5 px-3 font-semibold">
                                                                                            {t.notaDiaMedia !== null && t.notaDiaMedia !== undefined
                                                                                                ? `${Number(t.notaDiaMedia).toFixed(2)} (${Array.isArray(t.avaliacoesDia) ? t.avaliacoesDia.length : 1} av.)`
                                                                                                : "-"}
                                                                                        </td>
                                                                                        <td className="py-2.5 px-3">
                                                                                            <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-extrabold text-xs">
                                                                                                {t.notaCalculada.toFixed(2)}
                                                                                            </span>
                                                                                        </td>
                                                                                        <td className="py-2.5 px-3">
                                                                                            {vaiParaAnais ? (
                                                                                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                                                                                                    Publicado nos Anais
                                                                                                </span>
                                                                                            ) : (
                                                                                                <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                                                                                                    Aguardando Apresentação
                                                                                                </span>
                                                                                            )}
                                                                                        </td>
                                                                                    </tr>
                                                                                );
                                                                            })}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Modal de Avaliação Pré-Congresso pelo Admin */}
                                                {modalAvaliarPreAdmin && (
                                                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                                                        <div className="bg-white dark:bg-[#0c1e33] rounded-2xl max-w-lg w-full p-5 sm:p-6 border border-slate-200 dark:border-blue-900/50 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                                                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-blue-900/40 pb-3">
                                                                <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                                                                    Avaliação Pré-Congresso do Resumo
                                                                </h4>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setModalAvaliarPreAdmin(null)}
                                                                    className="p-1 text-slate-400 hover:text-slate-600"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </div>

                                                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#071321] border border-slate-200 dark:border-blue-900/40 text-xs space-y-1 max-h-40 overflow-y-auto">
                                                                <p className="font-bold text-slate-900 dark:text-white">{modalAvaliarPreAdmin.titulo}</p>
                                                                <p className="text-slate-500 whitespace-pre-wrap">{modalAvaliarPreAdmin.resumo || "Sem texto de resumo."}</p>
                                                            </div>

                                                            <div className="space-y-2">
                                                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                                                                    Decisão da Avaliação (3 opções):
                                                                </label>
                                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                                    {(["Aceito", "Aceito com ressalvas", "Recusado"] as const).map(op => (
                                                                        <button
                                                                            key={op}
                                                                            type="button"
                                                                            onClick={() => setAdminDecisaoPre(op)}
                                                                            className={`py-2 px-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                                                                                adminDecisaoPre === op
                                                                                    ? "bg-[#1e3a8a] text-white border-[#1e3a8a]"
                                                                                    : "bg-white dark:bg-[#071321] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-blue-900/50"
                                                                            }`}
                                                                        >
                                                                            {op}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                                {adminDecisaoPre === "Aceito com ressalvas" && (
                                                                    <p className="text-[11px] text-indigo-600 dark:text-indigo-400">
                                                                        O resumo voltará para o autor corrigir e, ao ser reenviado, retornará automaticamente para o mesmo avaliador.
                                                                    </p>
                                                                )}
                                                            </div>

                                                            {adminDecisaoPre === "Aceito" && (
                                                                <div className="space-y-1">
                                                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                                                                        Nota da Avaliação Pré-Congresso (0 a 10 — opcional):
                                                                    </label>
                                                                    <input
                                                                        type="number"
                                                                        step="0.1"
                                                                        min="0"
                                                                        max="10"
                                                                        value={adminNotaPre}
                                                                        onChange={e => setAdminNotaPre(e.target.value)}
                                                                        className={inputClass}
                                                                    />
                                                                </div>
                                                            )}

                                                            <div className="space-y-1">
                                                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                                                                    Parecer / Observações para o Autor:
                                                                </label>
                                                                <textarea
                                                                    rows={3}
                                                                    value={adminParecerPre}
                                                                    onChange={e => setAdminParecerPre(e.target.value)}
                                                                    placeholder="Digite o parecer ou as correções solicitadas..."
                                                                    className={inputClass}
                                                                />
                                                            </div>

                                                            <div className="flex justify-end gap-2 pt-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setModalAvaliarPreAdmin(null)}
                                                                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                                                                >
                                                                    Cancelar
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={handleSalvarPreCongressoAdmin}
                                                                    disabled={salvandoPreAdmin}
                                                                    className="px-4 py-2 rounded-xl bg-[#1e3a8a] hover:bg-[#172e6e] text-white text-xs font-bold cursor-pointer"
                                                                >
                                                                    {salvandoPreAdmin ? "Salvando..." : "Salvar Avaliação"}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Modal para Adicionar Avaliação no Dia (Múltiplos Avaliadores) */}
                                                {modalAvaliarDiaAdmin && (
                                                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                                                        <div className="bg-white dark:bg-[#0c1e33] rounded-2xl max-w-lg w-full p-5 sm:p-6 border border-slate-200 dark:border-blue-900/50 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                                                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-blue-900/40 pb-3">
                                                                <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                                                                    Lançar Nota de Apresentação (Múltiplos Avaliadores)
                                                                </h4>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setModalAvaliarDiaAdmin(null)}
                                                                    className="p-1 text-slate-400 hover:text-slate-600"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </div>

                                                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                                                Trabalho: {modalAvaliarDiaAdmin.titulo}
                                                            </p>

                                                            {Array.isArray(modalAvaliarDiaAdmin.avaliacoesDia) && modalAvaliarDiaAdmin.avaliacoesDia.length > 0 && (
                                                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#071321] border border-slate-200 dark:border-blue-900/40 space-y-1.5 text-xs">
                                                                    <span className="font-bold text-slate-700 dark:text-slate-300 block">
                                                                        Avaliações já registradas neste trabalho:
                                                                    </span>
                                                                    {modalAvaliarDiaAdmin.avaliacoesDia.map((av: AvaliacaoDiaEvento, i: number) => (
                                                                        <div key={i} className="flex items-center justify-between text-[11px]">
                                                                            <span>{av.avaliadorNome}</span>
                                                                            <span className="font-bold text-blue-600">Nota: {Number(av.notaFinal).toFixed(2)}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                <div>
                                                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                                                                        Nome do Avaliador
                                                                    </label>
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Ex: Prof. Avaliador 1"
                                                                        value={adminAvaliadorNome}
                                                                        onChange={e => setAdminAvaliadorNome(e.target.value)}
                                                                        className={inputClass}
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                                                                        Nota da Apresentação (Máx: {notaMaximaOral || 10})
                                                                    </label>
                                                                    <input
                                                                        type="number"
                                                                        step="0.1"
                                                                        min="0"
                                                                        max={Number(notaMaximaOral) || 10}
                                                                        value={adminNotaDia}
                                                                        onChange={e => setAdminNotaDia(e.target.value)}
                                                                        className={inputClass}
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                                                                    Observação (Opcional)
                                                                </label>
                                                                <textarea
                                                                    rows={2}
                                                                    value={adminObservacaoDia}
                                                                    onChange={e => setAdminObservacaoDia(e.target.value)}
                                                                    className={inputClass}
                                                                />
                                                            </div>

                                                            <div className="flex justify-end gap-2 pt-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setModalAvaliarDiaAdmin(null)}
                                                                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                                                                >
                                                                    Cancelar
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={handleSalvarNotaDiaAdmin}
                                                                    disabled={salvandoNotaDiaAdmin}
                                                                    className="px-4 py-2 rounded-xl bg-[#1e3a8a] hover:bg-[#172e6e] text-white text-xs font-bold cursor-pointer"
                                                                >
                                                                    {salvandoNotaDiaAdmin ? "Salvando..." : "Adicionar Avaliação"}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                    </div>

                    {/* Rodapé de Navegação / Ações */}
                    <div className="bg-slate-50/90 dark:bg-[#071321]/80 border-t border-slate-200 dark:border-blue-900/40 px-4 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-3">
                        <button
                            type="button"
                            onClick={() => goToTab(currentTabIndex - 1)}
                            disabled={isFirstTab}
                            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${!isFirstTab
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
                                {isEditing ? "Salvar Alterações" : "Publicar Evento"}
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleAvancarEtapa}
                                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20 hover:shadow-blue-600/30 transition-all cursor-pointer"
                            >
                                Próxima Etapa
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                </div>
            </div>

            {/* Modal de Validação Obrigatória de Seção / "Não se aplica" */}
            {modalPendencia && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#0c1e33] border border-slate-200 dark:border-blue-900/60 rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                        <div className="flex items-start gap-3.5">
                            <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200/80 dark:border-blue-900/50 shadow-xs">
                                <AlertCircle className="w-5 h-5 stroke-[2.2]" />
                            </div>
                            <div className="space-y-1 flex-1">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                                    {modalPendencia.subtitulo}
                                </span>
                                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                                    {modalPendencia.titulo}
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed pt-0.5">
                                    {modalPendencia.descricao}
                                </p>
                            </div>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#071321]/70 border border-slate-200/80 dark:border-blue-900/30 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                            Para evitar que o evento seja publicado com informações incompletas por descuido, é necessário <strong>preencher os dados</strong> ou <strong>ativar a opção &quot;Não se aplica&quot;</strong> caso este recurso não seja utilizado.
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-1">
                            <button
                                type="button"
                                onClick={() => setModalPendencia(null)}
                                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-blue-900/50 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#071321] text-xs sm:text-sm font-semibold transition-all cursor-pointer"
                            >
                                Vou Preencher os Dados
                            </button>
                            {modalPendencia.temNaoSeAplica && (
                                <button
                                    type="button"
                                    onClick={() => handleHabilitarNaoSeAplica(modalPendencia.secaoKey, false)}
                                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                    <Check className="w-4 h-4" />
                                    Habilitar &quot;Não se aplica&quot;
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

export default function CreateEventPage() {
    return (
        <Suspense fallback={
            <main className="min-h-[calc(100vh-73px)] bg-[#fafafa] dark:bg-[#0a1929] flex items-center justify-center p-4">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </main>
        }>
            <CreateEventContent />
        </Suspense>
    );
}