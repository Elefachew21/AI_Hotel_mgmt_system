import { getIO } from "../config/socket.js";
export const emitHousekeepingTaskCreated = (task) => {
    if (!task.assignedStaff) {
        return;
    }
    getIO().to(`housekeeper:${task.assignedStaff._id}`)
        .emit('housekeeping:task_created',
        task)
}
export const emitHousekeepingTaskStarted = (task) => {
    if (!task.assignedStaff) {
        return;
    }

    getIO()
        .to(`housekeeper:${task.assignedStaff._id}`)
        .emit("housekeeping:task_started", task);
};
export const emitHousekeepingTaskCompleted = (task) => {
    if (!task.assignedStaff) {
        return;
    }

    getIO()
        .to(`housekeeper:${task.assignedStaff._id}`)
        .emit("housekeeping:task_completed", task);
};

