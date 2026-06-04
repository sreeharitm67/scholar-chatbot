import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Enable large JSON payload parsing to handle base64 files
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Lazy initializer for Google Gen AI to prevent crashes if key is missing on startup
let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined. Please configure a secret in the Secrets panel.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// ----------------------------------------------------
// AI Backend Routes
// ----------------------------------------------------

// Endpoint for Lecture Tab
app.post("/api/lecture", async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { content, file, persona } = req.body;
    
    const parts: any[] = [];
    if (file && file.data && file.mimeType) {
      let base64Data = file.data;
      if (base64Data.includes("base64,")) {
        base64Data = base64Data.split("base64,")[1];
      }
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: file.mimeType,
        },
      });
    }
    if (content && content.trim() !== "") {
      parts.push({ text: `Context/Prompts specified by the user: ${content}` });
    }

    if (parts.length === 0) {
      res.status(400).json({ error: "Please provide either document context/images or text content to generate the lecture." });
      return;
    }

    // Persona-specific tone instructions
    let personaTone = "Deep Dive";
    if (persona === "simple") {
      personaTone = "Simple (broken down into plain English with relatable real-world analogies, perfect for beginners)";
    } else if (persona === "fast") {
      personaTone = "Fast Track (high-density, accelerated outline focusing on core formulas, syntax, or concepts for rapid assimilation)";
    } else {
      personaTone = "Deep Dive (comprehensive synthesis with exhaustive background context, mechanisms, and thorough breakdowns)";
    }

    const ai = getGeminiClient();
    const systemInstruction = `You are a friendly and clear Universal Academic Expert teaching persona inside Scholar Chatbot.
Strictly omit any region-specific or SCERT limitations (No SCERT).
The teaching persona tone style is: ${personaTone}.
You MUST generate explanations in extremely simple, friendly, clear, and everyday language instead of using heavy academic jargon.
You MUST format the "explanation" property using beautiful and clean Markdown styling.

Malayalam language logic:
By default, write your explanation in natural, simple, and friendly everyday English (designed to be read aloud beautifully).
HOWEVER, if the user's input/context content contains Malayalam characters/script, or their prompt/request is itself written in Malayalam, or they ask for explanations/answers in Malayalam, then you MUST translate, explain, and write back the entire moduleTitle, explanation, and keyTakeaway in simple, natural, and expressive Malayalam. Keep the structural content/layout mapping identical.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            moduleTitle: {
              type: Type.STRING,
              description: "Concise and academic title of this specific lecture module."
            },
            explanation: {
              type: Type.STRING,
              description: "Exhaustive core explanation with detailed Markdown lists, bold key terms, logical partitions, and mathematical equations if applicable."
            },
            keyTakeaway: {
              type: Type.STRING,
              description: "A single, highly motivating take-away sentence summarizing the entire lesson."
            }
          },
          required: ["moduleTitle", "explanation", "keyTakeaway"]
        }
      }
    });

    if (!response.text) {
      throw new Error("No response returned from the AI model.");
    }

    const parsedData = JSON.parse(response.text.trim());
    res.json(parsedData);
  } catch (error: any) {
    console.error("Lecture generation error:", error);
    res.status(500).json({ error: error.message || "Failed to generate academic lecture" });
  }
});

// Endpoint for Summarizer Tab
app.post("/api/summarize", async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { content, file } = req.body;

    const parts: any[] = [];
    if (file && file.data && file.mimeType) {
      let base64Data = file.data;
      if (base64Data.includes("base64,")) {
        base64Data = base64Data.split("base64,")[1];
      }
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: file.mimeType,
        },
      });
    }
    if (content && content.trim() !== "") {
      parts.push({ text: `Source notes or concepts to summarize: ${content}` });
    }

    if (parts.length === 0) {
      res.status(400).json({ error: "Please provide either notes/images or text content to summarize." });
      return;
    }

    const ai = getGeminiClient();
    const systemInstruction = `You are a friendly and clear Universal Academic Expert summarizing agent inside Scholar Chatbot.
Strictly omit any region-specific or SCERT limitations (No SCERT).
Create a highly structured overview using extremely simple, clear, and everyday language instead of using heavy academic jargon.
Provide simple key summaries, easy-to-understand core bullet points, and plain language takeaway sentences.
Your output must conform STRICTLY to the requested JSON structure. No other wrapper.

Malayalam language logic:
By default, write your summary in natural, simple, and friendly everyday English.
HOWEVER, if the user's input/context content contains Malayalam characters/script, or their request is in Malayalam, or they ask to summarize in Malayalam, you MUST write the entire overview, bulletPoints, and mainTakeaway in simple, natural, and expressive Malayalam instead of English. Keep the structural content/layout mapping identical.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overview: {
              type: Type.STRING,
              description: "Comprehensive structured summary overview paragraphs explaining the material."
            },
            bulletPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "An array of vital bullet points highlighting dates, key terms, logic, triggers, symbols, or takeaways."
            },
            mainTakeaway: {
              type: Type.STRING,
              description: "A final summarizing absolute takeaway phrase."
            }
          },
          required: ["overview", "bulletPoints", "mainTakeaway"]
        }
      }
    });

    if (!response.text) {
      throw new Error("No response returned from the AI model.");
    }

    const parsedData = JSON.parse(response.text.trim());
    res.json(parsedData);
  } catch (error: any) {
    console.error("Summarization error:", error);
    res.status(500).json({ error: error.message || "Failed to summarize text" });
  }
});

// Endpoint for Quiz Generation (Tab C)
app.post("/api/generate-quiz", async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { content, file } = req.body;

    const parts: any[] = [];
    if (file && file.data && file.mimeType) {
      let base64Data = file.data;
      if (base64Data.includes("base64,")) {
        base64Data = base64Data.split("base64,")[1];
      }
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: file.mimeType,
        },
      });
    }
    if (content && content.trim() !== "") {
      parts.push({ text: `Source concepts to build a quiz on: ${content}` });
    }

    if (parts.length === 0) {
      res.status(400).json({ error: "Please provide either content/images or text content to generate the interactive quiz." });
      return;
    }

    const ai = getGeminiClient();
    const systemInstruction = `You are a friendly and clear Universal Academic Expert quiz designer inside Scholar Chatbot.
Strictly omit any region-specific or SCERT limitations (No SCERT).
Construct an engaging, simple, and easy-to-understand interactive quiz with multiple-choice questions. Use everyday language and avoid complex or heavy jargon.
Each quiz entry must contain exactly 4 unique choices with a single correct index (0-3).
Generate exactly 5 relevant, interest-sparking questions covering general understanding of the uploaded material.

Malayalam language logic:
By default, write the quiz in natural, simple, and friendly everyday English.
HOWEVER, if the user's input/context content contains Malayalam characters/script, or their request is in Malayalam, or they ask for questions in Malayalam, you MUST construct all quiz questions and options in simple, natural Malayalam instead of English. Always align the structure perfectly.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: {
                type: Type.STRING,
                description: "The conceptual or fact-checking academic question text."
              },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Array of exactly 4 choices (A, B, C, D)."
              },
              correctIndex: {
                type: Type.INTEGER,
                description: "The zero-based index of the correct answer within the options array (0 to 3)."
              }
            },
            required: ["question", "options", "correctIndex"]
          }
        }
      }
    });

    if (!response.text) {
      throw new Error("No response returned from the AI model.");
    }

    const parsedData = JSON.parse(response.text.trim());
    res.json(parsedData);
  } catch (error: any) {
    console.error("Quiz generation error:", error);
    res.status(500).json({ error: error.message || "Failed to generate quiz" });
  }
});

// ----------------------------------------------------
// UI Serving logic (Vite setup & Fallbacks)
// ----------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Vite middleware for lightning-fast dev feedback
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production serving of static compiled assets
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Scholar Chatbot Server] running on http://localhost:${PORT}`);
  });
}

startServer();
