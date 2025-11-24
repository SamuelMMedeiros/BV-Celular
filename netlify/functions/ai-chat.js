const { GoogleGenAI } = require("@google/genai");
const { fetchSimplifiedProducts } = require("./utils/api-client.cjs"); // NOVO: Importa o módulo de API

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

exports.handler = async (event) => {
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

        // 2. Definir o prompt do sistema para o contexto da conversa, INJETANDO OS DADOS
        const systemInstruction = `
            Você é o Assistente de Compras da BV Celular. 
            Seu objetivo é ajudar o cliente a escolher o melhor produto. 
            
            DIRETRIZES ESSENCIAIS:
            1. **Prioridade em Dados Internos:** SEMPRE use a lista de produtos fornecida abaixo para fazer recomendações.
            2. **Não Mencione a Fonte:** Não diga que as informações vieram de uma lista, banco de dados ou inventário.
            3. **Seja Consultivo:** Sugira produtos específicos com base nas perguntas do cliente (ex: "Qual celular para jogos?").
            4. **Formatação Simples:** Mantenha as respostas amigáveis e não gere Markdown.
            
            ### PRODUTOS DISPONÍVEIS
            ${productsJsonString}
        `;

        // 3. Mapear o histórico para o formato da API Gemini (roles 'user' e 'model')
        const contents = history.map((msg) => ({
            role: msg.sender === "user" ? "user" : "model",
            parts: [{ text: msg.text }],
        }));

        // 4. Gera a resposta usando o histórico e as instruções do sistema
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: contents, // Envia o histórico
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.5,
            },
        });

        // Retorna a resposta (texto puro)
        return {
            statusCode: 200,
            body: JSON.stringify({ response: response.text }),
        };
    } catch (error) {
        console.error("Erro na Netlify Function (Chat):", error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: "Erro interno da IA do Chat. Verifique se o SUPABASE_SERVICE_KEY está configurado.",
            }),
        };
    }
};
