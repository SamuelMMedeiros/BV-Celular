
import { Database } from "@/integrations/supabase/types";

// --- ENTIDADES ---

export type Product = Omit<Database['public']['Tables']['Products']['Row'], 'colors' | 'images' | 'category'> & {
  stores: Store[];
  colors: string[]; 
  images: string[]; 
  category: 'aparelho' | 'acessorio'; 
  brand?: string | null;
  promotion_end_date?: string | null;
};

export type Store = Database['public']['Tables']['Stores']['Row'] & {
    address?: string | null;
    delivery_fixed_fee?: number;
    free_shipping_min_value?: number;
};

export type Employee = Omit<Database['public']['Tables']['Employees']['Row'], 'store_id'> & {
  store_id?: string | null; 
  Stores?: Pick<Store, 'id' | 'name'> | null; 
  can_create?: boolean;
  can_update?: boolean;
  can_delete?: boolean;
};

export type CustomerProfile = {
  id: string;
  name: string;
  phone: string;
  email: string;
};

export type Address = {
    id: string;
    client_id: string;
    name: string;
    cep: string;
    street: string;
    number: string;
    complement?: string | null;
    neighborhood: string;
    city: string;
    state: string;
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
  employee_id?: string | null;
  delivery_type?: 'pickup' | 'delivery';
  address_id?: string | null;
  delivery_fee?: number;
  payment_method?: string;
  change_for?: number;
  Clients?: { name: string; phone: string; email: string; } | null;
  Stores?: { name: string; city: string | null; } | null;
  Employees?: { name: string; } | null;
  Addresses?: Address | null;
};

export type Banner = {
    id: string;
    title: string;
    subtitle: string | null;
    image_url: string | null;
    link_url: string;
    button_text: string;
    active: boolean;
    background_color: string;
    text_color: string;
};

export type Warranty = {
    id: string;
    client_id: string;
    store_id: string;
    product_model: string;
    serial_number: string;
    invoice_number?: string | null;
    purchase_date: string; 
    warranty_months: number;
    warranty_end_date: string;
    created_at: string;
    Clients?: CustomerProfile | null;
    Stores?: Store | null;
};

export type Coupon = {
    id: string;
    code: string;
    discount_percent: number;
    active: boolean;
    created_at?: string;
    valid_until?: string | null;
    min_purchase_value?: number;
};

// --- PAYLOADS (Tipos para Inserção/Atualização) ---

export type ProductInsertPayload = Database['public']['Tables']['Products']['Insert'] & {
  store_ids?: string[]; 
  image_files?: File[];
  brand?: string;
  promotion_end_date?: string | null;
};

export type ProductUpdatePayload = Omit<ProductInsertPayload, 'image_files'> & {
  id: string;
  image_files?: File[];
  images_to_delete?: string[];
};

export type StoreInsertPayload = Database['public']['Tables']['Stores']['Insert'];
export type StoreUpdatePayload = Database['public']['Tables']['Stores']['Update'] & {
  id: string;
};

export type EmployeeInsertPayload = Database['public']['Tables']['Employees']['Insert'];
export type EmployeeUpdatePayload = Database['public']['Tables']['Employees']['Update'] & {
  id: string;
};

export type CustomerUpdatePayload = {
  id: string;
  name: string;
  phone: string;
};

export type OrderInsertPayload = {
  client_id: string;
  store_id: string;
  total_price: number;
  items: OrderCartItem[];
  status?: string;
  employee_id?: string | null;
  delivery_type?: 'pickup' | 'delivery';
  address_id?: string | null;
  delivery_fee?: number;
  payment_method?: string;
  change_for?: number;
};

export type AddressInsertPayload = Omit<Address, 'id' | 'created_at'>;

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

export type CouponInsertPayload = {
    code: string;
    discount_percent: number;
    active?: boolean;
    valid_until?: Date | null;
    min_purchase_value?: number;
};

export type BannerInsertPayload = {
    title: string;
    subtitle?: string | null;
    image_url?: string | null; 
    link_url: string;
    button_text: string;
    active?: boolean;
    background_color?: string;
    text_color?: string;
};

export type BannerUpdatePayload = Partial<BannerInsertPayload> & {
    id: string;
};