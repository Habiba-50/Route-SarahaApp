import { Router } from 'express'
import {  login, signup, verifyEmail } from './auth.service.js';
import { successResponse } from '../../common/utils/response/success.respone.js';
const router = Router(); 

router.post("/signup", async (req, res, next) => {
    const account = await signup(req.body)
    return successResponse(res, 201, { account });
})
router.post("/verify-email", async (req, res, next) => {
    const account = await verifyEmail(req.body)
    return successResponse(res, 201, { account });
})

router.post("/login", async (req, res, next) => {
    const account = await login(req.body)    
    return successResponse(res, 200, { account });
})



export default router