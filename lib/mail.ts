
export interface EnviarEmailOptions {
  para: string;
  nomeDestinatario?: string;
  assunto: string;
  codigo: string;
}

/**
 * Utilitário oficial de envio de e-mails para a Céos System via EmailJS.
 *
 * Utiliza o endpoint REST oficial da EmailJS com o template configurado.
 * Caso as variáveis de ambiente não estejam preenchidas em dev, exibe o código no terminal.
 */
export async function enviarCodigoVerificacao({
  para,
  nomeDestinatario,
  assunto,
  codigo,
}: EnviarEmailOptions): Promise<{ sucesso: boolean; metodo: string; erro?: string }> {
  const sanitizedEmail = para.trim().toLowerCase();

  const emailjsServiceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID?.trim();
  const emailjsTemplateId =
    process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID_AUTH?.trim() ||
    process.env.EMAILJS_TEMPLATE_ID_AUTH?.trim() ||
    process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID?.trim();
  const emailjsPublicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY?.trim();

  if (emailjsServiceId && emailjsTemplateId && emailjsPublicKey) {
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Origin": appUrl,
          "Referer": `${appUrl}/`,
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        body: JSON.stringify({
          lib_version: "4.4.1",
          service_id: emailjsServiceId,
          template_id: emailjsTemplateId,
          user_id: emailjsPublicKey,
          template_params: {
            to_email: sanitizedEmail,
            email: sanitizedEmail,
            user_email: sanitizedEmail,
            recipient: sanitizedEmail,
            to_name: nomeDestinatario || "Participante",
            name: nomeDestinatario || "Participante",
            nome: nomeDestinatario || "Participante",
            user_name: nomeDestinatario || "Participante",
            from_name: "Céos System",
            assunto: assunto,
            subject: assunto,
            codigo: codigo,
            code: codigo,
            token: codigo,
            otp: codigo,
            verification_code: codigo,
            codigo_verificacao: codigo,
            mensagem: `Seu código de confirmação para criação de conta na Céos System é: ${codigo}. Este código é válido por 10 minutos.`,
            message: `Seu código de confirmação para criação de conta na Céos System é: ${codigo}. Este código é válido por 10 minutos.`,
          },
        }),
      });

      if (response.ok) {
        console.log(`[EmailJS] E-mail com código enviado com sucesso para: ${sanitizedEmail}`);
        return { sucesso: true, metodo: "emailjs" };
      } else {
        const errorText = await response.text();
        console.error(`[EmailJS Error]: Status ${response.status} - ${errorText}`);
      }
    } catch (err: any) {
      console.error("[EmailJS Exception]:", err?.message || err);
    }
  }

  // Fallback Terminal em ambiente de desenvolvimento
  console.log("=========================================================");
  console.log(`[CÉOS SYSTEM - VERIFICAÇÃO DE CADASTRO]`);
  console.log(`E-mail de destino: ${sanitizedEmail}`);
  console.log(`CÓDIGO DE 6 DÍGITOS: >>> ${codigo} <<<`);
  console.log(`DICA: Digite esse código no modal para validar sua conta!`);
  console.log("=========================================================");

  return {
    sucesso: false,
    metodo: "console_fallback",
    erro: "E-mail não disparado por falta ou erro nas chaves do EmailJS.",
  };
}
