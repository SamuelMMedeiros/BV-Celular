/**
 * @title src/lib/api.ts
 * @collapsible
 */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/integrations/supabase/client";
import { 
    Product, Store, Employee, CustomerProfile, OrderCartItem, Order, Banner, Warranty, Coupon, Address, ShippingQuote, Driver, WholesaleClient, PublicLink,
    ProductInsertPayload, ProductUpdatePayload, StoreInsertPayload, StoreUpdatePayload,
    EmployeeInsertPayload, EmployeeUpdatePayload, CustomerUpdatePayload, OrderInsertPayload,
    BannerInsertPayload, BannerUpdatePayload, CouponInsertPayload, CouponUpdatePayload, WarrantyInsertPayload, AddressInsertPayload, DriverInsertPayload,
    WholesaleClientInsertPayload, WholesaleClientUpdatePayload, BulkClientInsertPayload,
    PublicLinkInsertPayload, PublicLinkUpdatePayload, ClientNotification
} from "@/types";
import { Database } from "@/integrations/supabase/types";
import { v4 as uuidv4 } from 'uuid'; 

// ==================================================================
// FUNÇÕES DE API (INTELIGÊNCIA ARTIFICIAL)
// ==================================================================

// Tipo de retorno para o preenchimento de Produto
type AIDataResponse = {
    description: string;
    battery_capacity: string | null;
    camera_specs: string | null;
    processor_model: string | null;
    technical_specs: string | null;
};

// Tipo de retorno para o Chatbot
type AIChatResponse = {
    response: string;
};

// Tipo de mensagem para o histórico do Chatbot
type AIChatMessage = {
    text: string;
    sender: "user" | "ai";
}

// Função que chama o ENDPOINT SEGURO para preenchimento de produto (Netlify Function)
export const generateProductData = async (
    productName: string,
    category: 'aparelho' | 'acessorio'
): Promise<AIDataResponse> => {
    // Apontando para a Netlify Function
    const endpoint = '/.netlify/functions/generate-product-data';

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productName, category }),
    });

    if (!response.ok) {
        const errorDetail = await response.text();
        console.error('AI Product API Error:', errorDetail);
        throw new Error(`Falha na API de IA. Detalhes: ${errorDetail.substring(0, 100)}...`);
    }

    return response.json() as Promise<AIDataResponse>;
};

// Função que chama o ENDPOINT SEGURO para o chatbot (Netlify Function)
export const generateAIChatResponse = async (
    history: AIChatMessage[]
): Promise<AIChatResponse> => {
    // Apontando para a Netlify Function
    const endpoint = '/.netlify/functions/ai-chat';

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ history }),
    });

    if (!response.ok) {
        const errorDetail = await response.text();
        console.error('AI Chat API Error:', errorDetail);
        throw new Error(`Falha na API de Chat AI. Detalhes: ${errorDetail.substring(0, 100)}...`);
    }

    return response.json() as Promise<AIChatResponse>;
};

// ==================================================================
// HELPER: PARSEAMENTO DE DADOS
// ==================================================================

const parseArrayData = (data: any): any[] => {
  if (Array.isArray(data)) {
    return data.flatMap(item => {
      if (typeof item === 'string' && (item.startsWith('[') || item.startsWith('{'))) {
        try { return JSON.parse(item); } catch (e) { return item; }
      }
      return item;
    });
  }
  if (typeof data === 'string') {
    try { 
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
    } catch { 
        if (data.startsWith('{')) {
            return data.replace(/[{}]/g, '').split(',').filter(Boolean);
        }
        return []; 
    }
  }
  return []; 
}

const getFileNameFromUrl = (url: string): string => {
  try {
    const newUrl = new URL(url);
    const parts = newUrl.pathname.split('/');
    return parts[parts.length - 1];
  } catch (e) {
    return '';
  }
}

// ==================================================================
// FUNÇÕES DE API (PRODUTOS)
// ==================================================================

// Definição do tipo para os filtros do frontend
export type ProductFilters = {
  q?: string;
  category?: 'aparelho' | 'acessorio';
  isPromotion?: boolean;
  
  // Novos Filtros de Especificações
  brands?: string[];
  ram?: string[];
  storage?: string[];
  battery_capacity?: string[];
  processor_model?: string[];
};

export const fetchProducts = async (params: ProductFilters = {}): Promise<Product[]> => {
  let query = supabase
    .from('Products')
    .select(`
      *,
      ProductStores (
        Stores (
          id, name, whatsapp, city
        )
      ),
      ProductVariants (*)
    `);

  // FILTROS BÁSICOS
  if (params.category) query = query.eq('category', params.category);
  if (params.isPromotion !== undefined) query = query.eq('isPromotion', params.isPromotion);
  if (params.q) query = query.ilike('name', `%${params.q}%`);
  
  // NOVOS FILTROS POR ARRAY (Faceted Search)
  if (params.brands && params.brands.length > 0) {
      query = query.in('brand', params.brands);
  }

  if (params.ram && params.ram.length > 0) {
      query = query.in('ram', params.ram);
  }
  
  if (params.storage && params.storage.length > 0) {
      query = query.in('storage', params.storage);
  }

  if (params.battery_capacity && params.battery_capacity.length > 0) {
      const batteryFilter = params.battery_capacity.map(b => `battery_capacity.ilike.%${b}%`).join(',');
      query = query.or(batteryFilter);
  }

  if (params.processor_model && params.processor_model.length > 0) {
      const processorFilter = params.processor_model.map(p => `processor_model.ilike.%${p}%`).join(',');
      query = query.or(processorFilter);
  }
  
  const { data: rawProducts, error } = await query;
  if (error) throw new Error(error.message);

  // Mapeamento Seguro com Cast
  return (rawProducts || []).map((p: any) => ({
      ...p,
      stores: p.ProductStores?.map((ps: any) => ps.Stores).filter(Boolean) || [],
      colors: parseArrayData(p.colors),
      images: parseArrayData(p.images),
      variants: p.ProductVariants || []
  })) as Product[];
};

export const fetchPromotions = async (params: { q?: string; isPromotion?: boolean } = {}): Promise<Product[]> => {
    return fetchProducts({ ...params, isPromotion: true });
};

export const fetchAllProducts = async (): Promise<Product[]> => {
    return fetchProducts();
};

export const fetchProductById = async (productId: string): Promise<Product> => {
  const { data: rawProduct, error } = await supabase
    .from('Products')
    .select(`
      *,
      ProductStores (
        Stores (
          id, name, whatsapp, city
        )
      ),
      ProductVariants (*)
    `)
    .eq('id', productId)
    .single();

  if (error) throw new Error(error.message);
  if (!rawProduct) throw new Error("Produto não encontrado");
  
  const productData = rawProduct as any;
  
  return {
    ...productData,
    stores: productData.ProductStores?.map((ps: any) => ps.Stores).filter(Boolean) || [],
    colors: parseArrayData(productData.colors),
    images: parseArrayData(productData.images),
    variants: productData.ProductVariants || []
  } as unknown as Product;
};

export const fetchRelatedProducts = async (category: string, currentProductId: string): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('Products')
    .select(`
      *,
      ProductStores ( Stores ( id, name, whatsapp, city ) )
    `)
    .eq('category', category)
    .neq('id', currentProductId) 
    .limit(4); 

  if (error) throw new Error(error.message);

  return (data || []).map((p: any) => ({
      ...p, 
      stores: p.ProductStores?.map((ps: any) => ps.Stores).filter(Boolean) || [], 
      colors: parseArrayData(p.colors), 
      images: parseArrayData(p.images)
  })) as Product[];
};

// --- FUNÇÃO CREATE PRODUCT BLINDADA (Inclui campos de especificações) ---
export const createProduct = async (payload: ProductInsertPayload): Promise<void> => {
  // 1. Upload Imagens
  const imageUrls: string[] = [];
  if (payload.image_files && payload.image_files.length > 0) {
    for (const file of payload.image_files) {
      const fileName = `${uuidv4()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage.from('product-images').upload(fileName, file);
      if (uploadError) throw new Error(uploadError.message);
      const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(uploadData.path);
      imageUrls.push(publicUrlData.publicUrl);
    }
  }
  
  const productData = {
    name: payload.name,
    description: payload.description,
    price: payload.price,
    originalPrice: payload.originalPrice,
    storage: payload.storage,
    ram: payload.ram,
    colors: payload.colors || [],
    isPromotion: payload.isPromotion,
    category: payload.category,
    brand: payload.brand,
    subcategory: payload.subcategory,
    promotion_end_date: payload.promotion_end_date, 
    quantity: payload.quantity || 0,
    wholesale_price: payload.wholesale_price || 0,
    installment_price: payload.installment_price || 0,
    max_installments: payload.max_installments || 12,
    has_variations: payload.has_variations || false,
    sku: payload.sku,
    cost_price: payload.cost_price,
    images: imageUrls,
    // Incluir campos de especificações técnicas
    battery_capacity: payload.battery_capacity,
    camera_specs: payload.camera_specs,
    processor_model: payload.processor_model,
    technical_specs: payload.technical_specs,
  };

  // 2. Insere Produto Pai
  const { data: newProduct, error: productError } = await supabase
    .from('Products')
    .insert(productData as any)
    .select('id')
    .single();

  if (productError) throw new Error(`Erro ao criar produto: ${productError.message}`);
  if (!newProduct) throw new Error("Erro crítico: Produto criado sem ID.");
  
  const newProductId = newProduct.id;

  // 3. Insere Relação com Lojas (Blindado contra undefined)
  if (payload.store_ids && payload.store_ids.length > 0) {
    const relations = payload.store_ids.map(storeId => ({
      product_id: newProductId,
      store_id: storeId,
    }));
    const resStores = await supabase.from('ProductStores').insert(relations);
    if (resStores.error) throw new Error(`Erro ao vincular lojas: ${resStores.error.message}`);
  }

  // 4. Insere Variações (Blindado)
  if (payload.has_variations && payload.variants && payload.variants.length > 0) {
      const variantsData = payload.variants.map(v => ({
          product_id: newProductId,
          name: v.name,
          attributes: v.attributes,
          price: v.price,
          original_price: v.original_price,
          quantity: v.quantity,
          sku: v.sku
      }));
      
      const resVariants = await supabase.from('ProductVariants').insert(variantsData);
      if (resVariants.error) throw new Error(`Erro ao salvar variações: ${resVariants.error.message}`);
  }
};

// --- FUNÇÃO UPDATE PRODUCT BLINDADA (Inclui campos de especificações) ---
export const updateProduct = async (payload: ProductUpdatePayload): Promise<void> => {
  // Deleta imagens antigas
  if (payload.images_to_delete?.length) {
    const fileNames = payload.images_to_delete.map(getFileNameFromUrl).filter(Boolean);
    if (fileNames.length) await supabase.storage.from('product-images').remove(fileNames);
  }

  // Upload novas imagens
  const newImageUrls: string[] = [];
  if (payload.image_files?.length) {
    for (const file of payload.image_files) {
      const fileName = `${uuidv4()}-${file.name}`;
      const { data, error } = await supabase.storage.from('product-images').upload(fileName, file);
      if (error) throw new Error(error.message);
      const { data: publicUrl } = supabase.storage.from('product-images').getPublicUrl(data.path);
      newImageUrls.push(publicUrl.publicUrl);
    }
  }
  
  // Mescla imagens
  const { data: currentProduct } = await supabase.from('Products').select('images').eq('id', payload.id).single();
  const currentImages = parseArrayData(currentProduct?.images);
  const remainingImages = currentImages.filter(url => !payload.images_to_delete?.includes(url));
  const finalImageUrls = [...remainingImages, ...newImageUrls];
  
  const productData = {
    name: payload.name,
    description: payload.description,
    price: payload.price,
    originalPrice: payload.originalPrice,
    storage: payload.storage,
    ram: payload.ram,
    colors: payload.colors || [],
    isPromotion: payload.isPromotion,
    category: payload.category,
    brand: payload.brand,
    subcategory: payload.subcategory,
    promotion_end_date: payload.promotion_end_date, 
    quantity: payload.quantity,
    wholesale_price: payload.wholesale_price,
    installment_price: payload.installment_price,
    max_installments: payload.max_installments,
    has_variations: payload.has_variations,
    sku: payload.sku,
    cost_price: payload.cost_price,
    images: finalImageUrls,
    // Incluir campos de especificações técnicas
    battery_capacity: payload.battery_capacity,
    camera_specs: payload.camera_specs,
    processor_model: payload.processor_model,
    technical_specs: payload.technical_specs,
  };

  const { error: productError } = await supabase.from('Products').update(productData as any).eq('id', payload.id);
  if (productError) throw new Error(`Erro ao atualizar produto: ${productError.message}`);
  
  // Atualiza Lojas
  await supabase.from('ProductStores').delete().eq('product_id', payload.id);
  if (payload.store_ids?.length) {
    const relations = payload.store_ids.map(sid => ({ product_id: payload.id, store_id: sid }));
    const resStores = await supabase.from('ProductStores').insert(relations);
    if (resStores.error) throw new Error(`Erro ao atualizar lojas: ${resStores.error.message}`);
  }

  // Atualiza Variações
  if (payload.has_variations && payload.variants) {
      await supabase.from('ProductVariants').delete().eq('product_id', payload.id);
      if (payload.variants.length > 0) {
          const variantsData = payload.variants.map(v => ({
              product_id: payload.id,
              name: v.name,
              attributes: v.attributes,
              price: v.price,
              original_price: v.original_price,
              quantity: v.quantity,
              sku: v.sku
          }));
          const resVariants = await supabase.from('ProductVariants').insert(variantsData);
          if (resVariants.error) throw new Error(`Erro ao atualizar variações: ${resVariants.error.message}`);
      }
  }
};

export const deleteProduct = async (product: Product): Promise<void> => {
  await supabase.from('ProductVariants').delete().eq('product_id', product.id);
  await supabase.from('ProductStores').delete().eq('product_id', product.id);
  const { error } = await supabase.from('Products').delete().eq('id', product.id);
  if (error) throw new Error(error.message);
  
  if (product.images && product.images.length > 0) {
    const fileNames = product.images.map(getFileNameFromUrl).filter(Boolean);
    if (fileNames.length > 0) await supabase.storage.from('product-images').remove(fileNames);
  }
};

// ==================================================================
// LOJAS (OMITIDO POR LIMITE)
// ==================================================================
export const fetchStores = async (): Promise<Store[]> => {
  const { data, error } = await supabase.from('Stores').select('*').order('name');
  if (error) throw new Error(error.message);
  return data as Store[];
};
export const createStore = async (payload: StoreInsertPayload) => {
  const { error } = await supabase.from('Stores').insert(payload);
  if (error) throw new Error(error.message);
};
export const updateStore = async (payload: StoreUpdatePayload) => {
  const { id, ...rest } = payload;
  const { error } = await supabase.from('Stores').update(rest).eq('id', id);
  if (error) throw new Error(error.message);
};
export const deleteStore = async (id: string) => {
  await supabase.from('ProductStores').delete().eq('store_id', id);
  const { error } = await supabase.from('Stores').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

// ==================================================================
// FUNCIONÁRIOS & ADMIN (OMITIDO POR LIMITE)
// ==================================================================
export const fetchEmployees = async (): Promise<Employee[]> => {
  const { data, error } = await supabase.from('Employees').select(`*, Stores(id, name)`).order('name');
  if (error) throw new Error(error.message);
  return data as unknown as Employee[];
};
export const fetchEmployeeProfile = async (userId: string): Promise<Employee | null> => {
  // @ts-ignore
  const { data, error } = await supabase.rpc('get_admin_profile');
  if (error || !data) return null;
  return data as unknown as Employee;
};
export const createEmployee = async (payload: EmployeeInsertPayload) => {
  const { error } = await supabase.from('Employees').insert(payload);
  if (error) throw new Error(error.message);
};
export const updateEmployee = async (payload: EmployeeUpdatePayload) => {
  const { id, ...rest } = payload;
  const { error } = await supabase.from('Employees').update(rest).eq('id', id);
  if (error) throw new Error(error.message);
};
export const deleteEmployee = async (id: string) => {
  const { error } = await supabase.from('Employees').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

// ==================================================================
// DRIVERS (ENTREGADORES)
// ==================================================================
export const fetchDrivers = async (): Promise<Driver[]> => {
    // Seleciona os novos campos de localização
    const { data, error } = await supabase.from('Drivers').select(`*, latitude, longitude, last_updated`).order('name');
    if (error) throw new Error(error.message);
    return data as Driver[];
};
export const fetchDriverProfile = async (): Promise<Driver | null> => {
    // @ts-ignore
    const { data, error } = await supabase.rpc('get_driver_profile');
    if (error || !data) return null;
    return data as unknown as Driver;
};
export const createDriver = async (payload: DriverInsertPayload) => {
    const { error } = await supabase.from('Drivers').insert({ id: uuidv4(), ...payload });
    if (error) throw new Error(error.message);
};
export const deleteDriver = async (id: string) => {
    const { error } = await supabase.from('Drivers').delete().eq('id', id);
    if (error) throw new Error(error.message);
};

// NOVO: Função para o driver mobile enviar localização
export const updateDriverLocation = async (
    driverId: string,
    latitude: number,
    longitude: number
): Promise<void> => {
    const { error } = await supabase
        .from('Drivers')
        .update({ latitude, longitude, last_updated: new Date().toISOString() })
        .eq('id', driverId);
    
    if (error) throw new Error(`Falha ao atualizar localização do driver: ${error.message}`);
};

// ==================================================================
// CLIENTES & ATACADO (OMITIDO POR LIMITE)
// ==================================================================
export const fetchClients = async (searchQuery?: string): Promise<CustomerProfile[]> => {
  let query = supabase.from('Clients').select(`id, name, phone, email`).order('created_at', { ascending: false });
  if (searchQuery) query = query.ilike('name', `%${searchQuery}%`);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as CustomerProfile[];
};

export const fetchCustomerProfile = async (userId: string): Promise<CustomerProfile | null> => {
  const { data, error } = await supabase.from('Clients').select(`id, name, phone, email`).eq('id', userId).maybeSingle(); 
  if (error) throw new Error(error.message);
  return data as CustomerProfile;
};

export const deleteClient = async (id: string) => {
  const { error } = await supabase.from('Clients').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

export const updateCustomerProfile = async (payload: CustomerUpdatePayload): Promise<void> => {
  const { id, ...updateData } = payload;
  const { error } = await supabase.from('Clients').update({ name: updateData.name, phone: updateData.phone }).eq('id', id);
  if (error) throw new Error(error.message);
  await supabase.auth.updateUser({ data: { full_name: updateData.name, phone: updateData.phone } });
};

export const upsertClient = async (profile: { id: string; name: string; phone: string; email: string }) => {
    const { error } = await supabase.from('Clients').upsert(profile, { onConflict: 'id' });
    if (error) throw error;
};

export const createBulkClients = async (clients: BulkClientInsertPayload[]): Promise<void> => {
    const clientsWithId = clients.map(c => ({ id: uuidv4(), name: c.name, email: c.email, phone: c.phone }));
    const { error } = await supabase.from('Clients').insert(clientsWithId);
    if (error) throw new Error(error.message);
};

export const fetchWholesaleClients = async (): Promise<WholesaleClient[]> => {
    const { data, error } = await supabase.from('WholesaleClients').select(`*, Stores ( name )`).order('name');
    if (error) throw new Error(error.message);
    return data as unknown as WholesaleClient[];
};
export const createWholesaleClient = async (payload: WholesaleClientInsertPayload) => {
    const { error } = await supabase.from('WholesaleClients').insert({ id: uuidv4(), ...payload });
    if (error) throw new Error(error.message);
};
export const updateWholesaleClient = async (payload: WholesaleClientUpdatePayload) => {
    const { id, ...rest } = payload;
    const { error } = await supabase.from('WholesaleClients').update(rest).eq('id', id);
    if (error) throw new Error(error.message);
};
export const deleteWholesaleClient = async (id: string) => {
    const { error } = await supabase.from('WholesaleClients').delete().eq('id', id);
    if (error) throw new Error(error.message);
};
export const fetchWholesaleProfile = async (): Promise<WholesaleClient | null> => {
    // @ts-ignore
    const { data, error } = await supabase.rpc('get_wholesale_profile');
    if (error || !data) return null;
    return data as unknown as WholesaleClient;
};

// ==================================================================
// ENDEREÇOS & FRETE (OMITIDO POR LIMITE)
// ==================================================================
export const fetchAddressByCEP = async (cep: string): Promise<Partial<Address> | null> => {
    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep.replace(/\D/g, '')}/json/`);
        const data = await response.json();
        if (data.erro) return null;
        return { street: data.logradouro, neighborhood: data.bairro, city: data.localidade, state: data.uf };
    } catch { return null; }
};
export const calculateFreight = async (cep: string): Promise<ShippingQuote> => {
    return { price: 2000, days: 5, type: 'PAC' }; 
};
export const fetchClientAddresses = async (clientId: string): Promise<Address[]> => {
    const { data, error } = await supabase.from('Addresses').select('*').eq('client_id', clientId).order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data as Address[];
};
export const createAddress = async (payload: AddressInsertPayload) => {
    const { error } = await supabase.from('Addresses').insert(payload);
    if (error) throw new Error(error.message);
};
export const deleteAddress = async (id: string) => {
    const { error } = await supabase.from('Addresses').delete().eq('id', id);
    if (error) throw new Error(error.message);
};

// ==================================================================
// PEDIDOS - ATUALIZADO COM DRIVER E NOTIFICAÇÕES
// ==================================================================


export const fetchDriverOrders = async (driverId: string): Promise<Order[]> => {
    const { data, error } = await supabase
        .from('Orders')
        .select(`
            *, 
            Clients(name, phone), 
            Addresses(*), 
            Stores(name, city)
        `)
        .eq('driver_id', driverId)
        .in('status', ['on_the_way', 'out_for_delivery'])
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    
    // Mapeia para o tipo Order (necessário devido ao select complexo)
    return (data || []).map((order: any) => ({
        ...order,
        Clients: order.Clients || {},
        Addresses: order.Addresses || {},
        Stores: order.Stores || {},
    })) as unknown as Order[];
};
// Helper para definir a mensagem de notificação com base no status
const getNotificationDetails = (status: string, orderId: string): { message: string, status_key: string } | null => {
    const shortId = orderId.substring(0, 6).toUpperCase();
    switch (status) {
        case 'pending': return { message: `Pedido #${shortId} foi recebido e está sendo processado.`, status_key: status };
        case 'processing': return { message: `A separação do pedido #${shortId} foi iniciada.`, status_key: status };
        case 'ready': return { message: `Pedido #${shortId} está pronto para retirada.`, status_key: status };
        case 'on_the_way': return { message: `Seu pedido #${shortId} saiu para entrega e está a caminho!`, status_key: status };
        case 'completed': return { message: `Pedido #${shortId} entregue com sucesso!`, status_key: status };
        case 'cancelled': return { message: `Seu pedido #${shortId} foi cancelado.`, status_key: status };
        default: return null;
    }
}

// Helper para criar notificação
const createClientNotification = async (clientId: string, orderId: string, status: string) => {
    const notificationData = getNotificationDetails(status, orderId);
    if (notificationData) {
        const { error: notifError } = await supabase.from('ClientNotifications').insert({
            client_id: clientId,
            order_id: orderId,
            message: notificationData.message,
            status_key: notificationData.status_key,
        });
        if (notifError) console.error("Erro ao criar notificação:", notifError.message);
    }
}

export const createOrder = async (payload: OrderInsertPayload): Promise<Database['public']['Tables']['Orders']['Row']> => {
    const orderData = {
        client_id: payload.client_id,
        store_id: payload.store_id,
        total_price: payload.total_price,
        items: payload.items,
        status: payload.status || 'pending',
        employee_id: payload.employee_id,
        delivery_type: payload.delivery_type || 'pickup',
        address_id: payload.address_id,
        delivery_fee: payload.delivery_fee || 0,
        payment_method: payload.payment_method,
        change_for: payload.change_for,
        stripe_payment_id: payload.stripe_payment_id,
        driver_id: payload.driver_id,
    };
    // @ts-ignore
    const { data, error } = await supabase.from('Orders').insert(orderData as any).select().single();
    if (error) throw new Error(error.message);
    
    // CRIA NOTIFICAÇÃO INICIAL (Pending/Processing)
    if (data) {
        await createClientNotification(data.client_id, data.id, data.status);
    }

    for (const item of payload.items) {
        try { await supabase.rpc('decrement_stock', { product_id: item.id, amount: item.quantity }); } 
        catch (e) { console.error("Erro estoque", e); }
    }
    return data;
};

export const fetchAllOrders = async (): Promise<Order[]> => {
    const { data, error } = await supabase
        .from('Orders')
        .select(`*, Clients(name,phone,email), Stores(name,city,address,cnpj), Employees(name), Addresses(*), Drivers(*)`)
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return (data || []).map((order: any) => ({
        ...order,
        Clients: order.Clients || { name: 'Cliente Removido', phone: '', email: '' },
        Stores: order.Stores || { name: 'Loja Indefinida' },
        Employees: order.Employees,
        Addresses: order.Addresses,
        Drivers: order.Drivers,
    })) as unknown as Order[];
};

// Função de logística para o LogisticsMap
export const fetchLogisticsData = async (): Promise<{ orders: Order[], drivers: Driver[] }> => {
    // Filtra pedidos em status de entrega/rota e com entregador atribuído
    const { data: rawOrders, error: orderError } = await supabase
        .from('Orders')
        .select(`
            id, driver_id, status, total_price,
            Clients(name, phone),
            Addresses(*),
            Drivers(*),
            Stores(name, address)
        `)
        .in('status', ['on_the_way', 'out_for_delivery', 'delivery_attempted'])
        .not('driver_id', 'is', null)
        .order('created_at', { ascending: false });

    if (orderError) throw new Error(`Erro ao buscar pedidos para logística: ${orderError.message}`);

    const orders = (rawOrders || []).map((order: any) => ({
        ...order,
        Clients: order.Clients || {},
        Addresses: order.Addresses,
        Drivers: order.Drivers,
        Stores: order.Stores,
    })) as unknown as Order[];

    // Busca motoristas ativos com dados de localização (reutiliza fetchDrivers)
    const allDrivers = await fetchDrivers();
    const activeDrivers = allDrivers.filter(d => d.active && d.latitude && d.longitude);

    return { orders, drivers: activeDrivers };
};

export const fetchClientOrders = async (clientId: string): Promise<Order[]> => {
    const { data, error } = await supabase
        .from('Orders')
        .select(`*, Stores(name, city)`)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data as unknown as Order[];
};

// ATUALIZADO: Cria notificação após mudança de status
export const updateOrderStatus = async (orderId: string, status: string) => {
    // 1. Obtém client_id antes de atualizar o status
    const { data: orderData, error: fetchError } = await supabase.from('Orders').select('client_id').eq('id', orderId).single();
    
    if (fetchError || !orderData) {
        throw new Error(`Pedido não encontrado: ${fetchError?.message}`);
    }

    // 2. Atualiza o status do pedido
    const { error } = await supabase.from('Orders').update({ status }).eq('id', orderId);
    if (error) throw new Error(error.message);

    // 3. Cria a notificação para o cliente
    await createClientNotification(orderData.client_id, orderId, status);
};

export const assignDriverToOrder = async (orderId: string, driverId: string) => {
    // 1. Atualiza o pedido com driver_id e status para 'on_the_way'
    const { error } = await supabase.from('Orders').update({ driver_id: driverId, status: 'on_the_way' }).eq('id', orderId);
    if (error) throw new Error(error.message);
    
    // 2. Cria notificação 'on_the_way'
    const { data: orderData } = await supabase.from('Orders').select('client_id').eq('id', orderId).single();
    if (orderData) {
        await createClientNotification(orderData.client_id, orderId, 'on_the_way');
    }
};

// ==================================================================
// OUTROS (NOTIFICAÇÕES DO CLIENTE E GARANTIAS)
// ==================================================================

export const checkIsFavorite = async (clientId: string, productId: string) => {
    const { data, error } = await supabase.from('Favorites').select('id').eq('client_id', clientId).eq('product_id', productId).maybeSingle();
    if (error) return false;
    return !!data;
};
export const toggleFavorite = async (clientId: string, productId: string) => {
    const isFav = await checkIsFavorite(clientId, productId);
    if (isFav) { await supabase.from('Favorites').delete().eq('client_id', clientId).eq('product_id', productId); return false; }
    else { await supabase.from('Favorites').insert({ client_id: clientId, product_id: productId }); return true; }
};
export const fetchClientFavorites = async (clientId: string): Promise<Product[]> => {
    //@ts-ignore
    const { data, error } = await (supabase.from('Favorites')
        .select(`product_id, Products ( *, ProductStores ( Stores ( id, name, whatsapp, city ) ) )`)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false }) as Promise<any>);

    if (error) throw new Error(error.message);

    return (data as any[]).map((item: any) => {
        const product = item.Products;
        if (!product) return null;
        const stores = (product.ProductStores || []).map((ps: any) => ps.Stores).filter((s: any) => s !== null);
        return { ...product, stores: stores, colors: parseArrayData(product.colors), images: parseArrayData(product.images) } as unknown as Product;
    }).filter(Boolean) as Product[];
};

export const fetchCoupon = async (code: string) => {
    const { data, error } = await supabase.from('Coupons').select('*').eq('code', code.toUpperCase()).eq('active', true).maybeSingle();
    if (error) return null;
    return data as Coupon;
};
export const fetchAllCoupons = async () => { const { data } = await supabase.from('Coupons').select('*'); return data as Coupon[]; };
export const createCoupon = async (p: CouponInsertPayload) => { 
    const { valid_until, ...rest } = p; 
    await supabase.from('Coupons').insert({...rest, code: p.code.toUpperCase(), valid_until: valid_until ? valid_until.toISOString() : null}); 
};
export const updateCoupon = async (p: CouponUpdatePayload) => { 
    const { id, valid_until, ...rest } = p; 
    // @ts-ignore
    await supabase.from('Coupons').update({ ...rest, code: rest.code?.toUpperCase(), valid_until: valid_until ? valid_until.toISOString() : null }).eq('id', id); 
};
export const deleteCoupon = async (id: string) => { await supabase.from('Coupons').delete().eq('id', id); };
export const toggleCouponStatus = async (id: string, s: boolean) => { await supabase.from('Coupons').update({ active: !s }).eq('id', id); };
export const checkCouponUsage = async (cid: string, cpid: string) => { const { data } = await supabase.from('CouponUsages').select('id').eq('client_id', cid).eq('coupon_id', cpid).maybeSingle(); return !!data; };
export const createCouponUsage = async (cid: string, cpid: string) => { await supabase.from('CouponUsages').insert({ client_id: cid, coupon_id: cpid }); };

export const fetchPublicLinks = async (): Promise<PublicLink[]> => { const { data } = await supabase.from('PublicLinks').select('*').order('created_at'); return data as PublicLink[]; };
export const createPublicLink = async (p: PublicLinkInsertPayload) => { await supabase.from('PublicLinks').insert(p); };
export const updatePublicLink = async (p: PublicLinkUpdatePayload) => { const { id, ...rest } = p; await supabase.from('PublicLinks').update(rest).eq('id', id); };
export const deletePublicLink = async (id: string) => { await supabase.from('PublicLinks').delete().eq('id', id); };
export const togglePublicLinkStatus = async (id: string, s: boolean) => { await supabase.from('PublicLinks').update({ active: !s }).eq('id', id); };

export const fetchNotifications = async () => { const { data } = await supabase.from('Notifications').select('*').order('created_at', {ascending:false}); return data as any; };
export const createNotification = async (p: any) => { await supabase.from('Notifications').insert(p); };
export const deleteNotification = async (id: string) => { await supabase.from('Notifications').delete().eq('id', id); };
export const sendNotificationNow = async (notif: any) => {
    const { data, error } = await supabase.functions.invoke('send-push', { body: { title: notif.title, body: notif.body, url: notif.link_url, image: notif.image_url } });
    if (error || data.error) throw new Error(error?.message || data.error);
    await supabase.from('Notifications').update({ status: 'sent', sent_count: data.successCount }).eq('id', notif.id);
    return data.successCount;
};
export const createPaymentIntent = async (amount: number, storeId: string) => {
  const { data, error } = await supabase.functions.invoke('create-payment-intent', { body: { amount, storeId } });
  if (error || data?.error) throw new Error(data?.error || error.message);
  return data; 
};
export const sendOrderEmail = async (to: string, clientName: string, orderId: string, totalFormatted: string, items: any[]) => {
    await supabase.functions.invoke('send-order-email', { body: { to, clientName, orderId, total: totalFormatted, items } });
};

export const fetchAllBannersAdmin = async () => { const { data } = await supabase.from('Banners').select('*'); return data as Banner[]; };
export const createBanner = async (p: BannerInsertPayload) => { await supabase.from('Banners').insert(p); };
export const updateBanner = async (p: BannerUpdatePayload) => { const { id, ...rest } = p; await supabase.from('Banners').update(rest).eq('id', id); };
export const deleteBanner = async (id: string) => { await supabase.from('Banners').delete().eq('id', id); };
export const uploadBannerImage = async (file: File) => {
    const fileName = `${uuidv4()}-${file.name}`;
    const { data } = await supabase.storage.from('product-images').upload(`banners/${fileName}`, file);
    return supabase.storage.from('product-images').getPublicUrl(data!.path).data.publicUrl;
};
export const fetchBanners = async () => { const { data } = await supabase.from('Banners').select('*').eq('active', true); return data as Banner[]; };
export const createWarranty = async (p: WarrantyInsertPayload) => { 
    // @ts-ignore
    await supabase.from('Warranties').insert({ ...p, purchase_date: p.purchase_date.toISOString(), warranty_end_date: p.warranty_end_date.toISOString() }); 
};
export const fetchAllWarranties = async () => {
    // @ts-ignore
    const { data } = await supabase.from('Warranties').select(`*, Clients(id, name, phone, email), Stores(*)`);
    return data as any as Warranty[];
};
export const fetchClientWarranties = async (cid: string) => { 
    // @ts-ignore
    const { data } = await supabase.from('Warranties').select(`*, Stores(name, address, city)`).eq('client_id', cid); return data as any as Warranty[]; 
};

export const fetchClientNotifications = async (clientId: string): Promise<ClientNotification[]> => {
    const { data, error } = await supabase
        .from('ClientNotifications')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
    
    if (error) throw new Error(error.message);
    return data as ClientNotification[];
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
    // A política RLS garante que apenas o dono da notificação pode atualizar
    const { error } = await supabase.from('ClientNotifications').update({ is_read: true }).eq('id', notificationId);
    if (error) throw new Error(error.message);
};

export const markAllNotificationsAsRead = async (clientId: string): Promise<void> => {
    // A política RLS deve ser configurada para permitir que o usuário atualize várias de uma vez
    const { error } = await supabase
        .from('ClientNotifications')
        .update({ is_read: true })
        .eq('client_id', clientId) 
        .eq('is_read', false);
    
    if (error) throw new Error(error.message);
};