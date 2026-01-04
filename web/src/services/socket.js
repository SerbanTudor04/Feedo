import { io } from "socket.io-client";

let socket;

export const connectSocket = (token) => {
  // If we already have a connected socket, reuse it
  if (socket && socket.connected) {
    console.log("Reusing existing socket connection");
    return socket;
  }

  // If socket exists but is disconnected, update token and reconnect
  if (socket) {
    socket.auth = { token };
    socket.connect();
    return socket;
  }

  // Create new connection
  console.log("Creating new socket connection...");
  socket = io('http://localhost:3000', {
    auth: { token },
    transports: ['websocket'], // Force websocket to avoid polling issues
    autoConnect: true,
  });

  socket.on("connect_error", (err) => {
    console.error("Socket Connection Error:", err.message);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    console.log("Disconnecting socket...");
    socket.disconnect();
    socket = null; // Clear the instance
  }
};