const { GoogleGenAI } = require("@google/genai");

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

        // 1. Mapear o histórico para o formato da API Gemini (roles 'user' e 'model')
        const contents = history.map((msg) => ({
            role: msg.sender === "user" ? "user" : "model",
            parts: [{ text: msg.text }],
        }));

        // 2. Definir o prompt do sistema para o contexto da conversa
        const systemInstruction = `Você é o Assistente de Compras da BV Celular. Seu objetivo é ajudar o cliente a escolher o melhor celular ou acessório. Seja amigável, conciso e útil. Mantenha o contexto de e-commerce de tecnologia.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: contents, // Envia o histórico
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.5,
            },
        });

        // 3. Retorna a resposta (texto puro)
        return {
            statusCode: 200,
            body: JSON.stringify({ response: response.text }),
        };
    } catch (error) {
        console.error("Erro na Netlify Function (Chat):", error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: "Erro interno da IA do Chat.",
                details: error.message,
            }),
        };
    }
};
