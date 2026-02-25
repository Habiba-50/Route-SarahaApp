import mongoose from "mongoose";
import { userModel } from "./user.model.js";

const profileViewSchema = new mongoose.Schema(
    {
       viewerId:{type: mongoose.Schema.Types.ObjectId, ref: userModel},
       profileId:{type: mongoose.Schema.Types.ObjectId, ref: userModel},
       
    }, {
        timestamps: true,
        collection: "profileViews",
        strict: true,
     }
)

profileViewSchema.index({ viewerId: 1, profileId: 1 }, { unique: true });

profileViewSchema.index({createdAt:1}, {expireAfterSeconds:60*60*24*90});

export const profileViewModel = mongoose.models.profileViewModel || mongoose.model("profileViews", profileViewSchema)
