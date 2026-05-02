import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface VerificationResult {
  status: 'Correct' | 'Incorrect' | 'Unclear';
  feedback: string;
}

export async function verifySolution(
  assignmentTitle: string,
  assignmentDesc: string,
  assignmentImage: string | null,
  solutionContent: string,
  solutionImage: string | null
): Promise<VerificationResult> {
  const prompt = `
    You are an expert engineering professor at AASTU (Addis Ababa Science and Technology University).
    Your task is to verify if a student's solution to an engineering/applied science assignment is correct.

    Assignment Title: ${assignmentTitle}
    Assignment Description: ${assignmentDesc}

    Student's Solution Content: ${solutionContent}

    Please analyze the solution against the assignment. 
    If there are images provided, consider them in your analysis.
    
    Respond in JSON format with:
    - status: "Correct", "Incorrect", or "Unclear"
    - feedback: A brief explanation of why it is correct or what is missing.
  `;

  const contents: any[] = [{ text: prompt }];

  if (assignmentImage) {
    contents.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: assignmentImage.split(',')[1] || assignmentImage
      }
    });
  }

  if (solutionImage) {
    contents.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: solutionImage.split(',')[1] || solutionImage
      }
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts: contents },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING, enum: ["Correct", "Incorrect", "Unclear"] },
            feedback: { type: Type.STRING }
          },
          required: ["status", "feedback"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return {
      status: result.status || 'Unclear',
      feedback: result.feedback || 'No feedback provided.'
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      status: 'Unclear',
      feedback: "AI verification failed due to an error."
    };
  }
}
