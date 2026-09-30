import Room from "../models/Room.js";
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

export { createRoom, getRooms, updateRoom, updateRoomStatus, getRoomsByID };