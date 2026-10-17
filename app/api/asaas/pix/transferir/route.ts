import { NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  transferirPixSubconta,
  listarTransferenciasSubconta,
  consultarSaldoSubcontaAsaas,
} from "@/lib/asaas";

/**
 * GET: Lista as transferências realizadas pela subconta do promotor
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Identificador de usuário não informado." }, { status: 400 });
    }

    const userSnap = await getDoc(doc(db, "users", userId));
    if (!userSnap.exists()) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    const apiKey = userSnap.data().asaasApiKey;
    if (!apiKey) {
      return NextResponse.json({ error: "Subconta não configurada para este promotor." }, { status: 400 });
    }

    const transferencias = await listarTransferenciasSubconta(apiKey);
    return NextResponse.json({ success: true, transferencias });
  } catch (error: any) {
    console.error("Erro ao listar transferências:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao consultar histórico de transferências." },
      { status: 500 }
    );
  }
}

/**
 * POST: Realiza uma transferência Pix da subconta para uma chave Pix externa
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      userId,
      value,
      pixAddressKey,
      pixAddressKeyType = "CPF",
      description,
    } = body;

    if (!userId || !value || !pixAddressKey) {
      return NextResponse.json(
        { error: "Campos obrigatórios não informados (usuário, valor, chave Pix)." },
        { status: 400 }
      );
    }

    const valorNumerico = Number(value);
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      return NextResponse.json(
        { error: "Informe um valor numérico positivo para a transferência." },
        { status: 400 }
      );
    }

    const userSnap = await getDoc(doc(db, "users", userId));
    if (!userSnap.exists()) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    const apiKey = userSnap.data().asaasApiKey;
    if (!apiKey) {
      return NextResponse.json({ error: "Subconta não configurada para este promotor." }, { status: 400 });
    }

    // 1. Verifica saldo disponível da subconta antes de transferir
    const saldo = await consultarSaldoSubcontaAsaas(apiKey);
    if (!saldo || !("balance" in saldo)) {
      return NextResponse.json(
        { error: "Subconta desautorizada ou com credenciais inválidas no Asaas." },
        { status: 400 }
      );
    }
    const saldoDisponivel = saldo.balance || 0;

    if (valorNumerico > saldoDisponivel) {
      return NextResponse.json(
        {
          error: `Saldo disponível insuficiente (R$ ${saldoDisponivel.toFixed(2).replace(".", ",")}). Não é possível transferir R$ ${valorNumerico.toFixed(2).replace(".", ",")}.`,
        },
        { status: 400 }
      );
    }

    // 2. Executa a transferência Pix na API do Asaas
    const resultado = await transferirPixSubconta(apiKey, {
      value: valorNumerico,
      pixAddressKey,
      pixAddressKeyType,
      description: description || "Transferência de saldo Céos System",
    });

    return NextResponse.json({
      success: true,
      message: "Transferência Pix realizada com sucesso!",
      transferencia: resultado,
    });
  } catch (error: any) {
    console.error("Erro ao realizar transferência Pix:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao processar transferência Pix no Asaas." },
      { status: 400 }
    );
  }
}
