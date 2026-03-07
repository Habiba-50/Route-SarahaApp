import { ProviderEnum } from "../../common/enums/index.js";
import { userModel, findOne, createOne } from "../../DB/index.js";
import {conflictException,notFoundException} from "./../../common/utils/response/index.js";
import { compareHash, createLoginCredentials, decrypt, encrypt, generateHash, generateToken, getTokenSignature } from "../../common/utils/security/index.js";
import { generateOTP, sendOTPEmail } from "../../common/utils/security/index.js";
import {OAuth2Client} from 'google-auth-library';
import { createNumberOtp, emailEmitter, sendEmail } from "../../common/utils/index.js";
import { emailTemplate } from "../../common/utils/email/template.email.js";
import { bannedAccountKey, deleteKey, get, increment, keys, maxLoginTrialsKey, otp2sv, otpBlockKey, otpKey, otpMaxRequestKey, set,  ttl } from "../../common/services/index.js";

// -----------------------------Generate OTP-----------------------------
const generateAndSetOTP = async (key) => {
  const code = await createNumberOtp();

    // Save the encoded OTP with a short TTL
    await set({
      key: `${key}`,
      value: await generateHash(`${code}`),
      ttl: 120,
    });
  
   return code
}

 
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
  if (!hashOtp) {
    throw notFoundException("OTP expired");
  }
  if (!(await compareHash(`${otp}`, hashOtp))) {
    return conflictException({ message: "Invalid OTP" });
  }
  return true;
};

// -----------------------------Generate Confirm Email OTP-------------
const generateConfirmEmailOtp = async (email) => {
  
    // Check max trial count
    const maxTrialCountKey = otpMaxRequestKey(email);
    const checkMaxOtpRequest = Number((await get(maxTrialCountKey)) || 0);

    // If max attempts reached, block further attempts for a period
    if (checkMaxOtpRequest >= 3) {
      // Create a temporary block
      await set({
        key: otpBlockKey(email),
        value: 0,
        ttl: 300, // seconds
      });
      const remainingBlockTime = await ttl(otpBlockKey(email));
      throw conflictException({ message: `You have reached max request trail count please try again later after ${remainingBlockTime} seconds` });
    }

  // Generate OTP code
  const code = await generateAndSetOTP(`${otpKey({ email })}`, email);
    // const code = await createNumberOtp();

    // // Save the encoded OTP with a short TTL
    // await set({
    //   key: `${otpKey({ email })}`,
    //   value: await generateHash(`${code}`),
    //   ttl: 120,
    // });

    // Increment max trial count and/or reset after a block/counter as per logic
    // If there is an existing max trial, increment; otherwise initialize it with ttl
    
  if (checkMaxOtpRequest > 0) {
      await increment(maxTrialCountKey);
    } else {
      await set({ key: maxTrialCountKey, value: 1, ttl: 300 });  // 300 seconds = 60 * 5 minutes
    }

    // Send confirmation email
    // await sendEmail({
    //   to: email,
    //   subject: "Confirm-Email",
    //   html: emailTemplate({ code, title: "Confirm_Email" }),
    // });

   emailEmitter.emit("confirm-email", { to: email, code, title:"Confirm_Email" });
    return;
};

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
    return conflictException({message : "Email already exists"});
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

  
  await generateConfirmEmailOtp(email);


  // console.log(await get(otpKey({ email })));
  

  // await sendEmail({
  //   to: email,
  //   subject: "Confirm-Email",
  //   html: emailTemplate({ code, title: "Confirm_Email" }),
  // });

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

  // console.log(user);
  //isVerified:{$exists:false} => this field isn't exist or exist but false

  if (!user) {
    throw notFoundException("Email not found");
  }

  if (user.isVerified) {
    throw conflictException("Email already verified");
  }

  const hashOtp = await get(otpKey({ email }));
  //  console.log(await get(otpKey({ email })));

  if (!hashOtp) {
    throw notFoundException("OTP expired");
  }
  if (!(await compareHash(`${otp}`, hashOtp))) {
    return conflictException("Invalid OTP");
  }

  user.isVerified = new Date();
  await user.save();
  await deleteKey(await keys (otpKey({ email }) ) );
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
    return notFoundException({message: "Fail to find matching account"});
  }


  // console.log(user);

  if (user.isVerified) {
    return conflictException({message: "Email already verified"});
  }

  const remainingTime= await ttl(otpKey({ email })) ;

  if( remainingTime > 0){
    conflictException({ message: `OTP already sent, please try again after ${remainingTime} seconds` });
  }

  await generateConfirmEmailOtp(email);
   

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
      return conflictException("Account already exists with different provider");
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
    return conflictException({
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
    return conflictException({
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

export const forgetPassword = async (email) => { 

  // if (await get(otpKey({ email }))) {
  //    const remainingTime = await ttl(otpKey({ email }));
  //    throw conflictException({
  //      message: `An OTP has already been sent, please try again after  ${remainingTime} seconds`,
  //    });
  //  }

  await checkOtpKey(otpKey({ email }));
  
  const user = await findOne({
    model: userModel,
    filter: { email, provider: ProviderEnum.System },
  });
  if (!user) {
    throw notFoundException("Email not found");
  }
  const code = await generateAndSetOTP(otpKey({ email }));

  emailEmitter.emit("confirm-email", {
    to: email,
    code,
    title: "Reset_Password",
  });

}

export const checkOtp = async (email , otp) => {
  await checkValidOtp(otpKey(email), otp)
}

export const resetPassword = async (email, newPassword, confirmNewPassword) => { 

  if(await get(otpKey({ email })) === null){
    throw notFoundException("OTP expired or invalid");
  }

  if (newPassword !== confirmNewPassword) {
    throw conflictException({ message: "New password and confirm new password do not match" });
  }
  
  const user = await findOne({
    model: userModel,
    filter: { email, provider: ProviderEnum.System },
  });

  if(await compareHash(newPassword, user.password)){
    throw conflictException({message: "New password cannot be the same as the old password"})
  }
  user.password = await generateHash(newPassword);
  await user.save();
  await deleteKey(otpKey({ email }));
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

  emailEmitter.emit("confirm-email", {
    to: user.email,
    code,
    title: "Verify_Account",
  });
}
 
export const verifyTwoStepVerification = async (user, otp) => { 
  const email = user.email
  await checkValidOtp(otp2sv(email), otp);
  user.twoStepVerification = new Date();
  await user.save();
  await deleteKey(otp2sv(email));
  return user;
}