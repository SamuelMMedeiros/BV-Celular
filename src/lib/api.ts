//
// === CÓDIGO COMPLETO PARA: src/lib/api.ts ===
//
import { supabase } from "@/integrations/supabase/client";
import { Product, Store, Employee } from "@/types"; // 1. Importar Employee
import { Database } from "@/integrations/supabase/types";
import { v4 as uuidv4 } from 'uuid';

// --- Tipos de Payload (Produtos) ---
export type ProductInsertPayload = Database['public']['Tables']['Products']['Insert'] & {
  store_ids: string[];
  image_files: FileList;
};
export type ProductUpdatePayload = Omit<ProductInsertPayload, 'image_files'> & {
  id: string;
  current_images: string[] | null | undefined;
  image_files?: FileList;
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

export const fetchProducts = async (params: { q?: string } = {}): Promise<Product[]> => {
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
    .eq('category', 'aparelho')
    .eq('isPromotion', false);

  if (params.q && params.q.length > 0) {
    query = query.ilike('name', `%${params.q}%`);
  }

  const { data: rawProducts, error } = await query;

  if (error) {
    console.error("Erro ao buscar produtos no Supabase:", error);
    throw new Error(error.message);
  }

  const products = rawProducts.map(product => {
    const stores: Store[] = product.ProductStores
      .map((ps: any) => ps.Stores)
      .filter((store: any): store is Store => store !== null); 
    
    return {
      ...product,
      stores: stores,
    } as Product;
  });

  return products;
};

export const fetchPromotions = async (): Promise<Product[]> => {
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

  const { data: rawProducts, error } = await query;

  if (error) {
    console.error("Erro ao buscar promoções no Supabase:", error);
    throw new Error(error.message);
  }

  const products = rawProducts.map(product => {
    const stores: Store[] = product.ProductStores
      .map((ps: any) => ps.Stores)
      .filter((store: any): store is Store => store !== null); 
    
    return {
      ...product,
      stores: stores,
    } as Product;
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

  if (error) {
    console.error("Erro ao buscar TODOS os produtos no Supabase:", error);
    throw new Error(error.message);
  }

  const products = rawProducts.map(product => {
    const stores: Store[] = product.ProductStores
      .map((ps: any) => ps.Stores)
      .filter((store: any): store is Store => store !== null); 
    
    return {
      ...product,
      stores: stores,
    } as Product;
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
    .eq('id', productId) // Filtro: Pelo ID
    .single(); // Espera um resultado único

  if (error) {
    console.error("Erro ao buscar produto por ID:", error);
    throw new Error(error.message);
  }
  
  if (!rawProduct) {
    throw new Error("Produto não encontrado");
  }

  // Mesma lógica de transformação
  const stores: Store[] = rawProduct.ProductStores
    .map((ps: any) => ps.Stores)
    .filter((store: any): store is Store => store !== null); 
  
  const product = {
    ...rawProduct,
    stores: stores,
  } as Product;

  return product;
};

export const createProduct = async (payload: ProductInsertPayload): Promise<void> => {
  
  // ----- 1. Upload de Imagens -----
  const imageUrls: string[] = [];
  if (payload.image_files && payload.image_files.length > 0) {
    for (const file of Array.from(payload.image_files)) {
      const fileName = `${uuidv4()}-${file.name}`;
      
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('product-images') // Nome do seu Bucket de Storage
        .upload(fileName, file);

      if (uploadError) {
        console.error("Erro no upload da imagem:", uploadError);
        throw new Error(uploadError.message);
      }

      const { data: publicUrlData } = supabase
        .storage
        .from('product-images')
        .getPublicUrl(uploadData.path);
      
      imageUrls.push(publicUrlData.publicUrl);
    }
  }

  // ----- 2. Preparar Dados do Produto -----
  const productData: Database['public']['Tables']['Products']['Insert'] = {
    name: payload.name,
    description: payload.description,
    price: payload.price,
    originalPrice: payload.originalPrice,
    storage: payload.storage,
    ram: payload.ram,
    colors: payload.colors,
    isPromotion: payload.isPromotion,
    category: payload.category,
    images: imageUrls, // Salva o array de URLs
  };

  // ----- 3. Inserir o Produto no Banco -----
  const { data: newProduct, error: productError } = await supabase
    .from('Products')
    .insert(productData)
    .select('id') // Pega o ID do produto recém-criado
    .single(); // Espera apenas um resultado

  if (productError) {
    console.error("Erro ao criar produto:", productError);
    throw new Error(productError.message);
  }

  const newProductId = newProduct.id;

  // ----- 4. Ligar Produto às Lojas (Tabela de Junção) -----
  if (payload.store_ids && payload.store_ids.length > 0) {
    const productStoreRelations = payload.store_ids.map(storeId => ({
      product_id: newProductId,
      store_id: storeId,
    }));

    const { error: relationError } = await supabase
      .from('ProductStores')
      .insert(productStoreRelations);

    if (relationError) {
      console.error("Erro ao ligar produto às lojas:", relationError);
      throw new Error(relationError.message);
    }
  }
};

export const updateProduct = async (payload: ProductUpdatePayload): Promise<void> => {
  
  let newImageUrls: string[] | undefined = undefined;

  // ----- 1. Lidar com Imagens (Se novas imagens foram enviadas) -----
  if (payload.image_files && payload.image_files.length > 0) {
    newImageUrls = []; // Inicializa o array

    // A. Fazer upload das novas imagens
    for (const file of Array.from(payload.image_files)) {
      const fileName = `${uuidv4()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('product-images')
        .upload(fileName, file);

      if (uploadError) {
        console.error("Erro no upload de novas imagens:", uploadError);
        throw new Error(uploadError.message);
      }
      
      const { data: publicUrlData } = supabase
        .storage
        .from('product-images')
        .getPublicUrl(uploadData.path);
      newImageUrls.push(publicUrlData.publicUrl);
    }

    // B. Deletar as imagens antigas do Storage
    if (payload.current_images && payload.current_images.length > 0) {
      const oldFileNames = payload.current_images.map(url => {
        const parts = url.split('product-images/');
        return parts[parts.length - 1];
      });
      
      await supabase
        .storage
        .from('product-images')
        .remove(oldFileNames);
      // Não tratamos o erro aqui para não interromper o fluxo
    }
  }
  
  // ----- 2. Preparar Dados do Produto para Update -----
  const productData: Database['public']['Tables']['Products']['Update'] = {
    name: payload.name,
    description: payload.description,
    price: payload.price,
    originalPrice: payload.originalPrice,
    storage: payload.storage,
    ram: payload.ram,
    colors: payload.colors,
    isPromotion: payload.isPromotion,
    category: payload.category,
    images: newImageUrls,
  };

  // ----- 3. Atualizar o Produto no Banco -----
  const { error: productError } = await supabase
    .from('Products')
    .update(productData)
    .eq('id', payload.id);

  if (productError) {
    console.error("Erro ao atualizar produto:", productError);
    throw new Error(productError.message);
  }

  // ----- 4. Atualizar Relações Produto-Lojas (Modo Simples: Deleta todas e Recria) -----
  
  // A. Deleta todas as relações existentes para este produto
  const { error: deleteRelationError } = await supabase
    .from('ProductStores')
    .delete()
    .eq('product_id', payload.id);

  if (deleteRelationError) {
    console.error("Erro ao limpar relações antigas:", deleteRelationError);
    throw new Error(deleteRelationError.message);
  }

  // B. Recria as relações com base no formulário
  if (payload.store_ids && payload.store_ids.length > 0) {
    const productStoreRelations = payload.store_ids.map(storeId => ({
      product_id: payload.id,
      store_id: storeId,
    }));

    const { error: insertRelationError } = await supabase
      .from('ProductStores')
      .insert(productStoreRelations);

    if (insertRelationError) {
      console.error("Erro ao recriar relações do produto:", insertRelationError);
      throw new Error(insertRelationError.message);
    }
  }
};

export const deleteProduct = async (product: Product): Promise<void> => {
  if (!product.id) throw new Error("ID do produto não encontrado.");

  // 1. Deletar relações da tabela de junção 'ProductStores'
  const { error: relationError } = await supabase
    .from('ProductStores')
    .delete()
    .eq('product_id', product.id);

  if (relationError) {
    console.error("Erro ao deletar relações do produto:", relationError);
    throw new Error(relationError.message);
  }

  // 2. Deletar o produto da tabela 'Products'
  const { error: productError } = await supabase
    .from('Products')
    .delete()
    .eq('id', product.id);

  if (productError) {
    console.error("Erro ao deletar produto:", productError);
    throw new Error(productError.message);
  }

  // 3. Deletar imagens do Storage (se houver)
  if (product.images && product.images.length > 0) {
    const fileNames = product.images.map(url => {
      const parts = url.split('product-images/');
      return parts[parts.length - 1];
    });
    
    const { error: storageError } = await supabase
      .storage
      .from('product-images')
      .remove(fileNames);

    if (storageError) {
      console.warn("Produto deletado, mas falha ao limpar imagens do Storage:", storageError);
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
  if (error) {
    console.error("Erro ao buscar lojas:", error);
    throw new Error(error.message);
  }
  return data as Store[];
};

export const createStore = async (payload: StoreInsertPayload) => {
  const { error } = await supabase
    .from('Stores')
    .insert(payload);
  
  if (error) {
    console.error("Erro ao criar loja:", error);
    throw new Error(error.message);
  }
};

export const updateStore = async (payload: StoreUpdatePayload) => {
  const { id, ...updateData } = payload;
  if (!id) throw new Error("ID da loja é obrigatório para atualizar.");

  const { error } = await supabase
    .from('Stores')
    .update(updateData)
    .eq('id', id);

  if (error) {
    console.error("Erro ao atualizar loja:", error);
    throw new Error(error.message);
  }
};

export const deleteStore = async (storeId: string) => {
  if (!storeId) throw new Error("ID da loja não encontrado.");

  // 1. Deletar relações na tabela de junção 'ProductStores'
  const { error: relationError } = await supabase
    .from('ProductStores')
    .delete()
    .eq('store_id', storeId);
  
  if (relationError) {
    console.error("Erro ao deletar relações da loja:", relationError);
    throw new Error(relationError.message);
  }
  
  // 2. Deletar a loja
  const { error: storeError } = await supabase
    .from('Stores')
    .delete()
    .eq('id', storeId);

  if (storeError) {
    console.error("Erro ao deletar loja:", storeError);
    throw new Error(storeError.message);
  }
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
  
  if (error) {
    console.error("Erro ao buscar funcionários:", error);
    throw new Error(error.message);
  }
  return data as Employee[];
};

// ==================================================================
// ESTA É A NOVA FUNÇÃO
// ==================================================================
/**
 * [AUTH] Busca o perfil de um funcionário pelo seu ID de autenticação.
 */
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
    .eq('id', userId) // Busca pelo ID (que deve ser o mesmo do auth.users)
    .single();

  if (error) {
    // Se 'single()' não encontrar nada, ele dá um erro 'PGRST116'
    if (error.code === 'PGRST116') {
      return null; // Usuário autenticado, mas sem perfil na tabela Employees
    }
    console.error("Erro ao buscar perfil do funcionário:", error);
    throw new Error(error.message);
  }
  return data as Employee;
};
// ==================================================================

export const createEmployee = async (payload: EmployeeInsertPayload) => {
  const { error } = await supabase
    .from('Employees')
    .insert(payload);
  
  if (error) {
    console.error("Erro ao criar funcionário:", error);
    if (error.code === '23505') { 
      throw new Error("Este e-mail já está em uso.");
    }
    throw new Error(error.message);
  }
};

export const updateEmployee = async (payload: EmployeeUpdatePayload) => {
  const { id, ...updateData } = payload;
  if (!id) throw new Error("ID do funcionário é obrigatório para atualizar.");

  const { error } = await supabase
    .from('Employees')
    .update(updateData)
    .eq('id', id);

  if (error) {
    console.error("Erro ao atualizar funcionário:", error);
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

  if (error) {
    console.error("Erro ao deletar funcionário:", error);
    throw new Error(error.message);
  }
};