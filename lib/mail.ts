export interface EnviarEmailOptions {
  para: string;
  nomeDestinatario?: string;
  assunto: string;
  codigo: string;
}

/**
 * Utilitário oficial de envio de e-mails para a Céos System.
 * Envio via EmailJS usando a API REST oficial (compatível com Server Actions e Route Handlers).
 */
export async function enviarCodigoVerificacao({
  para,
  nomeDestinatario,
  assunto,
  codigo,
}: EnviarEmailOptions): Promise<{ sucesso: boolean; metodo: string; erro?: string }> {
  const sanitizedEmail = para.trim().toLowerCase();
  const nome = nomeDestinatario || "Participante";

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
          Origin: appUrl,
          Referer: `${appUrl}/`,
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
            to_name: nome,
            name: nome,
            nome: nome,
            user_name: nome,
            from_name: "Céos System",
            assunto: assunto,
            subject: assunto,
            titulo: "Confirme seu endereço de e-mail",
            title: "Confirme seu endereço de e-mail",
            codigo: codigo,
            code: codigo,
            token: codigo,
            otp: codigo,
            verification_code: codigo,
            codigo_verificacao: codigo,
            mensagem: `Utilize o código de 6 dígitos abaixo para confirmar sua identidade e finalizar a criação da sua conta na Céos System:`,
            message: `Utilize o código de 6 dígitos abaixo para confirmar sua identidade e finalizar a criação da sua conta na Céos System:`,
            detalhes: `⏱ <strong>Validade:</strong> Este código expira em 10 minutos.<br />🔒 <strong>Segurança:</strong> Nunca compartilhe este código com ninguém.`,
          },
        }),
      });

      if (response.ok) {
        return { sucesso: true, metodo: "emailjs" };
      } else {
        const errorText = await response.text();
        console.error("[EmailJS Send Error]:", response.status, errorText);
        return { sucesso: false, metodo: "emailjs", erro: errorText };
      }
    } catch (err: any) {
      console.error("[EmailJS Exception]:", err?.message || err);
      return { sucesso: false, metodo: "emailjs", erro: err?.message || String(err) };
    }
  }

  // Fallback caso as chaves não estejam configuradas
  console.log("-----------------------------------------");
  console.log(`[Céos System] CÓDIGO DE VERIFICAÇÃO PARA: ${sanitizedEmail}`);
  console.log(`[Céos System] CÓDIGO: ${codigo}`);
  console.log("-----------------------------------------");

  return {
    sucesso: false,
    metodo: "console_fallback",
    erro: "E-mail não disparado por falta de chaves do EmailJS configuradas.",
  };
}

export interface EnviarIngressoOptions {
  para: string;
  nomeDestinatario: string;
  eventoTitulo: string;
  codigoIngresso: string;
  lote?: string;
  dataEvento?: string;
  localEvento?: string;
}

/**
 * Envia o ingresso / credencial de confirmação de inscrição para o participante.
 */
export async function enviarEmailIngressoCredenciamento({
  para,
  nomeDestinatario,
  eventoTitulo,
  codigoIngresso,
  lote,
  dataEvento,
  localEvento,
}: EnviarIngressoOptions): Promise<{ sucesso: boolean; metodo: string; erro?: string }> {
  const sanitizedEmail = para.trim().toLowerCase();
  const nome = nomeDestinatario || "Participante";
  const assunto = `Inscrição Confirmada: ${eventoTitulo} - Céos System`;

  const emailjsServiceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID?.trim();
  const emailjsTemplateId =
    process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID_INGRESSO?.trim() ||
    process.env.EMAILJS_TEMPLATE_ID_INGRESSO?.trim() ||
    process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID_CREDENCIAL?.trim() ||
    process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID_AUTH?.trim() ||
    process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID?.trim();
  const emailjsPublicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY?.trim();

  if (emailjsServiceId && emailjsTemplateId && emailjsPublicKey) {
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: appUrl,
          Referer: `${appUrl}/`,
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
            to_name: nome,
            name: nome,
            nome: nome,
            user_name: nome,
            from_name: "Céos System",
            assunto,
            subject: assunto,
            titulo: "Sua Credencial de Entrada está Pronta!",
            title: "Sua Credencial de Entrada está Pronta!",
            evento_titulo: eventoTitulo,
            eventoTitulo,
            codigo: codigoIngresso,
            codigoIngresso,
            codigo_ingresso: codigoIngresso,
            lote: lote || "Inscrição Geral",
            data_evento: dataEvento || "Consulte a programação",
            local_evento: localEvento || "Presencial / Consulte o local",
            mensagem: `Sua inscrição no evento "${eventoTitulo}" foi confirmada! Apresente o código abaixo na portaria para registrar sua entrada:`,
            message: `Sua inscrição no evento "${eventoTitulo}" foi confirmada! Apresente o código abaixo na portaria para registrar sua entrada:`,
            detalhes: `🎟 <strong>Categoria:</strong> ${lote || "Inscrição Geral"}<br />📱 <strong>Na portaria:</strong> Você pode escanear o QR Code da entrada e digitar este código ou seu <strong>CPF</strong> para liberar seu acesso.<br />🔒 Apresente este código na recepção.`,
          },
        }),
      });

      if (response.ok) {
        return { sucesso: true, metodo: "emailjs" };
      } else {
        const errorText = await response.text();
        console.error("[EmailJS Send Ingresso Error]:", response.status, errorText);
        return { sucesso: false, metodo: "emailjs", erro: errorText };
      }
    } catch (err: any) {
      console.error("[EmailJS Exception - Ingresso]:", err?.message || err);
      return { sucesso: false, metodo: "emailjs", erro: err?.message || String(err) };
    }
  }

  // Fallback caso as chaves não estejam configuradas
  console.log("-----------------------------------------");
  console.log(`[Céos System] INGRESSO ENVIADO PARA: ${sanitizedEmail}`);
  console.log(`[Céos System] EVENTO: ${eventoTitulo}`);
  console.log(`[Céos System] CÓDIGO INGRESSO: ${codigoIngresso}`);
  console.log("-----------------------------------------");

  return {
    sucesso: false,
    metodo: "console_fallback",
    erro: "E-mail não disparado por falta de chaves do EmailJS configuradas.",
  };
}
