import { GoogleGenAI, Type } from "@google/genai";
import { PromptData, UserResponse, EvaluationResult } from "../types";

// Initialize the client safely
const apiKey = process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY || "";
if (!apiKey) {
  console.warn("Warning: GEMINI_API_KEY is not set. AI features will fall back to mock data.");
}
const ai = new GoogleGenAI({ apiKey });

const MODEL_NAME = "gemini-3-flash-preview";

/**
 * Generates a random Product Sense interview question.
 */
export const generatePrompt = async (): Promise<PromptData> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: "Generate a single, unique Product Management interview question focused on Root Cause Analysis (RCA), product strategy, or real-life PM decisions and trade-offs. Make the question slightly simpler, suitable for an entry-level or mid-level PM (avoid overly complex or niche scenarios). Do NOT ask basic 'Design X' questions. Provide a short context sentence setting the stage. Also provide a 'proTip' that gives a specific hint on how to approach or structure the answer for this exact question.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING, description: "The main interview question" },
            context: { type: Type.STRING, description: "A brief sentence setting the stage" },
            proTip: { type: Type.STRING, description: "A helpful hint or suggested structure specific to this question" },
          },
          required: ["question", "context", "proTip"],
        },
        temperature: 0.9,
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as PromptData;
    }
    throw new Error("Empty response from AI");
  } catch (error) {
    console.error("Error generating prompt:", error);
    return {
      question: "Daily active users (DAU) on our core messaging app dropped by 10% yesterday. How would you investigate the root cause?",
      context: "You are the lead PM for the core engagement team.",
      proTip: "Start by clarifying if the drop is internal (data glitch) or external, then segment the data by platform, region, or user type.",
    };
  }
};

/**
 * Evaluates the user's answer using a rigorous PM rubric.
 */
export const evaluateSubmission = async (
  question: string,
  response: UserResponse
): Promise<EvaluationResult> => {
  const promptText = `
    You are a World-Class VP of Product at a top tech company (Google, Meta, etc.).
    Evaluate the following PM candidate's response to the interview question: "${question}".
    
    Candidate Response:
    ${response.answer}

    Tasks:
    1. Score the user's answer (0-100) on these five metrics:
       - Strategic Thinking
       - Creativity
       - Clarity & Specificity
       - Analytical Thinking
       - Customer Empathy
    2. Provide brief (1-2 sentences) qualitative feedback on the overall response.
    3. Generate three distinct sample answers for the same question from the perspective of an 'AI Junior PM', 'AI Senior PM', and 'AI World-Class PM'. 
       - These answers should be crisp, to-the-point, and prioritize creative, insightful ideas over sophisticated language.
    4. Score YOUR own generated sample answers using the same five metrics.
    5. Generate a short Wordle-style share message.

    Return ONLY JSON.
  `;

  const scoresSchema = {
    type: Type.OBJECT,
    properties: {
      strategicThinking: { type: Type.INTEGER },
      creativity: { type: Type.INTEGER },
      clarity: { type: Type.INTEGER },
      analyticalThinking: { type: Type.INTEGER },
      customerEmpathy: { type: Type.INTEGER },
      overall: { type: Type.INTEGER },
    },
    required: ["strategicThinking", "creativity", "clarity", "analyticalThinking", "customerEmpathy", "overall"],
  };

  try {
    const result = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            scores: scoresSchema,
            feedback: { type: Type.STRING, description: "Brief 1-2 sentence feedback" },
            sampleAnswers: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  level: { type: Type.STRING, enum: ["AI Junior PM", "AI Senior PM", "AI World-Class PM"] },
                  content: { type: Type.STRING },
                  scores: scoresSchema
                },
                required: ["level", "content", "scores"]
              },
            },
            shareMessage: { type: Type.STRING, description: "A short string with emojis summarizing the score, e.g. 'PM Practice 🟩🟩🟨 85/100'" },
          },
          required: ["scores", "feedback", "sampleAnswers", "shareMessage"],
        },
      },
    });

    if (result.text) {
      return JSON.parse(result.text) as EvaluationResult;
    }
    throw new Error("No evaluation generated");
  } catch (error) {
    console.error("Evaluation error", error);
    // Fallback mock for error handling
    return {
      scores: { overall: 0, strategicThinking: 0, creativity: 0, clarity: 0, analyticalThinking: 0, customerEmpathy: 0 },
      feedback: "Error generating evaluation. Please try again.",
      sampleAnswers: [],
      shareMessage: "Error 🔴",
    };
  }
};
