import { redisClient } from "../../DB/index.js";

export const baseRevokeTokenKey = ({userId, jti}) => {
    return `revoked_tokens::${userId}`;
}

export const revokeTokenKey = ({userId, jti}) => {
    return `${baseRevokeTokenKey({userId})}::${jti}`;
}

export const otpKey = ({ email }) => {
  return `OTP::User::${email}`;
};

export const otpMaxRequestKey = (email) => {
  return `${otpKey({ email })}::Request`;
}

export const otpBlockKey = (email) => {
  return `${otpKey({ email })}::Block`;
}

export const maxLoginTrialsKey= (email) => {
  return `LoginTrials::${email}`;
}

export const bannedAccountKey = (email) => {
  return `BannedAccount::${email}`;
}

export const otp2sv = (email) => {
  return `otp:2sv:${email}`;
};

export const set = async ({ key, value, ttl } = {}) => {
  try {
    let data = typeof value === "string" ? JSON.stringify(value) : value;

    return ttl
      ? await redisClient.set(key, data, { EX: ttl })
      : await redisClient.set(key, data);
    console.log(`Key-value pair set successfully: ${key} = ${data}`);
  } catch (error) {
    console.error("Fail in redis set operation", error);
  }
};

export const update = async ({ key, value, ttl } = {}) => {
  try {
    if (!(await redisClient.exists(key))) {
      return 0;
    }

    return await set({ key, value, ttl });
  } catch (error) {
    console.error("Fail in redis update operation", error);
  }
};

export const get = async (key) => {
  try {
    const data = await redisClient.get(key);
    if (!data) return null;

    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  } catch (error) {
    console.error("Redis GET error:", error);
    return null;
  }
};

export const ttl = async (key) => {
  try {
    return await redisClient.ttl(`${key}`);
  } catch (error) {
    console.error("Redis TTL error:", error);
    return null;
  }
};

export const expire = async (key, ttl) => {
  try {
    return await redisClient.expire(key, ttl);
  } catch (error) {
    console.error("Redis expire error:", error);
    return null;
  }
};

export const exists = async (key) => {
  try {
    return await redisClient.exists(key);
  } catch (error) {
    console.error("Redis expire error:", error);
    return null;
  }
};

export const keys = async (prefix) => {
  try {
    return await redisClient.keys(`${prefix}*`);
  } catch (error) {
    console.error("Redis KEYS error:", error);
    return null;
  }
};

export const deleteKey = async (keys) => {
  try {
    if (!keys.length) return 0;
    const result = await redisClient.del(keys);
    return result;
  } catch (error) {
    console.log(` Fail in redis dell operation ${error}`);
  }
};

export const mGet = async (keys = []) => {
  try {
    if (!keys.length) return 0; // or return []
    return await redisClient.mGet(keys);
  } catch (error) {
    console.log(`Fail in redis mGet operation: ${error}`);
    throw error; // rethrow or handle as appropriate
  }
};

export const increment = async (key) => {
  try {
    if(!await redisClient.exists(key)){
      return 0;
    }
    return await redisClient.incr(key);
  } catch (error) {
    console.log(`Fail to set this operation `);
    
  }
 }