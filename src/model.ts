import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
});


export async function ask(question: string, system_prompt: string, chatHistory: any[]): Promise<string> {
console.log({chatHistory});
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: [question],
    config: {
        systemInstruction: system_prompt,
      },
  });
  
  if (!response.text) {
    throw new Error('No response text received');
  }
  
  return response.text;
}

export async function generateImage(prompt: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp-image-generation',
      contents: prompt,
      config: {
        responseModalities: ['Text', 'Image']
      },
    });

    if (!response.candidates?.[0]?.content?.parts) {
      throw new Error('Invalid response format');
    }

    const parts = response.candidates[0].content.parts;

    for (const part of parts) {
      if (part.text) {
        console.log(part.text);
      } else if (part.inlineData?.data) {
        const imageData = part.inlineData.data;
        const buffer = Buffer.from(imageData, 'base64');
        fs.writeFileSync('gemini-native-image.png', buffer);
        
      }
    }
    
  } catch (error) {
    console.error("Error generating content:", error);
  }
  return 'gemini-native-image.png';
}

// Test function
if (require.main === module) {
  generateImage("Create a image for a t-shirt design with a cat on it");
}
  
  
