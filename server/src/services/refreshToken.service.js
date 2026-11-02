import crypto from "node:crypto";
import RefreshToken from "../models/RefreshToken.js";
import User from "../models/User.js";

const REFRESH_TOKEN_TTL_DAYS = Number(process.env.REFRESH_TOKEN_TTL_DAYS || 7);

const getRefreshTokenExpiry = () => {
  if (!Number.isFinite(REFRESH_TOKEN_TTL_DAYS) || REFRESH_TOKEN_TTL_DAYS <= 0) {
    throw new Error("Invalid refresh-token lifetime configuration.");
  }

  return new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
};

const generateRawRefreshToken = () =>
  crypto.randomBytes(64).toString("base64url");

const hashRefreshToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const createRefreshSession = async (user) => {
  if (!user?._id) {
    throw new Error("A valid user is required to create a session.");
  }

  const rawToken = generateRawRefreshToken();
  const tokenHash = hashRefreshToken(rawToken);
  const sessionId = crypto.randomUUID();

  await RefreshToken.create({
    user: user._id,
    familyId: sessionId,
    tokenHash,
    tokenVersion: user.tokenVersion ?? 0,
    expiresAt: getRefreshTokenExpiry(),
  });

  return {
    refreshToken: rawToken,
    sessionId,
  };
};

const rotateRefreshToken = async (rawToken) => {
  if (typeof rawToken !== "string" || rawToken.length < 20) {
    const error = new Error("Invalid or expired refresh token.");
    error.statusCode = 401;
    throw error;
  }

  const tokenHash = hashRefreshToken(rawToken);
  const now = new Date();

  const existing = await RefreshToken.findOne({ tokenHash }).select(
    "+tokenHash +replacedByHash",
  );

  if (!existing) {
    const error = new Error("Invalid or expired refresh token.");
    error.statusCode = 401;
    throw error;
  }

  // A previously rotated token was submitted again.
  // Revoke all tokens in this login session family.
  if (existing.revokedAt) {
    if (existing.replacedByHash) {
      await RefreshToken.updateMany(
        {
          familyId: existing.familyId,
          revokedAt: null,
        },
        {
          $set: { revokedAt: now },
        },
      );
    }

    const error = new Error(
      "Refresh token reuse detected. Please log in again.",
    );
    error.statusCode = 401;
    throw error;
  }

  if (existing.expiresAt <= now) {
    const error = new Error("Invalid or expired refresh token.");
    error.statusCode = 401;
    throw error;
  }

  const user = await User.findById(existing.user).select("status tokenVersion");

  if (
    !user ||
    user.status !== "ACTIVE" ||
    (user.tokenVersion ?? 0) !== existing.tokenVersion
  ) {
    await RefreshToken.updateMany(
      {
        familyId: existing.familyId,
        revokedAt: null,
      },
      {
        $set: { revokedAt: now },
      },
    );

    const error = new Error("Session is no longer valid. Please log in again.");
    error.statusCode = 401;
    throw error;
  }

  // Prepare the successor token before consuming the current one.
  const nextRawToken = generateRawRefreshToken();
  const nextTokenHash = hashRefreshToken(nextRawToken);

  // Conditional update prevents two simultaneous refresh requests
  // from successfully consuming the same token.
  const consumed = await RefreshToken.findOneAndUpdate(
    {
      _id: existing._id,
      revokedAt: null,
      expiresAt: { $gt: now },
      tokenVersion: user.tokenVersion ?? 0,
    },
    {
      $set: {
        revokedAt: now,
        replacedByHash: nextTokenHash,
        lastUsedAt: now,
      },
    },
    { new: true },
  );

  if (!consumed) {
    // Another request may have consumed this token concurrently.
    const current = await RefreshToken.findById(existing._id).select(
      "+tokenHash +replacedByHash",
    );

    if (current?.revokedAt && current.replacedByHash) {
      await RefreshToken.updateMany(
        {
          familyId: existing.familyId,
          revokedAt: null,
        },
        {
          $set: { revokedAt: new Date() },
        },
      );
    }

    const error = new Error(
      "Refresh token is no longer valid. Please log in again.",
    );
    error.statusCode = 401;
    throw error;
  }

  try {
    await RefreshToken.create({
      user: existing.user,
      familyId: existing.familyId,
      tokenHash: nextTokenHash,
      tokenVersion: user.tokenVersion ?? 0,
      expiresAt: getRefreshTokenExpiry(),
    });
  } catch (error) {
    // If successor creation fails, revoke the remaining family.
    await RefreshToken.updateMany(
      {
        familyId: existing.familyId,
        revokedAt: null,
      },
      {
        $set: { revokedAt: new Date() },
      },
    );

    throw error;
  }

  return {
    userId: user._id.toString(),
    refreshToken: nextRawToken,
    sessionId: existing.familyId,
  };
};

const revokeRefreshToken = async (rawToken) => {
  if (typeof rawToken !== "string" || rawToken.length < 20) {
    return false;
  }

  const tokenHash = hashRefreshToken(rawToken);

  // Find the refresh-token record, including previously rotated tokens.
  const existing = await RefreshToken.findOne({ tokenHash }).select(
    "+tokenHash",
  );

  if (!existing) {
    return false;
  }

  // Revoke every active token belonging to this login session.
  const result = await RefreshToken.updateMany(
    {
      familyId: existing.familyId,
      user: existing.user,
      revokedAt: null,
    },
    {
      $set: { revokedAt: new Date() },
    },
  );

  return result.modifiedCount > 0;
};

const revokeAllRefreshSessions = async (userId) => {
  const result = await RefreshToken.updateMany(
    {
      user: userId,
      revokedAt: null,
    },
    {
      $set: { revokedAt: new Date() },
    },
  );

  return result.modifiedCount;
};

export {
  createRefreshSession,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllRefreshSessions,
};
