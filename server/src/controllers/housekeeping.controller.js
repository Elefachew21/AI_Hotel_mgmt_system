import {
  startHousekeepingTask
} from "../services/housekeeping.service.js";
import { completeHousekeepingTask } from "../services/housekeeping.service.js";
export const startTask = async (req, res, next) => {
  try {
    const task = await startHousekeepingTask(
      req.params.id,
      req.user.id
    );

    res.status(200).json({
      success: true,
      message: "Housekeeping task started successfully",
      data: {
        task
      }
    });
  } catch (error) {
    next(error);
  }
};
export const completeTask = async (req, res, next) => {
  try {
    const task = await completeHousekeepingTask(req.params.id,
      req.user.id);
    res.status(200).json({
      success: true,
      message: "Housekeeping tak completed Successfully",
      data: {
        
        task
      }
    })
  } catch (error) {
    next(error);
  }
}