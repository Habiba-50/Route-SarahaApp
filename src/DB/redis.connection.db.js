import {createClient} from 'redis';
import { REDIS_URL } from '../../config/config.service.js';

export const redisClient = createClient({
    url: REDIS_URL
});

export const connectRedis = async () => {
    try {
        await redisClient.connect();
        console.log("Redis_DB connected successfully 👌🌸");
    } catch (error) {
        console.error("Error connecting to Redis:", error);
    }
}