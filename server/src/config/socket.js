import { Server } from "socket.io";

let io;

export const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173"
    }
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    //===================
    // KITCHEN
    //===================
    socket.on("kitchen:join", () => {
      socket.join("kitchen");

      console.log(
        `Socket ${socket.id} joined kitchen room`
      );
    });
   

    socket.on("kitchen:leave", () => {
      socket.leave("kitchen");

      console.log(
        `Socket ${socket.id} left kitchen room`
      );
    });
   
//===================
// HOUSEKEEPING
//===================

socket.on("housekeeping:join", (housekeeperId) => {
  const roomName = `housekeeper:${housekeeperId}`;

  socket.join(roomName);

  console.log(`Socket ${socket.id} joined ${roomName}`);
});

socket.on("housekeeping:leave", (housekeeperId) => {
  const roomName = `housekeeper:${housekeeperId}`;

  socket.leave(roomName);

  console.log(`Socket ${socket.id} left ${roomName}`);
});


    //===================
    // Disconnect
    //===================
    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO has not been initialized");
  }

  return io;
};