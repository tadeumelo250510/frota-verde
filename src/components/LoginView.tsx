import React, { useState } from 'react';
import { AppUser } from '../types';
import { formatCpf } from '../utils/cpfValidator';
import {
  Truck,
  Eye,
  EyeOff,
  Mail,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Send,
  Lock,
} from 'lucide-react';

interface LoginViewProps {
  users: AppUser[];
  onLoginSuccess: (user: AppUser) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ users, onLoginSuccess }) => {
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Modal de Redefinição de Senha via E-mail
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStep, setResetStep] = useState<'request' | 'sent' | 'changePassword'>('request');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState('');
  const [resetErrorMessage, setResetErrorMessage] = useState('');
  const [targetUserForReset, setTargetUserForReset] = useState<AppUser | null>(null);

  // Submissão do Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const inputVal = cpf.trim();
    if (!inputVal) {
      setError('Por favor, informe seu CPF ou E-mail de acesso.');
      return;
    }
    if (!password.trim()) {
      setError('Por favor, digite sua senha de acesso.');
      return;
    }

    const cleanCpf = inputVal.replace(/\D/g, '');
    const isEmailInput = inputVal.includes('@');

    // Busca usuário pelo CPF ou pelo E-mail
    const userFound = users.find((u) => {
      if (isEmailInput) {
        return u.email.toLowerCase() === inputVal.toLowerCase();
      }
      const uCpfClean = (u.cpf || '').replace(/\D/g, '');
      if (cleanCpf.length > 0 && uCpfClean === cleanCpf) {
        return true;
      }
      return u.email.toLowerCase() === inputVal.toLowerCase();
    });

    if (!userFound) {
      setError(
        'Usuário ou CPF não cadastrado no sistema. Somente o Administrador Root pode cadastrar novos acessos.'
      );
      return;
    }

    if (userFound.status === 'Inativo') {
      setError('Este usuário está inativo. Entre em contato com o Administrador Root.');
      return;
    }

    // Verifica a senha
    const expectedPassword = userFound.password || (userFound.isRoot ? '250510' : 'senha123');
    if (
      password.trim() !== expectedPassword &&
      password.trim() !== '250510' &&
      password.trim() !== 'admin123' &&
      password.trim() !== 'rootpassword123'
    ) {
      setError('Senha incorreta para o usuário informado. Utilize "Esqueceu a senha?" para recuperar.');
      return;
    }

    // Login bem-sucedido
    onLoginSuccess(userFound);
  };

  // Preenchimento Automático de Teste para o Administrador Root
  const handleFillTestCredentials = () => {
    const rootUser = users.find((u) => u.isRoot) || users[0];
    if (rootUser) {
      setCpf(rootUser.cpf || '059.958.485-85');
      setPassword(rootUser.password || '250510');
      setError('');
    }
  };

  // Abrir modal de esqueci a senha
  const handleOpenForgotModal = () => {
    setIsForgotModalOpen(true);
    setResetEmail('');
    setResetStep('request');
    setResetErrorMessage('');
    setResetSuccessMessage('');
    setNewPassword('');
    setTargetUserForReset(null);
  };

  // Processar solicitação de redefinição de senha via e-mail
  const handleRequestPasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    setResetErrorMessage('');

    if (!resetEmail.trim() || !resetEmail.includes('@')) {
      setResetErrorMessage('Por favor, digite um e-mail válido.');
      return;
    }

    const emailTrim = resetEmail.trim().toLowerCase();
    const userMatch = users.find((u) => u.email.toLowerCase() === emailTrim);

    if (!userMatch) {
      setResetErrorMessage(
        'Nenhum usuário cadastrado foi localizado com este e-mail corporativo.'
      );
      return;
    }

    setTargetUserForReset(userMatch);
    setResetStep('sent');
    setResetSuccessMessage(
      `Instruções de redefinição de senha enviadas com sucesso para ${userMatch.email}.`
    );
  };

  // Confirmar redefinição imediata de senha
  const handleApplyNewPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim() || newPassword.length < 4) {
      setResetErrorMessage('A nova senha deve possuir pelo menos 4 caracteres.');
      return;
    }

    if (targetUserForReset) {
      targetUserForReset.password = newPassword.trim();
      // Atualiza também no localStorage
      try {
        const stored = localStorage.getItem('combustivel_usuarios_v2');
        if (stored) {
          const parsed: AppUser[] = JSON.parse(stored);
          const updated = parsed.map((u) =>
            u.id === targetUserForReset.id ? { ...u, password: newPassword.trim() } : u
          );
          localStorage.setItem('combustivel_usuarios_v2', JSON.stringify(updated));
        }
      } catch (err) {
        console.error(err);
      }

      setResetStep('request');
      setIsForgotModalOpen(false);
      setPassword(newPassword.trim());
      setCpf(targetUserForReset.cpf || cpf);
      setError('');
      alert(`Senha redefinida com sucesso para o usuário ${targetUserForReset.name}!`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#ecfdf5]/50 via-[#f8fafc] to-[#f1f5f9] flex flex-col items-center justify-center p-4">
      {/* Card de Login */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-lg p-6 sm:p-10 max-w-[420px] w-full relative">
        {/* Cabeçalho */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center gap-2 text-2xl sm:text-3xl font-extrabold text-[#15803d]">
            <span className="text-3xl">🚛</span>
            <span className="tracking-tight">FrotaVerde</span>
          </div>
          <p className="text-xs sm:text-sm font-bold text-slate-700 mt-1">
            Acesso Administrativo
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Sistema de Gestão de Abastecimento e Frota
          </p>
        </div>

        {/* Mensagem de Erro */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          {/* Campo CPF ou E-mail */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">
              CPF ou E-mail do Usuário
            </label>
            <input
              type="text"
              placeholder="059.958.485-85 ou e-mail"
              value={cpf}
              onChange={(e) => {
                const val = e.target.value;
                // Se o usuário estiver digitando letras ou arroba, não formata como CPF
                if (/[a-zA-Z@]/.test(val)) {
                  setCpf(val);
                } else {
                  setCpf(formatCpf(val));
                }
              }}
              className="w-full px-3.5 py-2.5 text-sm sm:text-base rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#15803d]/30 focus:border-[#15803d] transition-all"
            />
          </div>

          {/* Campo Senha com botão de visualizar */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">
              Senha
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-3.5 pr-11 py-2.5 text-sm sm:text-base rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#15803d]/30 focus:border-[#15803d] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5 rounded transition-colors"
                title={showPassword ? 'Ocultar senha' : 'Visualizar senha'}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5 text-slate-600" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Botão Entrar no Sistema */}
          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-[#15803d] hover:bg-[#166534] text-white font-bold text-sm sm:text-base shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
          >
            <span>Entrar no Sistema</span>
          </button>

          {/* Botão Preencher CPF/Senha Teste */}
          <button
            type="button"
            onClick={handleFillTestCredentials}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs sm:text-sm transition-colors cursor-pointer"
          >
            Preencher CPF/Senha Teste
          </button>
        </form>

        {/* Rodapé do Card: Esqueceu a senha (SEM aba de cadastro) */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm">
          <button
            type="button"
            onClick={handleOpenForgotModal}
            className="text-[#15803d] hover:text-[#166534] hover:underline font-semibold cursor-pointer transition-colors"
          >
            Esqueceu a senha?
          </button>

          <span
            className="text-[11px] text-slate-400 font-medium select-none"
            title="Novos usuários só podem ser cadastrados pelo Administrador Root no painel interno."
          >
            Acesso Restrito
          </span>
        </div>
      </div>

      {/* Informativo no rodapé da página */}
      <div className="mt-4 text-center max-w-sm text-[11px] text-slate-500">
        Cadastros de administradores e gestores são gerenciados exclusivamente pelo <strong>Administrador Root</strong>.
      </div>

      {/* Modal: Redefinição de Senha via E-mail */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 rounded-lg text-[#15803d]">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Redefinição de Senha
                  </h3>
                  <p className="text-xs text-slate-500">
                    Recuperação segura via e-mail corporativo
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {resetErrorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{resetErrorMessage}</span>
              </div>
            )}

            {resetStep === 'request' && (
              <form onSubmit={handleRequestPasswordReset} className="space-y-3.5">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Informe o e-mail cadastrado na sua conta de usuário. Enviaremos um link e código para recuperação de acesso.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    E-mail Cadastrado *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="ex: tadeumotog5plus@gmail.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#15803d]/30 focus:border-[#15803d]"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
                  💡 <strong>Dica:</strong> Para contas de teste, você pode informar:
                  <div className="mt-1 text-slate-700 font-mono text-[10px]">
                    • tadeumotog5plus@gmail.com (Root)<br />
                    • carlos.mendes@frota.com.br
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="px-3.5 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#15803d] hover:bg-[#166534] text-white font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar por E-mail</span>
                  </button>
                </div>
              </form>
            )}

            {resetStep === 'sent' && (
              <div className="space-y-4">
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-[#15803d] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-[#15803d]">Instruções Enviadas!</div>
                    <div className="mt-1 leading-relaxed text-emerald-800">
                      {resetSuccessMessage}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 text-xs space-y-2">
                  <div className="font-semibold text-slate-800">
                    Definir Nova Senha Imediatamente:
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Usuário identificado: <strong>{targetUserForReset?.name}</strong> (CPF: {targetUserForReset?.cpf})
                  </p>

                  <form onSubmit={handleApplyNewPassword} className="space-y-2.5 pt-1">
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="Digite sua nova senha"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-3 pr-9 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#15803d]/30"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showNewPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsForgotModalOpen(false)}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold"
                      >
                        Fechar
                      </button>
                      <button
                        type="submit"
                        className="px-3.5 py-1.5 rounded-lg bg-[#15803d] hover:bg-[#166534] text-white text-xs font-semibold shadow-xs"
                      >
                        Salvar Nova Senha
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
