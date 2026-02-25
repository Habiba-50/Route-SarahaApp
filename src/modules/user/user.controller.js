import { Router } from "express";
import { profile, rotateToken, AddProfileImage, shareProfile } from "./user.service.js";
import { authentication, authorization } from "../../middleware/authentication.middleware.js";
import { successResponse } from "../../common/utils/response/success.respone.js";
import { RoleEnum } from "../../common/enums/user.enum.js";
import { TokenTypeEnum } from "../../common/enums/security.enum.js";
import { uploadSingleFile } from "../../middleware/upload.middleware.js";
    const router=Router()

router.get("/profile" ,authentication(), authorization([RoleEnum.User]), async (req,res,next)=>{
    const result = await profile(req.user)
    
    return successResponse(res, 200, { result })
})

router.get("/:userId/share-profile" , async (req,res,next)=>{
    const result = await shareProfile(req.params.userId)
    
    return successResponse(res, 200, { result })
})

router.get("/rotate-token" ,authentication(TokenTypeEnum.REFRESH), authorization([RoleEnum.User]), async (req,res,next)=>{
    const result = await rotateToken(req.user, `${req.protocol}://${req.host}`)
    
    return successResponse(res, 200, { result })
})


router.patch("/profile/image", authentication(), authorization([RoleEnum.User]), uploadSingleFile.single("image"), async (req, res, next) => {
    const result = await AddProfileImage(req.user, req.file);
    return successResponse(res, 200, { result });
});

export default router




