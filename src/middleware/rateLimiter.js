import rateLimit from "express-rate-limit";

export const otpLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 3,
  message: { message: "Too many OTP requests, wait a minute." }
});

export const loginLimiter = rateLimit({
  windowMs: 12 * 60 * 1000,
  max: 10,
  message: { message: "Too many login attempts, try again in 12 minutes." }
});