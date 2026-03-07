import nodemailer from "nodemailer";
import { APPLICATION_NAME, EMAIL_APP, EMAIL_APP_PASS } from "../../../../config/config.service.js";
import { badRequestException } from "../response/index.js";

export const sendEmail = async ({
  from,
  to,
  cc,
  bcc,
  subject,
  attachments = [],
  html,
} = {}) => {

  if (! to && ! cc && ! bcc) {
    throw badRequestException({ message: "Invalid recipient" });
  }

  if ((! html?.length ?? 0) > 0 && (!attachments?.length ?? 0) > 0) {
    throw badRequestException({ message: "Invalid mail content" });
  }

  // Create a transporter object to detect the email service provider and send the email
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: EMAIL_APP,
      pass: EMAIL_APP_PASS,
    },
  });


 
  const info = await transporter.sendMail({
      from : `"${APPLICATION_NAME}" <${EMAIL_APP}>`, // sender address
      to ,
      cc,
      bcc,
      subject,
      html, // HTML version of the message
      attachments
    });

  console.log("Message sent:", info.messageId);
  
  
  };



