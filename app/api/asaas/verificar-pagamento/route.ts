import { NextResponse } from "next/server";
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { consultarCobrancaAsaas } from "@/lib/asaas";

/**
 * Endpoint para sincronizar o status real de uma cobrança direto com a API do Asaas.
 * Útil para:
 * 1. Ambientes locais (localhost) onde o Webhook do Asaas não consegue alcançar a máquina do desenvolvedor;
 * 2. Fallback de segurança quando o webhook falha ou sofre atraso de rede;
 * 3. Botão "Já Realizei o Pagamento / Verificar Status" nas telas de participante.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const inscricaoId = searchParams.get("inscricaoId");
  const paymentId = searchParams.get("paymentId");

  if (!inscricaoId && !paymentId) {
    return sincronizarTodasInscricoesPendentes();
  }

  return processarVerificacao(inscricaoId, paymentId);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body?.inscricaoId && !body?.paymentId) {
      return sincronizarTodasInscricoesPendentes();
    }
    return processarVerificacao(body?.inscricaoId, body?.paymentId);
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }
}

async function sincronizarTodasInscricoesPendentes() {
  try {
    const q = query(collection(db, "inscricoes"), where("status", "==", "Pendente"));
    const snap = await getDocs(q);

    const resultados: any[] = [];

    for (const d of snap.docs) {
      const data = d.data();
      const asaasPaymentId = data.asaasPaymentId;
      if (!asaasPaymentId) continue;

      let apiKeyFinal = process.env.ASAAS_API_KEY;
      if (data.promotorUserId) {
        try {
          const promotorSnap = await getDoc(doc(db, "users", data.promotorUserId));
          if (promotorSnap.exists() && promotorSnap.data()?.asaasApiKey) {
            apiKeyFinal = promotorSnap.data().asaasApiKey;
          }
        } catch {}
      }

      if (!apiKeyFinal) continue;

      const cobranca = await consultarCobrancaAsaas(asaasPaymentId, apiKeyFinal);
      if (!cobranca) continue;

      const asaasStatus = cobranca.status;
      if (
        asaasStatus === "CONFIRMED" ||
        asaasStatus === "RECEIVED" ||
        asaasStatus === "RECEIVED_IN_CASH"
      ) {
        await updateDoc(doc(db, "inscricoes", d.id), {
          status: "Confirmada",
          statusNormalizado: "Confirmada",
          asaasStatus: asaasStatus,
          dataPagamento: cobranca.paymentDate || cobranca.clientPaymentDate || new Date().toISOString(),
          sincronizadoEm: new Date().toISOString(),
        });
        resultados.push({
          id: d.id,
          codigoIngresso: data.codigoIngresso,
          statusAnterior: "Pendente",
          novoStatus: "Confirmada",
          asaasStatus,
        });
      } else {
        resultados.push({
          id: d.id,
          codigoIngresso: data.codigoIngresso,
          status: "Pendente",
          asaasStatus,
        });
      }
    }

    return NextResponse.json({
      success: true,
      totalProcessadas: snap.size,
      atualizadas: resultados.filter((r) => r.novoStatus === "Confirmada").length,
      detalhes: resultados,
    });
  } catch (err: any) {
    console.error("Erro ao sincronizar inscrições pendentes:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function processarVerificacao(inscricaoId?: string | null, paymentIdParam?: string | null) {
  try {
    let targetInscricaoId = inscricaoId;
    let inscricaoData: any = null;

    // 1. Busca a inscrição pelo ID do documento
    if (targetInscricaoId) {
      const snap = await getDoc(doc(db, "inscricoes", targetInscricaoId));
      if (snap.exists()) {
        inscricaoData = snap.data();
      }
    }

    // 2. Fallback: busca pelo paymentId caso o ID da inscrição não tenha sido passado
    if (!inscricaoData && paymentIdParam) {
      const q = query(collection(db, "inscricoes"), where("asaasPaymentId", "==", paymentIdParam));
      const snapQ = await getDocs(q);
      if (!snapQ.empty) {
        targetInscricaoId = snapQ.docs[0].id;
        inscricaoData = snapQ.docs[0].data();
      }
    }

    if (!inscricaoData || !targetInscricaoId) {
      return NextResponse.json(
        { error: "Inscrição não encontrada no banco de dados." },
        { status: 404 }
      );
    }

    // Se já estiver confirmada no Firestore, não precisa refazer a checagem
    if (
      inscricaoData.status === "Confirmada" ||
      inscricaoData.status === "confirmado" ||
      inscricaoData.status === "pago"
    ) {
      return NextResponse.json({
        success: true,
        status: "Confirmada",
        alreadyConfirmed: true,
        message: "Inscrição já consta como confirmada.",
      });
    }

    const asaasPaymentId = inscricaoData.asaasPaymentId || paymentIdParam;
    if (!asaasPaymentId) {
      return NextResponse.json(
        { error: "Esta inscrição não possui identificador de pagamento Asaas associado." },
        { status: 400 }
      );
    }

    // 3. Localiza a API Key adequada (da subconta do promotor ou da plataforma principal)
    let apiKeyFinal = process.env.ASAAS_API_KEY;
    if (inscricaoData.promotorUserId) {
      try {
        const promotorSnap = await getDoc(doc(db, "users", inscricaoData.promotorUserId));
        if (promotorSnap.exists()) {
          const pData = promotorSnap.data();
          if (pData.asaasApiKey) {
            apiKeyFinal = pData.asaasApiKey;
          }
        }
      } catch (e) {
        console.warn("Aviso ao buscar API key da subconta do promotor:", e);
      }
    }

    if (!apiKeyFinal) {
      return NextResponse.json(
        { error: "Chave de API do Asaas não configurada no servidor." },
        { status: 500 }
      );
    }

    // 4. Consulta a API oficial do Asaas em tempo real
    const cobranca = await consultarCobrancaAsaas(asaasPaymentId, apiKeyFinal);

    if (!cobranca) {
      return NextResponse.json(
        { error: "Não foi possível obter dados da cobrança no Asaas." },
        { status: 502 }
      );
    }

    const asaasStatus = cobranca.status; // CONFIRMED, RECEIVED, RECEIVED_IN_CASH, PENDING, OVERDUE, etc.

    // 5. Se o pagamento foi concluído / recebido no Asaas
    if (
      asaasStatus === "CONFIRMED" ||
      asaasStatus === "RECEIVED" ||
      asaasStatus === "RECEIVED_IN_CASH"
    ) {
      await updateDoc(doc(db, "inscricoes", targetInscricaoId), {
        status: "Confirmada",
        statusNormalizado: "Confirmada",
        asaasStatus: asaasStatus,
        dataPagamento: cobranca.paymentDate || cobranca.clientPaymentDate || new Date().toISOString(),
        sincronizadoEm: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        status: "Confirmada",
        updated: true,
        asaasStatus,
        message: "Pagamento confirmado com sucesso no Asaas! Inscrição liberada.",
      });
    }

    if (asaasStatus === "REFUNDED" || asaasStatus === "CHARGEBACK_REQUESTED") {
      await updateDoc(doc(db, "inscricoes", targetInscricaoId), {
        status: "Cancelada",
        statusNormalizado: "Cancelada",
        asaasStatus: asaasStatus,
        sincronizadoEm: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        status: "Cancelada",
        updated: true,
        asaasStatus,
        message: "Cobrança cancelada ou estornada no Asaas.",
      });
    }

    // Caso continue PENDING / OVERDUE
    return NextResponse.json({
      success: true,
      status: "Pendente",
      updated: false,
      asaasStatus,
      message: "Cobrança ainda aguarda compensação no Asaas.",
    });
  } catch (error: any) {
    console.error("Erro ao verificar pagamento Asaas:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno ao verificar pagamento." },
      { status: 500 }
    );
  }
}
