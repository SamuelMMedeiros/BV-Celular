/**
 * @title netlify/functions/ai-chat.js (CORRIGIDO)
 * @collapsible
 */
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

        // 1. BUSCA DE PRODUTOS REAIS (E SIMPLIFICADOS)
        const productList = await fetchSimplifiedProducts();

        const productsJsonString = JSON.stringify(productList, null, 2);

        // 2. Definir o prompt do sistema com INSTRUÇÕES RÍGIDAS
        const systemInstruction = `
            Você é o Assistente de Compras da BV Celular. 
            Sua única fonte de conhecimento sobre produtos é o catálogo JSON fornecido abaixo.
            
            DIRETRIZES ESSENCIAIS:
            1. **PRIORIDADE MÁXIMA:** Se a pergunta do cliente for sobre recomendação, especificações, preço, ou disponibilidade, você **DEVE** usar o 'PRODUCTS_CATALOG' para responder. Nunca invente dados.
            2. **Foco:** Responda apenas com opções do catálogo se houverem correspondências claras.
            3. **Apresentação:** Apresente as recomendações de forma clara, mencionando 'name', 'brand', 'price_reais' (como R$ X.XX), e as especificações relevantes (RAM, Storage, etc.).
            4. **Link:** Inclua a URL do produto na recomendação, como: [NOME DO PRODUTO](/produto/ID).
            5. **Não Mencione o JSON:** Nunca diga que você está lendo uma lista JSON ou que está lendo um banco de dados.

            ### PRODUCTS_CATALOG (Catálogo de Produtos Disponíveis)
            ${productsJsonString}
        `;

        // 3. Mapear o histórico e gerar a resposta
        const contents = history.map((msg) => ({
            role: msg.sender === "user" ? "user" : "model",
            parts: [{ text: msg.text }],
        }));

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
