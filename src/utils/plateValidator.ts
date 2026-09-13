import { PlateType } from '../types';

/**
 * Normaliza e limpa caracteres da placa
 */
export function cleanPlate(input: string): string {
  return (input || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .trim();
}

/**
 * Regex para Placa Antiga (Tradicional Cinza): 3 letras + 4 números
 * Ex: ABC1234 -> formatado ABC-1234
 */
const ANTIGO_REGEX = /^[A-Z]{3}[0-9]{4}$/;

/**
 * Regex para Placa Mercosul: 3 letras + 1 número + 1 letra + 2 números
 * Ex: BRA2E19, ABC1D23
 */
const MERCOSUL_REGEX = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;

/**
 * Detecta o padrão da placa brasileira
 */
export function detectPlateType(input: string): PlateType {
  const cleaned = cleanPlate(input);
  if (MERCOSUL_REGEX.test(cleaned)) {
    return 'mercosul';
  }
  if (ANTIGO_REGEX.test(cleaned)) {
    return 'antigo';
  }
  return 'invalido';
}

/**
 * Formata a placa para exibição
 * - Padrão Antigo: ABC-1234
 * - Mercosul: ABC1D23
 */
export function formatPlate(input: string): string {
  const cleaned = cleanPlate(input);
  if (cleaned.length === 7) {
    if (ANTIGO_REGEX.test(cleaned)) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    }
    return cleaned;
  }
  // Se ainda estiver digitando, formata parcialmente
  if (cleaned.length > 3 && ANTIGO_REGEX.test(cleaned.padEnd(7, '0'))) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  }
  return cleaned;
}

export function getPlateValidationDetails(input: string): {
  isValid: boolean;
  type: PlateType;
  formatted: string;
  message: string;
} {
  const cleaned = cleanPlate(input);
  const type = detectPlateType(cleaned);
  const formatted = formatPlate(cleaned);

  if (type === 'mercosul') {
    return {
      isValid: true,
      type: 'mercosul',
      formatted,
      message: 'Placa padrão Mercosul reconhecida (Válida)',
    };
  }

  if (type === 'antigo') {
    return {
      isValid: true,
      type: 'antigo',
      formatted,
      message: 'Placa padrão Tradicional/Antigo reconhecida (Válida)',
    };
  }

  if (cleaned.length === 0) {
    return {
      isValid: false,
      type: 'invalido',
      formatted: '',
      message: 'Digite a placa do veículo',
    };
  }

  if (cleaned.length < 7) {
    return {
      isValid: false,
      type: 'invalido',
      formatted,
      message: `Faltam ${7 - cleaned.length} caractere(s) (Padrão Mercosul: ABC1D23 ou Antigo: ABC-1234)`,
    };
  }

  return {
    isValid: false,
    type: 'invalido',
    formatted,
    message: 'Formato inválido. Padrões aceitos: Mercosul (ABC1D23) ou Tradicional (ABC-1234)',
  };
}
