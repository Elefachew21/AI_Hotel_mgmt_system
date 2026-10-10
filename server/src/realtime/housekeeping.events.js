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

export const emitHousekeepingTaskAssigned = (task) => {
    if (!task ?.assignedStaff) {
        return;
    }
    // assigned staff may n=be a populated user document
    // or unpopulated mongoDB objected_ID
    const housekeeperId = task.assignedStaff._id ? task.assignedStaff._id.toString() : task.assignedStaff.toString();
    const payload = {
        _id: task._id,
        taskNumber: task.taskNumber,
         status: task.status,
        reason: task.reason,
        room: task.room,
        assignedStaff: housekeeperId,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
    };

    getIO()
        .to(`housekeeper:${housekeeperId}`)
        .emit("housekeeping:task_assigned", payload);

    console.log(
        `Emitted housekeeping:task_assigned for ${task.taskNumber}`
    );
    
}