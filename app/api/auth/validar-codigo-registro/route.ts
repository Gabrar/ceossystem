import { NextResponse } from "next/server";
import { doc, getDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { email, codigo } = await req.json();

    if (!email || !codigo) {
      return NextResponse.json(
        { error: "E-mail e código de verificação são obrigatórios." },
        { status: 400 }
      );
    }

    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedCodigo = codigo.toString().trim().replace(/\D/g, "");

    if (sanitizedCodigo.length !== 6) {
      return NextResponse.json(
        { error: "O código deve conter exatamente 6 dígitos numéricos." },
        { status: 400 }
      );
    }

    const docRef = doc(db, "codigos_verificacao", sanitizedEmail);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json(
        { error: "Nenhum código pendente para este e-mail. Solicite um novo código." },
        { status: 400 }
      );
    }

    const data = docSnap.data();

    // 1. Verifica tempo de expiração (10 minutos)
    const expiresAt = new Date(data?.expiresAt);
    if (new Date() > expiresAt) {
      await deleteDoc(docRef);
      return NextResponse.json(
        { error: "O código expirou. Por favor, solicite um novo código." },
        { status: 400 }
      );
    }

    // 2. Proteção contra força bruta (máximo de 5 tentativas)
    const tentativasAtuais = data?.tentativas || 0;
    if (tentativasAtuais >= 5) {
      await deleteDoc(docRef);
      return NextResponse.json(
        { error: "Muitas tentativas incorretas. Por segurança, solicite um novo código." },
        { status: 429 }
      );
    }

    // 3. Validação do código por Hash
    const salt = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "ceos_auth_salt_secret";
    const inputHash = crypto.createHash("sha256").update(sanitizedCodigo + salt).digest("hex");

    if (inputHash !== data?.codigoHash) {
      const novasTentativas = tentativasAtuais + 1;
      await updateDoc(docRef, { tentativas: novasTentativas });

      const restantes = 5 - novasTentativas;
      return NextResponse.json(
        {
          error: `Código incorreto. ${
            restantes > 0
              ? `Você ainda tem ${restantes} tentativa(s).`
              : "Limite de tentativas excedido. Solicite um novo código."
          }`,
        },
        { status: 400 }
      );
    }

    // 4. Código correto! Exclui o documento para não ser reutilizado
    await deleteDoc(docRef);

    return NextResponse.json({
      success: true,
      verified: true,
      message: "E-mail verificado com sucesso!",
    });
  } catch (error: any) {
    console.error("[validar-codigo-registro] Erro interno:", error);
    return NextResponse.json(
      { error: "Erro interno ao validar o código. Tente novamente." },
      { status: 500 }
    );
  }
}
