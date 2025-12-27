import { Server, Socket } from 'socket.io';
import { TokenPayload } from './types.js';
import jwt from 'jsonwebtoken';


const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-this';

// Extend the standard Socket type to include our user data
interface AuthenticatedSocket extends Socket {
    data: {
        user?: TokenPayload; // We will attach the decoded token here
    }
}

// 1. Define the shape of your data
interface ServerToClientEvents {
    // Events the server sends to the frontend
    receive_feedback: (data: { sessionId: number, value: string }) => void;
    participant_joined: (data: { nickname: string, count: number }) => void;
}

interface ClientToServerEvents {
    // Events the frontend sends to the server
    join_room: (data: { roomCode: string, nickname: string }) => void;
    send_feedback: (data: { roomCode: string, value: string, sessionId: number }) => void;
}

// 2. Export the initialization function
export const initializeSockets = (io: Server<ClientToServerEvents, ServerToClientEvents>) => {
  
// This runs BEFORE a client is allowed to connect
    io.use((socket, next) => {
        // 1. Get the token from the handshake auth object
        // Client sends: socket = io({ auth: { token: "..." } })
        const token = socket.handshake.auth.token;

        if (!token) {
            return next(new Error("Authentication error: No token provided"));
        }

        // 2. Verify the token
        jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
            if (err) {
                return next(new Error("Authentication error: Invalid token"));
            }
            
            // 3. Attach decoded user data to the socket object for later use
            (socket as AuthenticatedSocket).data.user = decoded as TokenPayload;
            next();
        });
    });

   io.on('connection', (rawSocket: Socket) => {
        const socket = rawSocket as AuthenticatedSocket;
        const user = socket.data.user;

        if (!user) return; // Should never happen due to middleware

        console.log(`Authorized: ${user.nickname} (${user.role}) connected.`);

        // AUTOMATIC ROOM JOINING
        // Since the room code is in the token, we can auto-join them!
        // No need for the client to emit "join_room" manually anymore.
        socket.join(user.room_code);
        console.log(`   -> Auto-joined room: ${user.room_code}`);

        // --- EVENTS ---
        
        socket.on('send_feedback', ({ value }) => {
            // ⚠️ SECURITY UPGRADE: 
            // We NO LONGER trust the client to tell us their sessionId or roomCode.
            // We take it strictly from the trusted token.
            
            console.log(`Feedback from ${user.nickname}: ${value}`);
            
            // Broadcast to the room found in the token
            io.to(user.room_code).emit('receive_feedback', { 
                sessionId: user.session_id, 
                value: value 
            });
        });

        socket.on('disconnect', () => {
            console.log(`${user.nickname} disconnected`);
        });
    });
};