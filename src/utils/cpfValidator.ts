// Utilitários de CPF (Formatação e Validação)

// Limpa qualquer pontuação (pontos, traços, barras, espaços e vírgulas) deixando apenas os dígitos
export const cleanCpfDigits = (value: string): string => {
  if (!value) return '';
  return value.replace(/\D/g, '').slice(0, 11);
};

// Formatador com máscara de CPF padrão: 000.000.000-00
export const formatCpf = (value: string): string => {
  const digits = cleanCpfDigits(value);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9)
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
};

// Validação de CPF com verificação de tamanho, sequências repetidas e dígitos verificadores (módulo 11)
export const isValidCpf = (cpf: string): boolean => {
  const clean = cleanCpfDigits(cpf);
  if (clean.length !== 11) return false;

  // Rejeita sequências de números iguais como 111.111.111-11, 000.000.000-00, etc.
  if (/^(\d)\1{10}$/.test(clean)) return false;

  // Cálculo do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean.charAt(i), 10) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(clean.charAt(9), 10)) return false;

  // Cálculo do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean.charAt(i), 10) * (11 - i);
  }
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(clean.charAt(10), 10)) return false;

  return true;
};

