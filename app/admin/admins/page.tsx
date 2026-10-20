"use client";

import React, { useEffect, useState } from "react";
import {
  buscarAdminsCadastrados,
  salvarAdminNaPasta,
  excluirAdminDaPasta,
  AdminProfile,
} from "@/lib/admin";
import { getApps, initializeApp } from "firebase/app";
import { createUserWithEmailAndPassword, getAuth, signOut } from "firebase/auth";
import app, { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import {
  Crown,
  Shield,
  KeyRound,
  UserPlus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Mail,
  Lock,
  User,
  ShieldAlert,
  Info,
} from "lucide-react";

export default function AdminAdminsPage() {
  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal para criar novo admin
  const [modalNovoAdmin, setModalNovoAdmin] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novoEmail, setNovoEmail] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [novoRole, setNovoRole] = useState<"admin" | "dono">("admin");
  const [salvandoAdmin, setSalvandoAdmin] = useState(false);
  const [erroModal, setErroModal] = useState("");

  // Modal de exclusão
  const [adminExcluir, setAdminExcluir] = useState<AdminProfile | null>(null);
  const [excluindoAdmin, setExcluindoAdmin] = useState(false);

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const carregarAdmins = async () => {
    setLoading(true);
    try {
      const data = await buscarAdminsCadastrados();
      setAdmins(data);
    } catch (err) {
      console.error("Erro ao carregar lista de admins:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarAdmins();
  }, []);

  // Criar novo Admin na pasta /admins
  const handleCriarAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroModal("");
    setSalvandoAdmin(true);

    try {
      if (!novoNome.trim() || !novoEmail.trim() || !novaSenha.trim()) {
        setErroModal("Preencha todos os campos obrigatórios.");
        setSalvandoAdmin(false);
        return;
      }

      if (novaSenha.length < 6) {
        setErroModal("A senha deve possuir pelo menos 6 caracteres.");
        setSalvandoAdmin(false);
        return;
      }

      // Cria a conta no Firebase Authentication via instância isolada (não desloga o Dono atual)
      const secondaryApp =
        getApps().find((a) => a.name === "SecondaryWorker") ||
        initializeApp(app.options, "SecondaryWorker");
      const secondaryAuth = getAuth(secondaryApp);
      const cred = await createUserWithEmailAndPassword(secondaryAuth, novoEmail.trim(), novaSenha);
      await signOut(secondaryAuth);

      // Salva estritamente na coleção /admins
      await setDoc(doc(db, "admins", cred.user.uid), {
        nome: novoNome.trim(),
        email: novoEmail.trim().toLowerCase(),
        role: novoRole,
        ativo: true,
        criadoEm: new Date().toISOString(),
        ultimoAcesso: null,
      });

      showToast(`Administrador ${novoNome} cadastrado com sucesso na pasta /admins!`);
      setModalNovoAdmin(false);
      setNovoNome("");
      setNovoEmail("");
      setNovaSenha("");
      await carregarAdmins();
    } catch (err: any) {
      console.error("Erro ao registrar novo admin:", err);
      let msg = "Não foi possível cadastrar o administrador.";
      if (err?.code === "auth/email-already-in-use") {
        msg = "Este e-mail já está em uso no Firebase. Tente cadastrar com outro e-mail corporativo.";
      }
      setErroModal(msg);
    } finally {
      setSalvandoAdmin(false);
    }
  };

  // Excluir Admin da pasta /admins
  const handleConfirmarExclusao = async () => {
    if (!adminExcluir) return;
    setExcluindoAdmin(true);
    try {
      await excluirAdminDaPasta(adminExcluir.id);
      showToast(`Acesso de ${adminExcluir.nome} removido da pasta /admins com sucesso.`);
      setAdminExcluir(null);
      await carregarAdmins();
    } catch (err) {
      alert("Erro ao excluir administrador.");
    } finally {
      setExcluindoAdmin(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-2xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-900/40 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-widest">
            <Crown className="w-3.5 h-3.5" />
            <span>Segurança & Permissões Master</span>
          </div>
          <h1 className="font-montserrat text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Gestão da Pasta /admins
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Coleção isolada do Firestore dedicada exclusivamente aos donos e administradores
          </p>
        </div>

        <button
          onClick={() => {
            setModalNovoAdmin(true);
            setErroModal("");
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer self-start sm:self-center"
        >
          <UserPlus className="w-4 h-4" />
          <span>Cadastrar Novo Administrador</span>
        </button>
      </div>

      

      {/* TABELA DE ADMINISTRADORES */}
      <div className="bg-[#0c1e33] rounded-3xl border border-blue-900/40 shadow-xl overflow-hidden">
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Carregando administradores...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-blue-900/40 bg-[#071321]/80 text-slate-400 font-semibold">
                  <th className="py-3.5 px-5">Administrador</th>
                  <th className="py-3.5 px-4">E-mail Corporativo</th>
                  <th className="py-3.5 px-4 text-center">Nível de Acesso</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4">Último Login</th>
                  <th className="py-3.5 px-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-900/20">
                {admins.map((adm) => (
                  <tr key={adm.id} className="hover:bg-slate-800/30 transition-colors">
                    {/* Nome & Avatar */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/20">
                          {adm.nome.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm">{adm.nome}</p>
                          <span className="text-[10px] text-slate-400 font-mono">UID: {adm.uid.slice(0, 10)}...</span>
                        </div>
                      </div>
                    </td>

                    {/* E-mail */}
                    <td className="py-4 px-4 text-slate-300 font-medium">{adm.email}</td>

                    {/* Role */}
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        <Crown className="w-3 h-3" />
                        <span>{adm.role === "dono" ? "Super Admin" : "Administrador"}</span>
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Ativo</span>
                      </span>
                    </td>

                    {/* Último Login */}
                    <td className="py-4 px-4 text-slate-400 text-[11px]">
                      {adm.ultimoAcesso ? new Date(adm.ultimoAcesso).toLocaleString("pt-BR") : "Ainda não acessou"}
                    </td>

                    {/* Ações */}
                    <td className="py-4 px-5 text-right">
                      {admins.length > 1 ? (
                        <button
                          onClick={() => setAdminExcluir(adm)}
                          className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                          title="Remover este administrador da pasta /admins"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-500 italic">Admin Principal</span>
                      )}
                    </td>
                  </tr>
                ))}

                {admins.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                      Nenhum administrador encontrado na pasta /admins.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: CADASTRAR NOVO ADMIN */}
      {modalNovoAdmin && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#0c1e33] border border-amber-500/30 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setModalNovoAdmin(false)}
              className="absolute right-5 top-5 p-1.5 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                <Crown className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="font-montserrat font-bold text-base text-white">
                  Cadastrar Administrador
                </h3>
                <p className="text-xs text-slate-400">Novo acesso salvo na pasta /admins</p>
              </div>
            </div>

            {erroModal && (
              <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-start gap-2 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{erroModal}</span>
              </div>
            )}

            <form onSubmit={handleCriarAdmin} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Nome Completo</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={novoNome}
                    onChange={(e) => setNovoNome(e.target.value)}
                    placeholder="Ex: Carlos Mendes"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#071321] border border-blue-900/50 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">E-mail de Login</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={novoEmail}
                    onChange={(e) => setNovoEmail(e.target.value)}
                    placeholder="carlos@ceossystem.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#071321] border border-blue-900/50 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Senha Provisória</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#071321] border border-blue-900/50 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Nível / Role</label>
                <select
                  value={novoRole}
                  onChange={(e) => setNovoRole(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#071321] border border-blue-900/50 text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="admin">Administrador Regular</option>
                  <option value="dono">Super Admin / Dono (Acesso Total)</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalNovoAdmin(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoAdmin}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  {salvandoAdmin ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Registrar Admin</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR EXCLUSÃO DE ADMIN */}
      {adminExcluir && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#0c1e33] border border-rose-500/30 rounded-3xl p-6 sm:p-7 space-y-4 shadow-2xl relative text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="font-montserrat font-bold text-lg text-white">
                Revogar Privilégios de Administrador?
              </h3>
              <p className="text-xs text-slate-400">
                Você está prestes a remover <strong className="text-white">{adminExcluir.nome}</strong>{" "}
                ({adminExcluir.email}) da pasta <code className="text-amber-400">/admins</code>.
                Esta pessoa perderá o acesso imediato ao Painel do Administrador.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAdminExcluir(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarExclusao}
                disabled={excluindoAdmin}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                {excluindoAdmin ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Confirmar Exclusão</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
