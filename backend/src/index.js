import http from "http";
import { Server } from "socket.io";
import { app } from "./app.js";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { startNoShowRefundWatcher } from "./services/noShowWatcher.service.js";
// import { registerSocketServer } from "./socket/index.js";
import { registerSocketServer } from "./socket/socket.js";

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: env.clientUrl,
    methods: ["GET", "POST", "PATCH"]
  }
});

registerSocketServer(io);

connectDb()
  .then(() => {
    startNoShowRefundWatcher();
    server.listen(env.port, () => {
      console.log(`DoubtBridge backend running on port ${env.port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect database", error);
    process.exit(1);
  });
