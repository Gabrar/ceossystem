import { collection, query, where, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getEventRegistrationStatus } from "@/lib/eventStatus";

export interface InscricaoNormalizada {
  id: string;
  eventoId: string;
  eventoTitulo?: string;
  userId?: string;
  userEmail?: string;
  email: string;
  nome: string;
  cpf?: string;
  ticketId?: string;
  valor?: string;
  lote?: string;
  status: string;
  dataCompra?: string;
  instituicao?: string;
  raw?: any;
}

export interface EventoInscritoItem {
  id: string;
  title: string;
  subtitle?: string;
  category?: string;
  date?: string;
  dateInicio?: string;
  dateFim?: string;
  horaInicio?: string;
  horaFim?: string;
  hour?: string;
  local?: any;
  localization?: string;
  "city-state"?: string;
  img?: string;
  statusCalculado: string;
  inscricao: InscricaoNormalizada;
  [key: string]: any;
}

/**
 * Busca todas as inscrições associadas ao usuário no Firestore,
 * aceitando tanto o esquema novo (userId, userEmail, eventoId)
 * quanto o legado migrado do Supabase (email, evento_id, evento, ticket_id, etc).
 * 
 * Realiza auto-vinculação (auto-attach) silenciosa do UID nos documentos legados.
 */
export async function buscarInscricoesDoUsuario(user: {
  uid: string;
  email?: string | null;
  displayName?: string | null;
}): Promise<InscricaoNormalizada[]> {
  if (!user || !user.uid) return [];

  const docsMap = new Map<string, any>();

  // 1. Busca por UID
  try {
    const qUid = query(collection(db, "inscricoes"), where("userId", "==", user.uid));
    const snapUid = await getDocs(qUid);
    snapUid.docs.forEach((d) => docsMap.set(d.id, { ref: d.ref, data: d.data() }));
  } catch (err) {
    console.error("Erro na busca de inscrições por UID:", err);
  }

  // 2. Busca por e-mail (se disponível)
  if (user.email) {
    const emailNorm = user.email.toLowerCase().trim();
    const emailsToTry = Array.from(new Set([user.email, emailNorm]));

    for (const em of emailsToTry) {
      try {
        // Campo 'email' (usado na migração do Supabase)
        const qEmail = query(collection(db, "inscricoes"), where("email", "==", em));
        const snapEmail = await getDocs(qEmail);
        snapEmail.docs.forEach((d) => {
          if (!docsMap.has(d.id)) {
            docsMap.set(d.id, { ref: d.ref, data: d.data() });
          }
        });
      } catch (err) {
        console.error("Erro na busca de inscrições por campo 'email':", err);
      }

      try {
        // Campo 'userEmail' (usado em versões recentes do sistema)
        const qUserEmail = query(collection(db, "inscricoes"), where("userEmail", "==", em));
        const snapUserEmail = await getDocs(qUserEmail);
        snapUserEmail.docs.forEach((d) => {
          if (!docsMap.has(d.id)) {
            docsMap.set(d.id, { ref: d.ref, data: d.data() });
          }
        });
      } catch (err) {
        console.error("Erro na busca de inscrições por campo 'userEmail':", err);
      }
    }
  }

  const inscricoes: InscricaoNormalizada[] = [];

  for (const [id, item] of docsMap.entries()) {
    const data = item.data;
    const eventoId = data.evento_id || data.evento || data.eventoId || data.eventId || "";

    // Auto-vínculo (auto-attach) transparente do UID e campos padronizados
    if (!data.userId || data.userId !== user.uid) {
      try {
        updateDoc(item.ref, {
          userId: user.uid,
          userEmail: user.email || data.email || "",
          eventoId: eventoId,
          autoVinculadoEm: new Date().toISOString(),
        }).catch(() => {});
      } catch (e) {
        // Atualização em background tolerante a falhas
      }
    }

    // Normalização da data de compra
    let dataCompraStr = "";
    if (data.data_inscricao) {
      try {
        dataCompraStr = new Date(data.data_inscricao).toLocaleDateString("pt-BR");
      } catch {
        dataCompraStr = String(data.data_inscricao);
      }
    } else if (data.created_at) {
      try {
        dataCompraStr = new Date(data.created_at).toLocaleDateString("pt-BR");
      } catch {
        dataCompraStr = String(data.created_at);
      }
    } else if (data.createdAt) {
      try {
        dataCompraStr = typeof data.createdAt === "string" 
          ? new Date(data.createdAt).toLocaleDateString("pt-BR")
          : (data.createdAt.toDate ? data.createdAt.toDate().toLocaleDateString("pt-BR") : "");
      } catch {
        dataCompraStr = "";
      }
    }

    inscricoes.push({
      id: id,
      eventoId: eventoId,
      eventoTitulo: data.eventoTitulo || data.eventTitle || data.title || "",
      userId: user.uid,
      userEmail: user.email || data.userEmail || data.email,
      email: data.email || data.userEmail || user.email || "",
      nome: data.nome || data.userName || user.displayName || "",
      cpf: data.cpf || data.documento_valor || "",
      ticketId: String(data.ticket_id || data.codigoIngresso || data.id || id),
      valor: data.valor !== undefined && data.valor !== null ? String(data.valor) : "",
      lote: data.lote || data.perfil_tipo_participante || data.tipo_participante || "Inscrição Geral",
      status: data.status || "confirmado",
      dataCompra: dataCompraStr,
      instituicao: data.instituicao || "",
      raw: data,
    });
  }

  return inscricoes;
}

/**
 * Verifica se um usuário está inscrito em um evento específico.
 */
export async function verificarUsuarioInscritoNoEvento(
  user: { uid: string; email?: string | null; displayName?: string | null } | null,
  eventId: string,
  eventTitle?: string
): Promise<{ isInscrito: boolean; inscricao?: InscricaoNormalizada }> {
  if (!user || !eventId) {
    return { isInscrito: false };
  }

  const todasInscricoes = await buscarInscricoesDoUsuario(user);

  const match = todasInscricoes.find((insc) => {
    if (insc.eventoId && insc.eventoId === eventId) return true;
    if (eventTitle && insc.eventoTitulo && insc.eventoTitulo.trim().toLowerCase() === eventTitle.trim().toLowerCase()) {
      return true;
    }
    return false;
  });

  if (match) {
    return { isInscrito: true, inscricao: match };
  }

  return { isInscrito: false };
}

/**
 * Busca e carrega os eventos individuais em que o usuário está inscrito,
 * com seus detalhes completos da coleção 'events' e status calculados.
 */
export async function buscarEventosInscritosDoUsuario(user: {
  uid: string;
  email?: string | null;
  displayName?: string | null;
}): Promise<EventoInscritoItem[]> {
  const inscricoes = await buscarInscricoesDoUsuario(user);
  if (inscricoes.length === 0) return [];

  // Mapeia eventos únicos
  const eventosMap = new Map<string, EventoInscritoItem>();

  for (const insc of inscricoes) {
    if (!insc.eventoId) continue;
    if (eventosMap.has(insc.eventoId)) continue;

    try {
      const evSnap = await getDoc(doc(db, "events", insc.eventoId));
      if (evSnap.exists()) {
        const data = evSnap.data();

        const statusCalculado = getEventRegistrationStatus({
          dataInscricaoInicio: data.dataInscricaoInicio,
          dataInscricaoFim: data.dataInscricaoFim,
          horaInscricaoInicio: data.horaInscricaoInicio,
          horaInscricaoFim: data.horaInscricaoFim,
          dateInicio: data.dateInicio,
          dateFim: data.dateFim,
          status: data.status,
        });

        eventosMap.set(insc.eventoId, {
          id: evSnap.id,
          title: data.title || insc.eventoTitulo || "Evento Científico",
          subtitle: data.subtitle || "",
          category: data.category || "Geral",
          date: data.date || "",
          dateInicio: data.dateInicio || "",
          dateFim: data.dateFim || "",
          horaInicio: data.horaInicio || "",
          horaFim: data.horaFim || "",
          hour: data.hour || "",
          local: data.local || null,
          localization: data.localization || "",
          "city-state": data["city-state"] || "",
          img: data.img || "/assets/logos/teste-anatomia.png",
          statusCalculado,
          inscricao: insc,
          ...data,
        });
      } else {
        // Caso o evento não exista mais ou esteja com outro id, cria um card com os dados da inscrição
        eventosMap.set(insc.eventoId, {
          id: insc.eventoId,
          title: insc.eventoTitulo || `Evento #${insc.eventoId}`,
          subtitle: "Inscrição confirmada",
          category: insc.lote || "Geral",
          img: "/assets/logos/teste-anatomia.png",
          statusCalculado: "Inscrições Abertas",
          inscricao: insc,
        });
      }
    } catch (err) {
      console.error(`Erro ao carregar detalhes do evento ${insc.eventoId}:`, err);
    }
  }

  return Array.from(eventosMap.values());
}
