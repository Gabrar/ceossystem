import { NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  listarChavesPixSubconta,
  criarChavePixSubconta,
  removerChavePixSubconta,
  getAsaasBaseUrl,
} from "@/lib/asaas";

/**
 * GET: Lista as chaves Pix cadastradas na subconta do promotor
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

    const chaves = await listarChavesPixSubconta(apiKey);
    return NextResponse.json({ success: true, chaves });
  } catch (error: any) {
    console.error("Erro ao listar chaves Pix:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao consultar chaves Pix no Asaas." },
      { status: 500 }
    );
  }
}

/**
 * POST: Cadastra uma nova chave Pix na subconta (padrão EVP / aleatória)
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, type = "EVP" } = body;

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

    const novaChave = await criarChavePixSubconta(apiKey, type);
    return NextResponse.json({
      success: true,
      message: "Chave Pix cadastrada com sucesso!",
      chave: novaChave,
    });
  } catch (error: any) {
    console.error("Erro ao cadastrar chave Pix:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao cadastrar chave Pix no Asaas." },
      { status: 400 }
    );
  }
}

/**
 * DELETE: Remove uma chave Pix cadastrada
 */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const keyId = searchParams.get("keyId");

    if (!userId || !keyId) {
      return NextResponse.json({ error: "Parâmetros userId e keyId obrigatórios." }, { status: 400 });
    }

    const userSnap = await getDoc(doc(db, "users", userId));
    if (!userSnap.exists()) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    const apiKey = userSnap.data().asaasApiKey;
    if (!apiKey) {
      return NextResponse.json({ error: "Subconta não configurada para este promotor." }, { status: 400 });
    }

    await removerChavePixSubconta(apiKey, keyId);
    return NextResponse.json({
      success: true,
      message: "Chave Pix removida com sucesso!",
    });
  } catch (error: any) {
    console.error("Erro ao remover chave Pix:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao remover chave Pix no Asaas." },
      { status: 400 }
    );
  }
}
