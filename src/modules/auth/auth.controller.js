import { Router } from 'express'
import {  login, loginGmail, resendOtp, signup, signupGmail, verifyEmail } from './auth.service.js';
import { successResponse } from '../../common/utils/response/success.respone.js';
import { loginLimiter, otpLimiter, validation} from '../../middleware/index.js';
import * as validators from './auth.validation.js'
import { badRequestException } from '../../common/utils/index.js';

const router = Router(); 

router.post("/signup", otpLimiter,validation( validators.signup), async (req, res, next) => {
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


router.post("/login", loginLimiter,validation(validators.login), async (req, res, next) => {
    const tokens = await login(req.body , `${req.protocol}://${req.host}`)    
    return successResponse(res, 200, { tokens });
})


router.post("/signup/gmail", async (req, res, next) => {
    console.log(req.body);
    const {account , status} = await signupGmail(req.body.idToken, `${req.protocol}://${req.host}`)
    return successResponse(res, status, { account });
})

router.post("/login/gmail", async (req, res, next) => {
    console.log(req.body);
    const account = await loginGmail(req.body, `${req.protocol}://${req.host}`)
    return successResponse(res, 201, { account });
})


export default router