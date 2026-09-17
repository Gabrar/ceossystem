"use client";

import { useState } from "react";
import { Info, MapPin, AlignLeft, Users, Save, Loader2, Calendar, Ticket, ShieldAlert, ImagePlus, Trash2, Plus, Map, MessageSquare, BookOpen, Landmark, Upload, X } from "lucide-react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function CreateEventPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("basicas");
    const [isLoading, setIsLoading] = useState(false);

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
    const [lotes, setLotes] = useState([{ id: Date.now(), perfil: "aluno", loteNumero: "1", preco: "", quantidade: "", codigoDesconto: "", valorPromocional: "", dataInicio: "", dataFim: "" }]);

    // 5. Detalhes
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
    const [palestrantes, setPalestrantes] = useState([{ id: Date.now(), foto: null as File | null, fotoPreview: "", nome: "", email: "", especialidade: "", instituicao: "", telefone: "", bio: "" }]);

    // 8. Minicursos
    const [minicursosNaoSeAplica, setMinicursosNaoSeAplica] = useState(false);
    const [minicursos, setMinicursos] = useState([{
        id: Date.now(), nome: "", tipo: "Teórico", imagem: null as File | null, imagemPreview: "", local: "", descricao: "",
        ministrantes: [{ id: Date.now(), nome: "", email: "" }],
        dias: [{ id: Date.now(), data: "", horaInicio: "", horaFim: "" }],
        ingressos: [{ id: Date.now(), perfil: "aluno", loteNumero: "1", preco: "", quantidade: "", codigoDesconto: "", valorPromocional: "", dataInicio: "", dataFim: "" }]
    }]);

    // 9. Administradores
    const [adminsNaoSeAplica, setAdminsNaoSeAplica] = useState(false);
    const [administradores, setAdministradores] = useState([{ 
        id: Date.now(), nome: "", email: "", telefone: "", telefoneAlt: "", senha: "", repeteSenha: "", 
        permissoes: { todas: false, site: false, inscricoes: false, minicursos: false, trabalhos: false, programacao: false, credenciamento: false, certificados: false, anais: false, financeiro: false, palestras: false } 
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
        { id: "basicas", label: "Básicas", icon: Info },
        { id: "datas", label: "Datas", icon: Calendar },
        { id: "local", label: "Local", icon: MapPin },
        { id: "ingressos", label: "Ingressos", icon: Ticket },
        { id: "detalhes", label: "Detalhes", icon: AlignLeft },
        { id: "mensagens", label: "Mensagens", icon: MessageSquare },
        { id: "palestrantes", label: "Palestrantes", icon: Users },
        { id: "minicursos", label: "Minicursos", icon: BookOpen },
        { id: "equipe", label: "Equipe", icon: ShieldAlert },
        { id: "patrocinios", label: "Patrocínios", icon: ImagePlus },
        { id: "financeiro", label: "Financeiro", icon: Landmark },
    ];

    // --- Helpers Genéricos ---
    const updateArray = (setter: any, array: any[], id: number, field: string, value: any) => {
        setter(array.map(item => item.id === id ? { ...item, [field]: value } : item));
    };
    const removeArray = (setter: any, array: any[], id: number) => {
        setter(array.filter(item => item.id !== id));
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
        if (!nomeEvento) return alert("Preencha ao menos o nome do evento.");

        setIsLoading(true);
        try {
            // Upload helper
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
                title: nomeEvento, category: categoria, status: "Em Breve", img: publicUrl,
                modalidade, capacidade, dateInicio: dataInicio, dateFim: dataFim, horaInicio, horaFim, workload: cargaHoraria,
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
                createdAt: new Date().toISOString()
            };

            await addDoc(collection(db, "events"), novoEvento);
            alert("Evento publicado com sucesso!");
            router.push("/eventos");
        } catch (error) {
            console.error("Erro ao salvar:", error);
            alert("Erro ao salvar o evento.");
        } finally {
            setIsLoading(false);
        }
    };

    const NaoSeAplicaToggle = ({ label, state, setState }: any) => (
        <label className="flex items-center gap-2 cursor-pointer mb-4 p-3 bg-slate-100 dark:bg-[#0c1e33] rounded-lg border border-slate-200 dark:border-blue-900/40 w-fit">
            <input type="checkbox" checked={state} onChange={(e) => setState(e.target.checked)} className="w-4 h-4 rounded text-blue-600" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</span>
        </label>
    );

    return (
        <main className="min-h-[calc(100vh-73px)] bg-[#fafafa] dark:bg-[#0a1929] py-8 px-4 sm:px-6 lg:px-8 flex justify-center">
            <div className="max-w-6xl w-full space-y-6">
                
                <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <h1 className="font-montserrat text-3xl font-extrabold text-slate-900 dark:text-white">Criar <span className="text-blue-600">Evento</span></h1>
                    </div>
                    <button onClick={handleSaveEvent} disabled={isLoading} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold">
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {isLoading ? "Publicando..." : "Publicar Evento"}
                    </button>
                </header>

                <div className="bg-white dark:bg-[#0c1e33]/90 rounded-3xl border border-slate-200 dark:border-blue-900/40 overflow-hidden flex flex-col">
                    
                    <div className="w-full bg-slate-50 dark:bg-[#071321]/50 border-b border-slate-200 dark:border-blue-900/40 p-4 shrink-0">
                        <nav className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border ${isActive ? "bg-white dark:bg-[#0c1e33] border-blue-200 shadow-sm" : "border-transparent hover:bg-white/60"}`}>
                                        <Icon className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-slate-500"}`} />
                                        <span className={`text-sm font-semibold ${isActive ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-300"}`}>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="p-5 sm:p-8">
                        
                        {/* Básicas */}
                        {activeTab === "basicas" && (
                            <div className="space-y-6 animate-in fade-in">
                                <h2 className="text-lg font-bold border-b pb-3 flex items-center gap-2"><Info className="w-5 h-5 text-blue-500"/> Básicas</h2>
                                <div className="space-y-1.5"><label className="text-xs font-semibold">Nome do Evento</label><input type="text" value={nomeEvento} onChange={e=>setNomeEvento(e.target.value)} className="w-full p-3 rounded-xl border dark:bg-[#071321]/70 dark:border-blue-900/50" /></div>
                                <div className="grid grid-cols-3 gap-5">
                                    <div className="space-y-1.5"><label className="text-xs font-semibold">Modalidade</label><select value={modalidade} onChange={e=>setModalidade(e.target.value)} className="w-full p-3 rounded-xl border dark:bg-[#071321]/70"><option>Presencial</option><option>Online</option><option>Híbrido</option></select></div>
                                    <div className="space-y-1.5"><label className="text-xs font-semibold">Categoria</label>
                                        <select value={categoria} onChange={e=>setCategoria(e.target.value)} className="w-full p-3 rounded-xl border dark:bg-[#071321]/70">
                                            <option value="Congresso">Congresso</option>
                                            <option value="Simpósio">Simpósio</option>
                                            <option value="Workshop">Workshop</option>
                                            <option value="Seminário">Seminário</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5"><label className="text-xs font-semibold">Capacidade</label><input type="number" value={capacidade} onChange={e=>setCapacidade(e.target.value)} className="w-full p-3 rounded-xl border dark:bg-[#071321]/70" /></div>
                                </div>
                                <div className="space-y-1.5"><label className="text-xs font-semibold">Imagem de Capa</label><input id="capaInput" type="file" onChange={handleImageChange} className="w-full p-2 border rounded-xl dark:bg-[#071321]/70" />
                                {imagePreview && (
                                    <div className="relative mt-2 w-fit">
                                        <img src={imagePreview} className="h-32 rounded-lg object-cover" />
                                        <button onClick={() => { setImageFile(null); setImagePreview(""); (document.getElementById('capaInput') as HTMLInputElement).value = ''; }} className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md transition-colors"><X className="w-4 h-4"/></button>
                                    </div>
                                )}</div>
                            </div>
                        )}

                        {/* Datas */}
                        {activeTab === "datas" && (
                            <div className="space-y-6 animate-in fade-in">
                                <h2 className="text-lg font-bold border-b pb-3 flex items-center gap-2"><Calendar className="w-5 h-5 text-blue-500"/> Datas</h2>
                                <div className="grid grid-cols-2 gap-5">
                                    <div className="space-y-1.5"><label className="text-xs font-semibold">Data Início</label><input type="date" value={dataInicio} onChange={e=>setDataInicio(e.target.value)} className="w-full p-3 rounded-xl border dark:bg-[#071321]/70" /></div>
                                    <div className="space-y-1.5"><label className="text-xs font-semibold">Data Fim</label><input type="date" value={dataFim} onChange={e=>setDataFim(e.target.value)} className="w-full p-3 rounded-xl border dark:bg-[#071321]/70" /></div>
                                    <div className="space-y-1.5"><label className="text-xs font-semibold">Hora Início</label><input type="time" value={horaInicio} onChange={e=>setHoraInicio(e.target.value)} className="w-full p-3 rounded-xl border dark:bg-[#071321]/70" /></div>
                                    <div className="space-y-1.5"><label className="text-xs font-semibold">Hora Fim</label><input type="time" value={horaFim} onChange={e=>setHoraFim(e.target.value)} className="w-full p-3 rounded-xl border dark:bg-[#071321]/70" /></div>
                                    <div className="space-y-1.5"><label className="text-xs font-semibold">Carga Horária</label><input type="number" value={cargaHoraria} onChange={e=>setCargaHoraria(e.target.value)} className="w-full p-3 rounded-xl border dark:bg-[#071321]/70" /></div>
                                </div>
                            </div>
                        )}

                        {/* Local */}
                        {activeTab === "local" && (
                            <div className="space-y-6 animate-in fade-in">
                                <h2 className="text-lg font-bold border-b pb-3 flex items-center gap-2"><MapPin className="w-5 h-5 text-blue-500"/> Local</h2>
                                <NaoSeAplicaToggle label="Não se aplica" state={localNaoSeAplica} setState={setLocalNaoSeAplica} />
                                {!localNaoSeAplica && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="text-xs font-semibold">CEP</label><input type="text" value={cep} onChange={e=>setCep(e.target.value)} className="w-full p-2 border rounded-lg" /></div>
                                        <div><label className="text-xs font-semibold">Endereço</label><input type="text" value={endereco} onChange={e=>setEndereco(e.target.value)} className="w-full p-2 border rounded-lg" /></div>
                                        <div><label className="text-xs font-semibold">Bairro</label><input type="text" value={bairro} onChange={e=>setBairro(e.target.value)} className="w-full p-2 border rounded-lg" /></div>
                                        <div><label className="text-xs font-semibold">Cidade</label><input type="text" value={cidade} onChange={e=>setCidade(e.target.value)} className="w-full p-2 border rounded-lg" /></div>
                                        <div><label className="text-xs font-semibold">Nome do Local</label><input type="text" value={nomeLocal} onChange={e=>setNomeLocal(e.target.value)} className="w-full p-2 border rounded-lg" /></div>
                                        <div className="col-span-2 h-40 bg-slate-200 dark:bg-slate-800 rounded-xl flex items-center justify-center">Mapa Placeholder</div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Ingressos */}
                        {activeTab === "ingressos" && (
                            <div className="space-y-6 animate-in fade-in">
                                <h2 className="text-lg font-bold border-b pb-3 flex items-center gap-2"><Ticket className="w-5 h-5 text-blue-500"/> Ingressos</h2>
                                <NaoSeAplicaToggle label="Não se aplica" state={ingressosNaoSeAplica} setState={setIngressosNaoSeAplica} />
                                {!ingressosNaoSeAplica && (
                                    <div className="space-y-4">
                                        {lotes.map(lote => (
                                            <div key={lote.id} className="p-4 border rounded-xl grid grid-cols-4 gap-4 relative bg-slate-50 dark:bg-[#071321]/50">
                                                {lotes.length>1 && <button onClick={()=>removeArray(setLotes, lotes, lote.id)} className="absolute top-2 right-2 text-red-500"><Trash2 className="w-4 h-4"/></button>}
                                                <div><label className="text-xs">Perfil</label><select value={lote.perfil} onChange={e=>updateArray(setLotes, lotes, lote.id, 'perfil', e.target.value)} className="w-full p-2 border rounded-lg"><option value="aluno">Aluno</option><option value="aluno-pos">Aluno Pós</option><option value="professor">Professor</option><option value="profissional">Profissional</option><option value="outros">Outros</option></select></div>
                                                <div><label className="text-xs">Lote N</label><input type="text" value={lote.loteNumero} onChange={e=>updateArray(setLotes, lotes, lote.id, 'loteNumero', e.target.value)} className="w-full p-2 border rounded-lg" /></div>
                                                <div><label className="text-xs">Preço</label><input type="text" value={lote.preco} onChange={e=>updateArray(setLotes, lotes, lote.id, 'preco', e.target.value)} className="w-full p-2 border rounded-lg" /></div>
                                                <div><label className="text-xs">Qtd</label><input type="text" value={lote.quantidade} onChange={e=>updateArray(setLotes, lotes, lote.id, 'quantidade', e.target.value)} className="w-full p-2 border rounded-lg" /></div>
                                            </div>
                                        ))}
                                        <button onClick={()=>setLotes([...lotes, { id: Date.now(), perfil: "aluno", loteNumero: "", preco: "", quantidade: "", codigoDesconto: "", valorPromocional: "", dataInicio: "", dataFim: "" }])} className="w-full py-2 bg-blue-100 text-blue-600 rounded-lg">Adicionar Lote</button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Detalhes */}
                        {activeTab === "detalhes" && (
                            <div className="space-y-6 animate-in fade-in">
                                <h2 className="text-lg font-bold border-b pb-3 flex items-center gap-2"><AlignLeft className="w-5 h-5 text-blue-500"/> Detalhes</h2>
                                <NaoSeAplicaToggle label="Não se aplica" state={descricaoNaoSeAplica} setState={setDescricaoNaoSeAplica} />
                                {!descricaoNaoSeAplica && (
                                    <div className="space-y-4">
                                        <textarea rows={5} value={descricao} onChange={e=>setDescricao(e.target.value)} className="w-full p-3 border rounded-xl" placeholder="Descrição completa..." />
                                        <div className="grid grid-cols-3 gap-4">
                                            <input type="text" placeholder="Instagram" value={instagram} onChange={e=>setInstagram(e.target.value)} className="p-3 border rounded-xl" />
                                            <input type="text" placeholder="LinkedIn" value={linkedin} onChange={e=>setLinkedin(e.target.value)} className="p-3 border rounded-xl" />
                                            <input type="text" placeholder="Facebook" value={facebook} onChange={e=>setFacebook(e.target.value)} className="p-3 border rounded-xl" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Mensagens */}
                        {activeTab === "mensagens" && (
                            <div className="space-y-6 animate-in fade-in">
                                <h2 className="text-lg font-bold border-b pb-3 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-blue-500"/> Mensagens (Carrossel)</h2>
                                <NaoSeAplicaToggle label="Não se aplica" state={mensagensNaoSeAplica} setState={setMensagensNaoSeAplica} />
                                {!mensagensNaoSeAplica && (
                                    <div className="space-y-4">
                                        {mensagens.map(m => (
                                            <div key={m.id} className="relative">
                                                <textarea value={m.texto} onChange={e=>updateArray(setMensagens, mensagens, m.id, 'texto', e.target.value)} className="w-full p-3 border rounded-xl" placeholder="Digite uma mensagem..." />
                                                {mensagens.length>1 && <button onClick={()=>removeArray(setMensagens, mensagens, m.id)} className="absolute top-2 right-2 text-red-500"><Trash2 className="w-4 h-4"/></button>}
                                            </div>
                                        ))}
                                        <button onClick={()=>setMensagens([...mensagens, {id: Date.now(), texto: ""}])} className="w-full py-2 bg-blue-100 text-blue-600 rounded-lg">Adicionar Mensagem</button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Palestrantes */}
                        {activeTab === "palestrantes" && (
                            <div className="space-y-6 animate-in fade-in">
                                <h2 className="text-lg font-bold border-b pb-3 flex items-center gap-2"><Users className="w-5 h-5 text-blue-500"/> Palestrantes</h2>
                                <NaoSeAplicaToggle label="Não se aplica" state={palestrantesNaoSeAplica} setState={setPalestrantesNaoSeAplica} />
                                {!palestrantesNaoSeAplica && (
                                    <div className="space-y-4">
                                        {palestrantes.map(p => (
                                            <div key={p.id} className="p-4 border rounded-xl bg-slate-50 dark:bg-[#071321]/50 relative space-y-4">
                                                {palestrantes.length>1 && <button onClick={()=>removeArray(setPalestrantes, palestrantes, p.id)} className="absolute top-2 right-2 text-red-500"><Trash2 className="w-4 h-4"/></button>}
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div><label className="text-xs">Foto</label>
                                                        <div className="flex items-center gap-2">
                                                            <input id={`foto-${p.id}`} type="file" accept="image/*" onChange={e=>{
                                                                const f = e.target.files?.[0];
                                                                if(f) updateArray(setPalestrantes, palestrantes, p.id, 'foto', f);
                                                            }} className="w-full p-2 border rounded-lg" />
                                                            {p.foto && <button onClick={()=>{ updateArray(setPalestrantes, palestrantes, p.id, 'foto', null); (document.getElementById(`foto-${p.id}`) as HTMLInputElement).value = ''; }} className="text-red-500 p-2 hover:bg-red-50 rounded-lg"><X className="w-4 h-4"/></button>}
                                                        </div>
                                                    </div>
                                                    <div><label className="text-xs">Nome</label><input type="text" value={p.nome} onChange={e=>updateArray(setPalestrantes, palestrantes, p.id, 'nome', e.target.value)} className="w-full p-2 border rounded-lg" /></div>
                                                    <div><label className="text-xs">Especialidade</label><input type="text" value={p.especialidade} onChange={e=>updateArray(setPalestrantes, palestrantes, p.id, 'especialidade', e.target.value)} className="w-full p-2 border rounded-lg" /></div>
                                                    <div><label className="text-xs">Instituição</label><input type="text" value={p.instituicao} onChange={e=>updateArray(setPalestrantes, palestrantes, p.id, 'instituicao', e.target.value)} className="w-full p-2 border rounded-lg" /></div>
                                                </div>
                                                <textarea rows={3} value={p.bio} onChange={e=>updateArray(setPalestrantes, palestrantes, p.id, 'bio', e.target.value)} placeholder="Mini Bio" className="w-full p-3 border rounded-xl" />
                                            </div>
                                        ))}
                                        <button onClick={()=>setPalestrantes([...palestrantes, { id: Date.now(), foto: null, fotoPreview: "", nome: "", email: "", especialidade: "", instituicao: "", telefone: "", bio: "" }])} className="w-full py-2 bg-blue-100 text-blue-600 rounded-lg">Adicionar Palestrante</button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Minicursos */}
                        {activeTab === "minicursos" && (
                            <div className="space-y-6 animate-in fade-in">
                                <h2 className="text-lg font-bold border-b pb-3 flex items-center gap-2"><BookOpen className="w-5 h-5 text-blue-500"/> Minicursos</h2>
                                <NaoSeAplicaToggle label="Não se aplica" state={minicursosNaoSeAplica} setState={setMinicursosNaoSeAplica} />
                                {!minicursosNaoSeAplica && (
                                    <div className="space-y-6">
                                        {minicursos.map((m, mIndex) => (
                                            <div key={m.id} className="p-5 border-2 border-blue-100 dark:border-blue-900/40 rounded-2xl space-y-4">
                                                <h3 className="font-bold text-blue-600">Minicurso {mIndex + 1}</h3>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div><label className="text-xs">Nome do Minicurso</label><input type="text" value={m.nome} onChange={e=>updateArray(setMinicursos, minicursos, m.id, 'nome', e.target.value)} className="w-full p-2 border rounded-lg" /></div>
                                                    <div><label className="text-xs">Imagem</label>
                                                        <div className="flex items-center gap-2">
                                                            <input id={`img-mini-${m.id}`} type="file" onChange={e=>{
                                                                const f = e.target.files?.[0];
                                                                if(f) updateArray(setMinicursos, minicursos, m.id, 'imagem', f);
                                                            }} className="w-full p-2 border rounded-lg" />
                                                            {m.imagem && <button onClick={()=>{ updateArray(setMinicursos, minicursos, m.id, 'imagem', null); (document.getElementById(`img-mini-${m.id}`) as HTMLInputElement).value = ''; }} className="text-red-500 p-2 hover:bg-red-50 rounded-lg"><X className="w-4 h-4"/></button>}
                                                        </div>
                                                    </div>
                                                </div>
                                                {/* Adicionar lógica de sub-arrays se o usuário pedir mais nível. 
                                                    Mantendo simples para focar nos dados. */}
                                            </div>
                                        ))}
                                        <button onClick={()=>setMinicursos([...minicursos, {id: Date.now(), nome: "", tipo: "Teórico", imagem: null, imagemPreview: "", local: "", descricao: "", ministrantes: [], dias: [], ingressos: []}])} className="w-full py-2 bg-blue-600 text-white rounded-lg">Adicionar Minicurso</button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Equipe */}
                        {activeTab === "equipe" && (
                            <div className="space-y-6 animate-in fade-in">
                                <h2 className="text-lg font-bold border-b pb-3 flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-blue-500"/> Equipe e Administradores</h2>
                                <NaoSeAplicaToggle label="Não se aplica" state={adminsNaoSeAplica} setState={setAdminsNaoSeAplica} />
                                {!adminsNaoSeAplica && (
                                    <div className="space-y-4">
                                        {administradores.map(admin => (
                                            <div key={admin.id} className="p-4 border rounded-xl bg-slate-50 dark:bg-[#071321]/50 relative space-y-4">
                                                {administradores.length>1 && <button onClick={()=>removeArray(setAdministradores, administradores, admin.id)} className="absolute top-2 right-2 text-red-500"><Trash2 className="w-4 h-4"/></button>}
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div><label className="text-xs">Nome</label><input type="text" value={admin.nome} onChange={e=>updateArray(setAdministradores, administradores, admin.id, 'nome', e.target.value)} className="w-full p-2 border rounded-lg" /></div>
                                                    <div><label className="text-xs">E-mail</label><input type="email" value={admin.email} onChange={e=>updateArray(setAdministradores, administradores, admin.id, 'email', e.target.value)} className="w-full p-2 border rounded-lg" /></div>
                                                    <div><label className="text-xs">Telefone</label><input type="text" value={admin.telefone} onChange={e=>updateArray(setAdministradores, administradores, admin.id, 'telefone', e.target.value)} className="w-full p-2 border rounded-lg" /></div>
                                                    <div><label className="text-xs">Senha</label><input type="password" value={admin.senha} onChange={e=>updateArray(setAdministradores, administradores, admin.id, 'senha', e.target.value)} className="w-full p-2 border rounded-lg" /></div>
                                                </div>
                                                <div className="flex flex-wrap gap-4">
                                                    {Object.keys(admin.permissoes).map(perm => (
                                                        <label key={perm} className="flex items-center gap-1 text-xs">
                                                            <input type="checkbox" checked={admin.permissoes[perm as keyof typeof admin.permissoes]} onChange={e=>{
                                                                const newPerms = {...admin.permissoes, [perm]: e.target.checked};
                                                                updateArray(setAdministradores, administradores, admin.id, 'permissoes', newPerms);
                                                            }} />
                                                            <span className="capitalize">{perm}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                        <button onClick={()=>setAdministradores([...administradores, { id: Date.now(), nome: "", email: "", telefone: "", telefoneAlt: "", senha: "", repeteSenha: "", permissoes: { todas: false, site: false, inscricoes: false, minicursos: false, trabalhos: false, programacao: false, credenciamento: false, certificados: false, anais: false, financeiro: false, palestras: false } }])} className="w-full py-2 bg-blue-100 text-blue-600 rounded-lg">Adicionar Administrador</button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Patrocínios */}
                        {activeTab === "patrocinios" && (
                            <div className="space-y-6 animate-in fade-in">
                                <h2 className="text-lg font-bold border-b pb-3 flex items-center gap-2"><ImagePlus className="w-5 h-5 text-blue-500"/> Patrocinadores e Apoiadores</h2>
                                <NaoSeAplicaToggle label="Não se aplica" state={patrociniosNaoSeAplica} setState={setPatrociniosNaoSeAplica} />
                                {!patrociniosNaoSeAplica && (
                                    <div className="space-y-8">
                                        <div className="space-y-4 p-4 border rounded-xl bg-slate-50 dark:bg-[#071321]/50">
                                            <h3 className="font-bold text-sm">Patrocinadores</h3>
                                            {patrocinadores.map(p => (
                                                <div key={p.id} className="flex items-center gap-2">
                                                    <input id={`patro-${p.id}`} type="file" accept="image/*" onChange={e=>updateArray(setPatrocinadores, patrocinadores, p.id, 'file', e.target.files?.[0] || null)} className="flex-1 p-2 border rounded-lg bg-white dark:bg-[#0c1e33]" />
                                                    {p.file && <button onClick={()=>{ updateArray(setPatrocinadores, patrocinadores, p.id, 'file', null); (document.getElementById(`patro-${p.id}`) as HTMLInputElement).value = ''; }} className="text-red-500 p-2 hover:bg-red-50 rounded-lg"><X className="w-4 h-4"/></button>}
                                                    <button onClick={()=>removeArray(setPatrocinadores, patrocinadores, p.id)} className="p-2 text-red-500 bg-red-50 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                                                </div>
                                            ))}
                                            <button onClick={()=>setPatrocinadores([...patrocinadores, {id: Date.now(), file: null, fileName: ""}])} className="py-2 px-4 bg-blue-100 text-blue-600 rounded-lg text-sm">Adicionar Patrocinador</button>
                                        </div>
                                        <div className="space-y-4 p-4 border rounded-xl bg-slate-50 dark:bg-[#071321]/50">
                                            <h3 className="font-bold text-sm">Apoiadores</h3>
                                            {apoiadores.map(a => (
                                                <div key={a.id} className="flex items-center gap-2">
                                                    <input id={`apoi-${a.id}`} type="file" accept="image/*" onChange={e=>updateArray(setApoiadores, apoiadores, a.id, 'file', e.target.files?.[0] || null)} className="flex-1 p-2 border rounded-lg bg-white dark:bg-[#0c1e33]" />
                                                    {a.file && <button onClick={()=>{ updateArray(setApoiadores, apoiadores, a.id, 'file', null); (document.getElementById(`apoi-${a.id}`) as HTMLInputElement).value = ''; }} className="text-red-500 p-2 hover:bg-red-50 rounded-lg"><X className="w-4 h-4"/></button>}
                                                    <button onClick={()=>removeArray(setApoiadores, apoiadores, a.id)} className="p-2 text-red-500 bg-red-50 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                                                </div>
                                            ))}
                                            <button onClick={()=>setApoiadores([...apoiadores, {id: Date.now(), file: null, fileName: ""}])} className="py-2 px-4 bg-blue-100 text-blue-600 rounded-lg text-sm">Adicionar Apoiador</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Financeiro */}
                        {activeTab === "financeiro" && (
                            <div className="space-y-6 animate-in fade-in">
                                <h2 className="text-lg font-bold border-b pb-3 flex items-center gap-2"><Landmark className="w-5 h-5 text-blue-500"/> Dados Bancários</h2>
                                <NaoSeAplicaToggle label="Não se aplica" state={bancarioNaoSeAplica} setState={setBancarioNaoSeAplica} />
                                {!bancarioNaoSeAplica && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="text-xs">Banco</label><input type="text" value={dadosBancarios.banco} onChange={e=>setDadosBancarios({...dadosBancarios, banco: e.target.value})} className="w-full p-2 border rounded-lg" /></div>
                                        <div><label className="text-xs">Agência</label><input type="text" value={dadosBancarios.agencia} onChange={e=>setDadosBancarios({...dadosBancarios, agencia: e.target.value})} className="w-full p-2 border rounded-lg" /></div>
                                        <div><label className="text-xs">Conta</label><input type="text" value={dadosBancarios.conta} onChange={e=>setDadosBancarios({...dadosBancarios, conta: e.target.value})} className="w-full p-2 border rounded-lg" /></div>
                                        <div><label className="text-xs">Chave PIX</label><input type="text" value={dadosBancarios.chavePix} onChange={e=>setDadosBancarios({...dadosBancarios, chavePix: e.target.value})} className="w-full p-2 border rounded-lg" /></div>
                                        <div><label className="text-xs">Titular</label><input type="text" value={dadosBancarios.titular} onChange={e=>setDadosBancarios({...dadosBancarios, titular: e.target.value})} className="w-full p-2 border rounded-lg" /></div>
                                        <div><label className="text-xs">CPF/CNPJ do Titular</label><input type="text" value={dadosBancarios.documentoTitular} onChange={e=>setDadosBancarios({...dadosBancarios, documentoTitular: e.target.value})} className="w-full p-2 border rounded-lg" /></div>
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </main>

        
    );
}