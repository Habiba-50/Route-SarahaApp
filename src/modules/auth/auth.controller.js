import { Router } from "express";
import {
  checkOtp,
  confirmationLogin,
  confirmEmail,
  forgetPassword,
  login,
  loginGmail,
  resendOtp,
  resetPassword,
  signup,
  signupGmail,
  twoStepVerification,
  verifyTwoStepVerification,
} from "./auth.service.js";
import { successResponse } from "../../common/utils/response/success.response.js";
import {
  authentication,
  validation,
} from "../../middleware/index.js";
import * as validators from "./auth.validation.js";


const router = Router();




router.post("/signup",validation(validators.signup),async (req, res, next) => {
    const account = await signup(req.body);
    return successResponse(res, 201, { account });
  },
);


router.patch("/confirm-email", validation(validators.emailAndOTP), async (req, res, next) => {
  const account = await confirmEmail(req.body);
  return successResponse(res, 200, { account }, "Email verified successfully");
});


router.patch("/resend-otp", validation(validators.email), async (req, res, next) => {
  const account = await resendOtp(req.body);
  return successResponse(
    res,
    200,
    { account },
    "A new OTP has been sent to your email",
  );
});


router.post("/login",
 validation(validators.login),
  async (req, res, next) => {
    const tokens = await login(req.body, `${req.protocol}://${req.host}`);
    return successResponse(res, 200, { tokens });
  },
);


router.post("/confirm-login",
 validation(validators.emailAndOTP),
  async (req, res, next) => {
    const {email, otp}= req.body
    const tokens = await confirmationLogin(email, otp , `${req.protocol}://${req.host}`);
    return successResponse(res, 200, { tokens });
  },
);


router.post("/signup/gmail", async (req, res, next) => {
  console.log(req.body);
  const { account, status } = await signupGmail(
    req.body.idToken,
    `${req.protocol}://${req.host}`,
  );
  return successResponse(res, status, { account });
});



router.post("/login/gmail", async (req, res, next) => {
  console.log(req.body);
  const account = await loginGmail(req.body, `${req.protocol}://${req.host}`);
  return successResponse(res, 201, { account });
});



router.post("/forget-password", validation(validators.email), async (req, res, next) => {
    const { email } = req.body;
  const result = await forgetPassword(email);
  return successResponse(res, 200, { result }, "If the email exists, a reset password OTP has been sent");

})
 

router.post("/otp-password", validation(validators.emailAndOTP), async (req, res, next) => {
  const { email , otp} = req.body;
  const result = await checkOtp(email, otp);
  return successResponse(res, 200, undefined , "you can now reset your password");
})

router.patch("/reset-password", validation(validators.resetPassword), async (req, res, next) => {
  const { email , password , confirmPassword} = req.body;
  const result = await resetPassword(email, password, confirmPassword);  
  return successResponse(res, 200, undefined , "Password reset successfully");
 })


// ----------------------------------2 step verification---------------------------------------
router.post("/enable-2sv", authentication(), async (req, res, next) => {
  const result = await twoStepVerification(req.user);
  return successResponse(res, 200, { result }, "An OTP has been sent to your email");
});


router.post("/verify-2sv", authentication(), async (req, res, next) => {
  const {otp} = req.body
  const result = await verifyTwoStepVerification(req.user,otp);
  return successResponse(res, 200, { result }, "Two-step verification confirmed successfully");
});

export default router;
