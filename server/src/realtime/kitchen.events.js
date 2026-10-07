import { getIO } from "../config/socket.js";

export const emitKotCreated = (kot) => {
  getIO()
    .to("kitchen")
    .emit("kot:created", kot);
};

export const emitKotStarted = (kot) => {
  getIO()
    .to("kitchen")
    .emit("kot:started", kot);
};

export const emitKotReady = (kot) => {
  getIO()
    .to("kitchen")
    .emit("kot:ready", kot);
};

export const emitKotCancelled = (kot) => {
  getIO()
    .to("kitchen")
    .emit("kot:cancelled", kot);
};