import { GoogleGenAI } from '@google/genai';
import { BotConfig } from '../types';
import fs from 'fs';

export class AIService {
    private static ai: GoogleGenAI | null = null;

    static async initialize(apiKey: string): Promise<void> {
        console.log({apiKey});
        this.ai = new GoogleGenAI({
            apiKey: apiKey,
        });
    }

    static async ask(question: string, systemPrompt: string): Promise<string> {
        if (!this.ai) {
            throw new Error('AI not initialized');
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
            throw new Error('AI not initialized');
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