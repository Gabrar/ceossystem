import { NextResponse } from "next/server";
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { criarOuBuscarClienteAsaas, criarCobrancaAsaas } from "@/lib/asaas";

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

    // 3. Integração com Asaas
    const apiKey = process.env.ASAAS_API_KEY;

    if (!apiKey) {
      // Se a chave não estiver no .env.local, avisa amigavelmente
      return NextResponse.json({
        success: true,
        gratuito: false,
        semChaveAsaas: true,
        inscricaoId: docRef.id,
        codigoIngresso,
        message:
          "Inscrição registrada como Pendente. Para ativar o redirecionamento ao Asaas, configure a ASAAS_API_KEY no arquivo .env.local.",
      });
    }

    try {
      // 3.1 Busca ou cria o cliente no Asaas
      const clienteAsaasId = await criarOuBuscarClienteAsaas({
        nome,
        cpf,
        email,
        telefone,
        cep,
        endereco,
        numero,
        complemento,
        bairro,
      });

      // 3.2 Cria a cobrança no Asaas com link de checkout
      const cobranca = await criarCobrancaAsaas({
        clienteId: clienteAsaasId,
        valor: valorNumerico,
        descricao: `Inscrição - ${eventoTitulo || "Evento"} - Lote: ${loteNome || "Padrão"}`,
        inscricaoId: docRef.id,
      });

      // 3.3 Atualiza a inscrição no Firestore com os dados do Asaas
      await updateDoc(doc(db, "inscricoes", docRef.id), {
        asaasCustomerId: clienteAsaasId,
        asaasPaymentId: cobranca.id,
        asaasInvoiceUrl: cobranca.invoiceUrl,
        asaasDueDate: cobranca.dueDate,
        asaasStatus: cobranca.status,
      });

      return NextResponse.json({
        success: true,
        gratuito: false,
        checkoutUrl: cobranca.invoiceUrl,
        inscricaoId: docRef.id,
        paymentId: cobranca.id,
        codigoIngresso,
      });
    } catch (asaasErr: any) {
      console.error("Erro na chamada da API Asaas:", asaasErr);
      return NextResponse.json(
        {
          error: asaasErr.message || "Erro ao conectar com o gateway Asaas.",
          inscricaoId: docRef.id,
        },
        { status: 502 }
      );
    }
  } catch (error: any) {
    console.error("Erro interno ao processar inscrição:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao processar sua inscrição." },
      { status: 500 }
    );
  }
}
