import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import api_router from './src/router.js';
import { initializeSockets } from './src/sockets/index.js';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;
// 1. Create the HTTP Server

app.use(cors({
    origin : "*",
    methods: ["GET", "POST"],
    credentials: true
}));

const httpServer = createServer(app);

// 2. Initialize Socket.io
const io = new Server(httpServer, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});
// 3. Connect the "magic" logic
initializeSockets(io);


app.use(express.json());
app.use('/api', api_router);



httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});