import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../types.js';
import prisma from '../../prisma.js'; // Adjust path to match your project structure

export const registerActivityHandlers = (io: Server, socket: AuthenticatedSocket) => {
    const user = socket.data.user;

    // SECURITY: Only allow Teachers to register these events
    if (!user || user.role !== 'teacher') return;

    // ---------------------------------------------------------
    // 1. STOP ACTIVITY (Close Room)
    // ---------------------------------------------------------
    socket.on('stop_activity', async () => {
        try {
            console.log(`🛑 Activity stopped by teacher ${user.nickname}`);

            // A. Update Database: Mark room as inactive and set end time
            await prisma.rooms.update({
                where: { id: user.room_id },
                data: {
                    is_active: false,
                    end_time: new Date()
                }
            });

            // B. Notify all clients (so they can show a "Class Ended" screen)
            io.to(user.room_code).emit('activity_ended');

            // C. Force disconnect all sockets in this room (closes the session)
            io.in(user.room_code).disconnectSockets(true);

        } catch (err) {
            console.error("Error stopping activity:", err);
            socket.emit('error', { message: "Failed to stop activity" });
        }
    });

    // ---------------------------------------------------------
    // 2. KICK STUDENT (Disconnect specific user)
    // ---------------------------------------------------------
    socket.on('kick_student', async ({ sessionId }) => {
        try {
            console.log(`🥾 Kicking student (Session ID: ${sessionId}) from room ${user.room_code}`);

            // A. Find the socket(s) belonging to this specific session_id
            const sockets = await io.in(user.room_code).fetchSockets();
            
            // We cast 's.data' to any because RemoteSocket types can be tricky, 
            // but we know our middleware attached 'user'
            const targetSocket = sockets.find(s => (s.data as any).user?.session_id === sessionId);

            if (targetSocket) {
                // B. Force Disconnect
                // This triggers the 'disconnect' event in connection.ts, 
                // which ALREADY handles updating the DB (leaved_at) and notifying the room.
                targetSocket.disconnect(true);
            } else {
                console.warn(`Student with session ${sessionId} not found in active sockets.`);
            }

        } catch (err) {
            console.error("Error kicking student:", err);
        }
    });
};