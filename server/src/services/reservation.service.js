import Reservation from "../models/Reservation.js";
import Customer from "../models/Customer.js";
import Room from "../models/Room.js";

const BLOCKING_STATUS = [ "CONFIRMERD", "CHECKED_IN"];
const calculateNights = (checkInDate, checkOutDate) => {
    const milliSecondsPerDay = 1000 * 60 * 60 * 24;
    return Math.ceil(
        (checkOutDate.getTime() - checkInDate.getTime()) / milliSecondsPerDay);
    
};
const createReservation = async({
    customerId,
    roomId,
    checkInDate,
    checkOutDate,
    numberOfGuests,
    specialRequests
}) => {
    //-----
    // 1. Find the customer
    //-------
    const customer = await Customer.findById(customerId);
    if (!customer) {
        const error = new Error("Customer Not Found");
        error.statusCode = 404;
        throw error;
    }
     //-----
    // 2. Find the Room
    //-------
    const room = await Room.findById(roomId);
    if (!room) {
        const error = new Error("Room not found");
        error.statusCode = 404;
        throw error;
    }
    //-----------------------
    //3. check weather the room can be booked
    //------------------------
    if (!room.isActive) {
        const error = new Error("Room is inactive");
        error.statusCode = 409;
        throw error;
    }
    if (room.status === "OUT_OF_SERVICE") {
        const error = new Error("Room is outOfService");
        error.statusCode = 409;
        throw error;
    }
    // -------------------------------
    //4. Check Room Max Capacity
    //--------------------------------
    if (numberOfGuests > room.capacity) {
        const error = new Error(`Room capacity is ${room.capacity} guest(s)`);
        error.statusCode = 409;
        throw error;

    }
    //------------------------------
    //5. check reservation date overlap
    //---------------------------------
    const overlappingReservation = await Reservation.findOne({
        room: roomId,
        status: {
            $in: BLOCKING_STATUS
        },
        checkInDate: {
            $lt: checkOutDate
        },
        checkOutDate: {
            $gt: checkInDate
        }
    });
    if (overlappingReservation) {
        const error = new Error("Room is already reserved for the selected Dates");
        error.statusCode = 409;
        throw error;
    }
    //-----------------------------------
    //6. Calculate Authoritative Pricing
    //-----------------------------------
    const nights = calculateNights(checkInDate, checkOutDate);
    const pricePerNight = room.pricePerNight;
    const totalAmount = nights * pricePerNight;
    //-------------------------------
    //7. Create reservation
    //-------------------------------
    const reservation = await Reservation.create({
        customer: customerId,
        room: roomId,
        checkInDate,
        checkOutDate,
        numberOfGuests,
        pricePerNight,
        totalAmount,
        status: "PENDING",
        specialRequests
    });

    return reservation;


}
export {createReservation}