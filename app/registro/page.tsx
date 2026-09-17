"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Globe,
  MapPin,
  FileText,
  Phone,
  CheckCircle2,
  AlertCircle,
  X,
  FileCheck,
  ShieldCheck,
  Check,
  GraduationCap,
  ChevronDown,
} from "lucide-react";

// Lista oficial de países e seus respectivos DDIs com nome completo
const PAISES = [
  { nome: "Brasil", ddi: "+55" },
  { nome: "Portugal", ddi: "+351" },
  { nome: "Estados Unidos", ddi: "+1" },
  { nome: "Espanha", ddi: "+34" },
  { nome: "Argentina", ddi: "+54" },
  { nome: "Uruguai", ddi: "+598" },
  { nome: "Paraguai", ddi: "+595" },
  { nome: "Chile", ddi: "+56" },
  { nome: "Colômbia", ddi: "+57" },
  { nome: "México", ddi: "+52" },
  { nome: "Angola", ddi: "+244" },
  { nome: "Moçambique", ddi: "+258" },
  { nome: "Cabo Verde", ddi: "+238" },
  { nome: "Reino Unido", ddi: "+44" },
  { nome: "França", ddi: "+33" },
  { nome: "Alemanha", ddi: "+49" },
  { nome: "Itália", ddi: "+39" },
  { nome: "Canadá", ddi: "+1" },
  { nome: "Outro", ddi: "+1" },
];

const ESTADOS_BRASIL = [
  { sigla: "AC", nome: "Acre" },
  { sigla: "AL", nome: "Alagoas" },
  { sigla: "AP", nome: "Amapá" },
  { sigla: "AM", nome: "Amazonas" },
  { sigla: "BA", nome: "Bahia" },
  { sigla: "CE", nome: "Ceará" },
  { sigla: "DF", nome: "Distrito Federal" },
  { sigla: "ES", nome: "Espírito Santo" },
  { sigla: "GO", nome: "Goiás" },
  { sigla: "MA", nome: "Maranhão" },
  { sigla: "MT", nome: "Mato Grosso" },
  { sigla: "MS", nome: "Mato Grosso do Sul" },
  { sigla: "MG", nome: "Minas Gerais" },
  { sigla: "PA", nome: "Pará" },
  { sigla: "PB", nome: "Paraíba" },
  { sigla: "PR", nome: "Paraná" },
  { sigla: "PE", nome: "Pernambuco" },
  { sigla: "PI", nome: "Piauí" },
  { sigla: "RJ", nome: "Rio de Janeiro" },
  { sigla: "RN", nome: "Rio Grande do Norte" },
  { sigla: "RS", nome: "Rio Grande do Sul" },
  { sigla: "RO", nome: "Rondônia" },
  { sigla: "RR", nome: "Roraima" },
  { sigla: "SC", nome: "Santa Catarina" },
  { sigla: "SP", nome: "São Paulo" },
  { sigla: "SE", nome: "Sergipe" },
  { sigla: "TO", nome: "Tocantins" },
];

// Algoritmo oficial da Receita Federal para validação de CPF
function validarCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, "");

  // Deve possuir exatamente 11 dígitos numéricos
  if (digits.length !== 11) return false;

  // Rejeita sequências conhecidas de dígitos repetidos (ex: 000.000.000-00, 111.111.111-11, etc.)
  if (/^(\d)\1{10}$/.test(digits)) return false;

  // Cálculo do primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(digits.charAt(i), 10) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(digits.charAt(9), 10)) return false;

  // Cálculo do segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(digits.charAt(i), 10) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(digits.charAt(10), 10)) return false;

  return true;
}

export default function RegistroPage() {
  const router = useRouter();
  // Campos do formulário
  const [nome, setNome] = useState("");
  const [tipoUsuario, setTipoUsuario] = useState("");
  const [email, setEmail] = useState("");
  const [pais, setPais] = useState("Brasil");
  const [estado, setEstado] = useState("");
  const [tipoDocumento, setTipoDocumento] = useState<"cpf" | "passaporte">("cpf");
  const [documento, setDocumento] = useState("");
  const [ddi, setDdi] = useState("+55");
  const [telefone, setTelefone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termosAceitos, setTermosAceitos] = useState(false);

  // Estados de controle e modal
  const [isModalTermosOpen, setIsModalTermosOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Validação de senha conforme requisitos
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasUpperCase && hasLowerCase && hasNumber;
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  // Validação em tempo real de CPF
  const cpfDigitos = documento.replace(/\D/g, "");
  const isCpfCompleto = tipoDocumento === "cpf" && cpfDigitos.length === 11;
  const isCpfValido = isCpfCompleto ? validarCPF(documento) : false;

  // Formatação de CPF e Passaporte
  const handleDocumentoChange = (value: string) => {
    if (tipoDocumento === "cpf") {
      const numeric = value.replace(/\D/g, "").slice(0, 11);
      let formatted = numeric;
      if (numeric.length > 9) {
        formatted = `${numeric.slice(0, 3)}.${numeric.slice(3, 6)}.${numeric.slice(6, 9)}-${numeric.slice(9)}`;
      } else if (numeric.length > 6) {
        formatted = `${numeric.slice(0, 3)}.${numeric.slice(3, 6)}.${numeric.slice(6)}`;
      } else if (numeric.length > 3) {
        formatted = `${numeric.slice(0, 3)}.${numeric.slice(3)}`;
      }
      setDocumento(formatted);
    } else {
      setDocumento(value.toUpperCase().slice(0, 20));
    }
  };

  // Formatação de Telefone (padrão Brasil se ddi for +55)
  const handleTelefoneChange = (value: string) => {
    if (ddi === "+55") {
      const numeric = value.replace(/\D/g, "").slice(0, 11);
      let formatted = numeric;
      if (numeric.length > 6) {
        formatted = `(${numeric.slice(0, 2)}) ${numeric.slice(2, 7)}-${numeric.slice(7)}`;
      } else if (numeric.length > 2) {
        formatted = `(${numeric.slice(0, 2)}) ${numeric.slice(2)}`;
      }
      setTelefone(formatted);
    } else {
      setTelefone(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!tipoUsuario) {
      setErrorMessage("Por favor, selecione seu tipo de usuário.");
      return;
    }

    // Validação estrita de CPF
    if (tipoDocumento === "cpf") {
      if (!validarCPF(documento)) {
        setErrorMessage("O CPF informado é inválido. Verifique os dígitos digitados.");
        return;
      }
    } else {
      if (documento.trim().length < 5) {
        setErrorMessage("Por favor, informe um número de passaporte válido.");
        return;
      }
    }

    if (!isPasswordValid) {
      setErrorMessage("A senha não cumpre todos os requisitos obrigatórios.");
      return;
    }

    if (!passwordsMatch) {
      setErrorMessage("A confirmação de senha não coincide com a senha criada.");
      return;
    }

    if (!termosAceitos) {
      setErrorMessage("É obrigatório aceitar os Termos de Uso para criar uma conta.");
      return;
    }

    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName: nome });
        
        await setDoc(doc(db, "users", userCredential.user.uid), {
          nome,
          tipoUsuario,
          email,
          pais,
          estado,
          tipoDocumento,
          documento,
          ddi,
          telefone,
          createdAt: new Date().toISOString()
        });
      }

      setIsSuccess(true);
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch (error: unknown) {
      console.error(error);
      let errorMsg = "Erro ao criar conta. Tente novamente.";
      const err = error as { code?: string };
      if (err.code === "auth/email-already-in-use") {
        errorMsg = "Este e-mail já está em uso.";
      }
      setErrorMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative min-h-[calc(100vh-73px)] w-full flex items-center justify-center px-3 sm:px-6 lg:px-8 py-6 sm:py-12 bg-[#fafafa] dark:bg-[#0a1929] text-slate-900 dark:text-slate-100 transition-colors duration-200 overflow-hidden fade-in">
      {/* Luz ambiente com blur suave no centro */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 sm:w-[600px] lg:w-[800px] h-72 sm:h-[600px] lg:h-[800px] bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-[100px] sm:blur-[160px] pointer-events-none"
      />

      <div className="relative z-10 w-full max-w-3xl mx-auto drop">
        {/* Card Principal de Registro */}
        <div className="p-5 sm:p-10 rounded-3xl bg-white/85 dark:bg-[#0c1e33]/90 border border-slate-200/90 dark:border-blue-900/40 shadow-xl sm:shadow-2xl shadow-blue-500/5 dark:shadow-black/40 backdrop-blur-md">
          {/* Botão para voltar à página inicial */}
          <Link
            href="/"
            aria-label="Voltar para o início"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group cursor-pointer mb-2"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          </Link>

          {/* Cabeçalho do Card */}
          <div className="flex flex-col items-center text-center space-y-2 mb-6 sm:mb-8">
            <h1 className="font-montserrat text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Crie sua conta
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300/90 leading-relaxed max-w-lg">
              Cadastre-se na Céos System para participar de congressos, submeter artigos e emitir seus certificados digitais.
            </p>
          </div>

          {isSuccess ? (
            <div className="p-6 sm:p-8 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-center space-y-4 fade-in">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="font-montserrat font-bold text-xl sm:text-2xl text-emerald-800 dark:text-emerald-300">
                Cadastro realizado com sucesso!
              </h2>
              <p className="text-xs sm:text-sm text-emerald-700 dark:text-emerald-400 max-w-md mx-auto">
                Sua conta na Céos System foi criada com segurança. Você já pode fazer login para acessar seus eventos científicos.
              </p>
              <div className="pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all"
                >
                  <span>Ir para o Login</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {/* Alerta de erro */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2.5 text-rose-700 dark:text-rose-300 text-xs sm:text-sm fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Grid de Campos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                {/* Nome Completo */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="nome"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200"
                  >
                    Nome Completo <span className="text-blue-600 dark:text-blue-400">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <User className="absolute left-3.5 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none z-10" />
                    <input
                      type="text"
                      id="nome"
                      required
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Ex: Ana Silva dos Santos"
                      className="w-full pl-11 pr-4 py-2.5 sm:py-3 rounded-xl bg-slate-50/70 dark:bg-[#071321]/70 border border-slate-200 dark:border-blue-900/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 dark:focus:border-blue-500 transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Tipo de Usuário */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="tipoUsuario"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200"
                  >
                    Tipo de Usuário <span className="text-blue-600 dark:text-blue-400">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <GraduationCap className="absolute left-3.5 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none z-10" />
                    <select
                      id="tipoUsuario"
                      required
                      value={tipoUsuario}
                      onChange={(e) => setTipoUsuario(e.target.value)}
                      className="w-full appearance-none pl-11 pr-10 py-2.5 sm:py-3 rounded-xl bg-slate-50/70 dark:bg-[#071321]/70 border border-slate-200 dark:border-blue-900/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 dark:focus:border-blue-500 transition-all duration-200 cursor-pointer"
                    >
                      <option value="" disabled className="bg-white dark:bg-[#0c1e33] text-slate-500">
                        Selecione seu perfil...
                      </option>
                      <option value="palestrante" className="bg-white dark:bg-[#0c1e33] text-slate-900 dark:text-slate-100">
                        Palestrante
                      </option>
                      <option value="congressista" className="bg-white dark:bg-[#0c1e33] text-slate-900 dark:text-slate-100">
                        Congressista
                      </option>
                      <option value="promotor" className="bg-white dark:bg-[#0c1e33] text-slate-900 dark:text-slate-100">
                        Promotor
                      </option>
                      <option value="aluno" className="bg-white dark:bg-[#0c1e33] text-slate-900 dark:text-slate-100">
                        Aluno
                      </option>
                      <option value="aluno_pos_graduacao" className="bg-white dark:bg-[#0c1e33] text-slate-900 dark:text-slate-100">
                        Aluno de Pós Graduação
                      </option>
                    </select>
                    <ChevronDown className="absolute right-3.5 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                  </div>
                </div>

                {/* E-mail */}
                <div className="space-y-1.5 md:col-span-2">
                  <label
                    htmlFor="email"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200"
                  >
                    E-mail <span className="text-blue-600 dark:text-blue-400">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3.5 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none z-10" />
                    <input
                      type="email"
                      id="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="exemplo@universidade.edu.br"
                      className="w-full pl-11 pr-4 py-2.5 sm:py-3 rounded-xl bg-slate-50/70 dark:bg-[#071321]/70 border border-slate-200 dark:border-blue-900/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 dark:focus:border-blue-500 transition-all duration-200"
                    />
                  </div>
                </div>

                {/* País com nome inteiro */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="pais"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200"
                  >
                    País <span className="text-blue-600 dark:text-blue-400">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Globe className="absolute left-3.5 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none z-10" />
                    <select
                      id="pais"
                      required
                      value={pais}
                      onChange={(e) => {
                        const novoPais = e.target.value;
                        setPais(novoPais);
                        const correspondente = PAISES.find((p) => p.nome === novoPais);
                        if (correspondente) {
                          setDdi(correspondente.ddi);
                        }
                      }}
                      className="w-full appearance-none pl-11 pr-10 py-2.5 sm:py-3 rounded-xl bg-slate-50/70 dark:bg-[#071321]/70 border border-slate-200 dark:border-blue-900/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 dark:focus:border-blue-500 transition-all duration-200 cursor-pointer"
                    >
                      {PAISES.map((p) => (
                        <option key={p.nome} value={p.nome} className="bg-white dark:bg-[#0c1e33] text-slate-900 dark:text-slate-100">
                          {p.nome}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3.5 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                  </div>
                </div>

                {/* Estado */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="estado"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200"
                  >
                    Estado <span className="text-blue-600 dark:text-blue-400">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <MapPin className="absolute left-3.5 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none z-10" />
                    {pais === "Brasil" ? (
                      <>
                        <select
                          id="estado"
                          required
                          value={estado}
                          onChange={(e) => setEstado(e.target.value)}
                          className="w-full appearance-none pl-11 pr-10 py-2.5 sm:py-3 rounded-xl bg-slate-50/70 dark:bg-[#071321]/70 border border-slate-200 dark:border-blue-900/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 dark:focus:border-blue-500 transition-all duration-200 cursor-pointer"
                        >
                          <option value="" disabled className="bg-white dark:bg-[#0c1e33] text-slate-500">
                            Selecione o estado (UF)...
                          </option>
                          {ESTADOS_BRASIL.map((uf) => (
                            <option key={uf.sigla} value={uf.sigla} className="bg-white dark:bg-[#0c1e33] text-slate-900 dark:text-slate-100">
                              {uf.sigla} - {uf.nome}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3.5 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                      </>
                    ) : (
                      <input
                        type="text"
                        id="estado"
                        required
                        value={estado}
                        onChange={(e) => setEstado(e.target.value)}
                        placeholder="Informe seu estado / província"
                        className="w-full pl-11 pr-4 py-2.5 sm:py-3 rounded-xl bg-slate-50/70 dark:bg-[#071321]/70 border border-slate-200 dark:border-blue-900/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 dark:focus:border-blue-500 transition-all duration-200"
                      />
                    )}
                  </div>
                </div>

                {/* Documento com Validação Completa de CPF */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="documento"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200"
                    >
                      Documento <span className="text-blue-600 dark:text-blue-400">*</span>
                    </label>
                    <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800/80 p-0.5 rounded-lg text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setTipoDocumento("cpf");
                          setDocumento("");
                        }}
                        className={`px-2.5 py-0.5 rounded-md font-medium transition-all cursor-pointer ${
                          tipoDocumento === "cpf"
                            ? "bg-blue-600 text-white shadow-xs"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        CPF
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTipoDocumento("passaporte");
                          setDocumento("");
                        }}
                        className={`px-2.5 py-0.5 rounded-md font-medium transition-all cursor-pointer ${
                          tipoDocumento === "passaporte"
                            ? "bg-blue-600 text-white shadow-xs"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        Passaporte
                      </button>
                    </div>
                  </div>

                  <div className="relative flex items-center">
                    <FileText className="absolute left-3.5 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none z-10" />
                    <input
                      type="text"
                      id="documento"
                      required
                      value={documento}
                      onChange={(e) => handleDocumentoChange(e.target.value)}
                      placeholder={tipoDocumento === "cpf" ? "000.000.000-00" : "Número do passaporte"}
                      className={`w-full pl-11 pr-4 py-2.5 sm:py-3 rounded-xl bg-slate-50/70 dark:bg-[#071321]/70 border text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 transition-all duration-200 ${
                        isCpfCompleto
                          ? isCpfValido
                            ? "border-emerald-500 focus:ring-emerald-500/30"
                            : "border-rose-500 focus:ring-rose-500/30"
                          : "border-slate-200 dark:border-blue-900/50 focus:ring-blue-500/30 focus:border-blue-600 dark:focus:border-blue-500"
                      }`}
                    />
                  </div>

                  {/* Feedback em tempo real para CPF */}
                  {tipoDocumento === "cpf" && isCpfCompleto && (
                    <p
                      className={`text-[11px] pt-0.5 flex items-center gap-1 ${
                        isCpfValido
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {isCpfValido ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>CPF válido</span>
                        </>
                      ) : (
                        <>
                          <X className="w-3.5 h-3.5" />
                          <span>CPF inválido (verifique os dígitos)</span>
                        </>
                      )}
                    </p>
                  )}
                </div>

                {/* Telefone com seleção de país pelo nome inteiro e código DDI */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="telefone"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200"
                  >
                    Telefone / WhatsApp <span className="text-blue-600 dark:text-blue-400">*</span>
                  </label>
                  <div className="flex gap-2">
                    {/* Seletor com Nome Completo do País e DDI */}
                    <div className="relative w-36 sm:w-44 shrink-0">
                      <select
                        id="ddi"
                        aria-label="Código DDI e País"
                        value={ddi}
                        onChange={(e) => {
                          setDdi(e.target.value);
                          setTelefone("");
                        }}
                        className="w-full appearance-none pl-3 pr-8 py-2.5 sm:py-3 rounded-xl bg-slate-50/70 dark:bg-[#071321]/70 border border-slate-200 dark:border-blue-900/50 text-slate-900 dark:text-slate-100 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 dark:focus:border-blue-500 transition-all duration-200 cursor-pointer"
                      >
                        {PAISES.map((p) => (
                          <option
                            key={`${p.nome}-${p.ddi}`}
                            value={p.ddi}
                            className="bg-white dark:bg-[#0c1e33] text-slate-900 dark:text-slate-100"
                          >
                            {p.nome} ({p.ddi})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                    </div>

                    {/* Input do Número do Telefone */}
                    <div className="relative flex-1 flex items-center">
                      <Phone className="absolute left-3.5 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none z-10" />
                      <input
                        type="tel"
                        id="telefone"
                        required
                        value={telefone}
                        onChange={(e) => handleTelefoneChange(e.target.value)}
                        placeholder={ddi === "+55" ? "(00) 00000-0000" : "Número do telefone"}
                        className="w-full pl-11 pr-4 py-2.5 sm:py-3 rounded-xl bg-slate-50/70 dark:bg-[#071321]/70 border border-slate-200 dark:border-blue-900/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 dark:focus:border-blue-500 transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>

                {/* Criar Senha */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200"
                  >
                    Criar Senha <span className="text-blue-600 dark:text-blue-400">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none z-10" />
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-11 py-2.5 sm:py-3 rounded-xl bg-slate-50/70 dark:bg-[#071321]/70 border border-slate-200 dark:border-blue-900/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 dark:focus:border-blue-500 transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Ocultar senha" : "Ver senha"}
                      className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Indicadores dinâmicos dos requisitos de senha */}
                  <div className="pt-2 grid grid-cols-2 gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <div
                      className={`flex items-center gap-1.5 transition-colors ${
                        hasMinLength ? "text-emerald-600 dark:text-emerald-400 font-medium" : ""
                      }`}
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                          hasMinLength
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                        }`}
                      >
                        ✓
                      </span>
                      <span>Mínimo 8 caracteres</span>
                    </div>

                    <div
                      className={`flex items-center gap-1.5 transition-colors ${
                        hasUpperCase ? "text-emerald-600 dark:text-emerald-400 font-medium" : ""
                      }`}
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                          hasUpperCase
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                        }`}
                      >
                        ✓
                      </span>
                      <span>Letra maiúscula</span>
                    </div>

                    <div
                      className={`flex items-center gap-1.5 transition-colors ${
                        hasLowerCase ? "text-emerald-600 dark:text-emerald-400 font-medium" : ""
                      }`}
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                          hasLowerCase
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                        }`}
                      >
                        ✓
                      </span>
                      <span>Letra minúscula</span>
                    </div>

                    <div
                      className={`flex items-center gap-1.5 transition-colors ${
                        hasNumber ? "text-emerald-600 dark:text-emerald-400 font-medium" : ""
                      }`}
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                          hasNumber
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                        }`}
                      >
                        ✓
                      </span>
                      <span>Pelo menos 1 número</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 pt-0.5">
                    * Caractere especial opcional (@, #, $, %, etc.)
                  </p>
                </div>

                {/* Confirmar Senha */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="confirmPassword"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200"
                  >
                    Confirmar Senha <span className="text-blue-600 dark:text-blue-400">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none z-10" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full pl-11 pr-11 py-2.5 sm:py-3 rounded-xl bg-slate-50/70 dark:bg-[#071321]/70 border text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 transition-all duration-200 ${
                        confirmPassword.length > 0
                          ? passwordsMatch
                            ? "border-emerald-500 focus:ring-emerald-500/30"
                            : "border-rose-500 focus:ring-rose-500/30"
                          : "border-slate-200 dark:border-blue-900/50 focus:ring-blue-500/30 focus:border-blue-600 dark:focus:border-blue-500"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? "Ocultar senha" : "Ver senha"}
                      className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {confirmPassword.length > 0 && (
                    <p
                      className={`text-[11px] pt-1 flex items-center gap-1 ${
                        passwordsMatch
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {passwordsMatch ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>As senhas coincidem</span>
                        </>
                      ) : (
                        <>
                          <X className="w-3.5 h-3.5" />
                          <span>As senhas não coincidem</span>
                        </>
                      )}
                    </p>
                  )}
                </div>
              </div>

              {/* Caixa de Seleção Obrigatória de Termos de Uso */}
              <div className="pt-2">
                <label className="flex items-start gap-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    required
                    checked={termosAceitos}
                    onChange={(e) => setTermosAceitos(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 dark:border-blue-900/60 text-blue-600 focus:ring-blue-500/30 dark:bg-[#071321] cursor-pointer accent-blue-600 shrink-0"
                  />
                  <span>
                    Declaro que li e concordo com os{" "}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsModalTermosOpen(true);
                      }}
                      className="text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                    >
                      Termos de Uso e Política de Privacidade
                    </button>{" "}
                    da plataforma Céos System. <span className="text-blue-600 dark:text-blue-400">*</span>
                  </span>
                </label>
              </div>

              {/* Botão de Cadastrar */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] disabled:opacity-70 text-white font-semibold text-sm shadow-md hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 group"
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processando cadastro...</span>
                  </span>
                ) : (
                  <>
                    <span>Cadastrar na Céos System</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Rodapé com link para login */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-blue-900/30 text-center">
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Já possui uma conta?{" "}
              <Link
                href="/login"
                className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 hover:underline transition-colors"
              >
                Fazer login
              </Link>
            </p>
          </div>
        </div>

        {/* Informação de Segurança */}
        <p className="mt-6 text-center text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          <span>Plataforma segura com conformidade à LGPD e proteção de dados científicos</span>
        </p>
      </div>

      {/* Modal de Visualização de Termos de Uso */}
      {isModalTermosOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-termos-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm fade-in overflow-y-auto"
          onClick={() => setIsModalTermosOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl bg-white dark:bg-[#0c1e33] border border-slate-200 dark:border-blue-900/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Topo do Modal */}
            <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-blue-900/40 flex items-center justify-between bg-slate-50/80 dark:bg-[#071321]/60 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2
                    id="modal-termos-title"
                    className="font-montserrat font-bold text-base sm:text-lg text-slate-900 dark:text-white"
                  >
                    Termos de Uso e Privacidade
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Céos System • Plataforma de Congressos e Eventos Científicos
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalTermosOpen(false)}
                aria-label="Fechar termos"
                className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo com Rolagem dos Termos */}
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
              <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40 text-blue-800 dark:text-blue-300 text-xs">
                Este documento reúne as diretrizes gerais de uso da plataforma. O texto completo dos termos será integrado e personalizado conforme os eventos científicos cadastrados.
              </div>

              <section className="space-y-1.5">
                <h3 className="font-montserrat font-bold text-sm text-slate-900 dark:text-white">
                  1. Objeto e Âmbito de Aplicação
                </h3>
                <p>
                  A Céos System é uma infraestrutura tecnológica destinada à gestão, realização e publicação científica de congressos, simpósios, conferências e eventos acadêmicos. Ao criar uma conta, o usuário adquire acesso aos módulos de inscrição, credenciamento, emissão de certificados digitais e submissão de artigos.
                </p>
              </section>

              <section className="space-y-1.5">
                <h3 className="font-montserrat font-bold text-sm text-slate-900 dark:text-white">
                  2. Responsabilidades do Usuário
                </h3>
                <p>
                  O usuário compromete-se a fornecer informações verídicas e atualizadas, zelando pelo sigilo de suas credenciais de acesso. Trabalhos científicos submetidos devem respeitar os direitos autorais e as diretrizes éticas de publicação.
                </p>
              </section>

              <section className="space-y-1.5">
                <h3 className="font-montserrat font-bold text-sm text-slate-900 dark:text-white">
                  3. Certificados Digitais e Publicação de Anais
                </h3>
                <p>
                  Os certificados emitidos através da Céos System possuem autenticação criptográfica e código verificador único. Os anais de eventos poderão ser indexados com ISBN e identificadores de publicação oficial.
                </p>
              </section>

              <section className="space-y-1.5">
                <h3 className="font-montserrat font-bold text-sm text-slate-900 dark:text-white">
                  4. Privacidade e Proteção de Dados (LGPD)
                </h3>
                <p>
                  Os dados fornecidos são utilizados exclusivamente para a execução dos serviços contratados pelos eventos e cumprimento de obrigações acadêmicas e legais, não sendo comercializados a terceiros.
                </p>
              </section>
            </div>

            {/* Rodapé do Modal com Ações */}
            <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-blue-900/40 bg-slate-50/80 dark:bg-[#071321]/60 flex flex-col sm:flex-row items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalTermosOpen(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-blue-900/60 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
              >
                Fechar
              </button>

              <button
                type="button"
                onClick={() => {
                  setTermosAceitos(true);
                  setIsModalTermosOpen(false);
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Li e Aceito os Termos</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}