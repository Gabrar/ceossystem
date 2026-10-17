import { NextResponse } from "next/server";
import { collection, addDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { criarOuBuscarClienteAsaas, criarCobrancaAsaas, SplitItemAsaas } from "@/lib/asaas";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      eventoId,
      eventoTitulo,
      userId,
      nome,
      email,
      cpf,
      telefone,
      instituicao,
      curso,
      pais,
      estado,
      cidade,
      cep,
      endereco,
      numero,
      complemento,
      bairro,
      tipoParticipante,
      areaAtuacao,
      loteNome,
      valorOriginal,
      valorFinal,
      codigoDesconto,
    } = body;

    if (!eventoId || !userId || !nome || !email || !cpf) {
      return NextResponse.json(
        { error: "Dados obrigatórios não fornecidos (nome, e-mail, CPF, evento)." },
        { status: 400 }
      );
    }

    // Normaliza o valor para número
    let valorNumerico = 0;
    if (typeof valorFinal === "number") {
      valorNumerico = valorFinal;
    } else if (valorFinal) {
      const parsed = parseFloat(
        String(valorFinal).replace("R$", "").replace(/\s/g, "").replace(",", ".")
      );
      if (!isNaN(parsed)) valorNumerico = parsed;
    }

    const codigoIngresso = `CEOS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // 1. Caso seja Gratuito (R$ 0,00)
    if (valorNumerico <= 0) {
      const novaInscricaoGratuita = {
        eventoId,
        eventoTitulo: eventoTitulo || "Evento Científico",
        userId,
        userEmail: email,
        userName: nome,
        nome,
        email,
        cpf,
        userCpf: cpf,
        telefone: telefone || "",
        instituicao: instituicao || "",
        curso: curso || "",
        pais: pais || "Brasil",
        estado: estado || "",
        cidade: cidade || "",
        cep: cep || "",
        endereco: endereco || "",
        numero: numero || "",
        complemento: complemento || "",
        bairro: bairro || "",
        tipoParticipante: tipoParticipante || "Geral",
        areaAtuacao: areaAtuacao || "",
        lote: loteNome || "Inscrição Geral",
        valor: "0,00",
        valorNumerico: 0,
        status: "Confirmada",
        statusNormalizado: "Confirmada",
        codigoIngresso,
        codigoDesconto: codigoDesconto || null,
        createdAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, "inscricoes"), novaInscricaoGratuita);

      return NextResponse.json({
        success: true,
        gratuito: true,
        inscricaoId: docRef.id,
        codigoIngresso,
        message: "Inscrição gratuita confirmada com sucesso!",
      });
    }

    // 2. Inscrição com Pagamento (> R$ 0,00) -> Status inicial "Pendente"
    const novaInscricaoPendente = {
      eventoId,
      eventoTitulo: eventoTitulo || "Evento Científico",
      userId,
      userEmail: email,
      userName: nome,
      nome,
      email,
      cpf,
      userCpf: cpf,
      telefone: telefone || "",
      instituicao: instituicao || "",
      curso: curso || "",
      pais: pais || "Brasil",
      estado: estado || "",
      cidade: cidade || "",
      cep: cep || "",
      endereco: endereco || "",
      numero: numero || "",
      complemento: complemento || "",
      bairro: bairro || "",
      tipoParticipante: tipoParticipante || "Geral",
      areaAtuacao: areaAtuacao || "",
      lote: loteNome || "Lote Padrão",
      valorOriginal: valorOriginal || valorNumerico,
      valor: valorNumerico.toFixed(2).replace(".", ","),
      valorNumerico,
      status: "Pendente",
      statusNormalizado: "Pendente",
      codigoIngresso,
      codigoDesconto: codigoDesconto || null,
      gateway: "asaas",
      createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, "inscricoes"), novaInscricaoPendente);

    // 3. Identifica o Promotor do Evento e sua Subconta Asaas
    let promotorUserId: string | null = null;
    let subcontaApiKey: string | null = null;
    let subcontaWalletId: string | null = null;
    let subcontaAccountId: string | null = null;

    try {
      const eventDocSnap = await getDoc(doc(db, "events", eventoId));
      if (eventDocSnap.exists()) {
        const eventData = eventDocSnap.data();
        promotorUserId = eventData.userId || null;

        if (promotorUserId) {
          const promotorSnap = await getDoc(doc(db, "users", promotorUserId));
          if (promotorSnap.exists()) {
            const pData = promotorSnap.data();
            const subcontaValida =
              pData.asaasStatus !== "ENCERRADA" &&
              !pData.asaasContaEncerrada;

            if (subcontaValida) {
              subcontaApiKey = pData.asaasApiKey || null;
              subcontaWalletId = pData.asaasWalletId || null;
              subcontaAccountId = pData.asaasAccountId || null;
            }
          }
        }
      }
    } catch (errBuscaPromotor) {
      console.warn("Aviso ao buscar dados da subconta do promotor:", errBuscaPromotor);
    }

    // Determina qual chave Asaas utilizar:
    // Se o promotor possuir subconta, usa a apiKey exclusiva dele.
    // Senão, recorre à ASAAS_API_KEY da plataforma configurada no .env.local
    const apiKeyFinal = subcontaApiKey || process.env.ASAAS_API_KEY;

    if (!apiKeyFinal) {
      return NextResponse.json({
        success: true,
        gratuito: false,
        semChaveAsaas: true,
        inscricaoId: docRef.id,
        codigoIngresso,
        message:
          "Inscrição registrada como Pendente. O promotor do evento ou a plataforma ainda não configuraram sua conta Asaas.",
      });
    }

    try {
      // 3.1 Busca ou cria o cliente pagador no Asaas (na conta-filha do promotor ou na principal)
      const clienteAsaasId = await criarOuBuscarClienteAsaas(
        {
          nome,
          cpf,
          email,
          telefone,
          cep,
          endereco,
          numero,
          complemento,
          bairro,
        },
        apiKeyFinal
      );

      // 3.2 Se a cobrança for emitida na subconta do promotor E a Céos System tiver taxa/split definida
      let splitConfig: SplitItemAsaas[] | undefined = undefined;
      const comissaoPercent = parseFloat(
        String(process.env.CEOS_COMMISSION_PERCENTAGE || "0").replace("%", "").trim()
      );
      const walletIdMae = process.env.ASAAS_WALLET_ID;

      if (subcontaApiKey && walletIdMae && !isNaN(comissaoPercent) && comissaoPercent > 0) {
        splitConfig = [
          {
            walletId: walletIdMae,
            percentualValue: comissaoPercent,
            description: `Comissão da Plataforma Céos System (${comissaoPercent}%)`,
          },
        ];
      }

      // 3.3 Cria a cobrança no Asaas com checkout seguro (Pix, Cartão, Boleto)
      const cobranca = await criarCobrancaAsaas(
        {
          clienteId: clienteAsaasId,
          valor: valorNumerico,
          descricao: `Inscrição - ${eventoTitulo || "Evento"} - Lote: ${loteNome || "Padrão"}`,
          inscricaoId: docRef.id,
        },
        apiKeyFinal,
        splitConfig
      );

      // 3.4 Atualiza a inscrição no Firestore com os dados do Asaas
      await updateDoc(doc(db, "inscricoes", docRef.id), {
        asaasCustomerId: clienteAsaasId,
        asaasPaymentId: cobranca.id,
        asaasInvoiceUrl: cobranca.invoiceUrl,
        asaasDueDate: cobranca.dueDate,
        asaasStatus: cobranca.status,
        promotorUserId: promotorUserId || null,
        subcontaAccountId: subcontaAccountId || null,
        subcontaWalletId: subcontaWalletId || null,
        splitAtivo: Boolean(splitConfig && splitConfig.length > 0),
        comissaoPercentual: splitConfig ? comissaoPercent : 0,
      });

      return NextResponse.json({
        success: true,
        gratuito: false,
        checkoutUrl: cobranca.invoiceUrl,
        inscricaoId: docRef.id,
        paymentId: cobranca.id,
        codigoIngresso,
        subcontaUtilizada: Boolean(subcontaAccountId),
      });
    } catch (asaasErr: unknown) {
      console.error("Erro na chamada da API Asaas:", asaasErr);
      const msg = asaasErr instanceof Error ? asaasErr.message : "Erro ao conectar com o gateway Asaas.";
      return NextResponse.json(
        {
          error: msg,
          inscricaoId: docRef.id,
        },
        { status: 502 }
      );
    }
  } catch (error: unknown) {
    console.error("Erro interno ao processar inscrição:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao processar sua inscrição." },
      { status: 500 }
    );
  }
}
