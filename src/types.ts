// Este é o tipo para a Loja
export interface Store {
  id: string; 
  name: string;
  whatsapp: string;
  city?: string | null;
}

// Este é o tipo para o Produto
export interface Product {
  id: string; 
  name: string;
  description?: string | null;
  price: number;
  originalPrice?: number | null;
  storage?: string | null;
  ram?: string | null;
  colors?: string[] | null;
  isPromotion?: boolean | null;
  category: string;
  images?: string[] | null;
  stores: Store[]; 
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  store_id: string | null; // Apenas o ID
  Stores: Store | null; // O Supabase vai aninhar o objeto da loja aqui
}