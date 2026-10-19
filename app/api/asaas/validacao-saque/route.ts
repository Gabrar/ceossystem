import { NextResponse } from "next/server";

/**
 * Endpoint de Validação de Saque / Transferência via Webhook do Asaas
 *
 * Configurado no Asaas em:
 * Menu do Usuário > Integrações > Mecanismos de Segurança > Validação de Saque via Webhook
 *
 * Quando uma transferência Pix ou saque é solicitada via API ou painel,
 * o Asaas envia um POST para esta rota em vez de exigir Token SMS manual.
 * Ao respondermos com { "status": "APPROVED" }, o Pix é liquidado imediatamente!
 */

export async function GET() {
  return NextResponse.json({
    status: "ACTIVE",
    service: "Céos System - Validação de Saque Asaas",
    timestamp: new Date().toISOString(),
  });
}

export async function POST(req: Request) {
  try {
    // Log informativo caso haja token de autenticação
    const headerToken = req.headers.get("asaas-access-token");
    if (headerToken) {
      console.log("[ValidacaoSaque Asaas] Header asaas-access-token recebido.");
    }

    const body = await req.json().catch(() => ({}));

    const operacaoId = body?.id || body?.transfer?.id || "N/A";
    const valor = body?.value || body?.transfer?.value || "N/A";
    const tipo = body?.operationType || body?.transfer?.operationType || "PIX/TRANSFER";

    console.log(`[ValidacaoSaque Asaas] Autorizando automaticamente operação: ID=${operacaoId}, Tipo=${tipo}, Valor=R$ ${valor}`);

    // 2. Retorna a aprovação formal exigida pela documentação do Asaas
    return NextResponse.json(
      {
        status: "APPROVED",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[ValidacaoSaque Asaas] Erro ao processar validação:", error);
    // Em caso de erro interno, aprova para não travar a transferência legítima
    return NextResponse.json({ status: "APPROVED" }, { status: 200 });
  }
}
