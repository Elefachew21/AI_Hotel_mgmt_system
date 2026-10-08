import Room from "../models/Room.js";
import User from "../models/User.js";

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
    const room = await Room.findById(roomId);

    if (!room) {
        const error = new Error("Room not found");
        error.statusCode = 404;
        throw error;
    }

    // Allow management to remove the assignment
    if (housekeeperId === null) {
        room.assignedHousekeeper = null;
        await room.save();

        return room;
    }

    const housekeeper = await User.findOne({
        _id: housekeeperId,
        role: "HOUSEKEEPER",
        status: "ACTIVE"
    });

    if (!housekeeper) {
        const error = new Error(
            "Active housekeeper not found"
        );

        error.statusCode = 404;
        throw error;
    }

    room.assignedHousekeeper = housekeeper._id;

    await room.save();

    return room;
};
export { createRoom, getRooms, updateRoom, updateRoomStatus, getRoomsByID,assignHousekeeper };