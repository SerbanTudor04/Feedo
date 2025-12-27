import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import api_router from './src/router.js';
import { initializeSockets } from './src/socket_io.js';

const app = express();
const PORT = process.env.PORT || 3000;
// 1. Create the HTTP Server
const httpServer = createServer(app);

// 2. Initialize Socket.io
const io = new Server(httpServer, {
    cors: {
        origin: "*", // Allow your frontend (React/Vue/etc) to connect
        methods: ["GET", "POST"]
    }
});
// 3. Connect the "magic" logic
initializeSockets(io);


app.use(express.json());
app.use('/api', api_router);



app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});