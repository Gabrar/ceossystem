import { NextResponse } from "next/server";
import { collection, query, where, getDocs, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import crypto from "crypto";
import { enviarCodigoVerificacao } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const { email, nome } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Por favor, informe um endereço de e-mail válido." },
        { status: 400 }
      );
    }

    const sanitizedEmail = email.trim().toLowerCase();

    // 1. Verifica se o e-mail já existe na coleção de usuários do Firebase
    const q = query(collection(db, "users"), where("email", "==", sanitizedEmail));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return NextResponse.json(
        { error: "Este endereço de e-mail já possui uma conta cadastrada. Tente fazer login." },
        { status: 400 }
      );
    }

    // 2. Gera código numérico de 6 dígitos (100000 a 999999)
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Salva hash seguro do código com salt para proteção no Firestore
    const salt = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "ceos_auth_salt_secret";
    const codigoHash = crypto.createHash("sha256").update(codigo + salt).digest("hex");

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // Validade de 10 minutos

    await setDoc(doc(db, "codigos_verificacao", sanitizedEmail), {
      email: sanitizedEmail,
      codigoHash,
      expiresAt: expiresAt.toISOString(),
      tentativas: 0,
      createdAt: new Date().toISOString(),
    });

    // 4. Dispara envio através do EmailJS
    const resultadoEnvio = await enviarCodigoVerificacao({
      para: sanitizedEmail,
      nomeDestinatario: nome,
      assunto: `Seu código de confirmação Céos System: ${codigo}`,
      codigo,
    });

    return NextResponse.json({
      success: true,
      emailEnviado: resultadoEnvio.sucesso,
      metodo: resultadoEnvio.metodo,
      message: "Código de verificação enviado com sucesso.",
    });
  } catch (error: any) {
    console.error("[enviar-codigo-registro] Erro interno:", error);
    return NextResponse.json(
      { error: "Erro interno ao gerar o código de verificação. Tente novamente." },
      { status: 500 }
    );
  }
}
