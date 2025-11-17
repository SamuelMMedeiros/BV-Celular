import { Database } from "@/integrations/supabase/types";

// Tipo para os dados de um Produto, incluindo Lojas
// --- CORREÇÃO: Omitimos 'category' da base e o redefinimos com o tipo correto ---
export type Product = Omit<Database['public']['Tables']['Products']['Row'], 'colors' | 'images' | 'category'> & {
  stores: Store[];
  colors: string[]; // Força a ser string[]
  images: string[]; // Força a ser string[]
  category: 'aparelho' | 'acessorio'; // <-- LINHA CORRIGIDA/ADICIONADA
};

// Tipo para os dados de uma Loja
export type Store = Database['public']['Tables']['Stores']['Row'];

// Tipo para os dados de um Funcionário (Admin)
export type Employee = Omit<Database['public']['Tables']['Employees']['Row'], 'store_id'> & {
  store_id?: string | null; // Opcional
  Stores?: Pick<Store, 'id' | 'name'> | null; // Relação opcional
};

// Tipo para o perfil de um Cliente
export type CustomerProfile = {
  id: string;
  name: string;
  phone: string;
  email: string;
};

// Tipo para os itens no Carrinho (usado no Context)
export type CartItem = {
  id: string; // product.id
  name: string;
  price: number;
  images: string[];
  quantity: number;
  category: 'aparelho' | 'acessorio'; // <-- O tipo esperado
};

// Tipo para os itens de um pedido (armazenado no JSONB 'items' da tabela Orders)
export type OrderCartItem = {
  id: string; // product.id
  name: string;
  price: number;
  quantity: number;
  category: 'aparelho' | 'acessorio';
};

// Tipo para um Pedido (Orçamento)
export type Order = {
  id: string;
  client_id: string;
  store_id: string; // Corrigido para text no SQL
  total_price: number;
  status: string;
  items: OrderCartItem[]; // O JSONB será deserializado para este tipo
  created_at: string;
};