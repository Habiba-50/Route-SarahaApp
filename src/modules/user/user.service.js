import { ACCESS_TOKEN_EXPIRY } from "../../../config/config.service.js"
import { AudienceEnum, TokenTypeEnum } from "../../common/enums/security.enum.js";
import { createLoginCredentials, decrypt, generateToken, getTokenSignature } from "../../common/utils/index.js";
import { findById, findOne } from "../../DB/db.service.js";
import { userModel } from "../../DB/index.js";

export const profile = async (user) => {
  // const user = await decodeToken(authorization, [TokenTypeEnum.ACCESS])
  
  // const verifyData = await verifyToken(authorization , signature)

  // console.log({ verifyData });

  // const user = await findById({
  //   model: userModel,
  //   id: verifyData.sub,
  // });
  
  return user;
};


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
  console.log(image);
    const updatedUser = await userModel.findByIdAndUpdate(user._id, { profilePic: image });
    return updatedUser;
}


