/**
 * Cliente de Integração com a API do Asaas (Sandbox / Produção)
 */

const getAsaasBaseUrl = () => {
  const env = process.env.ASAAS_ENVIRONMENT?.toLowerCase();
  if (env === "production" || env === "prod") {
    return "https://api.asaas.com/v3";
  }
  return "https://sandbox.asaas.com/v3";
};

const getAsaasHeaders = () => {
  const apiKey = process.env.ASAAS_API_KEY || "";
  return {
    "Content-Type": "application/json",
    access_token: apiKey,
  };
};

export interface DadosClienteAsaas {
  nome: string;
  cpf: string;
  email: string;
  telefone?: string;
  cep?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
}

export interface DadosCobrancaAsaas {
  clienteId: string;
  valor: number;
  descricao: string;
  inscricaoId: string;
  diasVencimento?: number;
}

export interface RespostaCobrancaAsaas {
  id: string;
  invoiceUrl: string;
  status: string;
  value: number;
  dueDate: string;
}

/**
 * Busca ou cadastra um cliente no Asaas a partir do CPF ou e-mail
 */
export async function criarOuBuscarClienteAsaas(
  dados: DadosClienteAsaas
): Promise<string> {
  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey) {
    throw new Error("ASAAS_API_KEY não configurada no ambiente.");
  }

  const baseUrl = getAsaasBaseUrl();
  const headers = getAsaasHeaders();
  const cpfLimpo = dados.cpf.replace(/\D/g, "");
  const telLimpo = (dados.telefone || "").replace(/\D/g, "");
  const cepLimpo = (dados.cep || "").replace(/\D/g, "");

  // 1. Tenta buscar cliente existente pelo CPF
  if (cpfLimpo) {
    try {
      const resBusca = await fetch(
        `${baseUrl}/customers?cpfCnpj=${cpfLimpo}`,
        { method: "GET", headers }
      );
      if (resBusca.ok) {
        const jsonBusca = await resBusca.json();
        if (jsonBusca.data && jsonBusca.data.length > 0) {
          return jsonBusca.data[0].id;
        }
      }
    } catch (e) {
      console.warn("Aviso ao buscar cliente por CPF no Asaas:", e);
    }
  }

  // 2. Se não encontrou, tenta buscar por e-mail
  if (dados.email) {
    try {
      const resBuscaEmail = await fetch(
        `${baseUrl}/customers?email=${encodeURIComponent(dados.email)}`,
        { method: "GET", headers }
      );
      if (resBuscaEmail.ok) {
        const jsonEmail = await resBuscaEmail.json();
        if (jsonEmail.data && jsonEmail.data.length > 0) {
          return jsonEmail.data[0].id;
        }
      }
    } catch (e) {
      console.warn("Aviso ao buscar cliente por e-mail no Asaas:", e);
    }
  }

  // 3. Cadastra novo cliente no Asaas
  const payload: any = {
    name: dados.nome,
    email: dados.email,
  };

  if (cpfLimpo) payload.cpfCnpj = cpfLimpo;
  if (telLimpo) {
    payload.phone = telLimpo;
    payload.mobilePhone = telLimpo;
  }
  if (cepLimpo) payload.postalCode = cepLimpo;
  if (dados.endereco) payload.address = dados.endereco;
  if (dados.numero) payload.addressNumber = dados.numero;
  if (dados.complemento) payload.complement = dados.complemento;
  if (dados.bairro) payload.province = dados.bairro;

  const resCriar = await fetch(`${baseUrl}/customers`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const jsonCriar = await resCriar.json();
  if (!resCriar.ok) {
    const msgErro =
      jsonCriar.errors?.[0]?.description ||
      jsonCriar.message ||
      "Falha ao cadastrar cliente no Asaas.";
    throw new Error(msgErro);
  }

  return jsonCriar.id;
}

/**
 * Cria uma cobrança com link de checkout seguro (PIX, Cartão e Boleto) no Asaas
 */
export async function criarCobrancaAsaas(
  dados: DadosCobrancaAsaas
): Promise<RespostaCobrancaAsaas> {
  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey) {
    throw new Error("ASAAS_API_KEY não configurada no ambiente.");
  }

  const baseUrl = getAsaasBaseUrl();
  const headers = getAsaasHeaders();

  // Data de vencimento: padrão 3 dias a partir de hoje
  const dataVenc = new Date();
  dataVenc.setDate(dataVenc.getDate() + (dados.diasVencimento || 3));
  const dueDateStr = dataVenc.toISOString().split("T")[0];

  const payload = {
    customer: dados.clienteId,
    billingType: "UNDEFINED", // Permite ao participante escolher Pix, Cartão ou Boleto no Asaas
    value: dados.valor,
    dueDate: dueDateStr,
    description: dados.descricao,
    externalReference: dados.inscricaoId,
    postalService: false,
  };

  const res = await fetch(`${baseUrl}/payments`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  if (!res.ok) {
    const msgErro =
      json.errors?.[0]?.description ||
      json.message ||
      "Falha ao gerar cobrança no Asaas.";
    throw new Error(msgErro);
  }

  return {
    id: json.id,
    invoiceUrl: json.invoiceUrl,
    status: json.status,
    value: json.value,
    dueDate: json.dueDate,
  };
}

/**
 * Consulta o status de um pagamento no Asaas pelo ID
 */
export async function consultarCobrancaAsaas(paymentId: string) {
  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey) return null;

  const baseUrl = getAsaasBaseUrl();
  const headers = getAsaasHeaders();

  try {
    const res = await fetch(`${baseUrl}/payments/${paymentId}`, {
      method: "GET",
      headers,
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error(`Erro ao consultar pagamento Asaas ${paymentId}:`, e);
  }
  return null;
}
