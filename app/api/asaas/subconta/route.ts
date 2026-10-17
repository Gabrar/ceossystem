import { NextResponse } from "next/server";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  criarSubcontaAsaas,
  consultarSubcontaAsaas,
  consultarSaldoSubcontaAsaas,
  consultarDocumentosSubcontaAsaas,
  configurarWebhookSubcontaAsaas,
  reenviarLinkAtivacaoSubconta,
} from "@/lib/asaas";

/**
 * GET: Consulta o status e saldo da subconta do promotor logado
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "Identificador de usuário não informado." },
        { status: 400 }
      );
    }

    // Busca dados no Firestore (coleção users ou subcontas_asaas)
    const userDocRef = doc(db, "users", userId);
    const userSnap = await getDoc(userDocRef);

    if (!userSnap.exists()) {
      return NextResponse.json({ exists: false, error: "Usuário não encontrado." }, { status: 404 });
    }

    const userData = userSnap.data();
    const asaasAccountId = userData.asaasAccountId;
    const asaasWalletId = userData.asaasWalletId;
    const asaasApiKey = userData.asaasApiKey;

    if (!asaasAccountId || !asaasApiKey) {
      return NextResponse.json({
        exists: false,
        message: "Promotor ainda não possui subconta configurada no Asaas.",
      });
    }

    // Busca saldo, dados da subconta e documentos/onboardingUrl em tempo real no Asaas
    let saldo: any = null;
    let dadosAsaas: any = null;
    let documentosAsaas: any = null;

    try {
      [saldo, dadosAsaas, documentosAsaas] = await Promise.all([
        consultarSaldoSubcontaAsaas(asaasApiKey),
        consultarSubcontaAsaas(asaasAccountId),
        consultarDocumentosSubcontaAsaas(asaasApiKey),
      ]);
    } catch (e) {
      console.warn("Aviso ao buscar dados em tempo real no Asaas:", e);
    }

    const contaEncerradaOuInvalida = Boolean(
      dadosAsaas?.notFound ||
      dadosAsaas?.status === "ENCERRADA" ||
      dadosAsaas?.status === "INACTIVE" ||
      dadosAsaas?.status === "DISABLED" ||
      dadosAsaas?.status === "CLOSED" ||
      saldo?.unauthorized
    );

    if (contaEncerradaOuInvalida) {
      try {
        await updateDoc(userDocRef, {
          asaasStatus: "ENCERRADA",
          asaasContaEncerrada: true,
          asaasContaEncerradaEm: new Date().toISOString(),
        });
      } catch {}

      return NextResponse.json({
        exists: true,
        accountId: asaasAccountId,
        walletId: asaasWalletId,
        status: "ENCERRADA",
        contaEncerrada: true,
        accountNumber: userData.asaasAccountNumber || null,
        saldo: { balance: 0, paymentInProgressValue: 0 },
        dadosCadastrais: userData.asaasDadosCadastrais || null,
        onboardingUrl: null,
        documentos: [],
        createdAt: userData.asaasCreatedAt || null,
      });
    }

    const listaDocs = documentosAsaas?.data || [];
    const docComOnboarding = listaDocs.find((d: any) => d.onboardingUrl) || null;
    const onboardingUrl = docComOnboarding?.onboardingUrl || documentosAsaas?.onboardingUrl || null;
    const situacaoDocumentos = listaDocs.map((d: any) => ({
      id: d.id,
      title: d.title || d.type,
      status: d.status,
      type: d.type,
      onboardingUrl: d.onboardingUrl,
      rejectReasons: d.rejectReasons || null,
    }));

    const todosAprovados = listaDocs.length > 0 && listaDocs.every((d: any) => d.status === "APPROVED");
    const precisaVerificacao = Boolean(
      onboardingUrl ||
      listaDocs.some((d: any) => d.status === "PENDING" || d.status === "AWAITING_APPROVAL" || d.status === "REJECTED")
    );

    return NextResponse.json({
      exists: true,
      accountId: asaasAccountId,
      walletId: asaasWalletId,
      status: dadosAsaas?.status || userData.asaasStatus || "ACTIVE",
      contaEncerrada: false,
      accountNumber: userData.asaasAccountNumber || dadosAsaas?.accountNumber || null,
      saldo: saldo || { balance: 0, paymentInProgressValue: 0 },
      dadosCadastrais: userData.asaasDadosCadastrais || null,
      onboardingUrl,
      documentos: situacaoDocumentos,
      todosDocumentosAprovados: todosAprovados,
      precisaVerificacao,
      createdAt: userData.asaasCreatedAt || null,
    });
  } catch (error: unknown) {
    console.error("Erro ao buscar subconta Asaas:", error);
    return NextResponse.json(
      { error: "Erro interno ao consultar dados da subconta." },
      { status: 500 }
    );
  }
}

/**
 * POST: Realiza o Onboarding e cria a subconta (conta-filha) no Asaas
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      userId,
      name,
      email,
      cpfCnpj,
      personType,
      birthDate,
      companyType,
      phone,
      mobilePhone,
      address,
      addressNumber,
      complement,
      province,
      postalCode,
      incomeValue,
    } = body;

    if (!userId || !name || !email || !cpfCnpj || !phone || !postalCode || !address) {
      return NextResponse.json(
        { error: "Campos obrigatórios não preenchidos para criação da conta no Asaas." },
        { status: 400 }
      );
    }

    // Verifica se a chave pai do Asaas está configurada
    if (!process.env.ASAAS_API_KEY) {
      return NextResponse.json(
        {
          error:
            "A chave mestre da plataforma (ASAAS_API_KEY) não está configurada no servidor (.env.local). Configure-a antes de criar subcontas.",
        },
        { status: 503 }
      );
    }

    // 1. Cria a subconta na API do Asaas usando a conta-mãe
    const subcontaCriada = await criarSubcontaAsaas({
      name,
      email,
      loginEmail: email,
      cpfCnpj,
      personType: personType || (cpfCnpj.replace(/\D/g, "").length > 11 ? "JURIDICA" : "FISICA"),
      birthDate: birthDate || undefined,
      companyType: companyType || undefined,
      phone,
      mobilePhone: mobilePhone || phone,
      address,
      addressNumber: addressNumber || "S/N",
      complement: complement || "",
      province: province || "Centro",
      postalCode,
      incomeValue: Number(incomeValue) || 1500,
    });

    // 2. Configura automaticamente o webhook do Céos System na subconta
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const webhookUrl = `${appUrl}/api/asaas/webhook`;
    await configurarWebhookSubcontaAsaas(subcontaCriada.apiKey, webhookUrl);

    // 3. Salva os identificadores e a API Key no Firestore com segurança
    const payloadBanco = {
      asaasAccountId: subcontaCriada.id,
      asaasWalletId: subcontaCriada.walletId,
      asaasApiKey: subcontaCriada.apiKey,
      asaasStatus: "ACTIVE",
      asaasAccountNumber: subcontaCriada.accountNumber || null,
      asaasDadosCadastrais: {
        name,
        email,
        cpfCnpj,
        personType: personType || "FISICA",
        phone,
        postalCode,
        address,
        addressNumber,
        complement,
        province,
      },
      asaasCreatedAt: new Date().toISOString(),
    };

    // Atualiza o documento do usuário
    await updateDoc(doc(db, "users", userId), payloadBanco);

    // Também espelha na coleção dedicada 'subcontas_asaas'
    await setDoc(doc(db, "subcontas_asaas", userId), {
      userId,
      ...payloadBanco,
    });

    return NextResponse.json({
      success: true,
      message: "Subconta Asaas criada com sucesso!",
      account: {
        id: subcontaCriada.id,
        walletId: subcontaCriada.walletId,
        accountNumber: subcontaCriada.accountNumber,
      },
    });
  } catch (error: unknown) {
    console.error("Erro ao criar subconta Asaas:", error);
    const msg = error instanceof Error ? error.message : "Erro interno ao criar subconta no Asaas.";
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Desvincula a subconta (reseta do perfil para permitir novo onboarding)
 */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Identificador de usuário não informado." }, { status: 400 });
    }

    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, {
      asaasAccountId: null,
      asaasWalletId: null,
      asaasApiKey: null,
      asaasStatus: null,
      asaasAccountNumber: null,
      asaasDadosCadastrais: null,
      asaasContaEncerrada: null,
      asaasContaEncerradaEm: null,
      subcontaResetadaEm: new Date().toISOString(),
    });

    try {
      await setDoc(doc(db, "subcontas_asaas", userId), {
        userId,
        status: "DESVINCULADA",
        desvinculadoEm: new Date().toISOString(),
      });
    } catch {}

    return NextResponse.json({
      success: true,
      message: "Subconta desvinculada com sucesso. Você já pode cadastrar uma nova subconta.",
    });
  } catch (error: any) {
    console.error("Erro ao desvincular subconta:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao desvincular subconta." },
      { status: 500 }
    );
  }
}

/**
 * PUT: Reenvia o link de ativação da subconta (quando aplicável)
 */
export async function PUT(req: Request) {
  try {
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "Identificador de usuário não informado." }, { status: 400 });
    }

    const userSnap = await getDoc(doc(db, "users", userId));
    if (!userSnap.exists()) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    const accountId = userSnap.data().asaasAccountId;
    if (!accountId) {
      return NextResponse.json({ error: "Subconta não encontrada para este usuário." }, { status: 400 });
    }

    const resAsaas = await reenviarLinkAtivacaoSubconta(accountId);
    return NextResponse.json({
      success: true,
      message: "Link de ativação reenviado com sucesso pelo Asaas para o seu e-mail!",
      data: resAsaas,
    });
  } catch (error: any) {
    console.error("Erro ao reenviar link de ativação:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao reenviar link de ativação no Asaas." },
      { status: 400 }
    );
  }
}

