import { ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY } from "../../../config/config.service.js"
import { AudienceEnum, LogoutEnum, TokenTypeEnum } from "../../common/enums/security.enum.js";
import { compareHash, conflictException, createLoginCredentials, decrypt, generateHash, generateToken, getTokenSignature, notFoundException } from "../../common/utils/index.js";
import { createOne, deleteMany, findById, findOne } from "../../DB/db.service.js";
import {  userModel } from "../../DB/index.js";
import Path from "path";
import fs from "fs";
import { baseRevokeTokenKey, deleteKey, keys, revokeTokenKey, set } from "../../common/services/index.js";


const createRevokeToken = async ({sub, jti, ttl}) => {
  await set({
    key: revokeTokenKey({ userId:sub, jti }),
    value: jti,
    ttl
  });
}

// -----------------------------Logout-----------------------------

export const logout = async ({flag}, user, {jti , iat, sub}) => { 
  
  let status = 200

  switch (flag) {
    case LogoutEnum.All:
      user.changeCredentialsTime = new Date();
      await user.save();

      const result = await deleteKey(await keys(baseRevokeTokenKey({ userId: sub })));
      console.log("Logout all sessions result:", result);
      break;
  
    default:

      await createRevokeToken({
        userId: sub,
        jti,
        ttl: iat + REFRESH_TOKEN_EXPIRY,
      });
      status = 201
      break;
  }

  
  return status;
}


// -----------------------------Profile-----------------------------

export const profile = async (user) => {

  return user;
};


// -----------------------------Profile Image-----------------------------

export const profileImage = async (file, user) => {
  console.log(user.profilePic.length);
  
  if (user.profilePic.length < 2) {
    user.profilePic.push(file.finalPath);
    await user.save();
    return user;
  } else {
    throw conflictException("You can only upload 2 profile picture at max , please delete one of them to upload a new one");
  }
};


// -----------------------------Profile Cover Image-----------------------------

export const profileCoverImage = async (files , user) => {
  user.profileCoverPic = files.map(file => file.finalPath);
  await user.save();
  return user;
};


// -----------------------------Delete Profile Image----------------------------

export const deleteProfileImage = async (user, body) => {
  const { imagePath } = body;
  if (!imagePath) {
    throw conflictException("Image path is required")
  }
  
  console.log(user.profilePic , imagePath);
  

  if (!user.profilePic.includes(imagePath)) {
    throw notFoundException("Image not found in user's profile")
  }

  const fullPath = Path.resolve(imagePath);

  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }

  user.profilePic = user.profilePic.filter((img) => img !== imagePath);
  await user.save();

  return true;
}


// -----------------------------Upload profile image-----------------------------

export const uploadProfileImage = async (file, user) => {
  if (user.profilePic.length >= 2) {
    throw conflictException("You can only upload 2 profile picture at max , please delete one of them to upload a new one");
  }

  if (user.profilePic.length > 0) {
    user.gallery.push(user.profilePic[0]);
  }

  user.profilePic = [file.finalPath];
  await user.save();
  return user;
}
 

// -----------------------------Share Profile-----------------------------

export const shareProfile = async (userId) => {
  
  const profile = await findOne({
    model: userModel,
    filter: {_id: userId},
    select: "firstName lastName email phone profilePic"
  });
  // console.log(profile.userName);
  
  if(!profile){
    throw notFoundException("User not found");
  }
  if(profile.phone){
    profile.phone = await decrypt(profile.phone);
  }
  return profile;
};

// -----------------------------Rotate Token-----------------------------

export const rotateToken = async (user, {sub ,jti , iat} , issuer) => {

  if ((iat + ACCESS_TOKEN_EXPIRY) * 1000 > Date.now() + ( 5 * 60 * 1000)) {
    throw conflictException("Current access token is still valid")
  }

  await createRevokeToken({
    userId: sub,
    jti,
    ttl: iat + REFRESH_TOKEN_EXPIRY
  })
 

  const {access_token , refresh_token} = await createLoginCredentials({ user, issuer })

  return {access_token, refresh_token}
};

// -----------------------------Update password-----------------------------

export const updatePassword = async (user, newPassword) => { 
  console.log(await compareHash(newPassword, user.password));
  
  if(await compareHash(newPassword, user.password)){
    throw conflictException({message: "New password cannot be the same as the old password"})
  }
  user.password = await generateHash(newPassword);
  await user.save();
  return user;
}

// export const AddProfileImage = async (user, file) => {
//   const image = file.path;
//   console.log(image);
//     const updatedUser = await userModel.findByIdAndUpdate(user._id, { profilePic: image });
//     return updatedUser;
// }


