import { ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY } from "../../../config/config.service.js"
import { AudienceEnum, LogoutEnum, TokenTypeEnum } from "../../common/enums/security.enum.js";
import { conflictException, createLoginCredentials, decrypt, generateToken, getTokenSignature, notFoundException } from "../../common/utils/index.js";
import { createOne, deleteMany, findById, findOne } from "../../DB/db.service.js";
import { tokenModel, userModel } from "../../DB/index.js";
import Path from "path";
import fs from "fs";


export const logout = async ({flag}, user, {jti , iat}) => { 
  
  let status = 200

  switch (flag) {
    case LogoutEnum.All:
      user.changeCredentialsTime = new Date();
      await user.save();

      await deleteMany({model: tokenModel, filter: {userId: user._id}})
      break;
  
    default:
      await createOne({
        model: tokenModel,
        data: [{
          userId: user._id,
          jti,
          expiresIn: new Date(iat * 1000 + REFRESH_TOKEN_EXPIRY * 1000),
        }]
      })
      status = 201
      break;
  }

  
  return status;
}

export const profile = async (user) => {

  return user;
};

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

export const profileCoverImage = async (files , user) => {
  user.profileCoverPic = files.map(file => file.finalPath);
  await user.save();
  return user;
};

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



export const rotateToken = async (user, {jti , iat} , issuer) => {

  if ((iat + ACCESS_TOKEN_EXPIRY) * 1000 > Date.now() + ( 5 * 60 * 1000)) {
    throw conflictException("Current access token is still valid")
  }
  await createOne({
    model: tokenModel,
    data: [
      {
        userId: user._id,
        jti,
        expiresIn: new Date(iat * 1000 + REFRESH_TOKEN_EXPIRY * 1000),
      },
    ],
  });

  const {access_token , refresh_token} = await createLoginCredentials({ user, issuer })

  return {access_token, refresh_token}
};


// export const AddProfileImage = async (user, file) => {
//   const image = file.path;
//   console.log(image);
//     const updatedUser = await userModel.findByIdAndUpdate(user._id, { profilePic: image });
//     return updatedUser;
// }


