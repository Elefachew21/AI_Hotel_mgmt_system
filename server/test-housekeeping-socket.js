import { io } from "socket.io-client";

const housekeeperId = process.env.HOUSEKEEPER_ID;

if (!housekeeperId) {
  throw new Error("Set HOUSEKEEPER_ID before running the test");
}

const socket = io("http://localhost:3132");

const events = [
  "housekeeping:task_created",
  "housekeeping:task_assigned",
  "housekeeping:task_started",
  "housekeeping:task_completed"
];

socket.on("connect", () => {
  console.log("Connected:", socket.id);

  socket.emit("housekeeping:join", housekeeperId);

  console.log("Requested housekeeping room join");
});

for (const eventName of events) {
  socket.on(eventName, (task) => {
    console.log(`\nReceived event: ${eventName}`);
    console.log("Task number:", task.taskNumber);
    console.log("Task status:", task.status);
    console.log("Room:", task.room?.roomNumber ?? task.room);
    console.log("Assigned staff:", task.assignedStaff?._id ?? task.assignedStaff);
  });
}

socket.on("connect_error", (error) => {
  console.error("Socket connection failed:", error.message);
});

socket.on("disconnect", (reason) => {
  console.log("Disconnected:", reason);
});