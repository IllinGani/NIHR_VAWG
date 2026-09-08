import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getWPSummary(wp: string, tickets: any[]) {
  // Filter by WP number (e.g., '1' for WP1)
  const wpNum = wp.replace('WP', '');
  const wpTickets = tickets.filter(t => t.no.startsWith(wpNum));
  
  if (wpTickets.length === 0) return "No active tasks for this work package.";

  const prompt = `
    Based on the following tasks for Work Package ${wp}, provide a concise summary (3-4 bullets max):
    Tasks: ${JSON.stringify(wpTickets)}
    
    Include:
    - Overall progress
    - Key upcoming tasks
    - Potential risks or blockers
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "Unable to generate summary.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating AI summary.";
  }
}

export async function getAnalyticsInsights(data: any[]) {
  const prompt = `
    Analyze the following social media ad performance data for a research survey:
    Data: ${JSON.stringify(data)}
    
    Provide:
    1. Best performing platform (and why)
    2. Worst performing platform
    3. One strategic recommendation to improve conversion rate or cost per completion.
    
    Keep it professional and concise.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "Unable to generate insights.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating AI insights.";
  }
}
