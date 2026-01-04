import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../types.js';
import prisma from '../../prisma.js';

// Mapping: Frontend String -> DB Integer (kind)
const REACTION_KIND_MAP: Record<string, number> = {
    'happy': 1,
    'confused': 2,
    'surprised': 3,
    'sad': 4
};

export const registerFeedbackHandlers = (io: Server, socket: AuthenticatedSocket) => {
    const user = socket.data.user;
    if (!user) return;

    socket.on('send_feedback', async ({ value }) => {
        
        // 1. Broadcast to screen immediately (Real-time UI)
        io.to(user.room_code).emit('receive_feedback', { 
            sessionId: user.session_id, 
            value: value 
        });

        // 2. Save to Database (Persist for Report)
        try {
            const kindInt = REACTION_KIND_MAP[value];
            if (!kindInt) return;

            // Fetch room start_time to calculate the "moment" (second of activity)
            // Optimization tip: You could cache start_time in socket.data to avoid this DB call every click
            const room = await prisma.rooms.findUnique({
                where: { id: user.room_id },
                select: { start_time: true }
            });

            if (room && room.start_time) {
                const now = new Date();
                // Calculate difference in seconds
                const diffInSeconds = Math.floor((now.getTime() - room.start_time.getTime()) / 1000);

                await prisma.room_feedback.create({
                    data: {
                        // Use the next available ID (if your DB doesn't auto-increment, you might need logic here, 
                        // but usually Prisma handles @default(autoincrement()) if set in DB. 
                        // Your schema says @id(map: "room_feedback_pk"), check if it auto-increments in Postgres)
                        id: undefined, // Let DB handle ID if auto-increment is on
                        
                        session_id: user.session_id,
                        room_id: user.room_id,
                        kind: kindInt,                 // The Type (Happy, etc.)
                        moment_of_feedback: diffInSeconds, // The Second of Activity
                        feedback_on: now,              // The Timestamp
                        created_at: now
                    }
                });
            }
        } catch (err) {
            console.error("Failed to save feedback:", err);
        }
    });
};