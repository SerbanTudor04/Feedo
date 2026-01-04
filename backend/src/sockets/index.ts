import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { TokenPayload, AuthenticatedSocket } from './types.js';
import { handleConnection, handleDisconnect } from './handlers/connection.js';
import { registerFeedbackHandlers } from './handlers/feedback.js';
import { registerActivityHandlers } from './handlers/activity.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-this';

export const initializeSockets = (io: Server) => {
  
    // 1. MIDDLEWARE: Security & Auth
    io.use((socket, next) => {
        const token = socket.handshake.auth.token || socket.handshake.headers.token;

    if (!token) {
        return next(new Error("Authentication error: No token provided"));
    }

        jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
            if (err) {
                return next(new Error("Authentication error: Invalid token"));
            }
            (socket as AuthenticatedSocket).data.user = decoded as TokenPayload;
            next();
        });
    });

    // 2. ON CONNECTION
    io.on('connection', async (rawSocket: Socket) => {
        const socket = rawSocket as AuthenticatedSocket;
        const user = socket.data.user;

        if (!user) return;

        console.log(`Authorized: ${user.nickname} (${user.role})`);

        // A. Auto-join the Socket.io room
        socket.join(user.room_code);

        // B. Run "On Join" Logic (Send counts, lists, times)
        await handleConnection(io, socket);

        // C. Register Event Listeners (Feedback, etc.)
        registerFeedbackHandlers(io, socket);
        registerActivityHandlers(io, socket);

        socket.on('disconnect', async () => {
             // <--- CALL THE NEW HANDLER HERE
            await handleDisconnect(io, socket);
        });
    });
};