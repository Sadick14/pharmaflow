import { GoogleGenAI } from "@google/genai";
import { InventoryItem } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const geminiService = {
  /**
   * Analyzes inventory to find low stock, expired items, and trends.
   */
  analyzeInventory: async (inventory: InventoryItem[]) => {
    if (!apiKey) return "API Key is missing. Cannot perform AI analysis.";

    const inventorySummary = inventory.map(item => 
      `${item.name} (Generic: ${item.genericName}): Qty ${item.quantity} ${item.unit}, Min ${item.minStockLevel}, Exp ${item.expiryDate}`
    ).join('\n');

    const prompt = `
      You are an expert pharmacy inventory manager. Analyze the following inventory list.
      
      Inventory List:
      ${inventorySummary}
      
      Please provide a concise report in Markdown format covering:
      1. **Critical Stock Alerts**: Items below minimum stock level.
      2. **Expiration Risks**: Items expired or expiring within the next 3 months.
      3. **Restock Recommendations**: What should be ordered immediately.
      4. **General Health**: A one-sentence summary of the inventory status.
      
      Keep it professional and actionable.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return response.text;
    } catch (error) {
      console.error("Gemini Analysis Error:", error);
      return "Failed to analyze inventory. Please try again later.";
    }
  },

  /**
   * Chat with the assistant about drug interactions or general pharmacy questions.
   */
  chatWithPharmacist: async (history: { role: 'user' | 'model', text: string }[], message: string) => {
    if (!apiKey) return "API Key is missing.";

    try {
      const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: "You are a helpful, knowledgeable AI Pharmacist Assistant. You help with drug interactions, side effects, and inventory management advice. Always include a disclaimer that you are an AI and not a substitute for professional medical advice when discussing treatments.",
        },
        history: history.map(h => ({
            role: h.role,
            parts: [{ text: h.text }]
        }))
      });

      const response = await chat.sendMessage({ message });
      return response.text;
    } catch (error) {
        console.error("Gemini Chat Error:", error);
        return "I encountered an error processing your request.";
    }
  }
};
