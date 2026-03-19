import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

if (!apiKey || apiKey === 'undefined' || apiKey === 'null') {
  console.error("API key is missing or invalid in environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || 'MISSING_KEY' });

export async function analyzeQuote(quote: string) {
  const generatePromise = ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the following quote for an Instagram post.
    Quote: "${quote}"
    
    1. Determine the emotional "vibe" (e.g., reflective, social, growth, calm).
    2. Create an image generation prompt for a background image that matches this vibe. The subject matter MUST randomly alternate between: 1) subtle, out-of-focus human figures (e.g., a silhouette, someone walking in the distance, hands holding a coffee), 2) open spaces (minimalist architecture, nature, empty rooms), and 3) purely atmospheric abstract scenes. The style MUST be: soft lifestyle photography, warm neutrals (beige, cream, linen), natural light, heavy bokeh/blur. Ensure there is enough negative space, blur, or simplicity in the center so that overlaid text remains readable. NO text, NO logos, NO watermarks, NO bright colors, NO busy patterns.
    3. Identify exactly ONE emotional core word or short phrase from the quote that should be italicized for emphasis. It MUST be an exact substring of the quote.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          vibe: { type: Type.STRING, description: "The emotional vibe" },
          imagePrompt: { type: Type.STRING, description: "The image generation prompt" },
          italicWord: { type: Type.STRING, description: "The exact word or short phrase from the quote to italicize" },
        },
        required: ["vibe", "imagePrompt", "italicWord"],
      },
    },
  });

  // Add a 30-second timeout
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Quote analysis timed out after 30 seconds.")), 30000);
  });

  const response = await Promise.race([generatePromise, timeoutPromise]).catch(err => {
    console.error("Error in analyzeQuote generateContent:", err);
    throw err;
  });

  if (response.promptFeedback?.blockReason) {
    throw new Error(`Quote analysis blocked by safety filters: ${response.promptFeedback.blockReason}`);
  }

  let jsonStr = response.text?.trim() || "{}";
  
  // Remove markdown formatting if present
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }
  
  try {
    return JSON.parse(jsonStr) as { vibe: string; imagePrompt: string; italicWord: string };
  } catch (e) {
    console.error("Failed to parse JSON from Gemini:", jsonStr);
    throw new Error("Invalid format from AI");
  }
}

export async function generateBackgroundImage(prompt: string): Promise<string> {
  const generatePromise = ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: prompt,
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "3:4", // Closest to 4:5
      },
    },
  });

  // Add a 60-second timeout
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Image generation timed out after 60 seconds.")), 60000);
  });

  const response = await Promise.race([generatePromise, timeoutPromise]).catch(err => {
    console.error("Error in generateBackgroundImage generateContent:", err);
    throw err;
  });

  if (response.promptFeedback?.blockReason) {
    throw new Error(`Image generation blocked by safety filters: ${response.promptFeedback.blockReason}`);
  }

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }
  
  throw new Error("Failed to generate image. The AI might have blocked the prompt due to safety filters.");
}
