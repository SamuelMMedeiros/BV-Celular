import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formata um valor numérico em CENTAVOS para a moeda BRL (R$ 00,00).
 * Ex: 75900 se torna "R$ 759,00"
 * @param valueInCents O número em centavos.
 * @returns A string formatada.
 */
export function formatCurrency(valueInCents: number | string): string {
  const numericValue = typeof valueInCents === 'string' 
    ? parseFloat(valueInCents) 
    : valueInCents;
  
  if (isNaN(numericValue)) {
    return "R$ 0,00"; // Fallback
  }

  // Converte centavos para o valor principal (ex: 75900 -> 759.00)
  const valueInReais = numericValue / 100;

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valueInReais);
}

/**
 * Converte uma string de moeda (ex: "759", "759,00", "759.00") em centavos.
 * @param value A string de entrada.
 * @returns O valor em centavos (number).
 */
export function parseCurrency(value: string | undefined | null): number | undefined {
  if (!value) return undefined;

  // Limpa tudo exceto dígitos, vírgula e ponto
  const cleanedValue = value.replace(/[^\d,.]/g, "");
  
  let numberValue: number;

  // Se o usuário digitou "." (ex: 759.00), trata como vírgula
  if (cleanedValue.includes('.')) {
      numberValue = parseFloat(cleanedValue.replace(/\./g, '').replace(',', '.'));
  } 
  // Se o usuário digitou "," (ex: 759,00)
  else if (cleanedValue.includes(',')) {
      numberValue = parseFloat(cleanedValue.replace(',', '.'));
  } 
  // Se o usuário digitou apenas números (ex: 759)
  else {
      numberValue = parseFloat(cleanedValue);
  }

  if (isNaN(numberValue)) return undefined;

  // Converte para centavos
  return Math.round(numberValue * 100);
}