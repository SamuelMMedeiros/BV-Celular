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
            description:
                "Capacidade da bateria (Ex: 5000 mAh). Null se for acessório.",
        },
        camera_specs: {
            type: "string",
            nullable: true,
            description:
                "Configuração da câmera principal (Ex: 50MP Principal). Null se for acessório.",
        },
        processor_model: {
            type: "string",
            nullable: true,
            description:
                "Nome do processador/chipset (Ex: Snapdragon 8 Gen 3). Null se for acessório.",
        },
        technical_specs: {
            type: "string",
            nullable: true,
            description:
                "Especificações adicionais em Markdown (Ex: material, certificação). Usado primariamente para acessórios. Null se for celular.",
        },
    },
    required: ["description"],
};

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
        const { productName, category } = JSON.parse(event.body);

        if (!productName || !category) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: "Parâmetros productName e category são obrigatórios.",
                }),
            };
        }

        const prompt = `Você é um especialista em produtos de tecnologia para e-commerce. 
                        Gere a descrição e as especificações técnicas no formato JSON para o produto: **${productName}**, que é da categoria **${category}**.
                        
                        Diretrizes:
                        1. Use formatação Markdown (títulos, negrito, listas) na 'description' e nas 'technical_specs'.
                        2. Se a categoria for 'aparelho', preencha battery_capacity, camera_specs e processor_model. Deixe 'technical_specs' como null. 
                        3. Se a categoria for 'acessorio', preencha 'technical_specs' com detalhes (Ex: material, conectividade, peso). Deixe os campos de hardware (battery, camera, processor) como null.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.7,
            },
        });

        // O response.text é a string JSON que o modelo retornou
        return {
            statusCode: 200,
            body: response.text,
        };
    } catch (error) {
        console.error(
            "Erro na Netlify Function (Product Data):",
            error.message
        );
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: "Erro interno da IA ao gerar dados.",
                details: error.message,
            }),
        };
    }
};
