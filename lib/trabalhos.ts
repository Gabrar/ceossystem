export interface AvaliacaoPreCongresso {
  id: string;
  avaliadorId?: string;
  avaliadorNome: string;
  avaliadorEmail: string;
  decisao: "Aceito" | "Aceito com ressalvas" | "Recusado";
  nota?: number | null;
  parecer: string;
  data: string;
  rodada?: number;
}

export interface AvaliacaoDiaEvento {
  id?: string;
  avaliadorId?: string;
  avaliadorNome: string;
  avaliadorEmail: string;
  nota?: number;
  notaFinal?: number;
  notasCriterios?: Record<string, number>;
  parecer?: string;
  observacao?: string;
  data?: string;
  avaliadoEm?: string;
}

export interface AvaliadorEvento {
  id: string;
  nome: string;
  email: string;
  areas?: string[];
  areasInteresse?: string[];
  instituicao?: string;
  qualificacao?: string;
}

export interface PeriodoConfig {
  id: number;
  inicio: string;
  fim: string;
  local: string;
}

export interface DiaAvaliacaoConfig {
  id: number;
  label: string;
  data: string;
  periodosOral: PeriodoConfig[];
  periodosBanner: PeriodoConfig[];
}

export interface CriterioConfig {
  id: number;
  nome: string;
  peso: number;
}

export interface TrabalhoCientificoCompleto {
  id: string;
  eventoId: string;
  eventoTitulo: string;
  userId: string;
  userEmail: string;
  autorPrincipal: string;
  autores?: string;
  coAutores?: Array<{
    nome: string;
    cpf: string;
    instituicao: string;
    curso: string;
  }>;
  orientador?: string;
  titulo: string;
  area: string;
  eixoTematico: string;
  tipoResumo: "simples" | "expandido";
  modalidade?: string;
  resumoTitulo?: string;
  resumoAutores?: string;
  resumo: string;
  arquivoUrl?: string;
  arquivoNome?: string;
  arquivoTamanho?: string;
  status: string;
  createdAt?: any;

  // Avaliação Pré-Congresso (1, 2 ou 3 avaliadores da mesma área)
  avaliadoresDesignados?: Array<{
    nome: string;
    email: string;
    area?: string;
  }>;
  avaliadorRessalvaEmail?: string;
  avaliadorRessalvaNome?: string;
  avaliacoesPreCongresso?: AvaliacaoPreCongresso[];
  notaPreCongresso?: number | null;
  parecer?: string;
  rodadaCorrecao?: number;
  dataUltimaCorrecao?: string;

  // Apresentação no Dia do Evento (Oral ou Banner)
  modalidadeApresentacao?: "oral" | "banner" | "";
  apresentacaoDiaId?: number | null;
  apresentacaoDiaLabel?: string;
  apresentacaoData?: string;
  apresentacaoHoraInicio?: string;
  apresentacaoHoraFim?: string;
  apresentacaoLocal?: string;
  conflitoMinicursoEvitado?: boolean;
  detalheConflitoEvitado?: string;

  // Avaliação no Dia do Evento (múltiplos avaliadores)
  avaliadoresDiaDesignados?: Array<{
    nome: string;
    email: string;
  }>;
  avaliacoesDiaEvento?: AvaliacaoDiaEvento[];
  notaApresentacaoMedia?: number | null;
  apresentadoNoEvento?: boolean;
}

/**
 * Converte "HH:MM" para minutos desde 00:00
 */
export function horaParaMinutos(hora?: string): number {
  if (!hora || !hora.includes(":")) return 0;
  const [h, m] = hora.split(":").map((v) => parseInt(v, 10));
  if (isNaN(h) || isNaN(m)) return 0;
  return h * 60 + m;
}

/**
 * Converte minutos desde 00:00 para "HH:MM"
 */
export function minutosParaHora(totalMinutos: number): string {
  const h = Math.floor(totalMinutos / 60);
  const m = totalMinutos % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Verifica se dois intervalos de horário [inicioA, fimA] e [inicioB, fimB] no mesmo dia se sobrepõem
 */
export function horariosConflitam(
  inicioA: string,
  fimA: string,
  inicioB: string,
  fimB: string
): boolean {
  const startA = horaParaMinutos(inicioA);
  const endA = horaParaMinutos(fimA);
  const startB = horaParaMinutos(inicioB);
  const endB = horaParaMinutos(fimB);
  if (endA <= startA || endB <= startB) return false;
  return startA < endB && startB < endA;
}

/**
 * Verifica se um trabalho tem status considerado Aceito / Aprovado
 */
export function isTrabalhoAceito(status?: string): boolean {
  const st = (status || "").toLowerCase().trim();
  if (st.includes("ressalva") || st.includes("aguardando corre")) return false;
  return st === "aceito" || st === "aprovado" || st.startsWith("aceito") || st.startsWith("aprovado");
}

/**
 * Verifica se o trabalho está aguardando correção do autor ("Aceito com ressalvas")
 */
export function isTrabalhoComRessalvas(status?: string): boolean {
  const st = (status || "").toLowerCase().trim();
  return st.includes("ressalva") || st.includes("aguardando corre");
}

/**
 * Distribui automaticamente um trabalho para N avaliadores (1, 2 ou 3) que tenham a mesma área de interesse,
 * priorizando aqueles com menor carga de trabalhos atribuídos.
 */
export function selecionarAvaliadoresPorArea(
  areaTrabalho: string,
  avaliadoresDisponiveis: AvaliadorEvento[],
  qtdAvaliadores: number,
  emailAutor?: string,
  contagemCargaAtual?: Record<string, number>
): Array<{ nome: string; email: string; area: string }> {
  const n = Math.max(1, Math.min(3, Number(qtdAvaliadores) || 1));
  const areaNorm = (areaTrabalho || "").trim().toLowerCase();
  const autorEmailNorm = (emailAutor || "").trim().toLowerCase();

  // Filtra avaliadores que não sejam o próprio autor e que tenham a mesma área de interesse
  const compativeis = avaliadoresDisponiveis.filter((av) => {
    const avEmail = (av.email || "").trim().toLowerCase();
    if (!avEmail || (autorEmailNorm && avEmail === autorEmailNorm)) return false;
    const listaAreasAv = av.areas || av.areasInteresse || [];
    return listaAreasAv.some((a) => {
      const aNorm = (a || "").trim().toLowerCase();
      return aNorm === areaNorm || aNorm.includes(areaNorm) || areaNorm.includes(aNorm);
    });
  });

  // Ordena pelo menor número de trabalhos já atribuídos para equilibrar a distribuição
  compativeis.sort((a, b) => {
    const cargaA = contagemCargaAtual?.[a.email.toLowerCase()] || 0;
    const cargaB = contagemCargaAtual?.[b.email.toLowerCase()] || 0;
    return cargaA - cargaB;
  });

  return compativeis.slice(0, n).map((av) => ({
    nome: av.nome,
    email: av.email,
    area: areaTrabalho,
  }));
}

export interface HorarioOcupadoParticipante {
  data: string; // YYYY-MM-DD ou DD/MM
  horaInicio: string; // HH:MM
  horaFim: string; // HH:MM
  atividadeNome?: string;
  descricao?: string;
}

/**
 * Normaliza uma data ("2026-11-10" ou "Dia 10/11" ou "10/11/2026") para chave comparável "DD/MM"
 */
export function normalizarChaveDiaMes(str?: string): string {
  if (!str) return "";
  const limpo = str.trim();
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(limpo)) {
    const parts = limpo.split("-");
    return `${parts[2]}/${parts[1]}`;
  }
  // Contém DD/MM
  const match = limpo.match(/(\d{2})\/(\d{2})/);
  if (match) {
    return `${match[1]}/${match[2]}`;
  }
  return limpo.toLowerCase();
}

/**
 * Faz a distribuição automática dos trabalhos aceitos (separados em Oral e Banner)
 * nos dias e períodos configurados pelo administrador, evitando choque de horário
 * entre o apresentador e qualquer curso/minicurso em que ele esteja inscrito (ou outra apresentação dele).
 */
export function distribuirTrabalhosNosPeriodos(
  arg1:
    | {
        trabalhosAceitos: any[];
        diasAvaliacao: DiaAvaliacaoConfig[];
        tempoApresentacaoOralMin: number;
        qtdBannersPorPeriodo: number;
        ocupacoesPorEmail: Record<string, HorarioOcupadoParticipante[]>;
      }
    | any[],
  diasAvaliacaoArg?: DiaAvaliacaoConfig[],
  tempoApresentacaoOralMinArg?: number,
  qtdBannersPorPeriodoArg?: number,
  ocupacoesPorEmailArg?: Record<string, HorarioOcupadoParticipante[]>
): {
  trabalhosDistribuidos: any[];
  atualizados: any[];
  listaOral: any[];
  listaBanner: any[];
  resumoDistribuicao: {
    totalOralDistribuidos: number;
    totalBannerDistribuidos: number;
    conflitosEvitadosCount: number;
    semVagaCount: number;
  };
} {
  const isArrayCall = Array.isArray(arg1);
  const trabalhosAceitos: any[] = isArrayCall ? arg1 : arg1.trabalhosAceitos;
  const diasAvaliacao: DiaAvaliacaoConfig[] = isArrayCall ? diasAvaliacaoArg || [] : arg1.diasAvaliacao;
  const tempoApresentacaoOralMin: number = isArrayCall
    ? tempoApresentacaoOralMinArg || 15
    : arg1.tempoApresentacaoOralMin;
  const qtdBannersPorPeriodo: number = isArrayCall
    ? qtdBannersPorPeriodoArg || 50
    : arg1.qtdBannersPorPeriodo;
  const ocupacoesPorEmail: Record<string, HorarioOcupadoParticipante[]> = isArrayCall
    ? ocupacoesPorEmailArg || {}
    : arg1.ocupacoesPorEmail;

  const tempoOral = Math.max(5, Number(tempoApresentacaoOralMin) || 15);
  const limiteBanner = Math.max(1, Number(qtdBannersPorPeriodo) || 50);

  // Criamos os slots de Apresentação Oral (subdividindo cada período em slots de `tempoOral` minutos)
  interface SlotOral {
    diaId: number;
    diaLabel: string;
    data: string;
    chaveDiaMes: string;
    horaInicio: string;
    horaFim: string;
    local: string;
    ocupado: boolean;
  }

  const slotsOral: SlotOral[] = [];
  for (const dia of diasAvaliacao) {
    const chaveDiaMes = normalizarChaveDiaMes(dia.data || dia.label);
    for (const p of dia.periodosOral || []) {
      const startMin = horaParaMinutos(p.inicio);
      const endMin = horaParaMinutos(p.fim);
      if (endMin <= startMin) continue;

      let cursor = startMin;
      while (cursor + tempoOral <= endMin) {
        slotsOral.push({
          diaId: dia.id,
          diaLabel: dia.label,
          data: dia.data || "",
          chaveDiaMes,
          horaInicio: minutosParaHora(cursor),
          horaFim: minutosParaHora(cursor + tempoOral),
          local: p.local || "",
          ocupado: false,
        });
        cursor += tempoOral;
      }
      if (cursor === startMin && endMin > startMin) {
        slotsOral.push({
          diaId: dia.id,
          diaLabel: dia.label,
          data: dia.data || "",
          chaveDiaMes,
          horaInicio: p.inicio,
          horaFim: p.fim,
          local: p.local || "",
          ocupado: false,
        });
      }
    }
  }

  // Criamos os períodos de Apresentação Banner (cada período comporta até `limiteBanner` trabalhos)
  interface SlotBanner {
    diaId: number;
    diaLabel: string;
    data: string;
    chaveDiaMes: string;
    horaInicio: string;
    horaFim: string;
    local: string;
    quantidadeAtual: number;
    capacidade: number;
  }

  const slotsBanner: SlotBanner[] = [];
  for (const dia of diasAvaliacao) {
    const chaveDiaMes = normalizarChaveDiaMes(dia.data || dia.label);
    for (const p of dia.periodosBanner || []) {
      slotsBanner.push({
        diaId: dia.id,
        diaLabel: dia.label,
        data: dia.data || "",
        chaveDiaMes,
        horaInicio: p.inicio,
        horaFim: p.fim,
        local: p.local || "",
        quantidadeAtual: 0,
        capacidade: limiteBanner,
      });
    }
  }

  // Clona ocupações para também registrar cada apresentação alocada e evitar choque duplo do mesmo apresentador
  const mapaOcupacoes: Record<string, HorarioOcupadoParticipante[]> = {};
  for (const [k, v] of Object.entries(ocupacoesPorEmail)) {
    mapaOcupacoes[k.toLowerCase()] = [...v];
  }

  let totalOralDistribuidos = 0;
  let totalBannerDistribuidos = 0;
  let conflitosEvitadosCount = 0;
  let semVagaCount = 0;

  const resultado: any[] = trabalhosAceitos.map((trab) => {
    const rawMod = String(trab.modalidadeApresentacao || trab.modalidade || "Banner").toLowerCase();
    const isOral = rawMod.includes("oral");
    const emailKey = (trab.userEmail || "").trim().toLowerCase();
    const ocupacoesAutor = emailKey ? mapaOcupacoes[emailKey] || [] : [];

    const temChoque = (chaveDiaMes: string, inicio: string, fim: string): string | null => {
      for (const oc of ocupacoesAutor) {
        const ocChave = normalizarChaveDiaMes(oc.data);
        if (ocChave && chaveDiaMes && ocChave === chaveDiaMes) {
          if (horariosConflitam(inicio, fim, oc.horaInicio, oc.horaFim)) {
            return oc.atividadeNome || oc.descricao || "Minicurso/Curso inscrito";
          }
        }
      }
      return null;
    };

    if (isOral) {
      let conflitoDesviado: string | null = null;
      let slotEscolhido: SlotOral | null = null;

      for (const slot of slotsOral) {
        if (slot.ocupado) continue;
        const motivoChoque = temChoque(slot.chaveDiaMes, slot.horaInicio, slot.horaFim);
        if (motivoChoque) {
          conflitoDesviado = motivoChoque;
          continue;
        }
        slotEscolhido = slot;
        break;
      }

      if (!slotEscolhido) {
        slotEscolhido = slotsOral.find((s) => !s.ocupado) || null;
      }

      if (slotEscolhido) {
        slotEscolhido.ocupado = true;
        totalOralDistribuidos++;
        if (conflitoDesviado) conflitosEvitadosCount++;

        if (emailKey) {
          if (!mapaOcupacoes[emailKey]) mapaOcupacoes[emailKey] = [];
          mapaOcupacoes[emailKey].push({
            data: slotEscolhido.data || slotEscolhido.diaLabel,
            horaInicio: slotEscolhido.horaInicio,
            horaFim: slotEscolhido.horaFim,
            atividadeNome: `Apresentação Oral: ${trab.titulo}`,
          });
        }

        return {
          ...trab,
          modalidadeApresentacao: "Oral",
          apresentacaoDiaId: slotEscolhido.diaId,
          apresentacaoDiaLabel: slotEscolhido.diaLabel,
          apresentacaoData: slotEscolhido.data,
          apresentacaoHoraInicio: slotEscolhido.horaInicio,
          apresentacaoHoraFim: slotEscolhido.horaFim,
          apresentacaoLocal: slotEscolhido.local,
          conflitoMinicursoEvitado: true,
          detalheConflitoEvitado: conflitoDesviado
            ? `Evitado choque com "${conflitoDesviado}"`
            : "",
        };
      } else {
        semVagaCount++;
        return {
          ...trab,
          modalidadeApresentacao: "Oral",
        };
      }
    } else {
      // Banner
      let conflitoDesviado: string | null = null;
      let slotEscolhido: SlotBanner | null = null;

      for (const slot of slotsBanner) {
        if (slot.quantidadeAtual >= slot.capacidade) continue;
        const motivoChoque = temChoque(slot.chaveDiaMes, slot.horaInicio, slot.horaFim);
        if (motivoChoque) {
          conflitoDesviado = motivoChoque;
          continue;
        }
        slotEscolhido = slot;
        break;
      }

      if (!slotEscolhido) {
        slotEscolhido = slotsBanner.find((s) => s.quantidadeAtual < s.capacidade) || null;
      }

      if (slotEscolhido) {
        slotEscolhido.quantidadeAtual++;
        totalBannerDistribuidos++;
        if (conflitoDesviado) conflitosEvitadosCount++;

        if (emailKey) {
          if (!mapaOcupacoes[emailKey]) mapaOcupacoes[emailKey] = [];
          mapaOcupacoes[emailKey].push({
            data: slotEscolhido.data || slotEscolhido.diaLabel,
            horaInicio: slotEscolhido.horaInicio,
            horaFim: slotEscolhido.horaFim,
            atividadeNome: `Apresentação Banner: ${trab.titulo}`,
          });
        }

        return {
          ...trab,
          modalidadeApresentacao: "Banner",
          apresentacaoDiaId: slotEscolhido.diaId,
          apresentacaoDiaLabel: slotEscolhido.diaLabel,
          apresentacaoData: slotEscolhido.data,
          apresentacaoHoraInicio: slotEscolhido.horaInicio,
          apresentacaoHoraFim: slotEscolhido.horaFim,
          apresentacaoLocal: slotEscolhido.local,
          conflitoMinicursoEvitado: true,
          detalheConflitoEvitado: conflitoDesviado
            ? `Evitado choque com "${conflitoDesviado}"`
            : "",
        };
      } else {
        semVagaCount++;
        return {
          ...trab,
          modalidadeApresentacao: "Banner",
        };
      }
    }
  });

  const listaOral = resultado.filter(
    (r) => String(r.modalidadeApresentacao || "").toLowerCase() === "oral"
  );
  const listaBanner = resultado.filter(
    (r) => String(r.modalidadeApresentacao || "").toLowerCase() !== "oral"
  );

  return {
    trabalhosDistribuidos: resultado,
    atualizados: resultado,
    listaOral,
    listaBanner,
    resumoDistribuicao: {
      totalOralDistribuidos,
      totalBannerDistribuidos,
      conflitosEvitadosCount,
      semVagaCount,
    },
  };
}

/**
 * Calcula a nota final para o Ranking de acordo com o modo selecionado pelo administrador:
 * - "apenas_apresentacao": usa a média das avaliações do dia do evento
 * - "media_pre_e_apresentacao": média entre a nota da avaliação pré-congresso e a nota do dia do evento
 * - "soma_pre_e_apresentacao": soma da nota pré-congresso + nota do dia do evento
 * - "apenas_pre_congresso": usa apenas a nota pré-congresso
 */
export function calcularNotaRanking(
  trabalho: any,
  modoCalculo: "apenas_apresentacao" | "media_pre_e_apresentacao" | "soma_pre_e_apresentacao" | "apenas_pre_congresso"
): number {
  const notaPre =
    trabalho?.notaPreCongresso !== undefined &&
    trabalho?.notaPreCongresso !== null &&
    !isNaN(Number(trabalho.notaPreCongresso))
      ? Number(trabalho.notaPreCongresso)
      : null;

  const rawDia = trabalho?.notaDiaMedia ?? trabalho?.notaApresentacaoMedia;
  const notaDia =
    rawDia !== undefined && rawDia !== null && !isNaN(Number(rawDia))
      ? Number(rawDia)
      : null;

  if (modoCalculo === "apenas_pre_congresso") {
    return notaPre ?? 0;
  }

  if (modoCalculo === "apenas_apresentacao") {
    return notaDia ?? notaPre ?? 0;
  }

  if (modoCalculo === "soma_pre_e_apresentacao") {
    return (notaPre ?? 0) + (notaDia ?? 0);
  }

  // "media_pre_e_apresentacao"
  if (notaPre !== null && notaDia !== null) {
    return (notaPre + notaDia) / 2;
  }
  return notaDia ?? notaPre ?? 0;
}
