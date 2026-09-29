"use client";

import { useState, useEffect } from "react";
import {
  X,
  CreditCard,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

interface LoteItem {
  perfil?: string;
  loteNumero?: string;
  preco?: string;
  quantidade?: string;
  codigoDesconto?: string;
  valorPromocional?: string;
  dataInicio?: string;
  dataFim?: string;
}

interface ModalInscricaoEventoProps {
  isOpen: boolean;
  onClose: () => void;
  evento: {
    id: string;
    titulo: string;
    data?: string;
    lotes?: LoteItem[];
  };
  user: any;
  userData: any;
  onInscricaoSucesso: () => void;
}

const ESTADOS_BRASIL = [
  { uf: "AC", nome: "Acre" },
  { uf: "AL", nome: "Alagoas" },
  { uf: "AP", nome: "Amapá" },
  { uf: "AM", nome: "Amazonas" },
  { uf: "BA", nome: "Bahia" },
  { uf: "CE", nome: "Ceará" },
  { uf: "DF", nome: "Distrito Federal" },
  { uf: "ES", nome: "Espírito Santo" },
  { uf: "GO", nome: "Goiás" },
  { uf: "MA", nome: "Maranhão" },
  { uf: "MT", nome: "Mato Grosso" },
  { uf: "MS", nome: "Mato Grosso do Sul" },
  { uf: "MG", nome: "Minas Gerais" },
  { uf: "PA", nome: "Pará" },
  { uf: "PB", nome: "Paraíba" },
  { uf: "PR", nome: "Paraná" },
  { uf: "PE", nome: "Pernambuco" },
  { uf: "PI", nome: "Piauí" },
  { uf: "RJ", nome: "Rio de Janeiro" },
  { uf: "RN", nome: "Rio Grande do Norte" },
  { uf: "RS", nome: "Rio Grande do Sul" },
  { uf: "RO", nome: "Rondônia" },
  { uf: "RR", nome: "Roraima" },
  { uf: "SC", nome: "Santa Catarina" },
  { uf: "SP", nome: "São Paulo" },
  { uf: "SE", nome: "Sergipe" },
  { uf: "TO", nome: "Tocantins" },
];

const TIPOS_PARTICIPANTE = [
  "Aluno",
  "ALUNO PÓS-GRADUAÇÃO",
  "Professor",
  "PROFISSIONAL",
  "TÉCNICO",
  "OUTRO",
];

const AREAS_CNPQ = [
  "Ciências Exatas e da Terra",
  "Ciências Biológicas",
  "Engenharias",
  "Ciências da Saúde",
  "Ciências Agrárias",
  "Ciências Sociais Aplicadas",
  "Ciências Humanas",
  "Linguística, Letras e Artes",
  "Outro",
];

export default function ModalInscricaoEvento({
  isOpen,
  onClose,
  evento,
  user,
  userData,
  onInscricaoSucesso,
}: ModalInscricaoEventoProps) {
  // Dados do formulário
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [tipoDocumento, setTipoDocumento] = useState("CPF (Brasil)");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  const [instituicao, setInstituicao] = useState("");
  const [curso, setCurso] = useState("");
  const [pais, setPais] = useState("Brasil");
  const [estado, setEstado] = useState("");
  const [cidade, setCidade] = useState("");
  const [cep, setCep] = useState("");
  const [endereco, setEndereco] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [tipoParticipante, setTipoParticipante] = useState("");
  const [areaAtuacao, setAreaAtuacao] = useState("");
  const [loteSelecionadoIndex, setLoteSelecionadoIndex] = useState(0);
  const [codigoDesconto, setCodigoDesconto] = useState("");
  const [termosAceitos, setTermosAceitos] = useState(false);

  // Estados de controle
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [submetendo, setSubmetendo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucessoMsg, setSucessoMsg] = useState<string | null>(null);

  // Auto-preenchimento inicial a partir dos dados do usuário
  useEffect(() => {
    if (user || userData) {
      setNome(userData?.nome || user?.displayName || "");
      setEmail(user?.email || userData?.email || "");
      setCpf(formatarCpfInput(userData?.cpf || ""));
      setTelefone(formatarTelefone(userData?.telefone || ""));
      setInstituicao(userData?.instituicao || "");
      setCurso(userData?.curso || "");
      if (userData?.estado) setEstado(userData.estado);
      if (userData?.cidade) setCidade(userData.cidade);
      if (userData?.cep) setCep(formatarCep(userData.cep));
      if (userData?.endereco) setEndereco(userData.endereco);
      if (userData?.numero) setNumero(userData.numero);
      if (userData?.bairro) setBairro(userData.bairro);
    }
  }, [user, userData, isOpen]);

  if (!isOpen) return null;

  // Lotes disponíveis
  const lotes = evento?.lotes && evento.lotes.length > 0 ? evento.lotes : [];
  const loteAtual = lotes[loteSelecionadoIndex] || null;

  // Cálculo do valor do lote
  const extrairValorNumerico = (str?: string) => {
    if (!str) return 0;
    const limpo = str.replace("R$", "").replace(/\s/g, "").replace(",", ".");
    const parsed = parseFloat(limpo);
    return isNaN(parsed) ? 0 : parsed;
  };

  const valorOriginal = loteAtual ? extrairValorNumerico(loteAtual.preco) : 0;
  let valorFinal = valorOriginal;

  // Verifica aplicação de cupom promocional
  const cupomValido =
    loteAtual?.codigoDesconto &&
    codigoDesconto.trim().toUpperCase() === loteAtual.codigoDesconto.trim().toUpperCase();

  if (cupomValido && loteAtual?.valorPromocional) {
    valorFinal = extrairValorNumerico(loteAtual.valorPromocional);
  }

  // Máscaras de input
  function formatarCpfInput(v: string) {
    const d = v.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
    if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
  }

  function formatarCep(v: string) {
    const d = v.replace(/\D/g, "").slice(0, 8);
    if (d.length <= 5) return d;
    return `${d.slice(0, 5)}-${d.slice(5, 8)}`;
  }

  function formatarTelefone(v: string) {
    const d = v.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
  }

  // Busca de CEP automática via ViaCEP
  const handleCepChange = async (val: string) => {
    const cepFormatado = formatarCep(val);
    setCep(cepFormatado);

    const digitos = val.replace(/\D/g, "");
    if (digitos.length === 8) {
      try {
        setBuscandoCep(true);
        const res = await fetch(`https://viacep.com.br/ws/${digitos}/json/`);
        const data = await res.json();
        if (!data.erro) {
          if (data.logradouro) setEndereco(data.logradouro);
          if (data.bairro) setBairro(data.bairro);
          if (data.localidade) setCidade(data.localidade);
          if (data.uf) setEstado(data.uf);
        }
      } catch (err) {
        console.warn("Erro ao consultar ViaCEP:", err);
      } finally {
        setBuscandoCep(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    // Validações
    if (!nome.trim()) return setErro("Por favor, preencha o seu nome completo.");
    if (!email.trim()) return setErro("Por favor, preencha o seu e-mail.");
    if (!cpf.trim() || cpf.replace(/\D/g, "").length !== 11) {
      return setErro("Por favor, preencha um CPF válido com 11 dígitos.");
    }
    if (!tipoParticipante) {
      return setErro("Por favor, selecione o Tipo de Participante.");
    }
    if (!termosAceitos) {
      return setErro("É necessário aceitar os termos de uso para prosseguir.");
    }

    try {
      setSubmetendo(true);

      const loteNomeEscolhido = loteAtual
        ? `${loteAtual.perfil || "Lote"} (Lote ${loteAtual.loteNumero || loteSelecionadoIndex + 1})`
        : "Inscrição Geral";

      const payload = {
        eventoId: evento.id,
        eventoTitulo: evento.titulo,
        userId: user?.uid,
        nome,
        email,
        cpf: cpf.replace(/\D/g, ""),
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
        loteNome: loteNomeEscolhido,
        valorOriginal,
        valorFinal,
        codigoDesconto: cupomValido ? codigoDesconto : null,
      };

      const res = await fetch("/api/asaas/criar-cobranca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao processar a inscrição.");
      }

      // Caso 1: Gratuito
      if (data.gratuito) {
        setSucessoMsg("Inscrição gratuita confirmada com sucesso!");
        onInscricaoSucesso();
        setTimeout(() => {
          onClose();
        }, 2000);
        return;
      }

      // Caso 2: Pago com link do Asaas disponível
      if (data.checkoutUrl) {
        setSucessoMsg("Redirecionando para o ambiente seguro de pagamento do Asaas...");
        setTimeout(() => {
          window.location.href = data.checkoutUrl;
        }, 1200);
        return;
      }

      // Caso 3: Pago sem chave Asaas no .env (modo demonstração/desenvolvimento)
      if (data.semChaveAsaas) {
        setSucessoMsg(
          "Inscrição registrada como Pendente no sistema! (Aguardando configuração da chave do Asaas no servidor)."
        );
        onInscricaoSucesso();
        setTimeout(() => {
          onClose();
        }, 3000);
      }
    } catch (err: any) {
      console.error("Erro ao finalizar inscrição:", err);
      setErro(err.message || "Erro inesperado ao registrar inscrição.");
    } finally {
      setSubmetendo(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-xl bg-white dark:bg-[#0c1e33] border border-slate-200 dark:border-blue-900/40 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95">
        
        {/* TOPO COM LOGO / IDENTIFICADOR */}
        <div className="bg-[#0b284e] text-white py-3.5 px-6 text-center relative border-b border-blue-950">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="font-montserrat font-bold text-base sm:text-lg tracking-wide">
            Inscrição
          </h2>
          <p className="text-[11px] text-blue-200 font-medium">Área do Participante</p>
        </div>

        {/* FAIXA DO EVENTO */}
        <div className="bg-[#123868] text-white px-6 py-3 border-b border-blue-900/40">
          <h3 className="font-montserrat font-bold text-sm sm:text-base leading-tight">
            {evento.titulo}
          </h3>
          <p className="text-xs text-blue-200 mt-0.5">
            {evento.data || "Data a confirmar"}
          </p>
        </div>

        {/* CORPO DO FORMULÁRIO */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-4 max-h-[75vh] overflow-y-auto text-xs text-slate-700 dark:text-slate-300">
          {erro && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{erro}</span>
            </div>
          )}

          {sucessoMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{sucessoMsg}</span>
            </div>
          )}

          {/* Nome e E-mail */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
                Nome Completo *
              </label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome completo"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-blue-900/50 bg-white dark:bg-[#071321] focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
                E-mail *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-blue-900/50 bg-white dark:bg-[#071321] focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Tipo Documento e Telefone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
                Documento
              </label>
              <select
                value={tipoDocumento}
                onChange={(e) => setTipoDocumento(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-blue-900/50 bg-white dark:bg-[#071321] focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="CPF (Brasil)">CPF (Brasil)</option>
                <option value="Passaporte">Passaporte / Estrangeiro</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
                Telefone
              </label>
              <div className="flex items-center gap-1.5">
                <span className="px-2.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-blue-900/50 font-medium text-slate-600 dark:text-slate-400">
                  🇧🇷 +55
                </span>
                <input
                  type="text"
                  value={telefone}
                  onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
                  placeholder="(99) 99999-9999"
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-blue-900/50 bg-white dark:bg-[#071321] focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Campo CPF */}
          <div>
            <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
              CPF *
            </label>
            <input
              type="text"
              required
              value={cpf}
              onChange={(e) => setCpf(formatarCpfInput(e.target.value))}
              placeholder="000.000.000-00"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-blue-900/50 bg-white dark:bg-[#071321] focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Instituição e Curso */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
                Instituição
              </label>
              <input
                type="text"
                value={instituicao}
                onChange={(e) => setInstituicao(e.target.value)}
                placeholder="Digite para buscar sua instituição"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-blue-900/50 bg-white dark:bg-[#071321] focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
                Curso
              </label>
              <input
                type="text"
                value={curso}
                onChange={(e) => setCurso(e.target.value)}
                placeholder="Digite para buscar seu curso"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-blue-900/50 bg-white dark:bg-[#071321] focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* País e Estado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
                País
              </label>
              <select
                value={pais}
                onChange={(e) => setPais(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-blue-900/50 bg-white dark:bg-[#071321] focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="Brasil">Brasil</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
                Estado
              </label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-blue-900/50 bg-white dark:bg-[#071321] focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">Selecione o estado</option>
                {ESTADOS_BRASIL.map((est) => (
                  <option key={est.uf} value={est.uf}>
                    {est.nome} ({est.uf})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* SEÇÃO ENDEREÇO PARA COBRANÇA */}
          <div className="pt-2 border-t border-slate-200 dark:border-blue-900/30 space-y-3">
            <div>
              <p className="font-bold text-slate-900 dark:text-white">
                Endereço para cobrança
              </p>
              <p className="text-[11px] text-slate-500">
                Necessário para gerar o pagamento (Pix/cartão).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span>CEP</span>
                  {buscandoCep && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
                </label>
                <input
                  type="text"
                  value={cep}
                  onChange={(e) => handleCepChange(e.target.value)}
                  placeholder="00000-000"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-blue-900/50 bg-white dark:bg-[#071321] focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
                  Endereço (rua/avenida)
                </label>
                <input
                  type="text"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="Rua, avenida, travessa..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-blue-900/50 bg-white dark:bg-[#071321] focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
                  Número
                </label>
                <input
                  type="text"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  placeholder="123"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-blue-900/50 bg-white dark:bg-[#071321] focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
                  Complemento
                </label>
                <input
                  type="text"
                  value={complemento}
                  onChange={(e) => setComplemento(e.target.value)}
                  placeholder="Apto, Bloco..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-blue-900/50 bg-white dark:bg-[#071321] focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
                  Bairro
                </label>
                <input
                  type="text"
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  placeholder="Bairro"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-blue-900/50 bg-white dark:bg-[#071321] focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
                Cidade
              </label>
              <input
                type="text"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                placeholder="Sua cidade"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-blue-900/50 bg-white dark:bg-[#071321] focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Tipo de Participante */}
          <div>
            <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
              Tipo de Participante *
            </label>
            <select
              required
              value={tipoParticipante}
              onChange={(e) => setTipoParticipante(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-blue-900/50 bg-white dark:bg-[#071321] focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">Selecione</option>
              {TIPOS_PARTICIPANTE.map((tp) => (
                <option key={tp} value={tp}>
                  {tp}
                </option>
              ))}
            </select>
          </div>

          {/* Área de Atuação (CNPq) */}
          <div>
            <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
              Área de Atuação (CNPq)
            </label>
            <input
              type="text"
              list="areas-cnpq"
              value={areaAtuacao}
              onChange={(e) => setAreaAtuacao(e.target.value)}
              placeholder="Selecione a área de atuação - digite para buscar"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-blue-900/50 bg-white dark:bg-[#071321] focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <datalist id="areas-cnpq">
              {AREAS_CNPQ.map((a) => (
                <option key={a} value={a} />
              ))}
            </datalist>
          </div>

          {/* Tipo de Ingresso / Lote */}
          <div>
            <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
              Tipo de Ingresso
            </label>
            {lotes.length > 0 ? (
              <select
                value={loteSelecionadoIndex}
                onChange={(e) => setLoteSelecionadoIndex(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-blue-900/50 bg-white dark:bg-[#071321] font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {lotes.map((lote, idx) => {
                  const nomeLote = lote.perfil || `Lote ${lote.loteNumero || idx + 1}`;
                  const precoFormatado = lote.preco
                    ? lote.preco.includes("R$")
                      ? lote.preco
                      : `R$ ${lote.preco}`
                    : "Gratuito";
                  return (
                    <option key={idx} value={idx}>
                      {nomeLote.toUpperCase()} (Lote {lote.loteNumero || idx + 1} - {precoFormatado})
                    </option>
                  );
                })}
              </select>
            ) : (
              <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-[#071321] text-xs font-semibold text-slate-700 dark:text-slate-300">
                Inscrição Geral - Gratuito
              </div>
            )}
          </div>

          {/* Total a Pagar */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-200 dark:border-blue-900/30">
            <span className="font-bold text-slate-900 dark:text-white text-sm">Total a pagar:</span>
            <span className="font-extrabold text-blue-700 dark:text-blue-400 text-lg">
              R$ {valorFinal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* Box de Atenção */}
          <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-[11px] leading-relaxed flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Atenção: Se for pagar com cartão, use os dados do cartão digital disponível no aplicativo do seu banco.
            </span>
          </div>

          {/* Código de Desconto */}
          <div>
            <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
              Código de Desconto
            </label>
            <input
              type="text"
              value={codigoDesconto}
              onChange={(e) => setCodigoDesconto(e.target.value)}
              placeholder="Digite seu código (opcional)"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-blue-900/50 bg-white dark:bg-[#071321] focus:ring-2 focus:ring-blue-500 focus:outline-none uppercase"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Se houver desconto disponível para este ingresso, será aplicado automaticamente.
            </p>
            {cupomValido && (
              <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                ✓ Desconto promocional aplicado com sucesso!
              </p>
            )}
          </div>

          {/* Termos de Uso */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="termos-uso"
              required
              checked={termosAceitos}
              onChange={(e) => setTermosAceitos(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="termos-uso" className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
              Li e aceito os <span className="text-blue-600 underline">termos de uso</span>
            </label>
          </div>

          {/* Botão de Finalização */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submetendo}
              className="w-full py-3.5 px-6 rounded-xl bg-[#1b437c] hover:bg-[#153460] active:scale-[0.99] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submetendo ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processando inscrição...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Finalizar Inscrição</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
