import { collection, query, where, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Formata um CPF no padrão 000.000.000-00 se possuir 11 dígitos
 */
export function formatarCpf(cpf: string | number | undefined | null): string {
  if (!cpf) return "";
  const limpo = String(cpf).replace(/\D/g, "");
  if (limpo.length === 11) {
    return limpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }
  return String(cpf).trim();
}

export interface ParticipanteInscrito {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  lote: string;
  valor: number;
  valorFormatado: string;
  status: string;
  statusNormalizado: "Confirmada" | "Pendente" | "Cancelada";
  dataCompra: string;
  dataCompraRaw?: any;
  codigoIngresso: string;
  instituicao?: string;
  curso?: string;
  grau?: string;
  raw?: any;
}

export interface LoteDistribuicao {
  nome: string;
  quantidade: number;
  percentual: number;
  receita: number;
}

export interface StatusDistribuicao {
  status: string;
  quantidade: number;
  percentual: number;
}

export interface EventoAnalyticsData {
  eventId: string;
  eventoTitulo: string;
  eventoImg?: string;
  eventoData?: string;
  eventoLocal?: string;
  eventoCategoria?: string;
  eventoStatus?: string;
  capacidade?: number | string;
  taxaOcupacaoPercent?: number | null;
  totalInscritos: number;
  totalConfirmados: number;
  totalPendentes: number;
  totalReceita: number;
  receitaFormatada: string;
  ticketMedio: number;
  ticketMedioFormatado: string;
  distribuicaoLotes: LoteDistribuicao[];
  distribuicaoStatus: StatusDistribuicao[];
  participantes: ParticipanteInscrito[];
}

export interface EventoPromotorItem {
  id: string;
  title: string;
  date?: string;
  dateInicio?: string;
  dateFim?: string;
  category?: string;
  img?: string;
  capacidade?: string | number;
  status?: string;
  totalInscritos?: number;
}

/**
 * Busca estritamente os eventos criados pelo promotor logado no Firestore.
 * Cada promotor visualiza unicamente os seus próprios eventos.
 */
export async function buscarEventosDoPromotor(user: {
  uid: string;
  email?: string | null;
}): Promise<EventoPromotorItem[]> {
  if (!user || !user.uid) return [];

  const eventosMap = new Map<string, any>();

  // 1. Busca por userId do criador
  try {
    const qUser = query(collection(db, "events"), where("userId", "==", user.uid));
    const snapUser = await getDocs(qUser);
    snapUser.docs.forEach((d) => eventosMap.set(d.id, { id: d.id, ...d.data() }));
  } catch (err) {
    console.error("Erro ao buscar eventos do promotor por UID:", err);
  }

  // 2. Busca complementar por promotorEmail caso o evento tenha sido cadastrado com esse e-mail
  if (user.email) {
    try {
      const qEmail = query(collection(db, "events"), where("promotorEmail", "==", user.email));
      const snapEmail = await getDocs(qEmail);
      snapEmail.docs.forEach((d) => {
        if (!eventosMap.has(d.id)) {
          eventosMap.set(d.id, { id: d.id, ...d.data() });
        }
      });
    } catch (err) {
      console.error("Erro ao buscar eventos do promotor por e-mail:", err);
    }
  }

  const lista: EventoPromotorItem[] = Array.from(eventosMap.values()).map((ev) => ({
    id: ev.id,
    title: ev.title || "Evento Científico",
    date: ev.date || (ev.dateInicio ? ev.dateInicio.split("-").reverse().join("/") : "A definir"),
    dateInicio: ev.dateInicio,
    dateFim: ev.dateFim,
    category: ev.category || "Geral",
    img: ev.img || "/assets/logos/teste-anatomia.png",
    capacidade: ev.capacidade || "",
    status: ev.status || "Ativo",
  }));

  return lista;
}

/**
 * Busca todas as inscrições de um evento específico e calcula os indicadores analíticos completos,
 * validando que o promotor logado seja de fato o proprietário do evento solicitado.
 */
export async function buscarAnalyticsDoEvento(
  eventId: string,
  user?: { uid: string; email?: string | null }
): Promise<EventoAnalyticsData> {
  if (!eventId) {
    throw new Error("ID do evento é obrigatório para carregar o analytics.");
  }

  // 1. Carrega dados do evento e valida propriedade do promotor
  let eventoTitulo = "Evento Científico";
  let eventoImg: string | undefined;
  let eventoData: string | undefined;
  let eventoLocal: string | undefined;
  let eventoCategoria: string | undefined;
  let eventoStatus: string | undefined;
  let capacidadeEvento: number | undefined;

  const evDoc = await getDoc(doc(db, "events", eventId));
  if (!evDoc.exists()) {
    throw new Error("Evento não encontrado no sistema.");
  }

  const evData = evDoc.data();

  // Verificação estrita de posse: garante que promotores não visualizem eventos de outros
  if (user && user.uid) {
    const isOwner =
      evData.userId === user.uid ||
      (user.email && evData.promotorEmail?.toLowerCase() === user.email.toLowerCase());

    if (!isOwner) {
      throw new Error("Acesso não autorizado: você só tem permissão para visualizar o analytics dos seus próprios eventos.");
    }
  }

  eventoTitulo = evData.title || eventoTitulo;
  eventoImg = evData.img || undefined;
  eventoData = evData.date || (evData.dateInicio ? evData.dateInicio.split("-").reverse().join("/") : undefined);
  eventoLocal = evData.local?.nomeLocal || evData.localization || undefined;
  eventoCategoria = evData.category || undefined;
  eventoStatus = evData.status || undefined;

  if (evData.capacidade && !isNaN(Number(evData.capacidade))) {
    capacidadeEvento = Number(evData.capacidade);
  }

  // 2. Busca todas as inscrições associadas ao evento
  // Suporta: evento_id, eventoId, evento, eventId
  const docsMap = new Map<string, any>();

  const queries = [
    query(collection(db, "inscricoes"), where("evento_id", "==", eventId)),
    query(collection(db, "inscricoes"), where("eventoId", "==", eventId)),
    query(collection(db, "inscricoes"), where("evento", "==", eventId)),
    query(collection(db, "inscricoes"), where("eventId", "==", eventId)),
  ];

  for (const q of queries) {
    try {
      const snap = await getDocs(q);
      snap.docs.forEach((d) => {
        if (!docsMap.has(d.id)) {
          docsMap.set(d.id, d.data());
        }
      });
    } catch (err) {
      console.warn("Erro ao consultar variantes de inscrição:", err);
    }
  }

  // 3. Identifica inscrições sem CPF e busca os dados na coleção 'users'
  const userIdsParaBuscar = new Set<string>();
  for (const [, data] of docsMap.entries()) {
    const rawCpf = data.cpf || data.userCpf || data.participanteCpf || data.documento_valor;
    if (!rawCpf && data.userId) {
      userIdsParaBuscar.add(String(data.userId));
    }
  }

  const userCache = new Map<string, any>();
  if (userIdsParaBuscar.size > 0) {
    await Promise.all(
      Array.from(userIdsParaBuscar).map(async (uid) => {
        try {
          const uDoc = await getDoc(doc(db, "users", uid));
          if (uDoc.exists()) {
            userCache.set(uid, uDoc.data());
          }
        } catch (e) {
          console.warn(`Erro ao buscar dados do participante ${uid} em users:`, e);
        }
      })
    );
  }

  // 4. Processamento e Normalização dos Participantes
  const participantes: ParticipanteInscrito[] = [];
  const lotesContagem: Record<string, { count: number; receita: number }> = {};
  const statusContagem: Record<string, number> = {};

  let totalReceita = 0;
  let totalConfirmados = 0;
  let totalPendentes = 0;

  for (const [id, data] of docsMap.entries()) {
    // Normalização do Valor
    let valorNumerico = 0;
    if (data.valor !== undefined && data.valor !== null) {
      const limpo = String(data.valor).replace("R$", "").replace(/\s/g, "").replace(",", ".");
      const parsed = parseFloat(limpo);
      if (!isNaN(parsed)) valorNumerico = parsed;
    }

    // Normalização do Status
    const rawStatus = (data.status || "confirmado").toString().toLowerCase().trim();
    let statusNormalizado: "Confirmada" | "Pendente" | "Cancelada" = "Confirmada";

    if (rawStatus === "confirmado" || rawStatus === "confirmada" || rawStatus === "pago" || rawStatus === "aprovado") {
      statusNormalizado = "Confirmada";
      totalConfirmados++;
      totalReceita += valorNumerico;
    } else if (rawStatus === "pendente" || rawStatus === "aguardando" || rawStatus === "processando") {
      statusNormalizado = "Pendente";
      totalPendentes++;
    } else if (rawStatus === "cancelado" || rawStatus === "recusado" || rawStatus === "estornado") {
      statusNormalizado = "Cancelada";
    } else {
      statusNormalizado = "Confirmada";
      totalConfirmados++;
      totalReceita += valorNumerico;
    }

    // Lote / Categoria
    const loteNome = data.lote || data.perfil_tipo_participante || data.tipo_participante || data.categoria || "Geral";
    if (!lotesContagem[loteNome]) {
      lotesContagem[loteNome] = { count: 0, receita: 0 };
    }
    lotesContagem[loteNome].count++;
    if (statusNormalizado === "Confirmada") {
      lotesContagem[loteNome].receita += valorNumerico;
    }

    // Status Contagem
    statusContagem[statusNormalizado] = (statusContagem[statusNormalizado] || 0) + 1;

    // Normalização de Data de Compra
    let dataCompraStr = "Recente";
    if (data.data_inscricao) {
      try {
        dataCompraStr = new Date(data.data_inscricao).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        });
      } catch {
        dataCompraStr = String(data.data_inscricao);
      }
    } else if (data.created_at) {
      try {
        dataCompraStr = new Date(data.created_at).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        });
      } catch {
        dataCompraStr = String(data.created_at);
      }
    } else if (data.createdAt) {
      try {
        dataCompraStr = typeof data.createdAt === "string"
          ? new Date(data.createdAt).toLocaleDateString("pt-BR")
          : (data.createdAt.toDate ? data.createdAt.toDate().toLocaleDateString("pt-BR") : "Recente");
      } catch {
        dataCompraStr = "Recente";
      }
    }

    // Recuperação de CPF e dados de perfil (com fallback e auto-reparo no Firestore)
    let cpfEncontrado = data.cpf || data.userCpf || data.participanteCpf || data.documento_valor || "";
    const uData = data.userId ? userCache.get(data.userId) : null;

    if (!cpfEncontrado && uData?.cpf) {
      cpfEncontrado = uData.cpf;

      // Auto-repara o documento na coleção inscricoes do Firestore para constar no Firebase Console
      try {
        updateDoc(doc(db, "inscricoes", id), {
          cpf: cpfEncontrado,
          userCpf: cpfEncontrado,
        }).catch(() => {});
      } catch {}
    }

    const cpfFormatado = formatarCpf(cpfEncontrado);

    participantes.push({
      id,
      nome: data.nome || data.userName || uData?.nome || "Participante Anônimo",
      email: data.email || data.userEmail || uData?.email || "Sem e-mail",
      cpf: cpfFormatado,
      lote: loteNome,
      valor: valorNumerico,
      valorFormatado: valorNumerico > 0 ? `R$ ${valorNumerico.toFixed(2).replace(".", ",")}` : "Gratuito",
      status: data.status || "confirmado",
      statusNormalizado,
      dataCompra: dataCompraStr,
      dataCompraRaw: data.data_inscricao || data.created_at || data.createdAt || null,
      codigoIngresso: String(data.ticket_id || data.codigoIngresso || data.id || id),
      instituicao: data.instituicao || uData?.instituicao || "",
      curso: data.curso || uData?.curso || "",
      grau: data.grau_aluno || "",
      raw: data,
    });
  }

  // Ordena participantes por data mais recente
  participantes.sort((a, b) => {
    const timeA = a.dataCompraRaw ? new Date(a.dataCompraRaw).getTime() : 0;
    const timeB = b.dataCompraRaw ? new Date(b.dataCompraRaw).getTime() : 0;
    return timeB - timeA;
  });

  const totalInscritos = participantes.length;

  // Distribuição por Lotes
  const distribuicaoLotes: LoteDistribuicao[] = Object.entries(lotesContagem).map(([nome, item]) => ({
    nome,
    quantidade: item.count,
    percentual: totalInscritos > 0 ? Math.round((item.count / totalInscritos) * 100) : 0,
    receita: item.receita,
  })).sort((a, b) => b.quantidade - a.quantidade);

  // Distribuição por Status
  const distribuicaoStatus: StatusDistribuicao[] = Object.entries(statusContagem).map(([st, count]) => ({
    status: st,
    quantidade: count,
    percentual: totalInscritos > 0 ? Math.round((count / totalInscritos) * 100) : 0,
  }));

  // Taxa de ocupação (se houver capacidade cadastrada)
  let taxaOcupacaoPercent: number | null = null;
  if (capacidadeEvento && capacidadeEvento > 0) {
    taxaOcupacaoPercent = Math.min(100, Math.round((totalConfirmados / capacidadeEvento) * 100));
  }

  const ticketMedio = totalConfirmados > 0 ? totalReceita / totalConfirmados : 0;

  return {
    eventId,
    eventoTitulo,
    eventoImg,
    eventoData,
    eventoLocal,
    eventoCategoria,
    eventoStatus,
    capacidade: capacidadeEvento,
    taxaOcupacaoPercent,
    totalInscritos,
    totalConfirmados,
    totalPendentes,
    totalReceita,
    receitaFormatada: `R$ ${totalReceita.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    ticketMedio,
    ticketMedioFormatado: `R$ ${ticketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    distribuicaoLotes,
    distribuicaoStatus,
    participantes,
  };
}

/**
 * Busca rápida da contagem de inscritos para múltiplos eventos (para exibir badges em listas)
 */
export async function buscarContagemInscritosDosEventos(eventoIds: string[]): Promise<Record<string, number>> {
  const contagens: Record<string, number> = {};
  if (!eventoIds || eventoIds.length === 0) return contagens;

  eventoIds.forEach((id) => (contagens[id] = 0));

  await Promise.all(
    eventoIds.map(async (evId) => {
      try {
        const snap1 = await getDocs(query(collection(db, "inscricoes"), where("evento_id", "==", evId)));
        const snap2 = await getDocs(query(collection(db, "inscricoes"), where("eventoId", "==", evId)));
        
        const setIds = new Set<string>();
        snap1.docs.forEach((d) => setIds.add(d.id));
        snap2.docs.forEach((d) => setIds.add(d.id));
        
        contagens[evId] = setIds.size;
      } catch (err) {
        console.error(`Erro ao contar inscritos do evento ${evId}:`, err);
      }
    })
  );

  return contagens;
}
