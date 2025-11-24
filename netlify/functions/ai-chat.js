const { GoogleGenAI } = require("@google/genai");
const { fetchSimplifiedProducts } = require("./utils/api-client.cjs");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

exports.handler = async (event) => {
    // Acessa a chave do API de forma segura
    if (!GEMINI_API_KEY) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: "GEMINI_API_KEY não configurada no Netlify.",
            }),
        };
    }
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Método Não Permitido" };
    }

    try {
        const { history } = JSON.parse(event.body);

        if (!Array.isArray(history)) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: "O histórico (history) deve ser um array.",
                }),
            };
        }

        // 1. BUSCA DE PRODUTOS REAIS
        const productList = await fetchSimplifiedProducts();

        const productsJsonString = JSON.stringify(productList, null, 2);
        const hasProducts = productList.length > 0;

        // 2. Definir o prompt do sistema com INSTRUÇÕES RÍGIDAS
        const systemInstruction = `
            Você é o Assistente de Compras da BV Celular.
            
            DIRETRIZES FUNDAMENTAIS:
            1. **CONTEXTO DE PRODUTO:** Sua ÚNICA fonte de conhecimento sobre produtos é o 'PRODUCTS_CATALOG' fornecido abaixo.
            2. **Obrigação:** Se a pergunta do cliente for sobre recomendação, preço, marca ou especificação, você **DEVE** (MUST) USAR SOMENTE OS DADOS DESSE CATÁLOGO.
            3. **RESPOSTA A PRODUTOS:** NUNCA responda que não há produtos, a menos que o 'PRODUCTS_CATALOG' esteja vazio OU você não encontre correspondências.
            4. **Formato:** Apresente os resultados de forma amigável, listando 'Nome (Marca)', 'Preço (R$ X.XX)' e 'Especificações principais'.

            ${
                !hasProducts
                    ? `AVISO CRÍTICO: O catálogo de produtos está vazio. Responda educadamente: "Desculpe, não temos produtos disponíveis no momento para recomendação."`
                    : `
                ### PRODUCTS_CATALOG (CATÁLOGO DE PRODUTOS VÁLIDOS)
                ${productsJsonString}
                `
            }
        `;

        // 3. Mapear o histórico e gerar a resposta
        const contents = history.map((msg) => ({
            role: msg.sender === "user" ? "user" : "model",
            parts: [{ text: msg.text }],
        }));

        // Se o catálogo estiver vazio, força a resposta padrão sem consumir tokens desnecessariamente.
        if (!hasProducts) {
            return {
                statusCode: 200,
                body: JSON.stringify({
                    response:
                        "Desculpe, não temos produtos disponíveis no momento para recomendação.",
                }),
            };
        }

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.5,
            },
        });

        // 4. Retorna a resposta (texto puro)
        return {
            statusCode: 200,
            body: JSON.stringify({ response: response.text }),
        };
    } catch (error) {
        console.error("Erro na Netlify Function (Chat):", error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: "Erro interno da IA do Chat. Verifique o log.",
            }),
        };
    }
};
