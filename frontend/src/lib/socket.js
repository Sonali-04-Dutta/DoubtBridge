import { io } from "socket.io-client";

const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:8080";

export const socket = io(socketUrl, {
  autoConnect: false
});

export const connectSocket = () => {
  socket.auth = {
    token: localStorage.getItem("doubtbridge_token") || ""
  };
  if (!socket.connected) socket.connect();
  return socket;
};
