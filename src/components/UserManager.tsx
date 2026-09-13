import React, { useState } from 'react';
import { AppUser, UserRole, Vehicle } from '../types';
import { formatCpf, isValidCpf, cleanCpfDigits } from '../utils/cpfValidator';
import {
  UserPlus,
  Trash2,
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  Pencil,
  Lock,
  Phone,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  Crown,
  Briefcase,
  X,
  CheckCircle2,
  Users,
  CreditCard,
} from 'lucide-react';

interface UserManagerProps {
  users: AppUser[];
  vehicles: Vehicle[];
  currentUser: AppUser;
  onSwitchUser: (user: AppUser) => void;
  onAddUser: (user: Omit<AppUser, 'id'>) => void;
  onUpdateUser: (id: string, updatedData: Partial<AppUser>) => void;
  onDeleteUser: (id: string) => void;
  onToggleStatus: (id: string) => void;
}

// Formatador de Telefone Brasileiro: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
const formatPhoneNumber = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

export const UserManager: React.FC<UserManagerProps> = ({
  users,
  vehicles,
  currentUser,
  onSwitchUser,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onToggleStatus,
}) => {
  // Estado do formulário de NOVO cadastro
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('Gestor de Frota');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estado da edição de usuário (Modal)
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editCpf, setEditCpf] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('Gestor de Frota');
  const [editPassword, setEditPassword] = useState('');
  const [editConfirmPassword, setEditConfirmPassword] = useState('');
  const [editStatus, setEditStatus] = useState<'Ativo' | 'Inativo'>('Ativo');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [showEditConfirmPassword, setShowEditConfirmPassword] = useState(false);
  const [editError, setEditError] = useState('');

  // Regras de Permissão:
  // Administrador Root pode editar qualquer cadastro.
  // Outros usuários só podem editar o seu próprio cadastro (currentUser.id === targetUser.id).
  const canEditUser = (targetUser: AppUser): boolean => {
    if (currentUser.isRoot) return true;
    return currentUser.id === targetUser.id;
  };

  // Administrador Root pode excluir qualquer cadastro (exceto a si próprio).
  // Outros usuários NÃO podem excluir nenhum usuário.
  const canDeleteUser = (targetUser: AppUser): boolean => {
    if (!currentUser.isRoot) return false;
    if (targetUser.isRoot || targetUser.id === currentUser.id) return false;
    return true;
  };

  // Envio do formulário de criação
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser.isRoot) {
      setError('Apenas o Administrador Root tem permissão para cadastrar novos usuários e administradores.');
      return;
    }
    if (!name.trim()) {
      setError('Informe o nome completo do usuário.');
      return;
    }
    const cleanCpf = cleanCpfDigits(cpf);
    if (!cleanCpf || cleanCpf.length !== 11) {
      setError('Informe um CPF válido com 11 dígitos.');
      return;
    }
    const duplicateCpf = users.find(
      (u) => cleanCpfDigits(u.cpf || '') === cleanCpf
    );
    if (duplicateCpf) {
      setError(`Este CPF já está cadastrado para o usuário "${duplicateCpf.name}".`);
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Informe um e-mail válido.');
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
      setError('Informe um número de telefone com DDD válido (ex: 11 98765-4321).');
      return;
    }
    if (!password.trim() || password.length < 4) {
      setError('Informe uma senha com no mínimo 4 caracteres.');
      return;
    }
    if (!confirmPassword.trim()) {
      setError('Por favor, confirme a senha digitada.');
      return;
    }
    if (password.trim() !== confirmPassword.trim()) {
      setError('As senhas digitadas não coincidem. Verifique e tente novamente.');
      return;
    }

    onAddUser({
      name: name.trim(),
      cpf: formatCpf(cpf),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      role,
      password: password.trim(),
      isRoot: false,
      status: 'Ativo',
      createdAt: new Date().toISOString(),
    });

    setName('');
    setCpf('');
    setEmail('');
    setPhone('');
    setPassword('');
    setConfirmPassword('');
    setRole('Gestor de Frota');
    setError('');
    setSuccess(`Usuário ${name.trim()} cadastrado com sucesso!`);
    setTimeout(() => setSuccess(''), 4000);
  };

  // Abrir Modal de Edição
  const handleOpenEdit = (user: AppUser) => {
    if (!canEditUser(user)) {
      alert('Você não tem permissão para editar este usuário. Apenas o Administrador Root ou o próprio usuário pode alterar este cadastro.');
      return;
    }
    setEditingUser(user);
    setEditName(user.name);
    setEditCpf(formatCpf(user.cpf || ''));
    setEditEmail(user.email);
    setEditPhone(user.phone || '');
    setEditRole(user.role);
    setEditPassword('');
    setEditConfirmPassword('');
    setEditStatus(user.status);
    setEditError('');
    setShowEditPassword(false);
    setShowEditConfirmPassword(false);
  };

  // Salvar Edição
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (!editName.trim()) {
      setEditError('Informe o nome completo.');
      return;
    }
    const cleanEditCpf = cleanCpfDigits(editCpf);
    if (!cleanEditCpf || cleanEditCpf.length !== 11) {
      setEditError('Informe um CPF válido com 11 dígitos.');
      return;
    }
    const duplicateCpf = users.find(
      (u) =>
        u.id !== editingUser.id &&
        cleanCpfDigits(u.cpf || '') === cleanEditCpf
    );
    if (duplicateCpf) {
      setEditError(`Este CPF já está em uso pelo usuário "${duplicateCpf.name}".`);
      return;
    }
    if (!editEmail.trim() || !editEmail.includes('@')) {
      setEditError('Informe um e-mail corporativo válido.');
      return;
    }
    if (!editPhone.trim() || editPhone.replace(/\D/g, '').length < 10) {
      setEditError('Informe um telefone válido com DDD.');
      return;
    }

    const updatedData: Partial<AppUser> = {
      name: editName.trim(),
      cpf: formatCpf(editCpf),
      email: editEmail.trim().toLowerCase(),
      phone: editPhone.trim(),
      status: editStatus,
    };

    // Apenas o Administrador Root pode alterar cargos de usuários
    if (currentUser.isRoot) {
      updatedData.role = editRole;
    }

    // Se preencheu nova senha, valida confirmação e atualiza
    if (editPassword.trim() || editConfirmPassword.trim()) {
      if (editPassword.length < 4) {
        setEditError('A nova senha deve possuir no mínimo 4 caracteres.');
        return;
      }
      if (editPassword.trim() !== editConfirmPassword.trim()) {
        setEditError('A nova senha e a confirmação de senha não coincidem.');
        return;
      }
      updatedData.password = editPassword.trim();
    }

    onUpdateUser(editingUser.id, updatedData);
    setEditingUser(null);
    setSuccess(`Cadastro de "${editName.trim()}" atualizado com sucesso!`);
    setTimeout(() => setSuccess(''), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#15803d] flex items-center gap-2">
            <Users className="w-7 h-7 text-[#15803d]" />
            Gerenciar Usuários
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Cadastro exclusivo de <strong>Administradores</strong> e <strong>Gestores de Frota</strong>. Todos possuem acesso a todos os dados do sistema.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-emerald-50 border border-emerald-200 text-[#15803d] px-3.5 py-1.5 rounded-lg text-xs font-bold">
            {users.length} Usuários Cadastrados
          </div>
        </div>
      </div>

      {/* Banner de Sessão Atual e Teste de Permissões */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div
              className={`p-2.5 rounded-xl text-white ${
                currentUser.isRoot ? 'bg-amber-500 shadow-xs' : 'bg-emerald-600 shadow-xs'
              }`}
            >
              {currentUser.isRoot ? (
                <Crown className="w-6 h-6" />
              ) : currentUser.role === 'Administrador' ? (
                <Shield className="w-6 h-6" />
              ) : (
                <Briefcase className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-500">
                  Sessão Ativa:
                </span>
                <span className="font-bold text-slate-900 text-sm sm:text-base">
                  {currentUser.name}
                </span>
                {currentUser.isRoot ? (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                    👑 Administrador Root (Master)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    {currentUser.role}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentUser.isRoot ? (
                  <span className="text-emerald-700 font-medium">
                    ✓ Permissão Root Master: Você pode <strong>editar</strong> e <strong>excluir</strong> qualquer cadastro de usuário.
                  </span>
                ) : (
                  <span className="text-slate-600 font-medium">
                    ℹ️ Usuário Padrão: Você pode editar <strong>apenas o seu próprio cadastro</strong>. Exclusão e edição de outros usuários estão bloqueadas.
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Alternador rápido de usuário para testar as regras de permissão */}
          <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
            <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">
              Alternar Usuário:
            </span>
            <select
              value={currentUser.id}
              onChange={(e) => {
                const selected = users.find((u) => u.id === e.target.value);
                if (selected) onSwitchUser(selected);
              }}
              className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-300 bg-slate-50 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#15803d]/30"
              title="Alterne o usuário ativo para testar as permissões de edição e exclusão"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} {u.isRoot ? '(👑 Root)' : `(${u.role})`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid Principal: Formulário de Cadastro + Lista de Usuários */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Formulário de Cadastro */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#15803d]" />
              Cadastrar Novo Usuário
            </h3>
            <span className="text-[10px] uppercase font-bold text-[#15803d] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Admin & Gestor
            </span>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-[#15803d] text-xs rounded-lg font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {!currentUser.isRoot && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-lg font-medium flex items-start gap-2">
              <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Cadastro Restrito:</span> Apenas o <strong>Administrador Root</strong> pode cadastrar novos administradores e gestores de frota.
              </div>
            </div>
          )}

          <form onSubmit={handleCreateSubmit} className="space-y-3.5">
            {/* Nome Completo */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome Completo *
              </label>
              <input
                type="text"
                placeholder="Ex: Carlos Eduardo Silva"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!currentUser.isRoot}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#15803d]/30 focus:border-[#15803d] disabled:bg-slate-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* CPF do Usuário */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                CPF do Usuário (aceita números, pontos e vírgulas) *
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(e) => setCpf(formatCpf(e.target.value))}
                  maxLength={14}
                  disabled={!currentUser.isRoot}
                  className="w-full pl-8 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#15803d]/30 focus:border-[#15803d] disabled:bg-slate-50 disabled:cursor-not-allowed"
                />
                <CreditCard className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Você pode digitar ou colar com pontos, traços ou vírgulas.
              </p>
            </div>

            {/* E-mail Corporativo */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                E-mail Corporativo *
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="Ex: carlos@frota.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!currentUser.isRoot}
                  className="w-full pl-8 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#15803d]/30 focus:border-[#15803d] disabled:bg-slate-50 disabled:cursor-not-allowed"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            {/* Número de Telefone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Número de Telefone (com DDD) *
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="(11) 98765-4321"
                  value={phone}
                  onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                  maxLength={15}
                  disabled={!currentUser.isRoot}
                  className="w-full pl-8 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#15803d]/30 focus:border-[#15803d] disabled:bg-slate-50 disabled:cursor-not-allowed"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            {/* Cargo / Função (Apenas Administrador ou Gestor de Frota) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Função / Cargo no Sistema *
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                disabled={!currentUser.isRoot}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#15803d]/30 focus:border-[#15803d] disabled:bg-slate-50 disabled:cursor-not-allowed"
              >
                <option value="Gestor de Frota">Gestor de Frota</option>
                <option value="Administrador">Administrador</option>
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Nota: A função <strong>Motorista foi descontinuada</strong>. Apenas gestores e administradores podem ser cadastrados.
              </p>
            </div>

            {/* Senha de Acesso e Confirmar Senha */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Senha de Acesso */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Senha de Acesso *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 4 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={!currentUser.isRoot}
                    className="w-full pl-8 pr-9 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#15803d]/30 focus:border-[#15803d] disabled:bg-slate-50 disabled:cursor-not-allowed"
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={!currentUser.isRoot}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer disabled:cursor-not-allowed"
                    title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirmar Senha */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirmar Senha *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Repita a mesma senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={!currentUser.isRoot}
                    className="w-full pl-8 pr-9 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#15803d]/30 focus:border-[#15803d] disabled:bg-slate-50 disabled:cursor-not-allowed"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={!currentUser.isRoot}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer disabled:cursor-not-allowed"
                    title={showConfirmPassword ? 'Ocultar confirmação' : 'Ver confirmação'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={!currentUser.isRoot}
              className={`w-full py-2.5 px-4 rounded-lg font-semibold text-xs sm:text-sm shadow-xs transition-colors mt-3 ${
                currentUser.isRoot
                  ? 'bg-[#15803d] hover:bg-[#166534] text-white cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {currentUser.isRoot ? 'Salvar Usuário' : 'Cadastro Restrito ao Root'}
            </button>
          </form>
        </div>

        {/* Tabela de Usuários */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Lista de Usuários Cadastrados
              </h3>
              <p className="text-xs text-slate-500">
                Administradores e Gestores de Frota com acesso a todo o sistema.
              </p>
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Acesso total a todos os dados garantido para todos os cargos.
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#f1f5f9] text-slate-700 text-xs font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Nome & Contato</th>
                  <th className="py-2.5 px-4">Telefone</th>
                  <th className="py-2.5 px-4">Cargo / Função</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {users.map((u) => {
                  const editable = canEditUser(u);
                  const deletable = canDeleteUser(u);
                  const isCurrentUser = currentUser.id === u.id;

                  return (
                    <tr
                      key={u.id}
                      className={`transition-colors ${
                        isCurrentUser
                          ? 'bg-emerald-50/40 hover:bg-emerald-50/70'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* Nome e E-mail */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-800">{u.name}</span>
                          {u.isRoot && (
                            <span title="Administrador Master Root">
                              <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0 inline" />
                            </span>
                          )}
                          {isCurrentUser && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Você
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{u.email}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                          <CreditCard className="w-3 h-3 text-slate-400" />
                          <span>CPF: {u.cpf || 'Não informado'}</span>
                        </div>
                      </td>

                      {/* Telefone */}
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{u.phone || 'Não informado'}</span>
                        </div>
                      </td>

                      {/* Cargo */}
                      <td className="py-3 px-4">
                        {u.isRoot ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-xs">
                            <Crown className="w-3 h-3 text-amber-600" />
                            Administrador Root
                          </span>
                        ) : u.role === 'Administrador' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <ShieldCheck className="w-3 h-3 text-indigo-600" />
                            Administrador
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Briefcase className="w-3 h-3 text-emerald-600" />
                            Gestor de Frota
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => {
                            if (!currentUser.isRoot && !isCurrentUser) {
                              alert('Apenas o Administrador Root ou o próprio usuário pode alterar o status.');
                              return;
                            }
                            onToggleStatus(u.id);
                          }}
                          className={`px-2 py-0.5 rounded-full text-xs font-bold transition-colors ${
                            u.status === 'Ativo'
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          } ${
                            !currentUser.isRoot && !isCurrentUser
                              ? 'cursor-not-allowed opacity-70'
                              : 'cursor-pointer'
                          }`}
                          title={
                            currentUser.isRoot || isCurrentUser
                              ? 'Clique para alternar status'
                              : 'Apenas Root ou o próprio usuário pode alternar'
                          }
                        >
                          {u.status}
                        </button>
                      </td>

                      {/* Ações: Editar Cadastro & Excluir */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Botão Editar Cadastro */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(u)}
                            disabled={!editable}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                              editable
                                ? 'bg-slate-100 hover:bg-[#15803d] text-slate-700 hover:text-white cursor-pointer shadow-2xs'
                                : 'bg-slate-50 text-slate-300 border border-slate-200 cursor-not-allowed'
                            }`}
                            title={
                              editable
                                ? 'Editar Cadastro de Usuário (dados, telefone, senha)'
                                : 'Apenas o Administrador Root ou o próprio usuário pode editar este cadastro.'
                            }
                          >
                            {editable ? (
                              <>
                                <Pencil className="w-3.5 h-3.5" />
                                <span>Editar</span>
                              </>
                            ) : (
                              <>
                                <Lock className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Bloqueado</span>
                              </>
                            )}
                          </button>

                          {/* Botão Excluir */}
                          {deletable ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Confirma a exclusão definitiva do usuário "${u.name}" (${u.email})?`
                                  )
                                ) {
                                  onDeleteUser(u.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Excluir usuário (Apenas Administrador Root)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <span
                              className="p-1.5 text-slate-300 cursor-not-allowed"
                              title={
                                u.isRoot
                                  ? 'O Administrador Root não pode ser excluído'
                                  : 'Apenas o Administrador Root pode excluir usuários'
                              }
                            >
                              <Trash2 className="w-4 h-4 opacity-40" />
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de Editar Cadastro */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Pencil className="w-5 h-5 text-[#15803d]" />
                  Editar Cadastro de Usuário
                </h3>
                <p className="text-xs text-slate-500">
                  {editingUser.name} {editingUser.isRoot ? '(Root Master)' : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              {/* Nome Completo */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#15803d]/30 focus:border-[#15803d]"
                />
              </div>

              {/* CPF do Usuário */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  CPF do Usuário (aceita números, pontos e vírgulas) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={editCpf}
                    onChange={(e) => setEditCpf(formatCpf(e.target.value))}
                    maxLength={14}
                    placeholder="000.000.000-00"
                    className="w-full pl-8 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#15803d]/30 focus:border-[#15803d]"
                  />
                  <CreditCard className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Reconhece pontuação padrão ou números separados por vírgula.
                </p>
              </div>

              {/* E-mail */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  E-mail Corporativo *
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#15803d]/30 focus:border-[#15803d]"
                />
              </div>

              {/* Número de Telefone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Número de Telefone (com DDD) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(formatPhoneNumber(e.target.value))}
                    maxLength={15}
                    placeholder="(11) 98765-4321"
                    className="w-full pl-8 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#15803d]/30 focus:border-[#15803d]"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              {/* Cargo / Função */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cargo / Função
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  disabled={!currentUser.isRoot}
                  className={`w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#15803d]/30 focus:border-[#15803d] ${
                    !currentUser.isRoot ? 'bg-slate-100 cursor-not-allowed text-slate-500' : ''
                  }`}
                >
                  <option value="Gestor de Frota">Gestor de Frota</option>
                  <option value="Administrador">Administrador</option>
                </select>
                {!currentUser.isRoot && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    * Apenas o Administrador Root tem permissão para alterar o cargo de usuários.
                  </p>
                )}
              </div>

              {/* Mudar Senha */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-[#15803d]" />
                    Mudar Senha
                  </label>
                  <span className="text-[10px] text-slate-500">Opcional</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Nova Senha */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Nova Senha
                    </label>
                    <div className="relative">
                      <input
                        type={showEditPassword ? 'text' : 'password'}
                        placeholder="Nova senha (mínimo 4 caracteres)"
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        className="w-full pl-3 pr-9 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#15803d]/30 focus:border-[#15803d]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEditPassword(!showEditPassword)}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        title={showEditPassword ? 'Ocultar senha' : 'Ver senha'}
                      >
                        {showEditPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirmar Nova Senha */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Confirmar Nova Senha
                    </label>
                    <div className="relative">
                      <input
                        type={showEditConfirmPassword ? 'text' : 'password'}
                        placeholder="Repita a nova senha"
                        value={editConfirmPassword}
                        onChange={(e) => setEditConfirmPassword(e.target.value)}
                        className="w-full pl-3 pr-9 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#15803d]/30 focus:border-[#15803d]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEditConfirmPassword(!showEditConfirmPassword)}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        title={showEditConfirmPassword ? 'Ocultar confirmação' : 'Ver confirmação'}
                      >
                        {showEditConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500">
                  Deixe estes campos vazios caso queira manter a senha de acesso atual.
                </p>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status da Conta
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as 'Ativo' | 'Inativo')}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#15803d]/30 focus:border-[#15803d]"
                >
                  <option value="Ativo">Ativo (Acesso Liberado)</option>
                  <option value="Inativo">Inativo (Acesso Suspenso)</option>
                </select>
              </div>

              {/* Botões do Modal */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#15803d] hover:bg-[#166534] text-white font-semibold text-xs sm:text-sm transition-colors cursor-pointer shadow-xs"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
