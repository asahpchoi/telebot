"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEnvironment = validateEnvironment;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function validateEnvironment() {
    const apiId = process.env.TELEGRAM_API_ID;
    const apiHash = process.env.TELEGRAM_API_HASH;
    const phoneNumber = process.env.TELEGRAM_PHONE_NUMBER;
    if (!apiId || !apiHash || !phoneNumber) {
        throw new Error('TELEGRAM_API_ID, TELEGRAM_API_HASH, and TELEGRAM_PHONE_NUMBER environment variables are required');
    }
    const parsedApiId = parseInt(apiId, 10);
    if (isNaN(parsedApiId)) {
        throw new Error('TELEGRAM_API_ID must be a valid number');
    }
    return {
        apiId: parsedApiId,
        apiHash,
        phoneNumber,
    };
}
