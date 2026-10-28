/**
 * Utilitários para verificação de Subconta Asaas e permissão de criação de eventos
 */

export interface StatusSubconta {
  isPromotor: boolean;
  isAdmin: boolean;
  hasSubconta: boolean;
  isAtiva: boolean;
  status: "SEM_CONTA" | "ENCERRADA" | "ATIVA" | "NAO_PROMOTOR" | "ADMIN";
  mensagem: string;
}

/**
 * Valida a situação cadastral da subconta do promotor no Asaas.
 * Regra: Um promotor só pode criar eventos se possuir uma subconta ativa no Asaas.
 */
export function verificarStatusSubconta(userData: any): StatusSubconta {
  if (!userData) {
    return {
      isPromotor: false,
      isAdmin: false,
      hasSubconta: false,
      isAtiva: false,
      status: "NAO_PROMOTOR",
      mensagem: "Usuário não autenticado ou dados não carregados.",
    };
  }

  const isPromotor = Boolean(
    userData?.tipoUsuario === "promotor" ||
    userData?.tipo_usuario === "promotor" ||
    userData?.role === "promotor"
  );

  const isAdmin = Boolean(
    userData?.isAdmin ||
    userData?.role === "admin" ||
    userData?.role === "dono"
  );

  // Administradores da plataforma possuem acesso mestre
  if (isAdmin) {
    return {
      isPromotor,
      isAdmin: true,
      hasSubconta: true,
      isAtiva: true,
      status: "ADMIN",
      mensagem: "Administrador da plataforma liberado.",
    };
  }

  // Se não for promotor
  if (!isPromotor) {
    return {
      isPromotor: false,
      isAdmin: false,
      hasSubconta: false,
      isAtiva: false,
      status: "NAO_PROMOTOR",
      mensagem: "Apenas usuários com perfil de Promotor podem criar eventos.",
    };
  }

  // Verifica se possui os identificadores gerados na criação da subconta Asaas
  const hasSubconta = Boolean(userData?.asaasAccountId && userData?.asaasApiKey);

  // Identifica se a subconta foi encerrada ou cancelada
  const isEncerrada = Boolean(
    userData?.asaasContaEncerrada ||
    userData?.asaasStatus === "ENCERRADA" ||
    userData?.asaasStatus === "DISABLED" ||
    userData?.asaasStatus === "CLOSED"
  );

  if (!hasSubconta) {
    return {
      isPromotor: true,
      isAdmin: false,
      hasSubconta: false,
      isAtiva: false,
      status: "SEM_CONTA",
      mensagem:
        "Para poder criar evento, a conta tem que ser criada primeiro. A criação de eventos só é liberada quando a situação do cadastro da conta estiver completa (conta ativa).",
    };
  }

  if (isEncerrada) {
    return {
      isPromotor: true,
      isAdmin: false,
      hasSubconta: true,
      isAtiva: false,
      status: "ENCERRADA",
      mensagem:
        "Sua subconta no Asaas foi desvinculada ou encerrada. É necessário configurar uma nova subconta ativa para voltar a criar eventos.",
    };
  }

  // Conta existente e com status ativo
  return {
    isPromotor: true,
    isAdmin: false,
    hasSubconta: true,
    isAtiva: true,
    status: "ATIVA",
    mensagem: "Subconta Asaas ativa e liberada para criação de eventos.",
  };
}
