import { Database } from "@/integrations/supabase/types";

export type Product = Omit<Database['public']['Tables']['Products']['Row'], 'colors' | 'images' | 'category'> & {
  stores: Store[];
  colors: string[]; 
  images: string[]; 
  category: 'aparelho' | 'acessorio'; 
};

// Atualizado com 'address'
export type Store = Database['public']['Tables']['Stores']['Row'] & {
    address?: string | null;
};

export type Employee = Omit<Database['public']['Tables']['Employees']['Row'], 'store_id'> & {
  store_id?: string | null; 
  Stores?: Pick<Store, 'id' | 'name'> | null; 
};

export type CustomerProfile = {
  id: string;
  name: string;
  phone: string;
  email: string;
};

export type CartItem = {
  id: string; 
  name: string;
  price: number;
  images: string[];
  quantity: number;
  category: 'aparelho' | 'acessorio'; 
};

export type OrderCartItem = {
  id: string; 
  name: string;
  price: number;
  quantity: number;
  category: 'aparelho' | 'acessorio';
};

export type Order = {
  id: string;
  client_id: string;
  store_id: string; 
  total_price: number;
  status: string; 
  items: OrderCartItem[]; 
  created_at: string;
  Clients?: { name: string; phone: string; email: string; } | null;
  Stores?: { name: string; city: string | null; } | null;
};

export type Banner = {
    id: string;
    title: string;
    subtitle: string | null;
    image_url: string;
    link_url: string;
    button_text: string;
    active: boolean;
};

// Atualizado para nova estrutura
export type Warranty = {
    id: string;
    client_id: string;
    store_id: string;
    product_model: string;
    serial_number: string;
    invoice_number?: string | null;
    purchase_date: string; // Vem como string do banco
    warranty_months: number;
    warranty_end_date: string;
    created_at: string;
    // Relacionamentos
    Clients?: CustomerProfile | null;
    Stores?: Store | null;
};

// Payload para criação
export type WarrantyInsertPayload = {
    client_id: string;
    store_id: string;
    product_model: string;
    serial_number: string;
    invoice_number?: string;
    purchase_date: Date;
    warranty_months: number;
    warranty_end_date: Date;
};