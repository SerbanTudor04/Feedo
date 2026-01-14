// socket.js
import { io } from "socket.io-client";
import { API_URL } from "./api";

let socket;

export const connectSocket = (token) => {
  if (socket && socket.connected) {
    console.log("Reusing existing socket connection");
    return socket;
  }

  if (socket) {
    socket.auth = { token };
    socket.connect();
    return socket;
  }

  console.log("Creating new socket connection...");
  

  const SOCKET_URL = API_URL.replace('/api', '');

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
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
    socket = null;
  }
};