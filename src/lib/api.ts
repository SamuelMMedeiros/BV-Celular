/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/integrations/supabase/client";
import { Product, Store, Employee, CustomerProfile, OrderCartItem, Order, Banner, WarrantyPayload } from "@/types";
import { Database } from "@/integrations/supabase/types";
import { v4 as uuidv4 } from 'uuid';

export type ProductInsertPayload = Database['public']['Tables']['Products']['Insert'] & {
  store_ids?: string[]; 
  image_files: File[];
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
};


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
      id, name, description, price, originalPrice, storage, ram, colors, isPromotion, category, images,
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

export const fetchPromotions = async (params: { q?: string } = {}): Promise<Product[]> => {
  let query = supabase
    .from('Products')
    .select(`
      id, name, description, price, originalPrice, storage, ram, colors, isPromotion, category, images,
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
  console.log("Iniciando fetchAllProducts..."); 
  
  try {
    let query = supabase
      .from('Products')
      .select(`
        id, name, description, price, originalPrice, storage, ram, colors, isPromotion, category, images,
        ProductStores (
          Stores (
            id, name, whatsapp, city
          )
        )
      `)
      .order('created_at', { ascending: false }); 

    const { data: rawProducts, error } = await query;
    
    if (error) {
      console.error("Erro no fetchAllProducts (Supabase):", error); 
      throw new Error(error.message);
    }
    
    if (!rawProducts) {
        console.warn("fetchAllProducts retornou dados vazios/nulos.");
        return [];
    }

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
    
    console.log("fetchAllProducts sucesso. Itens:", products.length); 
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
      id, name, description, price, originalPrice, storage, ram, colors, isPromotion, category, images,
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
  const productData: Database['public']['Tables']['Products']['Insert'] = {
    name: payload.name,
    description: payload.description,
    price: payload.price,
    originalPrice: payload.originalPrice,
    storage: payload.storage,
    ram: payload.ram,
    colors: payload.colors || [],
    isPromotion: payload.isPromotion,
    category: payload.category,
    images: imageUrls,
  };
  const { data: newProduct, error: productError } = await supabase
    .from('Products')
    .insert(productData)
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
  
  const productData: Database['public']['Tables']['Products']['Update'] = {
    name: payload.name,
    description: payload.description,
    price: payload.price,
    originalPrice: payload.originalPrice,
    storage: payload.storage,
    ram: payload.ram,
    colors: payload.colors || [],
    isPromotion: payload.isPromotion,
    category: payload.category,
    images: finalImageUrls,
  };

  const { error: productError } = await supabase
    .from('Products')
    .update(productData)
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
  if (!id) throw new Error("ID da loja é obrigatório para atualizar.");
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
// FUNÇÕES DE API (PEDIDOS/ORÇAMENTOS)
// ==================================================================

export const createOrder = async (payload: OrderInsertPayload): Promise<Database['public']['Tables']['Orders']['Row']> => {
  const orderData: Database['public']['Tables']['Orders']['Insert'] = {
    client_id: payload.client_id,
    store_id: payload.store_id,
    total_price: payload.total_price,
    items: payload.items, 
    status: payload.status || 'pending'
  };

  const { data, error } = await supabase
    .from('Orders')
    .insert(orderData)
    .select() 
    .single();

  if (error) {
    console.error("Erro ao criar pedido (createOrder):", error);
    throw new Error(error.message);
  }

  return data;
};

export const fetchAllOrders = async (): Promise<Order[]> => {
  const { data, error } = await supabase
    .from('Orders')
    .select(`
      *,
      Clients ( name, phone, email ),
      Stores ( name, city )
    `)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data as Order[];
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
  return data as Order[];
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
  const { data, error } = await supabase
    .from('Favorites')
    .select(`
      product_id,
      Products (
        id, name, description, price, originalPrice, storage, ram, colors, isPromotion, category, images,
        ProductStores ( Stores ( id, name, whatsapp, city ) )
      )
    `)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

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
// FUNÇÕES DE API (BANNERS) - NOVAS
// ==================================================================

export const fetchBanners = async (): Promise<Banner[]> => {
    const { data, error } = await supabase
        .from('Banners')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data as Banner[];
};

export const createWarranty = async (payload: WarrantyPayload): Promise<void> => {
    const { error } = await supabase
        .from('Warranties')
        .insert(payload);
        
    if (error) throw new Error(error.message);
};