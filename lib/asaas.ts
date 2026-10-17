/**
 * Cliente de Integração com a API do Asaas (Sandbox / Produção)
 * Suporte completo a Contas-Pai e Contas-Filho (Subcontas / White Label)
 */

export const getAsaasBaseUrl = () => {
  const env = process.env.ASAAS_ENVIRONMENT?.toLowerCase();
  if (env === "production" || env === "prod") {
    return "https://api.asaas.com/v3";
  }
  return "https://sandbox.asaas.com/v3";
};

export const getAsaasHeaders = (customApiKey?: string) => {
  const apiKey = customApiKey || process.env.ASAAS_API_KEY || "";
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

export interface SplitItemAsaas {
  walletId: string;
  fixedValue?: number;
  percentualValue?: number;
  description?: string;
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

export interface DadosSubcontaAsaas {
  name: string;
  email: string;
  loginEmail?: string;
  cpfCnpj: string;
  personType: "FISICA" | "JURIDICA";
  birthDate?: string; // Obrigatório para Pessoa Física no Asaas (YYYY-MM-DD)
  companyType?: "MEI" | "LIMITED" | "INDIVIDUAL" | "ASSOCIATION";
  phone: string;
  mobilePhone: string;
  address: string;
  addressNumber: string;
  complement?: string;
  province: string; // Bairro
  postalCode: string; // CEP
  incomeValue: number; // Renda mensal ou faturamento estimado
}

export interface RespostaCriacaoSubcontaAsaas {
  id: string;
  name: string;
  email: string;
  loginEmail: string;
  cpfCnpj: string;
  walletId: string;
  apiKey: string; // ATENÇÃO: Retornado pelo Asaas exclusivamente no momento da criação
  accountNumber?: {
    agency: string;
    account: string;
    accountDigit: string;
  };
}

export interface SaldoSubcontaAsaas {
  balance: number;
  paymentInProgressValue?: number;
  transferFee?: number;
}

/**
 * Cria uma Conta-Filha (Subconta) no Asaas via API da Conta-Pai
 */
export async function criarSubcontaAsaas(
  dados: DadosSubcontaAsaas
): Promise<RespostaCriacaoSubcontaAsaas> {
  const apiKeyPai = process.env.ASAAS_API_KEY;
  if (!apiKeyPai) {
    throw new Error("ASAAS_API_KEY da conta-pai não configurada no ambiente.");
  }

  const baseUrl = getAsaasBaseUrl();
  const headers = getAsaasHeaders(apiKeyPai);

  const cpfCnpjLimpo = dados.cpfCnpj.replace(/\D/g, "");
  const cepLimpo = dados.postalCode.replace(/\D/g, "");
  const telLimpo = dados.phone.replace(/\D/g, "");
  const celLimpo = (dados.mobilePhone || dados.phone).replace(/\D/g, "");

  const payload: Record<string, unknown> = {
    name: dados.name,
    email: dados.email,
    loginEmail: dados.loginEmail || dados.email,
    cpfCnpj: cpfCnpjLimpo,
    personType: dados.personType,
    phone: telLimpo,
    mobilePhone: celLimpo,
    postalCode: cepLimpo,
    address: dados.address,
    addressNumber: dados.addressNumber,
    complement: dados.complement || "",
    province: dados.province,
    incomeValue: Number(dados.incomeValue) || 1000,
  };

  if (dados.personType === "FISICA" && dados.birthDate) {
    payload.birthDate = dados.birthDate;
  }

  if (dados.personType === "JURIDICA" && dados.companyType) {
    payload.companyType = dados.companyType;
  }

  const res = await fetch(`${baseUrl}/accounts`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  if (!res.ok) {
    const msgErro =
      json.errors?.[0]?.description ||
      json.message ||
      "Falha ao criar subconta no Asaas.";
    throw new Error(msgErro);
  }

  return {
    id: json.id,
    name: json.name,
    email: json.email,
    loginEmail: json.loginEmail,
    cpfCnpj: json.cpfCnpj,
    walletId: json.walletId,
    apiKey: json.apiKey,
    accountNumber: json.accountNumber,
  };
}

/**
 * Consulta informações e status da Subconta no Asaas usando a chave da Conta-Pai
 */
export async function consultarSubcontaAsaas(subcontaId: string) {
  const apiKeyPai = process.env.ASAAS_API_KEY;
  if (!apiKeyPai) return null;

  const baseUrl = getAsaasBaseUrl();
  const headers = getAsaasHeaders(apiKeyPai);

  try {
    const res = await fetch(`${baseUrl}/accounts/${subcontaId}`, {
      method: "GET",
      headers,
    });
    if (res.ok) {
      return await res.json();
    }
    if (res.status === 404) {
      return { notFound: true, status: "ENCERRADA" };
    }
    const errBody = await res.json().catch(() => ({}));
    return { error: true, status: "INACTIVE", errBody };
  } catch (e) {
    console.error(`Erro ao consultar subconta ${subcontaId}:`, e);
  }
  return null;
}

/**
 * Consulta o saldo financeiro em tempo real da Subconta
 */
export async function consultarSaldoSubcontaAsaas(
  subcontaApiKey: string
): Promise<SaldoSubcontaAsaas | { unauthorized?: boolean } | null> {
  if (!subcontaApiKey) return null;

  const baseUrl = getAsaasBaseUrl();
  const headers = getAsaasHeaders(subcontaApiKey);

  try {
    const res = await fetch(`${baseUrl}/finance/balance`, {
      method: "GET",
      headers,
    });
    if (res.ok) {
      return await res.json();
    }
    if (res.status === 401) {
      return { unauthorized: true };
    }
  } catch (e) {
    console.error("Erro ao consultar saldo da subconta Asaas:", e);
  }
  return null;
}

/**
 * Consulta a lista de documentos e o link de onboarding facial/documental da subconta
 */
export async function consultarDocumentosSubcontaAsaas(subcontaApiKey: string) {
  if (!subcontaApiKey) return null;

  const baseUrl = getAsaasBaseUrl();
  const headers = getAsaasHeaders(subcontaApiKey);

  try {
    const res = await fetch(`${baseUrl}/myAccount/documents`, {
      method: "GET",
      headers,
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error("Erro ao consultar documentos da subconta Asaas:", e);
  }
  return null;
}

/**
 * Configura o Webhook de notificações na Subconta para apontar para o Céos System
 */
export async function configurarWebhookSubcontaAsaas(
  subcontaApiKey: string,
  urlWebhook: string
) {
  if (!subcontaApiKey || !urlWebhook) return false;

  const baseUrl = getAsaasBaseUrl();
  const headers = getAsaasHeaders(subcontaApiKey);

  const payload = {
    name: "Webhook Céos System",
    url: urlWebhook,
    email: "notificacoes@ceossystem.com",
    enabled: true,
    interrupted: false,
    apiVersion: 3,
    sendType: "SEQUENTIALLY",
    events: [
      "PAYMENT_CREATED",
      "PAYMENT_CONFIRMED",
      "PAYMENT_RECEIVED",
      "PAYMENT_OVERDUE",
      "PAYMENT_DELETED",
      "PAYMENT_REFUNDED",
      "PAYMENT_CHARGEBACK_REQUESTED",
      "ACCOUNT_STATUS_DOCUMENT_APPROVED",
      "ACCOUNT_STATUS_DOCUMENT_AWAITING_APPROVAL",
      "ACCOUNT_STATUS_DOCUMENT_PENDING",
      "ACCOUNT_STATUS_DOCUMENT_REJECTED",
      "ACCOUNT_STATUS_GENERAL_APPROVAL_APPROVED",
      "ACCOUNT_STATUS_GENERAL_APPROVAL_AWAITING_APPROVAL",
      "ACCOUNT_STATUS_GENERAL_APPROVAL_REJECTED",
    ],
  };

  try {
    const res = await fetch(`${baseUrl}/webhooks`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (e) {
    console.warn("Aviso ao configurar webhook na subconta Asaas:", e);
    return false;
  }
}

/**
 * Busca ou cadastra um cliente no Asaas a partir do CPF ou e-mail
 * Permite passar customApiKey para operar na subconta do promotor
 */
export async function criarOuBuscarClienteAsaas(
  dados: DadosClienteAsaas,
  customApiKey?: string
): Promise<string> {
  const token = customApiKey || process.env.ASAAS_API_KEY;
  if (!token) {
    throw new Error("Chave do Asaas não configurada.");
  }

  const baseUrl = getAsaasBaseUrl();
  const headers = getAsaasHeaders(token);
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
  const payload: Record<string, unknown> = {
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
 * Suporta emissão na subconta do promotor e aplicação de split de taxa para a Céos System
 */
export async function criarCobrancaAsaas(
  dados: DadosCobrancaAsaas,
  customApiKey?: string,
  split?: SplitItemAsaas[]
): Promise<RespostaCobrancaAsaas> {
  const token = customApiKey || process.env.ASAAS_API_KEY;
  if (!token) {
    throw new Error("Chave do Asaas não configurada.");
  }

  const baseUrl = getAsaasBaseUrl();
  const headers = getAsaasHeaders(token);

  // Data de vencimento: padrão 3 dias a partir de hoje
  const dataVenc = new Date();
  dataVenc.setDate(dataVenc.getDate() + (dados.diasVencimento || 3));
  const dueDateStr = dataVenc.toISOString().split("T")[0];

  const payload: Record<string, unknown> = {
    customer: dados.clienteId,
    billingType: "UNDEFINED", // Permite ao participante escolher Pix, Cartão ou Boleto
    value: dados.valor,
    dueDate: dueDateStr,
    description: dados.descricao,
    externalReference: dados.inscricaoId,
    postalService: false,
  };

  // Se houver divisão de pagamento (Split)
  if (split && split.length > 0) {
    payload.split = split;
  }

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
export async function consultarCobrancaAsaas(
  paymentId: string,
  customApiKey?: string
) {
  const token = customApiKey || process.env.ASAAS_API_KEY;
  if (!token) return null;

  const baseUrl = getAsaasBaseUrl();
  const headers = getAsaasHeaders(token);

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

/**
 * ==========================================
 * MÓDULO PIX & TRANSFERÊNCIAS (WHITE LABEL)
 * ==========================================
 */

/**
 * Lista as chaves Pix cadastradas na subconta
 */
export async function listarChavesPixSubconta(subcontaApiKey: string) {
  if (!subcontaApiKey) return [];

  const baseUrl = getAsaasBaseUrl();
  const headers = getAsaasHeaders(subcontaApiKey);

  try {
    const res = await fetch(`${baseUrl}/pix/addressKeys`, {
      method: "GET",
      headers,
    });
    if (res.ok) {
      const json = await res.json();
      return json.data || [];
    }
    const err = await res.json();
    throw new Error(err.errors?.[0]?.description || "Erro ao listar chaves Pix.");
  } catch (e: any) {
    console.error("Erro ao listar chaves Pix Asaas:", e);
    throw e;
  }
}

/**
 * Cria uma nova Chave Pix EVP (aleatória) para a subconta
 */
export async function criarChavePixSubconta(
  subcontaApiKey: string,
  type: "EVP" | "CPF" | "CNPJ" | "EMAIL" | "PHONE" = "EVP"
) {
  if (!subcontaApiKey) throw new Error("Chave da subconta não fornecida.");

  const baseUrl = getAsaasBaseUrl();
  const headers = getAsaasHeaders(subcontaApiKey);

  const res = await fetch(`${baseUrl}/pix/addressKeys`, {
    method: "POST",
    headers,
    body: JSON.stringify({ type }),
  });

  const json = await res.json();
  if (!res.ok) {
    const msg = json.errors?.[0]?.description || json.message || "Erro ao cadastrar chave Pix.";
    throw new Error(msg);
  }

  return json;
}

/**
 * Remove uma Chave Pix cadastrada na subconta
 */
export async function removerChavePixSubconta(
  subcontaApiKey: string,
  chaveId: string
) {
  if (!subcontaApiKey || !chaveId) throw new Error("Parâmetros inválidos para remoção de chave Pix.");

  const baseUrl = getAsaasBaseUrl();
  const headers = getAsaasHeaders(subcontaApiKey);

  const res = await fetch(`${baseUrl}/pix/addressKeys/${chaveId}`, {
    method: "DELETE",
    headers,
  });

  if (!res.ok) {
    const json = await res.json();
    const msg = json.errors?.[0]?.description || json.message || "Erro ao excluir chave Pix.";
    throw new Error(msg);
  }

  return true;
}

/**
 * Realiza uma transferência Pix da subconta para qualquer chave Pix externa
 */
export async function transferirPixSubconta(
  subcontaApiKey: string,
  dados: {
    value: number;
    pixAddressKey: string;
    pixAddressKeyType: "CPF" | "CNPJ" | "EMAIL" | "PHONE" | "EVP";
    description?: string;
  }
) {
  if (!subcontaApiKey) throw new Error("Chave da subconta não fornecida.");
  if (!dados.value || dados.value <= 0) throw new Error("Valor de transferência inválido.");
  if (!dados.pixAddressKey) throw new Error("Chave Pix de destino não informada.");

  const baseUrl = getAsaasBaseUrl();
  const headers = getAsaasHeaders(subcontaApiKey);

  const payload = {
    value: Number(dados.value),
    pixAddressKey: dados.pixAddressKey.trim(),
    pixAddressKeyType: dados.pixAddressKeyType,
    description: dados.description || "Transferência de saldo Céos System",
  };

  const res = await fetch(`${baseUrl}/transfers`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  if (!res.ok) {
    const msg = json.errors?.[0]?.description || json.message || "Erro ao realizar transferência Pix.";
    throw new Error(msg);
  }

  return json;
}

/**
 * Lista as transferências realizadas pela subconta
 */
export async function listarTransferenciasSubconta(subcontaApiKey: string) {
  if (!subcontaApiKey) return [];

  const baseUrl = getAsaasBaseUrl();
  const headers = getAsaasHeaders(subcontaApiKey);

  try {
    const res = await fetch(`${baseUrl}/transfers?limit=20`, {
      method: "GET",
      headers,
    });
    if (res.ok) {
      const json = await res.json();
      return json.data || [];
    }
  } catch (e) {
    console.error("Erro ao listar transferências Asaas:", e);
  }
  return [];
}

/**
 * Reenvia o link de ativação/cadastro de documentos para a subconta via API
 */
export async function reenviarLinkAtivacaoSubconta(subcontaId: string) {
  if (!subcontaId) throw new Error("ID da subconta não informado.");

  const baseUrl = getAsaasBaseUrl();
  const headers = getAsaasHeaders(); // usa a API key master da plataforma

  const res = await fetch(`${baseUrl}/accounts/${subcontaId}/resendActivationLink`, {
    method: "POST",
    headers,
  });

  const json = await res.json();
  if (!res.ok) {
    const msg = json.errors?.[0]?.description || json.message || "Erro ao reenviar link de ativação.";
    throw new Error(msg);
  }

  return json;
}

