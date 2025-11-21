/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/integrations/supabase/client";
import { 
    Product, Store, Employee, CustomerProfile, Order, Banner, Warranty, Coupon, Address, ShippingQuote, Driver, WholesaleClient, PublicLink,
    ProductInsertPayload, ProductUpdatePayload, StoreInsertPayload, StoreUpdatePayload,
    EmployeeInsertPayload, EmployeeUpdatePayload, CustomerUpdatePayload, OrderInsertPayload,
    BannerInsertPayload, BannerUpdatePayload, CouponInsertPayload, CouponUpdatePayload, WarrantyInsertPayload, AddressInsertPayload, DriverInsertPayload,
    WholesaleClientInsertPayload, WholesaleClientUpdatePayload, BulkClientInsertPayload,
    PublicLinkInsertPayload, PublicLinkUpdatePayload
} from "@/types";
import { Database } from "@/integrations/supabase/types";
import { v4 as uuidv4 } from 'uuid'; 

// Helper
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
        if (data.startsWith('{')) return data.replace(/[{}]/g, '').split(',').filter(Boolean);
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
  } catch (e) { return ''; }
}

// ==================================================================
// PRODUTOS
// ==================================================================

export const fetchProducts = async (params: { q?: string; category?: 'aparelho' | 'acessorio', isPromotion?: boolean } = {}): Promise<Product[]> => {
  let query = supabase
    .from('Products')
    .select(`
      *,
      ProductStores ( Stores ( id, name, whatsapp, city ) ),
      ProductVariants (*)
    `);

  if (params.category) query = query.eq('category', params.category);
  if (params.isPromotion !== undefined) query = query.eq('isPromotion', params.isPromotion);
  if (params.q) query = query.ilike('name', `%${params.q}%`);
  
  const { data: rawProducts, error } = await query;
  if (error) throw new Error(error.message);

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
      ProductStores ( Stores ( id, name, whatsapp, city ) ),
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

  return (data as any[]).map((p: any) => ({
      ...p, 
      stores: p.ProductStores?.map((ps: any) => ps.Stores).filter(Boolean) || [], 
      colors: parseArrayData(p.colors), 
      images: parseArrayData(p.images)
  })) as Product[];
};

export const createProduct = async (payload: ProductInsertPayload): Promise<void> => {
  const imageUrls: string[] = [];
  if (payload.image_files && payload.image_files.length > 0) {
    for (const file of payload.image_files) {
      const fileName = `${uuidv4()}-${file.name}`;
      const { data, error } = await supabase.storage.from('product-images').upload(fileName, file);
      if (error) throw new Error(error.message);
      const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(data.path);
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
    images: imageUrls,
  };

  const { data: newProduct, error: productError } = await supabase
    .from('Products')
    .insert(productData as any)
    .select('id')
    .single();

  if (productError) throw new Error(productError.message);
  const newProductId = newProduct.id;

  if (payload.store_ids && payload.store_ids.length > 0) {
    const productStoreRelations = payload.store_ids.map(storeId => ({
      product_id: newProductId,
      store_id: storeId,
    }));
    const { error: relationError } = await supabase.from('ProductStores').insert(productStoreRelations);
    if (relationError) throw new Error(relationError.message);
  }

  if (payload.has_variations && payload.variants && payload.variants.length > 0) {
      const variantsData = payload.variants.map(v => ({
          product_id: newProductId,
          name: v.name,
          attributes: v.attributes,
          price: v.price,
          original_price: v.original_price,
          quantity: v.quantity
      }));
      const { error: varError } = await supabase.from('ProductVariants').insert(variantsData);
      if (varError) throw new Error("Erro ao salvar variações: " + varError.message);
  }
};

export const updateProduct = async (payload: ProductUpdatePayload): Promise<void> => {
  if (payload.images_to_delete?.length) {
    const fileNames = payload.images_to_delete.map(getFileNameFromUrl).filter(Boolean);
    if (fileNames.length) await supabase.storage.from('product-images').remove(fileNames);
  }

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
    images: finalImageUrls,
  };

  const { error: productError } = await supabase.from('Products').update(productData as any).eq('id', payload.id);
  if (productError) throw new Error(productError.message);
  
  await supabase.from('ProductStores').delete().eq('product_id', payload.id);
  if (payload.store_ids?.length) {
    const relations = payload.store_ids.map(sid => ({ product_id: payload.id, store_id: sid }));
    await supabase.from('ProductStores').insert(relations);
  }

  if (payload.has_variations && payload.variants) {
      await supabase.from('ProductVariants').delete().eq('product_id', payload.id);
      if (payload.variants.length > 0) {
          const variantsData = payload.variants.map(v => ({
              product_id: payload.id,
              name: v.name,
              attributes: v.attributes,
              price: v.price,
              original_price: v.original_price,
              quantity: v.quantity
          }));
          await supabase.from('ProductVariants').insert(variantsData);
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
// LOJAS
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
// FUNCIONÁRIOS & ADMIN
// ==================================================================
export const fetchEmployees = async (): Promise<Employee[]> => {
  const { data, error } = await supabase.from('Employees').select('*, Stores(id, name)').order('name');
  if (error) throw new Error(error.message);
  return data as unknown as Employee[];
};
export const fetchEmployeeProfile = async (userId: string): Promise<Employee | null> => {
  const { data, error } = await supabase.rpc('get_admin_profile' as never);
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
// DRIVERS & CLIENTES
// ==================================================================
export const fetchDrivers = async (): Promise<Driver[]> => {
    const { data, error } = await supabase.from('Drivers').select('*').order('name');
    if (error) throw new Error(error.message);
    return data as Driver[];
};
export const fetchDriverProfile = async (): Promise<Driver | null> => {
    const { data, error } = await supabase.rpc('get_driver_profile' as never);
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
export const createBulkClients = async (clients: BulkClientInsertPayload[]) => {
    const clientsWithId = clients.map(c => ({ id: uuidv4(), name: c.name, email: c.email, phone: c.phone }));
    const { error } = await supabase.from('Clients').insert(clientsWithId);
    if (error) throw new Error(error.message);
};

// ==================================================================
// ATACADO
// ==================================================================
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
    const { data, error } = await supabase.rpc('get_wholesale_profile' as never);
    if (error || !data) return null;
    return data as unknown as WholesaleClient;
};

// ==================================================================
// ENDEREÇOS, FRETE & LOGÍSTICA
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
// PEDIDOS
// ==================================================================
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
        stripe_payment_id: payload.stripe_payment_id
    };
    // @ts-ignore
    const { data, error } = await supabase.from('Orders').insert(orderData as any).select().single();
    if (error) throw new Error(error.message);
    
    for (const item of payload.items) {
        try { await supabase.rpc('decrement_stock', { product_id: item.id, amount: item.quantity }); } 
        catch (e) { console.error("Erro estoque", e); }
    }
    return data;
};
export const fetchAllOrders = async (): Promise<Order[]> => {
    const { data, error } = await supabase
        .from('Orders')
        .select(`*, Clients(name,phone,email), Stores(name,city,address,cnpj), Employees(name), Addresses(*)`)
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    // @ts-ignore
    return (data || []).map((order: any) => ({
        ...order,
        Clients: order.Clients || { name: 'Cliente Removido', phone: '', email: '' },
        Stores: order.Stores || { name: 'Loja Indefinida' },
        Employees: order.Employees,
        Addresses: order.Addresses
    })) as unknown as Order[];
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
export const updateOrderStatus = async (orderId: string, status: string) => {
    const { error } = await supabase.from('Orders').update({ status }).eq('id', orderId);
    if (error) throw new Error(error.message);
};

// ==================================================================
// OUTROS
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
    const { data, error } = await (supabase.from('Favorites').select(`product_id, Products ( *, ProductStores ( Stores ( id, name, whatsapp, city ) ) )`).eq('client_id', clientId).order('created_at', { ascending: false }) as Promise<any>);
    if (error) throw new Error(error.message);
    return (data as any[]).map((item: any) => {
        const product = item.Products;
        if (!product) return null;
        const stores = (product.ProductStores || []).map((ps: any) => ps.Stores).filter((s: any) => s !== null);
        return { ...product, stores: stores, colors: parseArrayData(product.colors), images: parseArrayData(product.images) } as unknown as Product;
    }).filter(Boolean) as Product[];
};

// Cupons (Correção do erro 2769 - Tipo Date)
export const createCoupon = async (payload: CouponInsertPayload): Promise<void> => {
    // Separa o payload para tratar a data antes de enviar
    const { valid_until, ...rest } = payload;
    
    const insertData = {
        ...rest,
        code: payload.code.toUpperCase(),
        // Converte Date para string ISO (Supabase requirement)
        valid_until: valid_until ? valid_until.toISOString() : null
    };

    const { error } = await supabase.from('Coupons').insert(insertData);
    if (error) throw new Error(error.message);
};

export const fetchCoupon = async (code: string) => {
    const { data, error } = await supabase.from('Coupons').select('*').eq('code', code.toUpperCase()).eq('active', true).maybeSingle();
    if (error) return null;
    return data as Coupon;
};
export const fetchAllCoupons = async () => { const { data } = await supabase.from('Coupons').select('*'); return data as Coupon[]; };
export const updateCoupon = async (p: CouponUpdatePayload) => { 
    const { id, valid_until, ...rest } = p; 
    const updateData = { ...rest, code: rest.code?.toUpperCase(), valid_until: valid_until ? valid_until.toISOString() : null };
    const { error } = await supabase.from('Coupons').update(updateData).eq('id', id);
    if (error) throw new Error(error.message);
};
export const deleteCoupon = async (id: string) => { await supabase.from('Coupons').delete().eq('id', id); };
export const toggleCouponStatus = async (id: string, s: boolean) => { await supabase.from('Coupons').update({ active: !s }).eq('id', id); };
export const checkCouponUsage = async (cid: string, cpid: string) => { const { data } = await supabase.from('CouponUsages').select('id').eq('client_id', cid).eq('coupon_id', cpid).maybeSingle(); return !!data; };
export const createCouponUsage = async (cid: string, cpid: string) => { await supabase.from('CouponUsages').insert({ client_id: cid, coupon_id: cpid }); };

// Links, Push, Banners, Garantias, Pagamento, Email
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

// Correção de renomeação (oid -> orderId)
export const sendOrderEmail = async (to: string, clientName: string, orderId: string, totalFormatted: string, items: any[]) => {
    await supabase.functions.invoke('send-order-email', { body: { to, subject: `Pedido #${orderId.substring(0, 8)} - BV Celular`, clientName, orderId, total: totalFormatted, items } });
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