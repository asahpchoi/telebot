import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

export class AIService {
    private static ai: GoogleGenAI | null = null;

    static async initialize(apiKey?: string): Promise<void> {
        this.ai = new GoogleGenAI({
            apiKey: apiKey || process.env.GOOGLE_API_KEY,
        });
    }

    static async ask(question: string, systemPrompt: string, botId?: string): Promise<string> {
        if (!this.ai) {
            await this.initialize();
        }
        if (!this.ai) {
            throw new Error('Failed to initialize AI service');
        }

        const response = await this.ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: [question],
            config: {
                systemInstruction: systemPrompt,
            },
        });

        if (!response.text) {
            throw new Error('No response text received');
        }

        return response.text;
    }

    static async generateImage(prompt: string): Promise<string> {
        if (!this.ai) {
            await this.initialize();
        }
        if (!this.ai) {
            throw new Error('Failed to initialize AI service');
        }

        try {
            const response = await this.ai.models.generateContent({
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
            let responseText = '';

            for (const part of parts) {
                if (part.text) {
                    responseText = part.text;
                    console.log(part.text);
                } else if (part.inlineData?.data) {
                    const imageData = part.inlineData.data;
                    const buffer = Buffer.from(imageData, 'base64');
                    fs.writeFileSync('gemini-native-image.png', buffer);
                }
            }

            return 'gemini-native-image.png';
        } catch (error) {
            console.error("Error generating content:", error);
            throw error;
        }
    }
}

// Backwards compatibility functions
export async function ask(question: string, system_prompt: string, chatHistory: any[] = []): Promise<string> {
    if (chatHistory && chatHistory.length) {
        console.log({chatHistory});
    }
    return AIService.ask(question, system_prompt);
}

export async function generateImage(prompt: string): Promise<string> {
    return AIService.generateImage(prompt);
}

// Test function
if (require.main === module) {
    generateImage("Create a image for a t-shirt design with a cat on it");
}
  
  
