/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/integrations/supabase/client";
import { 
    Product, Store, Employee, CustomerProfile, OrderCartItem, Order, Banner, Warranty, Coupon, Address, ShippingQuote, Driver, WholesaleClient, PublicLink,
    ProductInsertPayload, ProductUpdatePayload, StoreInsertPayload, StoreUpdatePayload,
    EmployeeInsertPayload, EmployeeUpdatePayload, CustomerUpdatePayload, OrderInsertPayload,
    BannerInsertPayload, BannerUpdatePayload, CouponInsertPayload, CouponUpdatePayload, WarrantyInsertPayload, AddressInsertPayload, DriverInsertPayload,
    WholesaleClientInsertPayload, WholesaleClientUpdatePayload, BulkClientInsertPayload,
    PublicLinkInsertPayload, PublicLinkUpdatePayload // <-- NOVOS PAYLOADS IMPORTADOS
} from "@/types";
// Importamos o Database para uso nas funções de retorno se necessário (embora os tipos customizados acima já cubram)
import { Database } from "@/integrations/supabase/types";
import { v4 as uuidv4 } from 'uuid'; 

// ==================================================================
// FUNÇÕES DE API (PRODUTOS)
// ==================================================================

const parseArrayData = (data: any): any[] => {
  if (Array.isArray(data)) {
    return data.flatMap(item => {
      if (typeof item === 'string' && item.startsWith('[')) {
        try { return JSON.parse(item); } catch (e) { return item; }
      }
      return item;
    });
  }
  if (typeof data === 'string' && data.startsWith('[')) {
    try { return JSON.parse(data); } catch (e) { return []; }
  }
  if (typeof data === 'string' && data.startsWith('{')) {
    return data.replace(/[{}]/g, '').split(',');
  }
  return []; 
}

export const fetchProducts = async (params: { q?: string; category?: 'aparelho' | 'acessorio', isPromotion?: boolean } = {}): Promise<Product[]> => {
  let query = supabase
    .from('Products')
    .select(`
      id, name, description, price, originalPrice, storage, ram, colors, isPromotion, category, images, brand, promotion_end_date, subcategory, quantity, wholesale_price, installment_price, max_installments,
      ProductStores (
        Stores (
          id, name, whatsapp, city
        )
      )
    `);

  if (params.category) query = query.eq('category', params.category);
  if (params.isPromotion !== undefined) query = query.eq('isPromotion', params.isPromotion);
  if (params.q) query = query.ilike('name', `%${params.q}%`);
  
  const { data: rawProducts, error } = await query;
  if (error) throw new Error(error.message);

  const products = rawProducts.map(product => {
    const stores: Store[] = (product.ProductStores || [])
      .map((ps: any) => ps.Stores)
      .filter((store: any): store is Store => store !== null); 
    
    return {
      ...product,
      stores: stores,
      colors: parseArrayData(product.colors),
      images: parseArrayData(product.images),
    } as unknown as Product;
  });
  return products;
};

export const fetchPromotions = async (params: { q?: string; isPromotion?: boolean } = {}): Promise<Product[]> => {
  let query = supabase
    .from('Products')
    .select(`
      id, name, description, price, originalPrice, storage, ram, colors, isPromotion, category, images, brand, promotion_end_date, subcategory, quantity, wholesale_price, installment_price, max_installments,
      ProductStores (
        Stores (
          id, name, whatsapp, city
        )
      )
    `)
    .eq('isPromotion', true);

  if (params.q) query = query.ilike('name', `%${params.q}%`);

  const { data: rawProducts, error } = await query;
  if (error) throw new Error(error.message);

  const products = rawProducts.map(product => {
    const stores: Store[] = (product.ProductStores || [])
      .map((ps: any) => ps.Stores)
      .filter((store: any): store is Store => store !== null); 
    return {
      ...product,
      stores: stores,
      colors: parseArrayData(product.colors),
      images: parseArrayData(product.images),
    } as unknown as Product;
  });
  return products;
};

export const fetchAllProducts = async (): Promise<Product[]> => {
  try {
    let query = supabase
      .from('Products')
      .select(`
        id, name, description, price, originalPrice, storage, ram, colors, isPromotion, category, images, brand, promotion_end_date, subcategory, quantity, wholesale_price, installment_price, max_installments,
        ProductStores (
          Stores (
            id, name, whatsapp, city
          )
        )
      `)
      .order('created_at', { ascending: false }); 

    const { data: rawProducts, error } = await query;
    
    if (error) throw new Error(error.message);
    if (!rawProducts) return [];

    const products = rawProducts.map(product => {
      const productStores = product.ProductStores || [];
      
      const stores: Store[] = productStores
        .map((ps: any) => ps.Stores)
        .filter((store: any): store is Store => store !== null && store !== undefined); 
      
      return {
        ...product,
        stores: stores,
        colors: parseArrayData(product.colors),
        images: parseArrayData(product.images),
      } as unknown as Product;
    });
    
    return products;
    
  } catch (e) {
    console.error("Erro fatal em fetchAllProducts:", e);
    throw e;
  }
};

export const fetchProductById = async (productId: string): Promise<Product> => {
  let { data: rawProduct, error } = await supabase
    .from('Products')
    .select(`
      id, name, description, price, originalPrice, storage, ram, colors, isPromotion, category, images, brand, promotion_end_date, subcategory, quantity, wholesale_price, installment_price, max_installments,
      ProductStores (
        Stores (
          id, name, whatsapp, city
        )
      )
    `)
    .eq('id', productId)
    .single();

  if (error) throw new Error(error.message);
  if (!rawProduct) throw new Error("Produto não encontrado");
  
  const stores: Store[] = (rawProduct.ProductStores || [])
    .map((ps: any) => ps.Stores)
    .filter((store: any): store is Store => store !== null); 
  
  const product = {
    ...rawProduct,
    stores: stores,
    colors: parseArrayData(rawProduct.colors),
    images: parseArrayData(rawProduct.images),
  } as unknown as Product;
  return product;
};

// Função para buscar produtos relacionados
export const fetchRelatedProducts = async (category: string, currentProductId: string): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('Products')
    .select(`
      id, name, description, price, originalPrice, storage, ram, colors, isPromotion, category, images, brand, promotion_end_date, subcategory, quantity, wholesale_price, installment_price, max_installments,
      ProductStores (
        Stores (
          id, name, whatsapp, city
        )
      )
    `)
    .eq('category', category)
    .neq('id', currentProductId) 
    .limit(4); 

  if (error) throw new Error(error.message);

  return data.map((p: any) => ({
      ...p, 
      stores: p.ProductStores.map((ps: any) => ps.Stores), 
      colors: parseArrayData(p.colors), 
      images: parseArrayData(p.images)
  })) as Product[];
};

const getFileNameFromUrl = (url: string): string => {
  try {
    const newUrl = new URL(url);
    const parts = newUrl.pathname.split('/');
    const bucketName = 'product-images';
    const bucketIndex = parts.indexOf(bucketName);
    if (bucketIndex > -1 && parts.length > bucketIndex + 1) {
      return parts.slice(bucketIndex + 1).join('/');
    }
    return parts[parts.length - 1];
  } catch (e) {
    return '';
  }
}

export const createProduct = async (payload: ProductInsertPayload): Promise<void> => {
  const imageUrls: string[] = [];
  if (payload.image_files && payload.image_files.length > 0) {
    for (const file of payload.image_files) {
      const fileName = `${uuidv4()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('product-images')
        .upload(fileName, file);
      if (uploadError) throw new Error(uploadError.message);
      const { data: publicUrlData } = supabase
        .storage
        .from('product-images')
        .getPublicUrl(uploadData.path);
      imageUrls.push(publicUrlData.publicUrl);
    }
  }
  
  // @ts-ignore
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
    const { error: relationError } = await supabase
      .from('ProductStores')
      .insert(productStoreRelations);
    if (relationError) throw new Error(relationError.message);
  }
};

export const updateProduct = async (payload: ProductUpdatePayload): Promise<void> => {
  if (payload.images_to_delete && payload.images_to_delete.length > 0) {
    const fileNames = payload.images_to_delete.map(getFileNameFromUrl).filter(Boolean);
    if (fileNames.length > 0) {
      const { error: removeError } = await supabase
        .storage
        .from('product-images')
        .remove(fileNames);
      if (removeError) console.error("Erro ao deletar imagens antigas:", removeError);
    }
  }

  const newImageUrls: string[] = [];
  if (payload.image_files && payload.image_files.length > 0) {
    for (const file of payload.image_files) {
      const fileName = `${uuidv4()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('product-images')
        .upload(fileName, file);
      if (uploadError) throw new Error(uploadError.message);
      const { data: publicUrlData } = supabase
        .storage
        .from('product-images')
        .getPublicUrl(uploadData.path);
      newImageUrls.push(publicUrlData.publicUrl);
    }
  }
  
  const { data: currentProduct, error: fetchError } = await supabase
    .from('Products')
    .select('images')
    .eq('id', payload.id)
    .single();
  if (fetchError) throw new Error(fetchError.message);

  const currentImages = parseArrayData(currentProduct?.images);
  const remainingImages = currentImages.filter(
    url => !payload.images_to_delete?.includes(url)
  );
  const finalImageUrls = [...remainingImages, ...newImageUrls];
  
  // @ts-ignore
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
    images: finalImageUrls,
  };

  const { error: productError } = await supabase
    .from('Products')
    .update(productData as any)
    .eq('id', payload.id);
  if (productError) throw new Error(productError.message);
  
  const { error: deleteRelationError } = await supabase
    .from('ProductStores')
    .delete()
    .eq('product_id', payload.id);
  if (deleteRelationError) throw new Error(deleteRelationError.message);
  
  if (payload.store_ids && payload.store_ids.length > 0) {
    const productStoreRelations = payload.store_ids.map(storeId => ({
      product_id: payload.id,
      store_id: storeId,
    }));
    const { error: insertRelationError } = await supabase
      .from('ProductStores')
      .insert(productStoreRelations);
    if (insertRelationError) throw new Error(insertRelationError.message);
  }
};

export const deleteProduct = async (product: Product): Promise<void> => {
  if (!product.id) throw new Error("ID do produto não encontrado.");
  const { error: relationError } = await supabase
    .from('ProductStores')
    .delete()
    .eq('product_id', product.id);
  if (relationError) throw new Error(relationError.message);
  const { error: productError } = await supabase
    .from('Products')
    .delete()
    .eq('id', product.id);
  if (productError) throw new Error(productError.message);

  if (product.images && product.images.length > 0) {
    const fileNames = product.images.map(getFileNameFromUrl).filter(Boolean);
    if (fileNames.length > 0) {
      const { error: storageError } = await supabase
        .storage
        .from('product-images')
        .remove(fileNames);
      if (storageError) console.warn("Produto deletado, mas falha ao limpar imagens do Storage:", storageError);
    }
  }
};

// ==================================================================
// FUNÇÕES DE API (LOJAS)
// ==================================================================
export const fetchStores = async (): Promise<Store[]> => {
  const { data, error } = await supabase
    .from('Stores')
    .select('*')
    .order('name');
  if (error) throw new Error(error.message);
  return data as Store[];
};
export const createStore = async (payload: StoreInsertPayload) => {
  const { error } = await supabase
    .from('Stores')
    .insert(payload);
  if (error) throw new Error(error.message);
};
export const updateStore = async (payload: StoreUpdatePayload) => {
  const { id, ...updateData } = payload;
  const { error } = await supabase
    .from('Stores')
    .update(updateData)
    .eq('id', id);
  if (error) throw new Error(error.message);
};
export const deleteStore = async (storeId: string) => {
  if (!storeId) throw new Error("ID da loja não encontrado.");
  const { error: relationError } = await supabase
    .from('ProductStores')
    .delete()
    .eq('store_id', storeId);
  if (relationError) throw new Error(relationError.message);
  const { error: storeError } = await supabase
    .from('Stores')
    .delete()
    .eq('id', storeId);
  if (storeError) throw new Error(storeError.message);
};

// ==================================================================
// FUNÇÕES DE API (FUNCIONÁRIOS/ADMIN)
// ==================================================================
export const fetchEmployees = async (): Promise<Employee[]> => {
  const { data, error } = await supabase
    .from('Employees')
    .select(`
      id,
      name,
      email,
      store_id,
      Stores ( id, name )
    `)
    .order('name');
  if (error) throw new Error(error.message);
  return data as Employee[];
};

export const fetchEmployeeProfile = async (userId: string): Promise<Employee | null> => {
  console.log("[API] Buscando perfil via RPC get_admin_profile...");
  
  // @ts-ignore: Ignora erro de tipo da função RPC
  const { data, error } = await supabase.rpc('get_admin_profile');

  if (error) {
    console.error("[API] Erro na RPC get_admin_profile:", error);
    return null;
  }

  if (!data) {
    console.log("[API] RPC retornou nulo (usuário não é admin).");
    return null;
  }

  console.log("[API] Perfil encontrado via RPC:", data);
  return data as unknown as Employee;
};

export const createEmployee = async (payload: EmployeeInsertPayload) => {
  const { error } = await supabase
    .from('Employees')
    .insert(payload);
  if (error) {
    if (error.code === '23505') { 
      throw new Error("Este e-mail já está em uso.");
    }
    throw new Error(error.message);
  }
};
export const updateEmployee = async (payload: EmployeeUpdatePayload) => {
  const { id, ...updateData } = payload;
  if (!id) throw new Error("ID da loja é obrigatório para atualizar.");
  const { error } = await supabase
    .from('Employees')
    .update(updateData)
    .eq('id', id);
  if (error) {
    if (error.code === '23505') {
      throw new Error("Este e-mail já está em uso.");
    }
    throw new Error(error.message);
  }
};
export const deleteEmployee = async (employeeId: string) => {
  if (!employeeId) throw new Error("ID do funcionário não encontrado.");
  const { error } = await supabase
    .from('Employees')
    .delete()
    .eq('id', employeeId);
  if (error) throw new Error(error.message);
};

// ==================================================================
// FUNÇÕES DE API (ENTREGADORES)
// ==================================================================

export const fetchDrivers = async (): Promise<Driver[]> => {
    const { data, error } = await supabase
        .from('Drivers')
        .select('*')
        .order('name');
    if (error) throw new Error(error.message);
    return data as Driver[];
};

export const fetchDriverProfile = async (): Promise<Driver | null> => {
    // @ts-ignore
    const { data, error } = await supabase.rpc('get_driver_profile');
    if (error || !data) return null;
    return data as unknown as Driver;
};

export const createDriver = async (payload: DriverInsertPayload): Promise<void> => {
    const { error } = await supabase
        .from('Drivers')
        .insert({
            id: uuidv4(),
            ...payload
        });
    if (error) throw new Error(error.message);
};

export const deleteDriver = async (id: string): Promise<void> => {
    const { error } = await supabase.from('Drivers').delete().eq('id', id);
    if (error) throw new Error(error.message);
};

// ==================================================================
// FUNÇÕES DE API (CLIENTES)
// ==================================================================

export const fetchClients = async (): Promise<CustomerProfile[]> => {
  const { data, error } = await supabase
    .from('Clients')
    .select(`
      id,
      name,
      phone,
      email
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Erro ao buscar clientes (Admin):", error);
    throw new Error(error.message);
  }
  return data as CustomerProfile[];
};

export const fetchCustomerProfile = async (userId: string): Promise<CustomerProfile | null> => {
  const { data, error } = await supabase
    .from('Clients') 
    .select(`
      id,
      name,
      phone,
      email
    `)
    .eq('id', userId) 
    .maybeSingle(); 

  if (error) {
    console.error("Erro ao buscar perfil do cliente:", error);
    throw new Error(error.message);
  }
  return data as CustomerProfile;
};

export const deleteClient = async (clientId: string) => {
  if (!clientId) throw new Error("ID do cliente não encontrado.");
  const { error } = await supabase
    .from('Clients')
    .delete()
    .eq('id', clientId);

  if (error) {
    console.error("Erro ao deletar cliente:", error);
    throw new Error(error.message);
  }
};

export const updateCustomerProfile = async (payload: CustomerUpdatePayload): Promise<void> => {
  const { id, ...updateData } = payload;
  
  const { error } = await supabase
    .from('Clients')
    .update({ 
      name: updateData.name, 
      phone: updateData.phone 
    })
    .eq('id', id);

  if (error) {
    console.error("Erro ao atualizar perfil (tabela Clients):", error);
    throw new Error(error.message);
  }
  
  const { error: authError } = await supabase.auth.updateUser({
    data: { 
      full_name: updateData.name, 
      phone: updateData.phone 
    }
  });

  if (authError) {
     console.error("Erro ao atualizar user_metadata (Auth):", authError);
  }
};

export const upsertClient = async (profile: { id: string; name: string; phone: string; email: string }) => {
    const { error } = await supabase
        .from('Clients')
        .upsert({
            id: profile.id,
            name: profile.name,
            phone: profile.phone,
            email: profile.email
        }, { onConflict: 'id' });

    if (error) {
        console.error("Erro ao fazer upsert do cliente:", error);
        throw error;
    }
};

// ==================================================================
// FUNÇÕES DE API (CLIENTES ATACADO - WHOLESALE)
// ==================================================================

export const fetchWholesaleClients = async (): Promise<WholesaleClient[]> => {
    const { data, error } = await supabase.from('WholesaleClients').select(`*, Stores ( name )`).order('name');
    if (error) throw new Error(error.message);
    // @ts-ignore
    return data as unknown as WholesaleClient[];
};

export const createWholesaleClient = async (payload: WholesaleClientInsertPayload): Promise<void> => {
    const { error } = await supabase.from('WholesaleClients').insert({ id: uuidv4(), ...payload });
    if (error) throw new Error(error.message);
};

export const updateWholesaleClient = async (payload: WholesaleClientUpdatePayload): Promise<void> => {
    const { id, ...updateData } = payload;
    const { error } = await supabase.from('WholesaleClients').update(updateData).eq('id', id);
    if (error) throw new Error(error.message);
};

export const deleteWholesaleClient = async (id: string): Promise<void> => {
    const { error } = await supabase.from('WholesaleClients').delete().eq('id', id);
    if (error) throw new Error(error.message);
};

export const fetchWholesaleProfile = async (): Promise<WholesaleClient | null> => {
    // @ts-ignore
    const { data, error } = await supabase.rpc('get_wholesale_profile');
    if (error || !data) return null;
    return data as unknown as WholesaleClient;
};

// --- NOVA FUNÇÃO: IMPORTAÇÃO EM MASSA DE CLIENTES ---
export const createBulkClients = async (clients: BulkClientInsertPayload[]): Promise<void> => {
    const clientsWithId = clients.map(c => ({
        id: uuidv4(),
        name: c.name,
        email: c.email,
        phone: c.phone
    }));

    const { error } = await supabase
        .from('Clients')
        .insert(clientsWithId);

    if (error) throw new Error(error.message);
};

// ==================================================================
// FUNÇÕES DE API (ENDEREÇOS E CEP)
// ==================================================================

export const fetchAddressByCEP = async (cep: string): Promise<Partial<Address> | null> => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return null;

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        
        if (data.erro) return null;

        return {
            street: data.logradouro,
            neighborhood: data.bairro,
            city: data.localidade,
            state: data.uf,
        };
    } catch (error) {
        console.error("Erro ao buscar CEP:", error);
        return null;
    }
};

export const calculateFreight = async (cep: string): Promise<ShippingQuote> => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) throw new Error("CEP Inválido");

    const address = await fetchAddressByCEP(cleanCep);
    if (!address) throw new Error("CEP não encontrado");

    const state = address.state;
    
    // Simulação de frete
    if (state === 'MG') {
        return { price: 1500, days: 3, type: 'SEDEX (Local)' };
    } else if (['SP', 'RJ', 'ES'].includes(state)) {
        return { price: 2500, days: 5, type: 'PAC' };
    } else {
        return { price: 4500, days: 10, type: 'PAC' };
    }
};

export const fetchClientAddresses = async (clientId: string): Promise<Address[]> => {
    const { data, error } = await supabase
        .from('Addresses')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data as Address[];
};

export const createAddress = async (payload: AddressInsertPayload): Promise<void> => {
    const { error } = await supabase
        .from('Addresses')
        .insert(payload);

    if (error) throw new Error(error.message);
};

export const deleteAddress = async (id: string): Promise<void> => {
    const { error } = await supabase
        .from('Addresses')
        .delete()
        .eq('id', id);

    if (error) throw new Error(error.message);
};

// ==================================================================
// FUNÇÕES DE API (PEDIDOS/ORÇAMENTOS)
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
    stripe_payment_id: payload.stripe_payment_id,
    change_for: payload.change_for
  };

  // @ts-ignore: Contorna erro de tipo até update
  const { data, error } = await supabase
    .from('Orders')
    .insert(orderData as any) 
    .select() 
    .single();

  if (error) {
    console.error("Erro ao criar pedido (createOrder):", error);
    throw new Error(error.message);
  }

  // --- BAIXA DE ESTOQUE AUTOMÁTICA ---
  // Percorre os itens do pedido e chama a função de decrementar estoque
  for (const item of payload.items) {
    try {
        await supabase.rpc('decrement_stock', { 
            product_id: item.id, 
            amount: item.quantity 
        });
    } catch (stockError) {
        console.error("Erro ao baixar estoque do item:", item.name, stockError);
        // Não bloqueamos o pedido se o estoque falhar, mas logamos
    }
  }

  return data;
};

export const fetchAllOrders = async (): Promise<Order[]> => {
  const { data, error } = await supabase
    .from('Orders')
    .select(`
      *,
      Clients ( name, phone, email ),
      Stores ( name, city, address, cnpj ), 
      Employees ( name ),
      Addresses ( * )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Erro fetchAllOrders:", error);
    throw new Error(error.message);
  }
  // @ts-ignore
  return data as unknown as Order[];
};

export const fetchClientOrders = async (clientId: string): Promise<Order[]> => {
  const { data, error } = await supabase
    .from('Orders')
    .select(`
      *,
      Stores ( name, city )
    `)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  // @ts-ignore
  return data as unknown as Order[];
};

export const updateOrderStatus = async (orderId: string, newStatus: string): Promise<void> => {
  const { error } = await supabase
    .from('Orders')
    .update({ status: newStatus })
    .eq('id', orderId);

  if (error) throw new Error(error.message);
};


// ==================================================================
// FUNÇÕES DE API (FAVORITOS)
// ==================================================================

export const checkIsFavorite = async (clientId: string, productId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('Favorites')
    .select('id')
    .eq('client_id', clientId)
    .eq('product_id', productId)
    .maybeSingle();

  if (error) {
    console.error("Erro ao verificar favorito:", error);
    return false;
  }
  return !!data;
};

export const toggleFavorite = async (clientId: string, productId: string): Promise<boolean> => {
  const isFav = await checkIsFavorite(clientId, productId);

  if (isFav) {
    const { error } = await supabase
      .from('Favorites')
      .delete()
      .eq('client_id', clientId)
      .eq('product_id', productId);
      
    if (error) throw new Error(error.message);
    return false; 
  } else {
    const { error } = await supabase
      .from('Favorites')
      .insert({ client_id: clientId, product_id: productId });
      
    if (error) throw new Error(error.message);
    return true; 
  }
};

export const fetchClientFavorites = async (clientId: string): Promise<Product[]> => {
  // @ts-ignore: Ignora erro de profundidade de tipo temporariamente
  const { data, error } = await (supabase
    .from('Favorites')
    .select(`
      product_id,
      Products (
        id, name, description, price, originalPrice, storage, ram, colors, isPromotion, category, images, brand, promotion_end_date, subcategory, quantity, wholesale_price, installment_price, max_installments,
        ProductStores ( Stores ( id, name, whatsapp, city ) )
      )
    `)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false }) as Promise<any>);

  if (error) throw new Error(error.message);

  const products = data.map((item: any) => {
    const product = item.Products;
    if (!product) return null;

    const stores = (product.ProductStores || [])
      .map((ps: any) => ps.Stores)
      .filter((s: any) => s !== null);

    return {
      ...product,
      stores: stores,
      colors: parseArrayData(product.colors),
      images: parseArrayData(product.images),
    } as unknown as Product;
  }).filter(Boolean) as Product[];

  return products;
};

// ==================================================================
// FUNÇÕES DE API (BANNERS)
// ==================================================================

export const fetchAllBannersAdmin = async (): Promise<Banner[]> => {
    const { data, error } = await supabase
        .from('Banners')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data as Banner[];
};

export const createBanner = async (payload: BannerInsertPayload): Promise<void> => {
    const { error } = await supabase
        .from('Banners')
        .insert(payload);
        
    if (error) throw new Error(error.message);
};

export const updateBanner = async (payload: BannerUpdatePayload): Promise<void> => {
    const { id, ...updateData } = payload;
    const { error } = await supabase
        .from('Banners')
        .update(updateData)
        .eq('id', id);
        
    if (error) throw new Error(error.message);
};

export const deleteBanner = async (id: string): Promise<void> => {
    const { error } = await supabase
        .from('Banners')
        .delete()
        .eq('id', id);
        
    if (error) throw new Error(error.message);
};

export const uploadBannerImage = async (file: File): Promise<string> => {
    const fileName = `${uuidv4()}-${file.name}`;
    const { data, error } = await supabase
        .storage
        .from('product-images') 
        .upload(`banners/${fileName}`, file);

    if (error) throw new Error(error.message);
    
    const { data: publicUrlData } = supabase
        .storage
        .from('product-images')
        .getPublicUrl(data.path);
        
    return publicUrlData.publicUrl;
};

export const fetchBanners = async (): Promise<Banner[]> => {
    const { data, error } = await supabase
        .from('Banners')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data as Banner[];
};

// ==================================================================
// FUNÇÕES DE API (GARANTIAS)
// ==================================================================

export const createWarranty = async (payload: WarrantyInsertPayload): Promise<void> => {
    // @ts-ignore
    const { error } = await supabase
        .from('Warranties')
        .insert({
            ...payload,
            purchase_date: payload.purchase_date.toISOString(),
            warranty_end_date: payload.warranty_end_date.toISOString()
        } as any);
        
    if (error) throw new Error(error.message);
};

export const fetchAllWarranties = async (): Promise<Warranty[]> => {
    const { data, error } = await supabase
        .from('Warranties')
        .select(`
            *,
            Clients ( id, name, phone, email ),
            Stores ( * )
        `)
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    
    // @ts-ignore
    return data as any as Warranty[];
};

export const fetchClientWarranties = async (clientId: string): Promise<Warranty[]> => {
    //@ts-ignore
    const { data, error } = await supabase
        .from('Warranties')
        .select(`
            *,
            Stores ( name, address, city )
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    
    // @ts-ignore
    return data as any as Warranty[];
};

// ==================================================================
// FUNÇÕES DE API (CUPONS)
// ==================================================================

export const fetchCoupon = async (code: string): Promise<Coupon | null> => {
    const { data, error } = await supabase
        .from('Coupons')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('active', true)
        .maybeSingle();

    if (error) {
        console.error("Erro ao buscar cupom:", error);
        return null;
    }
    return data as Coupon;
};

export const fetchAllCoupons = async (): Promise<Coupon[]> => {
    const { data, error } = await supabase
        .from('Coupons')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data as Coupon[];
};

export const createCoupon = async (payload: CouponInsertPayload): Promise<void> => {
    const { error } = await supabase
        .from('Coupons')
        .insert({
            ...payload,
            code: payload.code.toUpperCase(),
            valid_until: payload.valid_until ? payload.valid_until.toISOString() : null
        });

    if (error) throw new Error(error.message);
};

export const updateCoupon = async (payload: CouponUpdatePayload): Promise<void> => {
    const { id, ...updateData } = payload;
    const updatePayload = {
        ...updateData,
        code: updateData.code?.toUpperCase(),
        valid_until: updateData.valid_until ? updateData.valid_until.toISOString() : null
    };
    
    const { error } = await supabase
        .from('Coupons')
        .update(updatePayload)
        .eq('id', id);

    if (error) throw new Error(error.message);
};

export const deleteCoupon = async (id: string): Promise<void> => {
    const { error } = await supabase
        .from('Coupons')
        .delete()
        .eq('id', id);

    if (error) throw new Error(error.message);
};

export const toggleCouponStatus = async (id: string, currentStatus: boolean): Promise<void> => {
     const { error } = await supabase
        .from('Coupons')
        .update({ active: !currentStatus })
        .eq('id', id);

    if (error) throw new Error(error.message);
};

// ==================================================================
// FUNÇÕES DE API (CONTROLE DE USO DE CUPOM)
// ==================================================================

export const checkCouponUsage = async (clientId: string, couponId: string): Promise<boolean> => {
    const { data, error } = await supabase
        .from('CouponUsages')
        .select('id')
        .eq('client_id', clientId)
        .eq('coupon_id', couponId)
        .maybeSingle();

    if (error) {
        console.error("Erro ao verificar uso do cupom:", error);
        return false;
    }
    return !!data;
};

export const createCouponUsage = async (clientId: string, couponId: string): Promise<void> => {
    const { error } = await supabase
        .from('CouponUsages')
        .insert({
            client_id: clientId,
            coupon_id: couponId
        });

    if (error) {
        console.error("Erro ao registrar uso do cupom:", error);
    }
};

// ==================================================================
// FUNÇÕES DE PAGAMENTO (STRIPE)
// ==================================================================

export const createPaymentIntent = async (amount: number, storeId: string): Promise<{ clientSecret: string }> => {
  const { data, error } = await supabase.functions.invoke('create-payment-intent', {
    body: { amount, storeId }
  });

  if (error) throw new Error(`Erro pagamento: ${error.message}`);
  if (data?.error) throw new Error(data.error);

  return data; 
};

// ==================================================================
// FUNÇÕES DE API (AGREGADOR DE LINKS) - NOVO
// ==================================================================

export const fetchPublicLinks = async (): Promise<PublicLink[]> => {
    const { data, error } = await supabase
        .from('PublicLinks')
        .select('*')
        .order('created_at', { ascending: true }); 

    if (error) throw new Error(error.message);
    return data as PublicLink[];
};

export const createPublicLink = async (payload: PublicLinkInsertPayload): Promise<void> => {
    const { error } = await supabase
        .from('PublicLinks')
        .insert({ 
            id: uuidv4(), 
            ...payload 
        });

    if (error) throw new Error(error.message);
};

export const updatePublicLink = async (payload: PublicLinkUpdatePayload): Promise<void> => {
    const { id, ...updateData } = payload;
    const { error } = await supabase
        .from('PublicLinks')
        .update(updateData)
        .eq('id', id);

    if (error) throw new Error(error.message);
};

export const deletePublicLink = async (id: string): Promise<void> => {
    const { error } = await supabase
        .from('PublicLinks')
        .delete()
        .eq('id', id);

    if (error) throw new Error(error.message);
};

export const togglePublicLinkStatus = async (id: string, currentStatus: boolean): Promise<void> => {
    const { error } = await supabase
        .from('PublicLinks')
        .update({ active: !currentStatus })
        .eq('id', id);

    if (error) throw new Error(error.message);
};