const { GoogleGenAI } = require("@google/genai");

// A chave é carregada automaticamente pela variável de ambiente do Netlify
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// 1. Definição do Schema de Saída (JSON Mode)
const responseSchema = {
    type: "object",
    properties: {
        description: {
            type: "string",
            description: "Descrição detalhada em Markdown para o cliente.",
        },
        battery_capacity: {
            type: "string",
            nullable: true,
            description: "Ex: 5000 mAh. Null se for acessório.",
        },
        camera_specs: {
            type: "string",
            nullable: true,
            description: "Ex: Principal 50MP. Null se for acessório.",
        },
        processor_model: {
            type: "string",
            nullable: true,
            description: "Ex: Snapdragon 8 Gen 3. Null se for acessório.",
        },
        technical_specs: {
            type: "string",
            nullable: true,
            description:
                "Outras especificações em texto livre em Markdown. Null se for celular.",
        },
    },
    required: ["description"],
};

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
        const { productName, category } = JSON.parse(event.body);

        if (!productName || !category) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: "Parâmetros productName e category são obrigatórios.",
                }),
            };
        }

        const prompt = `Você é um copywriter de e-commerce e especialista em produtos de tecnologia.
                        Gere uma descrição de marketing **VISUALMENTE ATRATIVA** em formato Markdown para o produto: "${productName}", que é da categoria "${category}".
                        
                        DIRETRIZES DE FORMATAÇÃO (Obrigatórias):
                        1. **ESTILO:** Use um tom entusiasta e de vendas.
                        2. **EMOJIS:** Use 3 a 5 EMOJIS relevantes que condizem com o texto (Ex: 🚀, 🔋, 📸, ✨).
                        3. **LISTAS:** Use quebras de linha (enter) antes e depois de títulos e listas. As listas devem ser claras e espaçadas.
                        4. **ESTRUTURA SUGERIDA:**
                            - Título de Marketing
                            - Parágrafo de Abertura.
                            - Título Secundário (## ou ###).
                            - Lista de Características Principais (usando '-' ou '*' e Emojis).
                            - Chamada final para Ação.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.8, // Aumenta a criatividade
            },
        });

        // Retorna o JSON gerado pela IA
        return {
            statusCode: 200,
            body: response.text,
            headers: { "Content-Type": "application/json" },
        };
    } catch (error) {
        console.error("Erro na Edge Function:", error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: "Erro interno da IA.",
                details: error.message,
            }),
            headers: { "Content-Type": "application/json" },
        };
    }
};
