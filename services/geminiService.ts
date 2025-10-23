import { GoogleGenAI } from "@google/genai";
import { RESUME_DATA } from '../constants';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const generateChatResponse = async (userQuery: string): Promise<string> => {
  const systemInstruction = `You are a helpful AI assistant embedded in a command prompt on a portfolio website for Moshe Haim Makias, a full-stack developer. Your ONLY source of information is the JSON object provided below. Answer questions about Moshe's professional background based strictly on this data. Do not invent, assume, or retrieve any external information. If a question is outside the scope of this data (e.g., personal life, opinions), politely state that you can only answer questions about Moshe's professional experience. Format your answers concisely as if in a real command prompt.

--- RESUME DATA ---
${JSON.stringify(RESUME_DATA, null, 2)}
--- END RESUME DATA ---
`;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: userQuery,
        config: {
            systemInstruction: systemInstruction,
        }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API error:", error);
    return "Error: Could not connect to assistant. Please check the API key and try again.";
  }
};