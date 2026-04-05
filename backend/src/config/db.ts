
import mongoose from 'mongoose';

export const connectDB=async ()=>{
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
        throw new Error('MONGO_URI is not set in environment variables.');
    }

    const maxAttempts = Number(process.env.MONGO_CONNECT_RETRIES || 5);
    const retryDelayMs = Number(process.env.MONGO_CONNECT_RETRY_DELAY_MS || 2000);

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
            const connection = await mongoose.connect(mongoUri, {
                serverSelectionTimeoutMS: 15000,
                connectTimeoutMS: 15000,
            });
            console.log(`MongoDB Connected: ${connection.connection.host}`);
            return;
        } catch (error) {
            const isLastAttempt = attempt === maxAttempts;
            console.error(`DB connection attempt ${attempt}/${maxAttempts} failed:`, error);

            if (isLastAttempt) {
                throw error;
            }

            await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
        }
    }
}
