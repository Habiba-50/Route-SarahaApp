import { notFoundException } from "../../common/utils/index.js";
import { createOne, find, findOne, findOneAndDelete, messageModel, userModel } from "../../DB/index.js";


export const sendMessage = async (receiverId, {content = undefined } = {}, files , user) => {
    
  const account = await findOne({
    model: userModel,
    filter: { _id: receiverId, isVerified: { $exists: true } }
  })

  if (!account) {
    throw notFoundException("Fail to find matching receiver account")
  }

  const message = await createOne({
    model: messageModel,
    data: [{
      content,
      attachment: files.map((file) => file.finalPath),
      receiverId,
      senderId: user? user._id : undefined
    }]
  })

  return message
};


export const getMessage = async (messageId , user ) => {
    const message = await findOne({
      model: messageModel,
        filter: {
            _id: messageId,
            $or: [
                { senderId: user._id },
                {receiverId : user._id}
            ]
        },
        select:"-senderId"
    });

    if (!message) {
      throw notFoundException("Invalid Message or not authorized action");
    }

    return message
}


export const getMessages = async ( user ) => {
    const messages = await find({
      model: messageModel,
        filter: {
            // _id: messageId,
            $or: [
                { senderId: user._id },
                {receiverId : user._id}
            ]
        },
        select:"-senderId"
    });

    if (!messages) {
      throw notFoundException("Not found messages");
    }

    return messages
}


export const deleteMessage = async (messageId , user) => {
    const message = await findOneAndDelete({
      model: messageModel,
        filter: {
        _id : messageId,
        receiverId: user._id,
      },
    });

    if (!message) {
        throw notFoundException("Invalid Message or not authorized action");

    }
}