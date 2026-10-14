
import "dotenv/config";
import mongoose from "mongoose";

import connectDB from "../config/database.js";
import User from "../models/User.js";
import Role from "../models/Role.js";

const migrateUserRoleRefs = async () => {
  let migrated = 0;
  let alreadyCorrect = 0;
  let missingRoles = 0;
  let conflicts = 0;

  try {
    await connectDB();

    const users = await User.find({})
      .select("_id role roleRef")
      .lean();

    console.log(`Users found: ${users.length}`);

    for (const user of users) {
      const roleName = user.role?.trim().toUpperCase();

      if (!roleName) {
        console.error(
          `User ${user._id} has no role string. Skipping.`
        );
        missingRoles++;
        continue;
      }

      const matchingRole = await Role.findOne({
        name: roleName,
      })
        .select("_id name")
        .lean();

      if (!matchingRole) {
        console.error(
          `No Role document found for "${roleName}" ` +
          `(user: ${user._id}).`
        );
        missingRoles++;
        continue;
      }

      // Do not overwrite an existing, different reference silently.
      if (user.roleRef) {
        if (
          user.roleRef.toString() ===
          matchingRole._id.toString()
        ) {
          alreadyCorrect++;
        } else {
          console.error(
            `Role reference conflict for user ${user._id}. ` +
            `Existing roleRef does not match "${roleName}".`
          );
          conflicts++;
        }

        continue;
      }

      // Update only users whose roleRef is still empty.
      const result = await User.updateOne(
        {
          _id: user._id,
          $or: [
            { roleRef: null },
            { roleRef: { $exists: false } },
          ],
        },
        {
          $set: { roleRef: matchingRole._id },
        }
      );

      if (result.modifiedCount === 1) {
        migrated++;
        console.log(
          `Migrated user ${user._id} -> ${roleName}`
        );
      } else {
        console.warn(
          `User ${user._id} was not updated; inspect the record.`
        );
      }
    }

    console.log("\nMigration summary:");
    console.log(`Migrated: ${migrated}`);
    console.log(`Already correct: ${alreadyCorrect}`);
    console.log(`Missing roles or user roles: ${missingRoles}`);
    console.log(`Conflicts: ${conflicts}`);

    if (missingRoles > 0 || conflicts > 0) {
      process.exitCode = 1;
    }
  } catch (error) {
    console.error("User role migration failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

migrateUserRoleRefs();