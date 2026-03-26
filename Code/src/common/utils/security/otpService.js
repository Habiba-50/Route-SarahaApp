// security/otpService.js
import nodemailer from 'nodemailer';

// Transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS
  }
});

// generateOTP
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// sendOTPEmail
export const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: `"Security Team" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your Verification Code",
    html: `
      <div style="font-family: Arial, sans-serif; text-align: center;">
        <h2>Account Verification</h2>
        <p>Your verification code is:</p>
        <h1 style="color: #4CAF50; letter-spacing: 5px;">${otp}</h1>
        <p>This code is valid for 10 minutes only.</p>
      </div>
    `
  };
  return transporter.sendMail(mailOptions);
};

