// --- Tipos de Dados da Aplicação (Cliente) ---
export interface CustomerProfile {
  name: string;
  phone: string;
}

// --- Tipos de Dados da Aplicação (DB) ---
export interface Store {
  id: string; 
  name: string;
  whatsapp: string;
  city?: string | null;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  store_id: string | null;
  Stores: Store | null;
}

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

// --- Tipos de Carrinho ---
export interface CartItem {
  product: Product;
  quantity: number;
}