const { createClient } = require("@supabase/supabase-js");

// As variáveis de ambiente devem ser configuradas no Netlify!
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Chave com privilégios de leitura (Service Role Key)

if (!supabaseUrl || !supabaseKey) {
    throw new Error("Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_KEY são necessárias para o backend.");
}

// Inicializa o cliente Supabase com a Chave de Serviço (Service Role Key)
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Busca uma lista simplificada de todos os produtos ativos para a IA.
 * @returns {Promise<Array<Object>>} Lista simplificada de produtos.
 */
async function fetchSimplifiedProducts() {
    const { data: rawProducts, error } = await supabase
        .from('Products')
        .select(`
            id,
            name,
            description,
            price,
            category,
            brand,
            storage,
            ram,
            colors
        `)
        .eq('active', true) // Filtra apenas produtos ativos
        .limit(50); // Limita para evitar sobrecarga na IA

    if (error) {
        console.error("Erro ao buscar produtos para a IA:", error);
        return [];
    }
    
    // --- DEBUG: EXIBE A CONTAGEM NO LOG DO NETLIFY ---
    console.log(`[AI-CHAT DEBUG] Produtos encontrados: ${rawProducts.length}`);
    // -------------------------------------------------

    // Formata o array de cores e o preço para um formato simples
    return rawProducts.map(p => ({
        name: p.name, 
        url: `/produto/${p.id}`,
        description_curta: p.description ? p.description.substring(0, 70) + '...' : 'Sem descrição.',
        price_reais: (p.price / 100).toFixed(2), // Garante 2 casas decimais
        category: p.category,
        brand: p.brand,
        storage: p.storage,
        ram: p.ram,
        // Converte o array de cores para string
        cores: p.colors && Array.isArray(p.colors) ? p.colors.join(', ') : 'N/A',
    }));
}

module.exports = {
    fetchSimplifiedProducts,
};