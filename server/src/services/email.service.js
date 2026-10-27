import { getEmailTransporter } from "../config/email.js";

const getSender = () => {
  const sender = process.env.SMTP_FROM;

  if (!sender) {
    throw new Error("SMTP_FROM is not configured.");
  }

  return sender;
};

const sendOtpEmail = async ({ to, code, purpose, expiresAt }) => {
  const transporter = getEmailTransporter();
  const sender = getSender();

  const subjects = {
    GUEST_REGISTRATION: "Verify your Gethéva Hotel email",
    STAFF_EMAIL_VERIFICATION: "Verify your Gethéva Hotel staff email",
    PASSWORD_RESET: "Your Gethéva Hotel password reset code",
  };

  const descriptions = {
    GUEST_REGISTRATION:
      "Use this code to verify your email address and complete your guest registration.",
    STAFF_EMAIL_VERIFICATION:
      "Use this code to verify the email address associated with your staff account.",
    PASSWORD_RESET: "Use this code to continue resetting your password.",
  };

  const subject = subjects[purpose];
  const description = descriptions[purpose];

  if (!subject || !description) {
    throw new Error("Unsupported email OTP purpose.");
  }

  if (!/^\d{6}$/.test(code)) {
    throw new Error("Invalid OTP format.");
  }

  const expiryMinutes = Math.max(
    1,
    Math.ceil((expiresAt.getTime() - Date.now()) / 60000),
  );

  if (expiryMinutes <= 0) {
    throw new Error("The OTP has already expired.");
  }

  await transporter.sendMail({
    from: sender,
    to,
    subject,
    text: [
      "Gethéva Hotel",
      "",
      description,
      "",
      `Your verification code is: ${code}`,
      "",
      `This code expires in approximately ${expiryMinutes} minute(s).`,
      "Do not share this code with anyone.",
      "If you did not request this code, you can ignore this email.",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 520px; margin: auto;">
        <h2>Gethéva Hotel</h2>
        <p>${description}</p>
        <div style="font-size: 30px; font-weight: bold; letter-spacing: 8px; padding: 16px 0;">
          ${code}
        </div>
        <p>This code expires in approximately ${expiryMinutes} minute(s).</p>
        <p><strong>Do not share this code with anyone.</strong></p>
        <p>If you did not request this code, you can ignore this email.</p>
      </div>
    `,
  });
};

// Keep the existing long-token email function temporarily.
// We will remove it after the OTP password-reset flow is working.

const sendPasswordResetEmail = async ({ to, code, expiresAt }) => {
  const transporter = getEmailTransporter();
  const sender = getSender();

  const expiresInMinutes = Math.max(
    1,
    Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 60000),
  );

  await transporter.sendMail({
    from: sender,
    to,
    subject: "Your Gethéva Hotel password reset code",
    text: [
      "We received a request to reset your password.",
      "",
      `Your password reset code is: ${code}`,
      "",
      `This code expires in approximately ${expiresInMinutes} minutes.`,
      "If you did not request this, you can ignore this email.",
      "For your security, do not share this code with anyone.",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Password Reset</h2>
        <p>We received a request to reset your password.</p>
        <p>Your password reset code is:</p>
        <p style="font-size: 28px; font-weight: bold; letter-spacing: 6px;">
          ${code}
        </p>
        <p>This code expires in approximately ${expiresInMinutes} minutes.</p>
        <p>If you did not request this, you can ignore this email.</p>
        <p>For your security, do not share this code with anyone.</p>
      </div>
    `,
  });
};

export { sendOtpEmail, sendPasswordResetEmail };
