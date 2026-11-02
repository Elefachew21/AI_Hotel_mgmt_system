import {
  createUser,
  findUserByEmail,
  comparePassword,
} from "../services/auth.service.js";
import { generateAccessToken } from "../services/token.service.js";
import {
  createRefreshSession,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllRefreshSessions,
} from "../services/refreshToken.service.js";
import { recordAuditEvent } from "../services/auditLog.service.js";
import User from "../models/User.js";
import { deliverOtp } from "../services/otpDelivery.service.js";
import { verifyOtp } from "../services/otp.service.js";
import {
  requestPasswordReset,
  resetPassword,
} from "../services/passwordReset.service.js";

// Keep audit failures from unintentionally changing the authentication
// response. Audit persistence errors are already logged by recordAuditEvent.
const recordAuthAudit = async (event) => {
  try {
    await recordAuditEvent(event);
  } catch {
    // The audit service already logs persistence errors.
  }
};

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

    if (!user || !user.roleRef) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code.",
      });
    }

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
  let attemptedUser = null;

  try {
    const { email, password } = req.body;
    const user = await findUserByEmail(email);

    attemptedUser = user;

    if (!user) {
      await recordAuthAudit({
        action: "AUTH_LOGIN_FAILURE",
        resourceType: "AUTH_SESSION",
        outcome: "FAILURE",
        requestId: req.id ?? null,
        details: { reason: "INVALID_CREDENTIALS" },
      });

      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Use the assigned role name when available, otherwise use the
    // legacy role string stored on the User document.
    const actorRole = user.roleRef?.name ?? user.role ?? null;

    if (user.status !== "ACTIVE") {
      await recordAuthAudit({
        actor: user._id,
        actorRole,
        action: "AUTH_LOGIN_FAILURE",
        resourceType: "AUTH_SESSION",
        resourceId: user._id,
        outcome: "FAILURE",
        requestId: req.id ?? null,
        details: { reason: "ACCOUNT_NOT_ACTIVE" },
      });

      return res.status(403).json({
        success: false,
        message: "Account is not active.",
      });
    }

    const passwordMatches = await comparePassword(password, user.passwordHash);

    if (!passwordMatches) {
      await recordAuthAudit({
        actor: user._id,
        actorRole,
        action: "AUTH_LOGIN_FAILURE",
        resourceType: "AUTH_SESSION",
        resourceId: user._id,
        outcome: "FAILURE",
        requestId: req.id ?? null,
        details: { reason: "INVALID_CREDENTIALS" },
      });

      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (user.emailVerified !== true) {
      await recordAuthAudit({
        actor: user._id,
        actorRole,
        action: "AUTH_LOGIN_FAILURE",
        resourceType: "AUTH_SESSION",
        resourceId: user._id,
        outcome: "FAILURE",
        requestId: req.id ?? null,
        details: { reason: "EMAIL_NOT_VERIFIED" },
      });

      return res.status(403).json({
        success: false,
        code: "EMAIL_NOT_VERIFIED",
        message: "Please verify your email address before logging in.",
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    // Create the login session first.
    const { refreshToken, sessionId } = await createRefreshSession(user);

    // Generate an access token linked to that session.
    const accessToken = generateAccessToken(user, sessionId);
    await recordAuthAudit({
      actor: user._id,
      actorRole,
      action: "AUTH_LOGIN_SUCCESS",
      resourceType: "AUTH_SESSION",
      resourceId: user._id,
      outcome: "SUCCESS",
      requestId: req.id ?? null,
      details: { method: "PASSWORD" },
    });

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        accessToken,
        refreshToken,
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
    await recordAuthAudit({
      actor: attemptedUser?._id ?? null,
      actorRole: attemptedUser?.roleRef?.name ?? attemptedUser?.role ?? null,
      action: "AUTH_LOGIN_ERROR",
      resourceType: "AUTH_SESSION",
      resourceId: attemptedUser?._id ?? null,
      outcome: "FAILURE",
      requestId: req.id ?? null,
      details: { reason: "UNEXPECTED_ERROR" },
    });

    return next(error);
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

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body ?? {};

    if (typeof refreshToken !== "string" || !refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required.",
      });
    }

    const rotated = await rotateRefreshToken(refreshToken);

    const user = await User.findById(rotated.userId).select(
      "firstName lastName email phone role roleRef status tokenVersion emailVerified",
    );

    if (!user || user.status !== "ACTIVE" || !user.emailVerified) {
      await revokeRefreshToken(rotated.refreshToken);

      return res.status(401).json({
        success: false,
        message: "Session is no longer valid. Please log in again.",
      });
    }

    const accessToken = generateAccessToken(user, rotated.sessionId);
    return res.status(200).json({
      success: true,
      message: "Tokens refreshed successfully.",
      data: {
        accessToken,
        refreshToken: rotated.refreshToken,
      },
    });
  } catch (error) {
    if (error.statusCode === 401) {
      return res.status(401).json({
        success: false,
        message: error.message,
      });
    }

    return next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body ?? {};

    // Step 1: Validate that a refresh token was supplied.
    if (typeof refreshToken !== "string" || !refreshToken.trim()) {
      await recordAuthAudit({
        actor: req.user?.id ?? null,
        actorRole: req.user?.role ?? null,
        action: "AUTH_LOGOUT_FAILURE",
        resourceType: "AUTH_SESSION",
        resourceId: req.user?.id ?? null,
        outcome: "FAILURE",
        requestId: req.id ?? null,
        details: { reason: "REFRESH_TOKEN_REQUIRED" },
      });

      return res.status(400).json({
        success: false,
        message: "Refresh token is required.",
      });
    }

    // Step 2: Attempt to revoke the refresh-token session.
    const revoked = await revokeRefreshToken(refreshToken);

    // Step 3: Reject invalid, unknown, or already-revoked tokens.
    if (!revoked) {
      await recordAuthAudit({
        actor: req.user?.id ?? null,
        actorRole: req.user?.role ?? null,
        action: "AUTH_LOGOUT_FAILURE",
        resourceType: "AUTH_SESSION",
        resourceId: req.user?.id ?? null,
        outcome: "FAILURE",
        requestId: req.id ?? null,
        details: { reason: "INVALID_REFRESH_SESSION" },
      });

      return res.status(401).json({
        success: false,
        message: "Invalid or already revoked refresh token.",
      });
    }

    // Step 4: Record successful logout only after actual revocation.
    await recordAuthAudit({
      actor: req.user?.id ?? null,
      actorRole: req.user?.role ?? null,
      action: "AUTH_LOGOUT_SUCCESS",
      resourceType: "AUTH_SESSION",
      resourceId: req.user?.id ?? null,
      outcome: "SUCCESS",
      requestId: req.id ?? null,
      details: { method: "REFRESH_TOKEN" },
    });

    return res.status(200).json({
      success: true,
      message: "Logout completed.",
    });
  } catch (error) {
    await recordAuthAudit({
      actor: req.user?.id ?? null,
      actorRole: req.user?.role ?? null,
      action: "AUTH_LOGOUT_FAILURE",
      resourceType: "AUTH_SESSION",
      resourceId: req.user?.id ?? null,
      outcome: "FAILURE",
      requestId: req.id ?? null,
      details: { reason: "UNEXPECTED_ERROR" },
    });

    return next(error);
  }
};
const logoutAll = async (req, res, next) => {
  const actorId = req.user?.id ?? null;
  const actorRole = req.user?.role ?? null;

  try {
    const user = await User.findById(actorId).select("tokenVersion");

    if (!user) {
      await recordAuthAudit({
        actor: actorId,
        actorRole,
        action: "AUTH_LOGOUT_ALL_FAILURE",
        resourceType: "AUTH_SESSION",
        resourceId: actorId,
        outcome: "FAILURE",
        requestId: req.id ?? null,
        details: { reason: "USER_NOT_FOUND" },
      });

      return res.status(401).json({
        success: false,
        message: "User account not found.",
      });
    }

    await revokeAllRefreshSessions(user._id);

    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    await user.save();

    await recordAuthAudit({
      actor: user._id,
      actorRole,
      action: "AUTH_LOGOUT_ALL_SUCCESS",
      resourceType: "AUTH_SESSION",
      resourceId: user._id,
      outcome: "SUCCESS",
      requestId: req.id ?? null,
      details: { method: "ALL_SESSIONS" },
    });

    return res.status(200).json({
      success: true,
      message: "Logged out from all sessions. Please log in again.",
    });
  } catch (error) {
    await recordAuthAudit({
      actor: actorId,
      actorRole,
      action: "AUTH_LOGOUT_ALL_FAILURE",
      resourceType: "AUTH_SESSION",
      resourceId: actorId,
      outcome: "FAILURE",
      requestId: req.id ?? null,
      details: { reason: "UNEXPECTED_ERROR" },
    });

    return next(error);
  }
};

export {
  register,
  login,
  resetPasswordController,
  forgotPassword,
  verifyEmail,
  resendVerification,
  refresh,
  logout,
  logoutAll,
};
