import { Types } from "mongoose";
import { ACCESS_TOKEN_EXPIRY } from "../../../config/config.service.js"
import { AudienceEnum, TokenTypeEnum } from "../../common/enums/security.enum.js";
import { badRequestException, createLoginCredentials, decrypt, generateToken, getTokenSignature, notFoundException } from "../../common/utils/index.js";
import { createOne, find, findById, findOne } from "../../DB/db.service.js";
import { userModel, profileViewModel } from "../../DB/index.js";
import { RoleEnum } from "../../common/enums/user.enum.js";

// export const profile = async (user) => {
  

  

//   if(user.phone){
//     user.phone = await decrypt(user.phone);
//   }
  
//   return user;
// };


export const shareProfile = async (viewer, userId) => {
  const profileId = userId ?? viewer._id;

  const profile = await findOne({
    model: userModel,
    filter: { _id: profileId },
    select: "firstName lastName email phone",
    options: { lean: true },
  });

  if (!profile) {
    throw notFoundException("User not found");
  }

  if (profile.phone) {
    profile.phone = await decrypt(profile.phone);
  }

  const viewerId = viewer._id;

  if (viewerId === profileId) {
    const countViewers = await profileViewModel.countDocuments({
      profileId: profileId,
    });

    profile.views = countViewers;
    return profile;
  }

  if (viewer.role !== RoleEnum.Admin) {
    try {
      await createOne({
        model: profileViewModel,
        data: [{ viewerId, profileId }],
      });
    } catch (error) {
      // duplicate key error 
    }

    return profile;
  }

  const viewers = await find({
    model: profileViewModel,
    filter: { profileId },
    select: "viewerId",
    options: {
      populate: { path: "viewerId", select: "username email phone" },
      lean: true,
    },
  });

  for (const viewer of viewers) {
    if (viewer.viewerId.phone) {
      viewer.viewerId.phone = await decrypt(viewer.viewerId.phone);
    }
  }

  profile.views = viewers;
  return profile;
};


export const rotateToken = async (user, issuer) => {

  // const { accessSignature, audience } = await getTokenSignature(user.role);

  // const newAccessToken = await generateToken({
  //   payload: { sub: user._id },
  //   signature: accessSignature,
  //   options: {
  //     issuer,
  //     audience: [TokenTypeEnum.ACCESS, audience],
  //     expiresIn: ACCESS_TOKEN_EXPIRY
  //   }
  // })

  const {access_token} = await createLoginCredentials({ user, issuer })

  return {access_token}
};


export const AddProfileImage = async (user, file) => {
  const image = file.path;
  // console.log(image);
    const updatedUser = await userModel.findByIdAndUpdate(user._id, { profilePic: image });
    return updatedUser;
}


