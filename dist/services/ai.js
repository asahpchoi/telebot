"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIService = void 0;
const genai_1 = require("@google/genai");
const fs_1 = __importDefault(require("fs"));
class AIService {
    static async initialize(apiKey) {
        console.log({ apiKey });
        this.ai = new genai_1.GoogleGenAI({
            apiKey: apiKey,
        });
    }
    static async ask(question, systemPrompt) {
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
    static async generateImage(prompt) {
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
                }
                else if (part.inlineData?.data) {
                    const imageData = part.inlineData.data;
                    const buffer = Buffer.from(imageData, 'base64');
                    fs_1.default.writeFileSync('gemini-native-image.png', buffer);
                }
            }
            return 'gemini-native-image.png';
        }
        catch (error) {
            console.error("Error generating content:", error);
            throw error;
        }
    }
}
exports.AIService = AIService;
AIService.ai = null;
