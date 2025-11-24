/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck
import { GoogleGenAI } from "@google/genai";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// Variável de ambiente configurada no Supabase ou no .env local
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY não está configurada nas variáveis de ambiente.");
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// 1. Definição do Schema de Saída (JSON Mode)
const responseSchema = {
    type: "object",
    properties: {
        description: { type: "string", description: "Descrição detalhada em Markdown para o cliente." },
        battery_capacity: { type: "string", nullable: true, description: "Capacidade da bateria (Ex: 5000 mAh). Null se for acessório." },
        camera_specs: { type: "string", nullable: true, description: "Configuração da câmera principal (Ex: 50MP Principal). Null se for acessório." },
        processor_model: { type: "string", nullable: true, description: "Nome do processador/chipset (Ex: Snapdragon 8 Gen 3). Null se for acessório." },
        technical_specs: { type: "string", nullable: true, description: "Especificações adicionais em Markdown (Ex: material, certificação). Usado primariamente para acessórios. Null se for celular." }
    },
    required: ["description"]
};

serve(async (req) => {
    try {
        const { productName, category } = await req.json();

        if (!productName || !category) {
            return new Response(JSON.stringify({ error: "Parâmetros productName e category são obrigatórios." }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        const prompt = `Você é um especialista em e-commerce de eletrônicos. 
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
                // Aumenta a temperatura para ser mais criativo na descrição
                temperature: 0.7, 
            },
        });
        
        // O response.text já é a string JSON garantida pelo responseMimeType
        return new Response(response.text, {
            status: 200,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });

    } catch (error) {
        console.error("Erro na Edge Function:", error.message);
        return new Response(JSON.stringify({ error: "Erro interno da IA.", details: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
    }
});