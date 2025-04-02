"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ask = ask;
exports.generateImage = generateImage;
const genai_1 = require("@google/genai");
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const ai = new genai_1.GoogleGenAI({
    apiKey: process.env.GOOGLE_API_KEY,
});
async function ask(question, system_prompt, chatHistory) {
    console.log({ chatHistory });
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
async function generateImage(prompt) {
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
            }
            else if (part.inlineData?.data) {
                const imageData = part.inlineData.data;
                const buffer = Buffer.from(imageData, 'base64');
                fs_1.default.writeFileSync('gemini-native-image.png', buffer);
            }
        }
    }
    catch (error) {
        console.error("Error generating content:", error);
    }
    return 'gemini-native-image.png';
}
// Test function
if (require.main === module) {
    generateImage("Create a image for a t-shirt design with a cat on it");
}
