import { createRoom,getRoomsByID, getRooms, updateRoom, updateRoomStatus,assignHousekeeper } from "../services/room.service.js";
const create = async (req, res, next) => {
    try {
        const room = await createRoom(req.body);
        res.status(201).json({
                    success: true,
                    message: "Room created successfully",
                    data: {
                        room
                    }
        });
    } 
    catch(error) {
        next(error);  
    }
}
const list = async (req, res, next) => {
    try {
        const rooms = await getRooms();
        res.status(200).json({
            success: true,
            data: {
                rooms
            }
        })
    } catch (error) {
        next(error);
    }

}
const getOne = async (req, res, next) => {
    try {
        const room = await getRoomsByID(req.params.id);
        if (!room) {
            res.status(404).json({
                success: false,
                message:"Room Not Found"
            })
        }
      return  res.status(200).json({
            success: true,
            data: {
                room
            }
        });
    } catch (error) {
        next(error); 
    }
}
const update = async (req, res, next) => {
    try {
        const room = await updateRoom(req.params.id, req.body);
          if (!room) {
            return res.status(404).json({
                success: false,
                message: "Room not found"
            });
        }
        res.status(200).json({
            success: true,
            message: "Room Updated Successfully !!!",
            data: {
                room
            }
        })
    } catch (error) {
        next(error);  
    }
}
const updateStatus = async (req, res, next) => {
    try {
        const room = await updateRoomStatus(req.params.id, req.body.status);
        if(!room){
            return res.status(404).json({
                success: false,
                message:"Room Not Found"
            })

        }
        res.status(200).json({
            success: true,
            message: "Room Status Updated Successfully !!!",
            data: {
                room
            }
        })
    } catch (error) {
        next(error);
    }
}
const assignHousekeeperToRoom = async (req, res, next) => {
    try {
        const room = await assignHousekeeper(
            req.params.id,
            req.body.housekeeperId
        );

        res.status(200).json({
            success: true,
            message: "Housekeeper assignment updated successfully",
            data: {
                room
            }
        });
    } catch (error) {
        next(error);
    }
};
export {
    create,
    update,
    updateStatus,
    list,
    getOne,assignHousekeeperToRoom
}