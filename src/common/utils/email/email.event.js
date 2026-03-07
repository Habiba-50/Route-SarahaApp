import { EventEmitter } from "node:events";
import { sendEmail } from "./send.email.js";
import { emailTemplate } from "./template.email.js";

export const emailEmitter = new EventEmitter();

emailEmitter.on(
  "confirm-email",
  async ({ to, subject = "Verify_Account", title = "Confirm_Email", code }) => {
    try {
      await sendEmail({
        to,
        subject,
        html: emailTemplate({ code, title }),
      });
    } catch (error) {
        // console.error("Error sending email:", error);
        //Roleback or handle the error as needed
    }
  },
);
