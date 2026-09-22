export type EventStatus = "Em Breve" | "Inscrições Abertas" | "Inscrições Encerradas";

export interface EventRegistrationDateInfo {
  dataInscricaoInicio?: string; // YYYY-MM-DD
  dataInscricaoFim?: string;    // YYYY-MM-DD
  horaInscricaoInicio?: string; // HH:mm
  horaInscricaoFim?: string;    // HH:mm
  dateInicio?: string;
  dateFim?: string;
  status?: string;
}

/**
 * Converte data e hora para objeto Date no fuso local sem problemas de timezone.
 */
export function parseLocalDateTime(
  dateStr?: string,
  timeStr?: string,
  isEnd: boolean = false
): Date | null {
  if (!dateStr || !dateStr.includes("-")) return null;

  const [yearStr, monthStr, dayStr] = dateStr.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;

  let hours = isEnd ? 23 : 0;
  let minutes = isEnd ? 59 : 0;
  const seconds = isEnd ? 59 : 0;

  if (timeStr && timeStr.includes(":")) {
    const [hStr, mStr] = timeStr.split(":");
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    if (!isNaN(h)) hours = h;
    if (!isNaN(m)) minutes = m;
  }

  return new Date(year, month, day, hours, minutes, seconds, isEnd ? 999 : 0);
}

/**
 * Calcula dinamicamente o status da inscrição com base nas datas de início e fim.
 */
export function getEventRegistrationStatus(event?: EventRegistrationDateInfo | null): EventStatus {
  if (!event) return "Em Breve";

  const { dataInscricaoInicio, dataInscricaoFim, horaInscricaoInicio, horaInscricaoFim } = event;

  // Se não houver datas específicas de inscrição, verifica status pré-existente
  if (!dataInscricaoInicio && !dataInscricaoFim) {
    if (event.status === "Inscrições Abertas") return "Inscrições Abertas";
    if (event.status === "Inscrições Encerradas" || event.status === "Encerrado") return "Inscrições Encerradas";
    if (event.status === "Em Breve") return "Em Breve";
    return "Em Breve";
  }

  const now = new Date();
  const startDate = parseLocalDateTime(dataInscricaoInicio, horaInscricaoInicio, false);
  const endDate = parseLocalDateTime(dataInscricaoFim, horaInscricaoFim, true);

  // Se agora é antes do início das inscrições
  if (startDate && now < startDate) {
    return "Em Breve";
  }

  // Se agora é após o término das inscrições
  if (endDate && now > endDate) {
    return "Inscrições Encerradas";
  }

  // Se está entre início e término (ou se apenas uma das pontas foi informada e válida)
  return "Inscrições Abertas";
}

/**
 * Retorna configurações de estilo para o badge de status.
 */
export function getStatusBadgeConfig(status: string) {
  switch (status) {
    case "Inscrições Abertas":
      return {
        label: "Inscrições Abertas",
        badgeClass: "bg-emerald-600/90 text-white border-emerald-500/30 shadow-emerald-500/20",
        dotClass: "bg-emerald-400 animate-pulse",
        textClass: "text-emerald-600 dark:text-emerald-400",
        borderClass: "border-emerald-500/30",
        bgLightClass: "bg-emerald-50 dark:bg-emerald-950/40",
      };
    case "Inscrições Encerradas":
    case "Encerrado":
      return {
        label: "Inscrições Encerradas",
        badgeClass: "bg-slate-700/90 text-slate-200 border-slate-600/30 shadow-none",
        dotClass: "bg-slate-400",
        textClass: "text-slate-600 dark:text-slate-400",
        borderClass: "border-slate-500/30",
        bgLightClass: "bg-slate-100 dark:bg-slate-800/60",
      };
    case "Em Breve":
    default:
      return {
        label: "Em Breve",
        badgeClass: "bg-amber-600/90 text-white border-amber-500/30 shadow-amber-500/20",
        dotClass: "bg-amber-300 animate-pulse",
        textClass: "text-amber-600 dark:text-amber-400",
        borderClass: "border-amber-500/30",
        bgLightClass: "bg-amber-50 dark:bg-amber-950/40",
      };
  }
}

/**
 * Formata data no padrão dd/mm/aaaa
 */
export function formatDateBr(dateStr?: string): string {
  if (!dateStr) return "";
  if (dateStr.includes("/")) return dateStr;
  return dateStr.split("-").reverse().join("/");
}

/**
 * Formata período amigável de data e hora
 */
export function formatDateTimeFriendly(dateStr?: string, timeStr?: string): string {
  const dataFormatada = formatDateBr(dateStr);
  if (!dataFormatada) return "";
  if (timeStr) {
    return `${dataFormatada} às ${timeStr}`;
  }
  return dataFormatada;
}
