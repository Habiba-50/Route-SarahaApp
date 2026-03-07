import { resolve } from 'node:path'
import { config } from 'dotenv'
import { log } from 'node:console';

export const NODE_ENV = process.env.NODE_ENV

const envPath = {
    development: `.env.development`,
    production: `.env.production`,
}
console.log({ en: envPath[NODE_ENV] });


config({ path: resolve(`./config/${envPath[NODE_ENV]}`) })


export const port = process.env.PORT ?? 7000

export const APPLICATION_NAME = process.env.APPLICATION_NAME ?? "Saraha App"

export const DB_URI = process.env.DB_URI ?? 'mongodb://127.0.0.1:27017/Saraha_App'
export const REDIS_URL = process.env.REDIS_URL 

// Encryption
export const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY 


// Email
export const EMAIL_APP = process.env.EMAIL_APP;
export const EMAIL_APP_PASS = process.env.EMAIL_PASS;

// JWT
export const System_JWT_SECRET = process.env.System_JWT_SECRET;
export const System_REFRESH_JWT_SECRET = process.env.System_REFRESH_JWT_SECRET;
export const User_JWT_SECRET = process.env.User_JWT_SECRET
export const User_REFRESH_JWT_SECRET = process.env.User_REFRESH_JWT_SECRET

export const ACCESS_TOKEN_EXPIRY = parseInt(process.env.ACCESS_EXPIRES_IN) 
export const REFRESH_TOKEN_EXPIRY = parseInt(process.env.REFRESH_EXPIRES_IN) 

export const WEB_CLIENT_ID = process.env.WEB_CLIENT_ID



export const SALT_ROUND = parseInt(process.env.SALT_ROUND ?? '10')
console.log({SALT_ROUND});
