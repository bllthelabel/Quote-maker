import { GoogleGenAI, Type } from "@google/genai";

export async function analyzeQuote(quote: string, retries = 2) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  
  if (!apiKey || apiKey === 'undefined' || apiKey === 'null') {
    throw new Error("API key not valid. Please check your AI Studio settings.");
  }

  const ai = new GoogleGenAI({ apiKey });

  let lastError: any;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
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

      // Add a 20-second timeout per attempt
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("TIMEOUT")), 20000);
      });

      const response = await Promise.race([generatePromise, timeoutPromise]);

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
    } catch (err: any) {
      lastError = err;
      console.error(`Attempt ${attempt + 1} failed:`, err.message);
      
      // If it's a hard error (like invalid API key or safety block), don't retry
      if (err.message !== "TIMEOUT" && !err.message.includes("fetch failed") && !err.message.includes("network") && !err.message.includes("503")) {
        throw err;
      }
      
      if (attempt === retries) {
        throw new Error("Quote analysis timed out or failed after multiple attempts. Please try again.");
      }
      
      // Wait a short moment before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  throw lastError;
}
