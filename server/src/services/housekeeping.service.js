import mongoose from "mongoose";
import HousekeepingTask from "../models/HousekeepingTask.js";
import Room from "../models/Room.js"; 
import { generateHousekeepingTaskNumber } from "./sequence.service.js";
import { emitHousekeepingTaskStarted ,emitHousekeepingTaskCompleted} from "../realtime/housekeeping.events.js";
export const createHousekeepingTask = async ({
    roomId,
        assignedStaff,
        reason,
        session
        
}
) => {
    const taskNumber = await generateHousekeepingTaskNumber(session);
    const [task] = await HousekeepingTask.create(
        [
            {
                taskNumber,
                room: roomId,
                assignedStaff,
                reason: "CHECKOUT",
                status:"PENDING"
            }
        ],{session}
    )
    return task;
}

export const startHousekeepingTask = async (
  taskId,
  userId
) => {
  const session = await mongoose.startSession();

  try {
    let startedTaskId;

    await session.withTransaction(async () => {
      const task = await HousekeepingTask.findById(taskId)
        .session(session);

      if (!task) {
        const error = new Error(
          "Housekeeping task not found"
        );

        error.statusCode = 404;
        throw error;
      }

      if (task.status !== "PENDING") {
        const error = new Error(
          `Housekeeping task cannot be started from ${task.status} status`
        );

        error.statusCode = 409;
        throw error;
      }

      if (!task.assignedStaff) {
        const error = new Error(
          "Housekeeping task has no assigned housekeeper"
        );

        error.statusCode = 409;
        throw error;
      }

      if (task.assignedStaff.toString() !== userId.toString()) {
        const error = new Error(
          "You are not assigned to this housekeeping task"
        );

        error.statusCode = 403;
        throw error;
      }

      const updatedRoom = await Room.findOneAndUpdate(
        {
          _id: task.room,
          isActive: true,
          status: "DIRTY"
        },
        {
          $set: {
            status: "CLEANING"
          }
        },
        {
          new: true,
          session
        }
      );

      if (!updatedRoom) {
        const error = new Error(
          "The room is not currently dirty"
        );

        error.statusCode = 409;
        throw error;
      }

      task.status = "IN_PROGRESS";
      task.startedAt = new Date();
      task.startedBy = userId;

      await task.save({ session });

      startedTaskId = task._id;
    });

    const task= await HousekeepingTask.findById(startedTaskId)
      .populate("room")
      .populate(
        "assignedStaff",
        "firstName lastName email role"
      )
      .populate(
        "startedBy",
        "firstName lastName email role"
    );
    if (task) {
      emitHousekeepingTaskStarted(task);
    }
    return task;

  } finally {
    await session.endSession();
  }
};
export const completeHousekeepingTask = async (taskId, userId) => {
    const session = await mongoose.startSession();
  try {
    let completedTaskID;

    await session.withTransaction(async () => {
      const task = await HousekeepingTask.findById(taskId)
        .session(session);

      if (!task) {
        const error = new Error(
          "Housekeeping task not found"
        );

        error.statusCode = 404;
        throw error;
      }

      if (task.status !== "IN_PROGRESS") {
        const error = new Error(
          `Housekeeping task cannot be completed from ${task.status} status`
        );

        error.statusCode = 409;
        throw error;
      }

      if (!task.assignedStaff) {
        const error = new Error(
          "Housekeeping task has no assigned housekeeper"
        );

        error.statusCode = 409;
        throw error;
      }

      if (task.assignedStaff.toString() !== userId.toString()) {
        const error = new Error(
          "You are not assigned to this housekeeping task"
        );

        error.statusCode = 403;
        throw error;
      }

      const updatedRoom = await Room.findOneAndUpdate(
        {
          _id: task.room,
          isActive: true,
          status: "CLEANING"
        },
        {
          $set: {
            status: "AVAILABLE"
          }
        },
        {
          new: true,
          session
        }
      );

      if (!updatedRoom) {
        const error = new Error(
          "The room is not currently dirty"
        );

        error.statusCode = 409;
        throw error;
      }

      task.status = "COMPLETED";
      task.completedAt = new Date();
      task.completedAt = userId;

      await task.save({ session });

      completedTaskID = task._id;
    });


    const task= await HousekeepingTask.findById(completedTaskID)
      .populate("room")
      .populate(
        "assignedStaff",
        "firstName lastName email role"
      )
      .populate(
        "completedBy",
        "firstName lastName email role"
    );
    if (task) {
      emitHousekeepingTaskCompleted(task);
    }
    return task;

  } finally {
    await session.endSession();
  }
}
