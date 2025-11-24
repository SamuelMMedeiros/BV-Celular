//
// === CÓDIGO COMPLETO PARA: src/types.ts ===
//
import { Database } from "@/integrations/supabase/types";

// --- ENTIDADES PRINCIPAIS ---

// Nova Entidade: Variação de Produto
export type ProductVariant = {
    id: string;
    product_id: string;
    name: string;
    attributes: Record<string, string>; // Ex: { cor: "Azul", memoria: "128GB" }
    price: number;
    original_price?: number;
    quantity: number;
    sku?: string; // Adicionado SKU na variação
};

export type Product = Omit<Database['public']['Tables']['Products']['Row'], 'colors' | 'images' | 'category'> & {
  stores: Store[];
  colors: string[]; 
  images: string[]; 
  category: 'aparelho' | 'acessorio'; 
  subcategory?: string | null;
  brand?: string | null;
  promotion_end_date?: string | null;
  quantity?: number; // Estoque geral (se não tiver variação)
  
  // Novos Campos Financeiros e Logísticos
  sku?: string | null;
  cost_price?: number | null;
  
  wholesale_price?: number;
  installment_price?: number;
  max_installments?: number;
  
  has_variations?: boolean;
  variants?: ProductVariant[]; // Lista de variações carregadas
};

export type Store = Database['public']['Tables']['Stores']['Row'] & {
    address?: string | null;
    cnpj?: string | null; 
    delivery_fixed_fee?: number;
    free_shipping_min_value?: number;
    stripe_public_key?: string | null;
    stripe_secret_key?: string | null;
    stripe_enabled?: boolean;
};

export type Employee = Omit<Database['public']['Tables']['Employees']['Row'], 'store_id'> & {
  store_id?: string | null; 
  Stores?: Pick<Store, 'id' | 'name'> | null; 
  can_create?: boolean;
  can_update?: boolean;
  can_delete?: boolean;
};

export type Driver = {
    id: string;
    name: string;
    email: string;
    phone: string;
    active: boolean;
    created_at?: string;
};

export type WholesaleClient = {
    id: string;
    name: string;
    company_name: string;
    cnpj: string;
    cpf?: string;
    email: string;
    address: string;
    phone: string;
    active: boolean;
    store_id?: string;
    Stores?: { name: string } | null;
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

// --- CARRINHO E PEDIDOS ---

export type CartItem = {
  id: string; 
  name: string;
  price: number;
  images: string[];
  quantity: number;
  category: 'aparelho' | 'acessorio'; 
  isPromotion?: boolean;
  
  // Campos para Variação no Carrinho
  variantId?: string;       
  variantName?: string;     
};

export type OrderCartItem = {
  id: string; 
  name: string;
  price: number;
  quantity: number;
  category: 'aparelho' | 'acessorio';
  variantName?: string; 
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
  stripe_payment_id?: string | null;
  
  Clients?: { name: string; phone: string; email: string; } | null;
  Stores?: { name: string; city: string | null; address?: string | null; cnpj?: string | null; } | null;
  Employees?: { name: string; } | null;
  Addresses?: Address | null;
};

export type ShippingQuote = {
    price: number;
    days: number;
    type: string;
};

// --- MARKETING E UTILITÁRIOS ---

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
    image_only?: boolean;
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
    valid_for_categories?: string[]; 
    allow_with_promotion?: boolean;  
};

export type PublicLink = {
    id: string;
    title: string;
    url: string;
    icon: string;
    active: boolean;
};

// Tipo auxiliar para Notificações (usado no api.ts e AdminNotifications)
export type PushCampaign = {
    id: string;
    title: string;
    body: string;
    image_url?: string | null;
    link_url?: string | null;
    scheduled_for?: string | null;
    status: 'draft' | 'sent' | 'scheduled';
    sent_count: number;
    created_at: string;
};

// --- PAYLOADS (Tipos para Inserção/Atualização na API) ---

export type ProductVariantPayload = {
    name: string;
    attributes: Record<string, string>;
    price: number;
    original_price?: number;
    quantity: number;
    sku?: string;
};

export type ProductInsertPayload = Database['public']['Tables']['Products']['Insert'] & {
  store_ids?: string[]; 
  image_files?: File[];
  brand?: string;
  promotion_end_date?: string | null;
  quantity?: number;
  
  sku?: string;
  cost_price?: number;
  
  wholesale_price?: number;
  installment_price?: number;
  max_installments?: number;
  subcategory?: string;
  
  has_variations?: boolean;
  variants?: ProductVariantPayload[]; 
};

export type ProductUpdatePayload = Omit<ProductInsertPayload, 'image_files'> & {
  id: string;
  image_files?: File[];
  images_to_delete?: string[];
};

export type StoreInsertPayload = Database['public']['Tables']['Stores']['Insert'] & {
    cnpj?: string; 
    stripe_public_key?: string;
    stripe_secret_key?: string;
    stripe_enabled?: boolean;
};

export type StoreUpdatePayload = Database['public']['Tables']['Stores']['Update'] & {
  id: string;
  cnpj?: string;
  stripe_public_key?: string;
  stripe_secret_key?: string;
  stripe_enabled?: boolean;
};

export type EmployeeInsertPayload = Database['public']['Tables']['Employees']['Insert'];
export type EmployeeUpdatePayload = Database['public']['Tables']['Employees']['Update'] & {
  id: string;
};

export type DriverInsertPayload = {
    name: string;
    email: string;
    phone: string;
};

export type WholesaleClientInsertPayload = {
    name: string;
    company_name: string;
    cnpj: string;
    cpf?: string;
    email: string;
    address: string;
    phone: string;
    store_id: string;
};

export type WholesaleClientUpdatePayload = Partial<WholesaleClientInsertPayload> & {
    id: string;
};

export type CustomerUpdatePayload = {
  id: string;
  name: string;
  phone: string;
};

export type BulkClientInsertPayload = {
    name: string;
    email: string;
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
  stripe_payment_id?: string | null;
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
    valid_for_categories?: string[]; 
    allow_with_promotion?: boolean;  
};

export type CouponUpdatePayload = Partial<CouponInsertPayload> & {
    id: string;
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
    image_only?: boolean;
};

export type BannerUpdatePayload = Partial<BannerInsertPayload> & {
    id: string;
};

export type PublicLinkInsertPayload = {
    title: string;
    url: string;
    icon: string;
    active?: boolean;
};

export type PublicLinkUpdatePayload = Partial<PublicLinkInsertPayload> & {
    id: string;
};

export type PushCampaignInsertPayload = {
    title: string;
    body: string;
    image_url?: string | null;
    link_url?: string | null;
    scheduled_for?: string | null; // ISO String
    status?: 'draft' | 'sent' | 'scheduled';
};