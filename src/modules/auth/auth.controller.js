import { Router } from 'express'
import {  login, resendOtp, signup, verifyEmail } from './auth.service.js';
import { successResponse } from '../../common/utils/response/success.respone.js';
import { loginLimiter, otpLimiter } from '../../middleware/index.js';
const router = Router(); 

router.post("/signup",otpLimiter, async (req, res, next) => {
    const account = await signup(req.body)
    return successResponse(res, 201, { account });
})
router.post("/verify-email",otpLimiter, async (req, res, next) => {
    const account = await verifyEmail(req.body)
    return successResponse(res, 201, { account },"Email verified successfully");
})
router.post("/resend-otp",otpLimiter, async (req, res, next) => {
    const account = await resendOtp(req.body)
    return successResponse(res, 201, { account },"A new OTP has been sent to your email");
})

router.post("/login",loginLimiter, async (req, res, next) => {
    const account = await login(req.body)    
    return successResponse(res, 200, { account });
})



export default router