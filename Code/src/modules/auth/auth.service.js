import { ProviderEnum } from "../../common/enums/index.js";
import { userModel, findOne, createOne, findOneAndUpdate } from "../../DB/index.js";
import {conflictException,notFoundException} from "./../../common/utils/response/index.js";
import { compareHash, createLoginCredentials, decrypt, encrypt, generateHash, generateToken, getTokenSignature } from "../../common/utils/security/index.js";
import { generateOTP, sendOTPEmail } from "../../common/utils/security/index.js";
import {OAuth2Client} from 'google-auth-library';
import { createNumberOtp, emailEmitter, sendEmail } from "../../common/utils/index.js";
import { emailTemplate } from "../../common/utils/email/template.email.js";
import { bannedAccountKey, deleteKey, get, increment, keys, maxLoginTrialsKey, otp2sv, otpKey, maxRequestOtpKey, set,  ttl, blockOtpKey, revokeTokenKey, baseRevokeTokenKey } from "../../common/services/index.js";
import { EmailEnum } from "../../common/enums/email.enum.js";

// -----------------------------Generate OTP-----------------------------
// const generateAndSetOTP = async (key) => {
//   const code = await createNumberOtp();

//     // Save the encoded OTP with a short TTL
//     await set({
//       key: `${key}`,
//       value: await generateHash(`${code}`),
//       ttl: 120,
//     });
  
//    return code
// }

 
const checkOtpKey = async (key) => {
  
    const checkKeyExist = await get(key);
    // console.log(await get(otp2sv(email )));

    if (checkKeyExist) {
      const remainingTime = await ttl(key);
      // console.log(remainingTime)
      throw conflictException({
        message: `An OTP has already been sent, please try again after ${remainingTime} seconds`,
      });
    }
  
}


export const checkValidOtp = async (key, otp) => {
 const hashOtp = await get(key);
 console.log(hashOtp);
 if (!hashOtp) {
   throw notFoundException("OTP expired");
 }
 if (!(await compareHash(`${otp}`, hashOtp))) {
   throw conflictException({ message: "Invalid OTP" });
 }
  return true;
};

// -----------------------------Send Email OTP-----------------------------

const sendEmailOtp = async (email, type = EmailEnum.ConfirmEmail, title = "Verify-Account") => {

  // Check Block Condition
  const isBlocked = await get(blockOtpKey({ email, type }));
  if (isBlocked) {
    const remainingTime = await ttl(blockOtpKey({ email, type }));
    if( remainingTime > 0){
    throw conflictException({ message: `OTP already sent, please try again after ${remainingTime} seconds` });
    }
  }

  // Check Max Trials
  const maxTrialCount = await get(maxRequestOtpKey({ email , type }));
  if (maxTrialCount >= 3) {
    await set({
      key: blockOtpKey({ email , type }),
      value: 1,
      ttl: 300,
    });
    throw conflictException({ message: "You have reached max request trial count please try again later after 5 minutes" });
  }


// Generate and Set OT P 
  const code = await createNumberOtp();

  await set({
      key: otpKey({email , type}),
      value: await generateHash(`${code}`),
      ttl: 120,
  });

  
  // Send Email
  await sendEmail({
    to: email,
    subject: title,
    html: emailTemplate({ code, title }),
  });
   

  // Increment Trials Count
  maxTrialCount > 0 ?
    await increment(maxRequestOtpKey({ email, type }))
    : await set({ key: maxRequestOtpKey({ email, type }), value: 1, ttl: 300 })

}


// ----------------------------Signup--------------------------------

export const signup = async (inputs) => {
  const { userName, email, password, phone } = inputs;
  const checkUserExist = await findOne({
    model: userModel,
    filter: { email },
    select: "email",
    options: {
      //   populate : [{path:'lol'}]
      lean: true,
    },
  });
  // console.log(checkUserExist);

  if (checkUserExist) {
    throw conflictException({message : "Email already exists"});
  }

  // const otp = generateOTP();
  // const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  const user = await createOne({
    model: userModel,
    data: [{
      userName,
      email,
      password: await generateHash(password),
      phone: encrypt(phone),
      provider: ProviderEnum.System,
      // otpCode: await generateHash(otp),
      // otpExpiresAt: expiresAt,
    }],
  });

  emailEmitter.emit("send-email", async () => {
      await sendEmailOtp(email, EmailEnum.ConfirmEmail, "Confirm-Email");
  } )

  return user;
};

// ----------------------------Confirm Email--------------------------------

export const confirmEmail = async (inputs) => {

  const { email, otp } = inputs;

  const user = await findOne({
    model: userModel,
    filter: { email, provider: ProviderEnum.System },
    select: "email isVerified",
  });

  if (!user) {
    throw notFoundException("Email not found");
  }

  if (user.isVerified) {
    throw conflictException("Email already verified");
  }

  await checkValidOtp(otpKey({ email  , type: EmailEnum.ConfirmEmail}), otp)


  user.isVerified = new Date();
  await user.save();
  await deleteKey(await keys (otpKey({ email , type : EmailEnum.ConfirmEmail }) ) );
  // await deleteKey(otpKey({ email }) , otpMaxRequestKey(email) , otpBlockKey(email));
  return user;
};

// ----------------------------Resend OTP--------------------------------

export const resendOtp = async (inputs) => {
  
  const { email } = inputs;

  const user = await findOne({
    model: userModel,
    filter: { email , provider: ProviderEnum.System },
    select: "email isVerified",

  });

  if (!user) {
    return notFoundException("Fail to find matching account");
  }

  // console.log(user);

  if (user.isVerified) {
    throw conflictException({message: "Email already verified"});
  }

  // await checkOtpKey(otpKey({email , type:EmailEnum.ConfirmEmail}))

  await sendEmailOtp(email, EmailEnum.ConfirmEmail, "Confirm-Email");

  return user;
  
};

// -----------------------------Verify google account --------------------------------

const verifyGoogleAccount = async (idToken) => {
    const client = new OAuth2Client();

  const ticket = await client.verifyIdToken({
    idToken: idToken,
    audience: process.env.WEB_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  // console.log(payload);

  if (!payload?.email_verified) {
    return notFoundException("fail to verify this account with google");
  }

  return payload
}


// ----------------------------Signup Gmail--------------------------------

export const signupGmail = async (idToken, issuer) => {

  const payload = await verifyGoogleAccount(idToken)

  console.log(payload);

  const checkUser = await findOne({
    model: userModel,
    filter: { email: payload?.email },
  });

  // console.log(checkUser);

  if (checkUser) {
    if (checkUser.provider !== ProviderEnum.Google) {
      throw conflictException("Account already exists with different provider");
    } else {
      const account = await loginGmail({idToken}, issuer);
      return {account , status:200}
    }
    
  }

   const newUser = await createOne({
    model: userModel,
    data: [{
      firstName: payload?.given_name,
      lastName: payload?.family_name,
      email: payload?.email,
      provider: ProviderEnum.Google,
      profilePic: payload?.picture,
      isVerified: true,
      confirmEmail: new Date()
    }],
  });
  console.log(newUser);

  return await createLoginCredentials({ user: newUser, issuer });
};

// -----------------------------Login-------------------------------

export const login = async (inputs, issuer) => {
  const { email, password } = inputs;

  if (await get(bannedAccountKey(email))) {
    const remainingBlockTime = await ttl(bannedAccountKey(email));
    console.log(remainingBlockTime);
    throw conflictException({
      message: `You have reached max login trial count, your account is temporarily banned. Please try again after ${remainingBlockTime} seconds`,
    });
  }

  // Check max trial count
  const loginTrialsKey = maxLoginTrialsKey(email);
  const checkMaxTrials = Number((await get(loginTrialsKey)) || 0);

  if (checkMaxTrials == 5) {
    await set({
      key: bannedAccountKey(email),
      value: 1,
      ttl: 300, // seconds
    });
    throw conflictException({
      message: `You have reached max login trial count, your account is temporarily banned. Please try again after 5 minutes`,
    });
  }

  const user = await findOne({
    model: userModel,
    filter: { email },
    // select:'-password'
  });

  if (!user) {
    return notFoundException("Invalid login credentials");
  }

  if (!user.isVerified) {
    return notFoundException("Please verify your email first");
  }

  const matched = await compareHash(password, user.password);
  if (!matched) {
    if (checkMaxTrials > 0) {
      await increment(maxLoginTrialsKey(email));
    } else {
      await set({
        key: maxLoginTrialsKey(email),
        value: 1,
        ttl: 300, // seconds
      });
    }
    return notFoundException("Invalid login credentials");
  }

  if (
      user.twoStepVerification &&
      user.twoStepVerification < Date.now() - 24 *60* 60 * 1000
    ) {
      await twoStepVerification(user);
      throw conflictException({
        message: "An OTP has been sent to your email",
      });
  }

  await deleteKey([maxLoginTrialsKey(email), bannedAccountKey(email)]);

  return await createLoginCredentials({ user, issuer });
};


// -----------------------------Confirmation Login-------------------------------

export const confirmationLogin = async (email, otp , issuer) => {
   const user = await findOne({
     model: userModel,
     filter: { email, provider: ProviderEnum.System },
   });
  await verifyTwoStepVerification(user, otp)
   
   return await createLoginCredentials({ user, issuer });
}

// -----------------------------Login Gmail-------------------------------

 export const loginGmail = async (idToken, issuer) => {

  const payload = await verifyGoogleAccount(idToken)

  const user = await findOne({
    model: userModel,
    filter: { email: payload?.email,provider: ProviderEnum.Google },
  });

  if (!user?.provider === ProviderEnum.Google) {
    throw conflictException("Account already exists with different provider");
  }


  return await createLoginCredentials({ user: checkUser, issuer });
};


// -------------------------------Forget Password------------------------------

// 1 - Send Forgot Password OTP
export const forgetPassword = async (email) => { 
  
  const user = await findOne({
    model: userModel,
    filter: {
      email,
      provider: ProviderEnum.System,
      isVerified: { $exists: true }
    },
  });

  if (!user) {
    throw notFoundException("Email not found");
  }

   await sendEmailOtp(email, EmailEnum.ForgotPassword, "Reset-Code");

}


// 2 - Verify Forgot Password OTP
export const verifyForgetPasswordOtp = async (email, type = EmailEnum.ForgotPassword ,  otp) => {
    await checkValidOtp(otpKey({ email, type }), otp);

}

// 3 - Reset Password
export const resetPassword = async (email, newPassword) => { 

  // To check otp is still valid or not 
  // if(await get(otpKey({ email , type: EmailEnum.ForgotPassword})) == null){
  //   throw notFoundException("OTP expired or invalid");
  // }

  // if (newPassword !== confirmNewPassword) {
  //   throw conflictException({ message: "New password and confirm new password do not match" });
  // }
  // That's already Done in validation method 

  // if (await compareHash(newPassword, user.password)) {
  //     throw conflictException({
  //       message: "New password cannot be the same as the old password",
  //     });
  // }
  
  const user = await findOneAndUpdate({
    model: userModel,
    filter: {
      email,
      provider: ProviderEnum.System,
      isVerified: { $exists: true }
    },
    update: {
      password: await generateHash(newPassword),
      changeCredentialsTime: new Date()
    },
  });

  if(!user){
    throw notFoundException("User not found");
  }
console.log(user.id)

  const tokenKeys = await keys(baseRevokeTokenKey(user.id));
  const otpKeys = await keys(otpKey({ email, type: EmailEnum.ForgotPassword }));

  await deleteKey([...tokenKeys , ...otpKeys]);
  return user;
}


// -----------------------------2 step-verification-----------------------------
export const twoStepVerification = async (user) => {

  if(user.twoStepVerification && user.twoStepVerification > Date.now() - 24 * 60 * 60 * 1000){
   throw conflictException({message:"Two step verification is already enabled for this account"});  
  }

  const email  = user.email;

 await checkOtpKey(otp2sv(email));

  const code = await generateAndSetOTP(otp2sv(email));

  emailEmitter.emit("send-email", user.email, code, EmailEnum.ConfirmEmail, "Verify_Account");
}
 
export const verifyTwoStepVerification = async (user, otp) => { 
  const email = user.email
  await checkValidOtp(otp2sv(email), otp);
  user.twoStepVerification = new Date();
  await user.save();
  await deleteKey(otp2sv(email));
  return user;
}