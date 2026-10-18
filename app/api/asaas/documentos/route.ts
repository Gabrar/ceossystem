import { NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { enviarDocumentoSubcontaAsaas } from "@/lib/asaas";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const userId = formData.get("userId") as string;
    const documentId = formData.get("documentId") as string;
    const type = formData.get("type") as string;
    const file = formData.get("file") as File | null;

    if (!userId || !documentId || !type || !file) {
      return NextResponse.json(
        { error: "Parâmetros obrigatórios ausentes (userId, documentId, type, file)." },
        { status: 400 }
      );
    }

    // Busca a chave de API da subconta no Firestore
    const userDocSnap = await getDoc(doc(db, "users", userId));
    if (!userDocSnap.exists()) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    const userData = userDocSnap.data();
    const subcontaApiKey = userData.asaasApiKey;

    if (!subcontaApiKey) {
      return NextResponse.json(
        { error: "Subconta não configurada para este usuário." },
        { status: 400 }
      );
    }

    const resultado = await enviarDocumentoSubcontaAsaas(
      subcontaApiKey,
      documentId,
      type,
      file,
      file.name
    );

    return NextResponse.json({
      success: true,
      message: "Documento enviado com sucesso para análise do Asaas!",
      resultado,
    });
  } catch (error: unknown) {
    console.error("Erro ao enviar documento para o Asaas:", error);
    const msg = error instanceof Error ? error.message : "Erro interno ao enviar documento.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
