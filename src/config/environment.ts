import dotenv from 'dotenv';

dotenv.config();

export interface TelegramConfig {
    apiId: number;
    apiHash: string;
    phoneNumber: string;
}

export function validateEnvironment(): TelegramConfig {
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