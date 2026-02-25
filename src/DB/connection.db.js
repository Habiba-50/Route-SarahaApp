import mongoose from "mongoose";
import { DB_URI } from "../../config/config.service.js";
import { profileViewModel, userModel } from "./model/index.js";

export const connectDB = async () => {
    try {
        console.log("Connecting to DB...");
        await mongoose.connect(DB_URI, { serverSelectionTimeoutMS: 5000 })
        console.log("DB connected successfully ✅");
        // Only sync indexes if connection is successful
        await userModel.syncIndexes().catch(err => console.error("Index sync failed:", err.message));
        await profileViewModel.syncIndexes().catch(err => console.error("Index sync failed:", err.message));

    }
    catch (error) {
        console.error("DB connection failed ❌");
        console.error("Error Message:", error.message);
        console.error("URI used:", DB_URI.replace(/:([^@]+)@/, ":****@")); // Mask password
        process.exit(1); // Exit process if DB connection is critical
    }
}