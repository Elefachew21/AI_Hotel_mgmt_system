import Room from "../models/Room.js";
import HousekeepingTask from "../models/HousekeepingTask.js";
import User from "../models/User.js";
import { emitHousekeepingTaskAssigned } from "../realtime/housekeeping.events.js";
const createRoom = async (data) => {
    const existingRoom = await Room.findOne({
        roomNumber: data.roomNumber
    });
    if (existingRoom) {
        const error = new Error("Room already exists");
        error.statusCode = 409;
        throw error;
    }

    return Room.create(data);
}
const getRooms = async () => {
    return Room.find()
        .sort({
        roomNumber:1
    })
}
const getRoomsByID = async (roomId) => {
    return Room.findById(roomId);
}
const updateRoom = async (roomId, data) => {
    return Room.findByIdAndUpdate(
        roomId,
        data, {
            new: true,
            runValidators:true
        }
    )

}
const updateRoomStatus = async (roomId, status) => {
    return Room.findByIdAndUpdate(
        roomId,
        { status },
        {
            new: true,
            runValidators:true
        }
    )
}



const assignHousekeeper = async (roomId, housekeeperId) => {
    const session = await Room.startSession();


    try {
            let assignedTaskId = null;
            let updatedRoom;
        await session.withTransaction(async () => {
            const room = await Room.findById(roomId).session(session);

            if (!room) {
                const error = new Error("Room not found");
                error.statusCode = 404;
                throw error;
            }

            // Allow management to remove the room assignment.
            if (housekeeperId === null) {
                room.assignedHousekeeper = null;
                await room.save({ session });

                updatedRoom = room;
                return;
            }

            const housekeeper = await User.findOne({
                _id: housekeeperId,
                role: "HOUSEKEEPER",
                status: "ACTIVE"
            }).session(session);

            if (!housekeeper) {
                const error = new Error("Active housekeeper not found");
                error.statusCode = 404;
                throw error;
            }

            // Update the room's default housekeeper.
            room.assignedHousekeeper = housekeeper._id;
            await room.save({ session });

            // Also assign the latest eligible existing task,
            // if one is waiting for a housekeeper.
            const pendingTask = await HousekeepingTask.findOne({
                room: room._id,
                status: "PENDING",
                assignedStaff: null
            })
                .sort({ createdAt: -1 })
                .session(session);

            if (pendingTask) {
                pendingTask.assignedStaff = housekeeper._id;
                await pendingTask.save({ session });
                assignedTaskId = pendingTask._id;
            }

            updatedRoom = room;
        }); 
        if (assignedTaskId) {
            const assignedTask = await HousekeepingTask.findById(
                assignedTaskId)
                .populate("room", "roomNumber");
            if (assignedTask) {
                emitHousekeepingTaskAssigned(assignedTask);
            }
        }
 
        return updatedRoom;
    } finally {
        await session.endSession();
    }
};

export { createRoom, getRooms, updateRoom, updateRoomStatus, getRoomsByID,assignHousekeeper };