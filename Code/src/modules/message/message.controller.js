import { Router } from "express";
import { badRequestException, decodeToken, fileFieldValidation, localFileUpload, successResponse } from "../../common/utils/index.js";
import { deleteMessage, getMessage, getMessages, sendMessage } from "./message.service.js";
import { validation } from "../../middleware/validation.middleware.js";
import * as validators from "./message.validation.js"
import { TokenTypeEnum } from "../../common/enums/security.enum.js";
import { authentication } from "../../middleware/authentication.middleware.js";

const router = Router({caseSensitive:true , strict:true })

router.get("/list",
    authentication(),
    async (req, res , next) => {
        const messages = await getMessages(req.user);
        return successResponse(res , 200, {messages})
    }  
);

router.post("/:receiverId",
    async (req , res , next) => {
        if (req.headers.authorization) {
            const {user , decoded} = await decodeToken( req.headers?.authorization, TokenTypeEnum.ACCESS)
                req.user = user
                req.decoded = decoded
        }
        next()
    },
    localFileUpload({ validation: fileFieldValidation.image, customPath: "Messages", maxSize: 1 }).array("attachments", 2),
    validation(validators.sendMessage),
    async (req, res, next) => {
        if (!req.body?.content && !req.fields?.length) {
        throw badRequestException({message:"Validation Error" , extra : {key : "body", path:['content'], message:"missing content"} })
    }
    const message = await sendMessage(req.params.receiverId, req.body, req.files , req.user);
    return successResponse(res , 201, {message})
}
)

router.get("/:messageId",
    authentication(),
    validation(validators.getMessage),
    async (req, res , next) => {
        const message = await getMessage(req.params.messageId,req.user);
        return successResponse(res , 200, {message})
    }  
);

router.delete("/:messageId",
    authentication(),
    validation(validators.getMessage),
    async (req, res, next) => {
        const result = await deleteMessage(req.params.messageId, req.user)
        return successResponse(res , 200 ,{ message : "Message deleted successfully"})
    }
)

export default router;