import Otp from "../models/Otp.js";
import { issueOtp } from "./otp.service.js";
import { sendOtpEmail } from "./email.service.js";

const deliverOtp = async ({ userId, email, purpose }) => {
  const issued = await issueOtp({ userId, email, purpose });

  try {
    await sendOtpEmail({
      to: issued.email,
      code: issued.code,
      purpose: issued.purpose,
      expiresAt: issued.expiresAt,
    });

    // Never return the code to the API caller.
    return {
      email: issued.email,
      expiresAt: issued.expiresAt,
    };
  } catch (error) {
    // Invalidate only the exact code that failed to be delivered.
    // A newer code must not be invalidated by an older request.
    const crypto = await import("node:crypto");
    const secret = process.env.OTP_HMAC_SECRET;

    const codeHash = crypto
      .createHmac("sha256", secret)
      .update(`${issued.purpose}:${issued.email}:${issued.code}`)
      .digest("hex");

    await Otp.updateOne(
      {
        userId: issued.userId,
        email: issued.email,
        purpose: issued.purpose,
        codeHash,
        consumedAt: null,
      },
      {
        $set: { consumedAt: new Date() },
      },
    );

    // Avoid logging OTPs, recipient addresses, or SMTP credentials.
    console.error("OTP email delivery failed.", {
      purpose: issued.purpose,
      code: error.code,
      message: error.message,
    });

    const deliveryError = new Error(
      "Unable to deliver the verification email. Please try again later.",
    );
    deliveryError.statusCode = 503;
    throw deliveryError;
  }
};

export { deliverOtp };
