import jwt from "jsonwebtoken";
import { ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY, System_JWT_SECRET, System_REFRESH_JWT_SECRET, User_JWT_SECRET, User_REFRESH_JWT_SECRET } from "../../../../config/config.service.js";
import { RoleEnum } from "../../enums/index.js";
import { AudienceEnum, TokenTypeEnum } from "../../enums/security.enum.js";
import { badRequestException } from "../response/error.response.js";
import { findById } from "../../../DB/db.service.js";
import { userModel } from "../../../DB/index.js";


export const generateToken = async ({
    payload = {},
    signature = User_JWT_SECRET,
    options = {}
}) => {
    return jwt.sign(payload, signature, options);
}

// ------------------------------Get Token Signature----------------------------------

export const getTokenSignature = async (role) => {
  let accessSignature = undefined;
  let refreshSignature = undefined;
  let audience = AudienceEnum.User;

  switch (role) {
    case RoleEnum.Admin:
      accessSignature = System_JWT_SECRET;
      refreshSignature = System_REFRESH_JWT_SECRET;
      audience = AudienceEnum.System;
      break;
    default:
      accessSignature = User_JWT_SECRET;
      refreshSignature = User_REFRESH_JWT_SECRET;
      audience = AudienceEnum.User;
      break;
  }

  return { accessSignature, refreshSignature, audience };
}

// ------------------------------Create login credentials ---------------------
export const  createLoginCredentials = async ({ user, issuer }) => {
  const { accessSignature, refreshSignature, audience } = await getTokenSignature(user.role);

  const access_token = await generateToken({
    payload: { sub: user._id },
    signature: accessSignature,
    options: {
      issuer,
      audience: [TokenTypeEnum.ACCESS, audience],
      expiresIn: ACCESS_TOKEN_EXPIRY
    }
  })

  const refresh_token = await generateToken({
    payload: { sub: user._id },
    signature: refreshSignature,
    options: {
      issuer,
      audience: [TokenTypeEnum.REFRESH, audience],
      expiresIn: REFRESH_TOKEN_EXPIRY
    }
  })
  
  return { access_token, refresh_token };
  
}

//------------------------------Decode Token----------------------------------

export const decodeToken = async (token, allowedTokenType = []) => {

  const decoded = jwt.decode(token);
  console.log({ decoded });
  
  if (!decoded?.aud?.length) {
    throw badRequestException({message: "fail to decode token, aud is required"})
  }

  const [tokenType , audience] = decoded.aud


  if (!Object.values(TokenTypeEnum).includes(tokenType)) {
    throw badRequestException({message: "Invalid token"})
  }

  if (!Object.values(AudienceEnum).includes(audience)) {
    throw badRequestException({message: "Invalid token"})
  }

  if (allowedTokenType.length && !allowedTokenType.includes(tokenType)) {
    throw badRequestException({message: "Invalid token type"})
  }

  let signature = undefined;
  
  switch (tokenType) {
    case TokenTypeEnum.ACCESS:
      signature =  audience === AudienceEnum.System ? System_JWT_SECRET : User_JWT_SECRET
      break;
    case TokenTypeEnum.REFRESH:
      signature =  audience === AudienceEnum.System ? System_REFRESH_JWT_SECRET : User_REFRESH_JWT_SECRET
      break;
  }

      
  const verifyData = await verifyToken(token , signature)
  
  console.log({ verifyData });
  
  const user = await findById({
    model: userModel,
    id: verifyData.sub,
  });

  if (!user) {
    throw notFoundException("No registered account found");
  }
  
    return user;

}


// ------------------------------Verify Token----------------------------------

export const verifyToken = async (token, signature) => {
  const verifyData = jwt.verify(token, signature);
  return verifyData
}



