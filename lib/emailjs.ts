import emailjs from "@emailjs/browser";

export interface ContactEmailData {
  nome: string;
  email: string;
  telefone?: string;
  assunto: string;
  mensagem: string;
}

export async function sendContactEmail(data: ContactEmailData) {
  const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID?.trim();
  const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID?.trim();
  const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY?.trim();

  if (!serviceId || !templateId || !publicKey) {
    throw new Error(
      "As chaves do EmailJS não estão configuradas no arquivo .env.local. Por favor, adicione NEXT_PUBLIC_EMAILJS_SERVICE_ID, NEXT_PUBLIC_EMAILJS_TEMPLATE_ID e NEXT_PUBLIC_EMAILJS_PUBLIC_KEY."
    );
  }

  // Prepara parâmetros com nomes comuns de templates do EmailJS
  const templateParams = {
    nome: data.nome,
    email: data.email,
    telefone: data.telefone || "Não informado",
    assunto: data.assunto,
    mensagem: data.mensagem,
    // Aliases em inglês comuns em templates do EmailJS
    from_name: data.nome,
    from_email: data.email,
    user_name: data.nome,
    user_email: data.email,
    user_phone: data.telefone || "Não informado",
    phone: data.telefone || "Não informado",
    subject: data.assunto,
    message: data.mensagem,
    to_name: "Equipe Céos System",
    date: new Date().toLocaleString("pt-BR"),
  };

  return await emailjs.send(serviceId, templateId, templateParams, publicKey);
}
