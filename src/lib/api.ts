/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
//
// === CÓDIGO COMPLETO FINAL PARA: src/lib/api.ts ===
//
import { supabase } from "@/integrations/supabase/client";
import { Product, Store, Employee } from "@/types";
import { Database } from "@/integrations/supabase/types";
import { v4 as uuidv4 } from 'uuid';

// --- Tipos de Payload (Produtos) ---
export type ProductInsertPayload = Database['public']['Tables']['Products']['Insert'] & {
  store_ids: string[];
  image_files: File[];
};

export type ProductUpdatePayload = Omit<ProductInsertPayload, 'image_files'> & {
  id: string;
  image_files?: File[];
  images_to_delete?: string[];
};

// --- Tipos de Payload (Lojas) ---
export type StoreInsertPayload = Database['public']['Tables']['Stores']['Insert'];
export type StoreUpdatePayload = Database['public']['Tables']['Stores']['Update'] & {
  id: string;
};

// --- Tipos de Payload (Funcionários) ---
export type EmployeeInsertPayload = Database['public']['Tables']['Employees']['Insert'];
export type EmployeeUpdatePayload = Database['public']['Tables']['Employees']['Update'] & {
  id: string;
};


// ==================================================================
// FUNÇÕES DE API (PRODUTOS)
// ==================================================================

// Helper para "limpar" dados de array que vêm do Supabase
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
  return []; // Retorna vazio se for null ou outro tipo
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

// Helper para extrair nome do arquivo da URL do Supabase
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
  
  // ----- 1. Deletar imagens marcadas para exclusão -----
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

  // ----- 2. Fazer upload de novas imagens (se houver) -----
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
  
  // ----- 3. Preparar Dados do Produto para Update -----
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

  // ----- 4. Atualizar o Produto no Banco -----
  const { error: productError } = await supabase
    .from('Products')
    .update(productData)
    .eq('id', payload.id);
  if (productError) throw new Error(productError.message);
  
  // ----- 5. Atualizar Relações Produto-Lojas -----
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
// FUNÇÕES DE API (FUNCIONÁRIOS)
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

// CORRIGIDO (Resolve o erro de importação)
export const fetchEmployeeProfile = async (userId: string): Promise<Employee | null> => {
  const { data, error } = await supabase
    .from('Employees')
    .select(`
      id,
      name,
      email,
      store_id,
      Stores ( id, name )
    `)
    .eq('id', userId)
    .single();
  if (error) {
    if (error.code === 'PGRST116') {
      return null; 
    }
    throw new Error(error.message);
  }
  return data as Employee;
};

export const createEmployee = async (payload: EmployeeInsertPayload) => {
  const { error } = await supabase
    .from('Employees')
    .insert(payload);
  if (error) throw new Error(error.message);
};
export const updateEmployee = async (payload: EmployeeUpdatePayload) => {
  const { id, ...updateData } = payload;
  if (!id) throw new Error("ID da loja é obrigatório para atualizar.");
  const { error } = await supabase
    .from('Employees')
    .update(updateData)
    .eq('id', id);
  if (error) throw new Error(error.message);
};
export const deleteEmployee = async (employeeId: string) => {
  if (!employeeId) throw new Error("ID do funcionário não encontrado.");
  const { error } = await supabase
    .from('Employees')
    .delete()
    .eq('id', employeeId);
  if (error) throw new Error(error.message);
};