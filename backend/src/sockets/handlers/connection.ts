import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../types.js';
import prisma from '../../prisma.js'; // Ensure path points to your prisma instance

export const handleConnection = async (io: Server, socket: AuthenticatedSocket) => {
    const user = socket.data.user;
    if (!user) return;

    try {
        // 1. Get Room Info (Start Time)
        const room = await prisma.rooms.findUnique({
            where: { id: user.room_id },
            select: { start_time: true, code: true }
        });

        // 2. Get Participant Count
        const participantCount = await prisma.room_members.count({
            where: { room_id: user.room_id }
        });

        // "receives number of participants and start time"
        socket.emit('room_state', {
            startTime: room?.start_time,
            participantCount: participantCount
        });

        // "receives a list of all participants"
        if (user.role === 'teacher') {
            const members = await prisma.room_members.findMany({
                where: { room_id: user.room_id },
                include: {
                    sessions: {
                        select: { nickname: true, id: true }
                    }
                }
            });

            // Map to a clean list of nicknames
            const participantList = members.map(m => ({
                sessionId: m.sessions?.id,
                nickname: m.sessions?.nickname,
                joinAt: m.join_at
            }));

            socket.emit('teacher_dashboard_data', {
                participants: participantList,
                timestamp: new Date() 
            });
        } 
        else {
            // Optional: If a student joins, notify the teacher immediately
            // so their list updates in real-time
            io.to(user.room_code).emit('participant_joined', {
                nickname: user.nickname,
                count: participantCount
            });
        }

    } catch (err) {
        console.error("Error in connection handler:", err);
    }
};


export const handleDisconnect = async (io: Server, socket: AuthenticatedSocket) => {
    const user = socket.data.user;
    if (!user) return;

    // We only track "participants" (students) leaving. 
    // If a teacher leaves, the room might stay open or close depending on your logic, 
    // but they aren't in the 'room_members' table.
    if (user.role === 'student') {
        try {
            // 1. Update DB: Mark this specific session as left
            // We use updateMany to be safe, targeting the active session for this room
            await prisma.room_members.updateMany({
                where: {
                    session_id: user.session_id,
                    room_id: user.room_id,
                    leaved_at: null // Only close currently open memberships
                },
                data: {
                    leaved_at: new Date()
                }
            });

            // 2. Get the new count of ACTIVE participants
            const participantCount = await prisma.room_members.count({
                where: {
                    room_id: user.room_id,
                    leaved_at: null // Only count people who haven't left
                }
            });

            // 3. Notify the Room (Teacher + Students)
            // The teacher's frontend can use this to remove the name from the list
            io.to(user.room_code).emit('participant_left', {
                nickname: user.nickname,
                sessionId: user.session_id,
                count: participantCount
            });

            console.log(`❌ ${user.nickname} left room ${user.room_code} (Count: ${participantCount})`);

        } catch (err) {
            console.error("Error handling disconnect:", err);
        }
    } else {
        console.log(`Teacher ${user.nickname} disconnected.`);
    }
};