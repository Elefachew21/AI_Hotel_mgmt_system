import mongoose from "mongoose";
import AuditLog from "../models/AuditLog.js";
import logger from "../config/logger.js";

const sensitiveKeyPattern =
  /password|token|secret|authorization|cookie|card|cvv|smtpPass|privateKey/i;

const sanitizeDetails = (value, depth = 0) => {
  if (depth > 5) return "[MAX_DEPTH]";

  if (value === null || value === undefined) {
    return value;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? "[INVALID_DATE]"
      : value.toISOString();
  }

  if (value instanceof mongoose.Types.ObjectId) {
    return value.toString();
  }

  if (typeof value === "string") {
    return value.slice(0, 500);
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.slice(0, 50).map((item) => sanitizeDetails(item, depth + 1));
  }

  if (typeof value === "object") {
    const prototype = Object.getPrototypeOf(value);

    // Accept only plain objects, not database documents
    // or arbitrary class instances.
    if (prototype !== Object.prototype && prototype !== null) {
      return "[UNSUPPORTED_OBJECT]";
    }

    const result = {};
    const entries = Object.entries(value).slice(0, 50);

    for (const [key, item] of entries) {
      if (sensitiveKeyPattern.test(key)) {
        continue;
      }

      result[key] = sanitizeDetails(item, depth + 1);
    }

    return result;
  }

  return "[UNSUPPORTED_VALUE]";
};

const recordAuditEvent = async ({
  actor = null,
  actorRole = null,
  action,
  resourceType,
  resourceId = null,
  outcome = "SUCCESS",
  requestId = null,
  details = {},
  session = null,
}) => {
  try {
    const safeDetails = sanitizeDetails(details) ?? {};

    const [record] = await AuditLog.create(
      [
        {
          actor,
          actorRole,
          action,
          resourceType,
          resourceId: resourceId === null ? null : String(resourceId),
          outcome,
          requestId,
          details: safeDetails,
        },
      ],
      session ? { session } : {},
    );

    return record;
  } catch (error) {
    logger.error(
      {
        err: error,
        action,
        resourceType,
        requestId,
      },
      "Failed to record audit event",
    );

    throw error;
  }
};

export { recordAuditEvent };
