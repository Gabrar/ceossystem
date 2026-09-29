import { NextResponse } from "next/server";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Webhook do Asaas — recebe notificações de mudança de status de pagamento
 * e atualiza automaticamente o status da inscrição correspondente no Firestore.
 *
 * Eventos tratados:
 *   PAYMENT_CONFIRMED  → status "Confirmada"
 *   PAYMENT_RECEIVED   → status "Confirmada"
 *   PAYMENT_OVERDUE    → status "Pendente"
 *   PAYMENT_DELETED    → status "Cancelada"
 *   PAYMENT_REFUNDED   → status "Cancelada"
 *   PAYMENT_CHARGEBACK_REQUESTED → status "Cancelada"
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const event: string = body?.event ?? "";
    const payment = body?.payment ?? {};
    const paymentId: string = payment?.id ?? "";
    const externalReference: string = payment?.externalReference ?? "";

    if (!paymentId && !externalReference) {
      return NextResponse.json(
        { error: "Webhook inválido: sem paymentId ou externalReference." },
        { status: 400 }
      );
    }

    // Mapeamento de eventos Asaas → status normalizado da inscrição
    let novoStatus: "Confirmada" | "Pendente" | "Cancelada" | null = null;
    let novoStatusAsaas: string = payment?.status ?? event;

    if (
      event === "PAYMENT_CONFIRMED" ||
      event === "PAYMENT_RECEIVED" ||
      payment?.status === "CONFIRMED" ||
      payment?.status === "RECEIVED"
    ) {
      novoStatus = "Confirmada";
    } else if (
      event === "PAYMENT_OVERDUE" ||
      payment?.status === "OVERDUE" ||
      payment?.status === "PENDING"
    ) {
      novoStatus = "Pendente";
    } else if (
      event === "PAYMENT_DELETED" ||
      event === "PAYMENT_REFUNDED" ||
      event === "PAYMENT_CHARGEBACK_REQUESTED" ||
      payment?.status === "REFUNDED" ||
      payment?.status === "CHARGEBACK_REQUESTED"
    ) {
      novoStatus = "Cancelada";
    }

    if (!novoStatus) {
      // Evento irrelevante — apenas acusar recebimento
      return NextResponse.json({ received: true, ignored: true });
    }

    // Localiza a inscrição pelo externalReference (inscricaoId) ou pelo asaasPaymentId
    const inscricaoRef = await localizarInscricao(paymentId, externalReference);

    if (!inscricaoRef) {
      console.warn(`Webhook Asaas: Inscrição não encontrada para paymentId=${paymentId}, ref=${externalReference}`);
      return NextResponse.json({ received: true, found: false });
    }

    await updateDoc(inscricaoRef, {
      status: novoStatus,
      statusNormalizado: novoStatus,
      asaasStatus: novoStatusAsaas,
      asaasPaymentId: paymentId,
      webhookUpdatedAt: new Date().toISOString(),
    });

    console.log(`Webhook Asaas: Inscrição ${inscricaoRef.id} atualizada → ${novoStatus} (${event})`);

    return NextResponse.json({ received: true, updated: inscricaoRef.id, status: novoStatus });
  } catch (error: any) {
    console.error("Erro ao processar webhook Asaas:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar webhook." },
      { status: 500 }
    );
  }
}

/**
 * Localiza o document reference da inscrição no Firestore
 * buscando primeiro pelo externalReference (inscricaoId direto)
 * e, como fallback, pelo campo asaasPaymentId.
 */
async function localizarInscricao(
  paymentId: string,
  externalReference: string
): Promise<ReturnType<typeof doc> | null> {
  // 1. Busca direta pelo ID do documento (externalReference = docId)
  if (externalReference) {
    try {
      const snapById = await getDocs(
        query(collection(db, "inscricoes"), where("__name__", "==", externalReference))
      );
      if (!snapById.empty) {
        return doc(db, "inscricoes", externalReference);
      }
    } catch {
      // Firestore não suporta __name__ em query simples — fallback abaixo
    }
  }

  // 2. Busca por campo asaasPaymentId
  if (paymentId) {
    try {
      const snapPay = await getDocs(
        query(collection(db, "inscricoes"), where("asaasPaymentId", "==", paymentId))
      );
      if (!snapPay.empty) {
        return doc(db, "inscricoes", snapPay.docs[0].id);
      }
    } catch (e) {
      console.warn("Erro ao buscar por asaasPaymentId:", e);
    }
  }

  // 3. Busca por externalReference como campo
  if (externalReference) {
    try {
      const snapExt = await getDocs(
        query(collection(db, "inscricoes"), where("externalReference", "==", externalReference))
      );
      if (!snapExt.empty) {
        return doc(db, "inscricoes", snapExt.docs[0].id);
      }
    } catch (e) {
      console.warn("Erro ao buscar por externalReference:", e);
    }
  }

  return null;
}
