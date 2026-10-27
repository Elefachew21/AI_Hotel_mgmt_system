import {
  createUser,
  findUserByEmail,
  comparePassword,
} from "../services/auth.service.js";
import { generateAccessToken } from "../services/token.service.js";

import User from "../models/User.js";
import { deliverOtp } from "../services/otpDelivery.service.js";
import { verifyOtp } from "../services/otp.service.js";

import {
  requestPasswordReset,
  resetPassword,
} from "../services/passwordReset.service.js";

const register = async (req, res, next) => {
  try {
    const user = await createUser(req.body);

    await deliverOtp({
      userId: user._id,
      email: user.email,
      purpose: "GUEST_REGISTRATION",
    });

    return res.status(201).json({
      success: true,
      message:
        "Registration received. Check your email for the verification code.",
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          emailVerified: false,
          role: user.role,
          status: user.status,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const { email, code } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({
      email: normalizedEmail,
    }).populate({
      path: "roleRef",
      match: { isActive: true },
      select: "name isActive",
    });

    // User must exist and have an active assigned role.
    if (!user || !user.roleRef) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code.",
      });
    }

    // Require an active account as well.
    if (user.status !== "ACTIVE") {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code.",
      });
    }

    if (user.emailVerified) {
      return res.status(200).json({
        success: true,
        message: "Email is already verified.",
      });
    }

    // Choose the OTP purpose according to the assigned role.
    const purpose =
      user.roleRef.name === "GUEST"
        ? "GUEST_REGISTRATION"
        : "STAFF_EMAIL_VERIFICATION";

    await verifyOtp({
      userId: user._id,
      email: normalizedEmail,
      purpose,
      code,
    });

    user.emailVerified = true;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Email verified successfully. You can now log in.",
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (user.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "Account is not active.",
      });
    }

    const passwordMatches = await comparePassword(password, user.passwordHash);

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Never issue an access token to an unverified account.
    if (user.emailVerified !== true) {
      return res.status(403).json({
        success: false,
        code: "EMAIL_NOT_VERIFIED",
        message: "Please verify your email address before logging in.",
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const accessToken = generateAccessToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        accessToken,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          emailVerified: user.emailVerified,
          role: user.role,
          roleRef: user.roleRef,
          status: user.status,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    await requestPasswordReset(req.body.email);

    return res.status(200).json({
      success: true,
      message:
        "If an account with that email exists, password reset instructions will be sent.",
    });
  } catch (error) {
    next(error);
  }
};

const resetPasswordController = async (req, res, next) => {
  try {
    await resetPassword({
      email: req.body.email,
      code: req.body.code,
      password: req.body.password,
    });

    return res.status(200).json({
      success: true,
      message: "Password has been reset successfully.",
    });
  } catch (error) {
    next(error);
  }
};

const resendVerification = async (req, res, next) => {
  try {
    const email = req.body.email.toLowerCase().trim();

    const user = await User.findOne({
      email,
      emailVerified: false,
      status: "ACTIVE",
    })
      .select("_id email emailVerified status")
      .populate({
        path: "roleRef",
        match: { isActive: true },
        select: "name isActive",
      });

    // Use the same response whether an eligible account exists or not.
    if (user && user.roleRef) {
      const purpose =
        user.roleRef.name === "GUEST"
          ? "GUEST_REGISTRATION"
          : "STAFF_EMAIL_VERIFICATION";

      await deliverOtp({
        userId: user._id,
        email: user.email,
        purpose,
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "If an eligible unverified account exists, a new verification code will be sent.",
    });
  } catch (error) {
    next(error);
  }
};

export {
  register,
  login,
  resetPasswordController,
  forgotPassword,
  verifyEmail,
  resendVerification,
};
