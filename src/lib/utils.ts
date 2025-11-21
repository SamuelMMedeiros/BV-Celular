import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Formata centavos (int) para string R$ "1.200,50"
export function formatCurrency(value: number | string): string {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numericValue)) return "R$ 0,00";

  // Se o valor vier do banco (ex: 3900 centavos), dividimos por 100.
  // Se o valor for pequeno (ex: 39.00 float), assumimos que já é reais.
  // Para evitar confusão, vamos assumir que a API sempre trafega CENTAVOS (Inteiros)
  // Mas se o valor for float no JS, tratamos.
  
  // Normalização: O sistema espera receber o valor em CENTAVOS (ex: 5000 = R$ 50,00)
  // Mas para exibir, usamos Intl.
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numericValue / 100);
}

// Transforma string do input "R$ 1.200,50" em número float puro (1200.50) ou centavos (120050)
// O seu pedido foi: "Valor digitado direto em real".
// Retornaremos CENTAVOS para salvar no banco integer.
export function parseCurrency(value: string | undefined | null): number {
  if (!value) return 0;
  
  // Remove tudo que não é número
  const onlyDigits = value.replace(/\D/g, "");
  
  if (!onlyDigits) return 0;
  
  // O input de moeda geralmente funciona assim: o usuário digita "1", vira "0,01". Digita "2", vira "0,12".
  // Então o valor "cru" (onlyDigits) já representa os centavos.
  // Ex: Digitou "3900", a string formatada é "39,00". O onlyDigits é "3900".
  // Isso é exatamente o valor em centavos que queremos salvar.
  
  return parseInt(onlyDigits, 10);
}