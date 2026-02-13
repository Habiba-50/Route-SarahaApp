import mongoose from "mongoose";
import { GenderEnum, ProviderEnum, RoleEnum } from "../../common/enums/index.js";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is mandatory"],
      minLength: [2, "First name must be at least 2 characters long"],
      maxLength: [25, "First name must be at most 25 characters long"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is mandatory"],
      minLength: [2, "Last name must be at least 2 characters long"],
      maxLength: [25, "Last name must be at most 25 characters long"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
    },
    password: {
      type: String,
      required: function () {
        return this.provider == ProviderEnum.System
      }
    },

    phone: String,

    DOB: Date,

    gender: {
      type: String,
      enum: Object.values(GenderEnum),
      default: GenderEnum.MALE,
    },

    provider: {
      type: String,
      enum: Object.values(ProviderEnum),
      default: ProviderEnum.System,
    },

    role: {
      type: Number,
      enum: Object.values(RoleEnum),
      default: RoleEnum.User,
    },

    profilePic: String,

    confirmEmail: Date,

    isVerified: { type: Boolean, default: false },
    otpCode: String,
    otpExpiresAt: Date,
  },
  {
    collection: "users",
    strict: true,
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

userSchema
  .virtual("userName")
  .set(function (value) {
    const [firstName, lastName] = value.split(" ") || [];
    this.firstName = firstName;
    this.lastName = lastName;
  })
  .get(function () {
    return this.firstName + " " + this.lastName;
  });

export const userModel =
  mongoose.models.User || mongoose.model("User", userSchema);
