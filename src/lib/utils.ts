/* eslint-disable prefer-const */
//
// === CÓDIGO COMPLETO PARA: src/lib/utils.ts ===
//
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formata um valor numérico (seja centavos ou reais, depende do contexto) para BRL.
 * Recomendado passar o valor em REAIS se for float (ex: 50.00) 
 * ou dividir por 100 antes se for centavos (ex: 5000 / 100).
 */
export function formatCurrency(value: number | string): string {
  const numericValue = typeof value === 'string' 
    ? parseFloat(value) 
    : value;
  
  if (isNaN(numericValue)) {
    return "R$ 0,00";
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numericValue);
}

/**
 * Converte uma string de moeda (ex: "R$ 1.250,50" ou "50,00") em CENTAVOS (integer).
 * Ex: "50,00" -> 5000
 * Ex: "1.000,00" -> 100000
 */
export function parseCurrency(value: string | undefined | null): number | undefined {
  if (!value) return undefined;

  // 1. Remove tudo que não é dígito, vírgula ou sinal de menos
  // Ex: "R$ 1.200,50" vira "1200,50"
  let cleanStr = value.replace(/[^\d,-]/g, ""); 

  // 2. Se não tiver vírgula, assume que são inteiros (reais) e multiplica
  // Ex: "50" -> 5000 cents
  if (!cleanStr.includes(",")) {
      const num = parseFloat(cleanStr);
      return isNaN(num) ? undefined : Math.round(num * 100);
  }

  // 3. Se tem vírgula, removemos ela para tratar como inteiros diretos
  // Ex: "1200,50" -> "120050"
  // Mas precisamos garantir que só tenha 2 casas decimais
  const parts = cleanStr.split(",");
  
  // Parte inteira (removemos pontos se tiverem sobrado, mas o regex já tirou)
  let integerPart = parts[0]; 
  
  // Parte decimal (pegamos até 2 dígitos)
  let decimalPart = parts[1].substring(0, 2);
  
  // Preenche com 0 se tiver só 1 casa (ex: ,5 vira ,50)
  if (decimalPart.length === 1) decimalPart += "0";
  // Se vazio, vira 00
  if (decimalPart.length === 0) decimalPart = "00";

  const finalStr = `${integerPart}${decimalPart}`;
  const result = parseInt(finalStr, 10);

  return isNaN(result) ? undefined : result;
}