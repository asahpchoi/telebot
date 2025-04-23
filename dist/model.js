"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIService = void 0;
exports.ask = ask;
exports.generateImage = generateImage;
const genai_1 = require("@google/genai");
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class AIService {
    static async initialize(apiKey) {
        this.ai = new genai_1.GoogleGenAI({
            apiKey: apiKey || process.env.GOOGLE_API_KEY,
        });
    }
    static async ask(question, systemPrompt, chatHistory = []) {
        if (!this.ai) {
            await this.initialize();
        }
        if (!this.ai) {
            throw new Error('Failed to initialize AI service');
        }
        const contents = chatHistory.length > 0
            ? [...chatHistory.map(h => h.message), question]
            : [question];
        const response = await this.ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: contents,
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
// Backwards compatibility functions
async function ask(question, system_prompt, chatHistory = []) {
    if (chatHistory && chatHistory.length) {
        console.log({ chatHistory });
    }
    return AIService.ask(question, system_prompt);
}
async function generateImage(prompt) {
    return AIService.generateImage(prompt);
}
// Test function
if (require.main === module) {
    generateImage("Create a image for a t-shirt design with a cat on it");
}
