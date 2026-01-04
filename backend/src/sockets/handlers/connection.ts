import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../types.js';
import prisma from '../../prisma.js'; 

export const handleConnection = async (io: Server, socket: AuthenticatedSocket) => {
    const user = socket.data.user;
    if (!user) return;

    try {
        // 1. Get Room Info
        const room = await prisma.rooms.findUnique({
            where: { id: user.room_id },
            select: { start_time: true, code: true, name:true, description:true }
        });

        const participantCount = await prisma.room_members.count({
            where: { room_id: user.room_id, leaved_at: null } // Only count active
        });

        socket.emit('room_state', {
            startTime: room?.start_time,
            participantCount: participantCount
        });

        if (user.role === 'teacher') {
            const members = await prisma.room_members.findMany({
                where: { room_id: user.room_id },
                include: {
                    sessions: {
                        select: { nickname: true, id: true }
                    }
                }
            });

            const participantList = members.map(m => ({
                sessionId: m.sessions?.id,
                nickname: m.sessions?.nickname,
                joinAt: m.join_at,
                leavedAt: m.leaved_at // <--- ADD THIS LINE
            }));

            socket.emit('teacher_dashboard_data', {
                participants: participantList,
                timestamp: new Date(),
                roomName: room?.name,
                roomDescription: room?.description,
            });
        } 
        else {
            io.to(user.room_code).emit('participant_joined', {
                nickname: user.nickname,
                sessionId: user.session_id,
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

    if (user.role === 'student') {
        try {
            await prisma.room_members.updateMany({
                where: {
                    session_id: user.session_id,
                    room_id: user.room_id,
                    leaved_at: null 
                },
                data: { leaved_at: new Date() }
            });

            const participantCount = await prisma.room_members.count({
                where: { room_id: user.room_id, leaved_at: null }
            });

            io.to(user.room_code).emit('participant_left', {
                nickname: user.nickname,
                sessionId: user.session_id,
                count: participantCount
            });

            console.log(`❌ ${user.nickname} left room ${user.room_code}`);

        } catch (err) {
            console.error("Error handling disconnect:", err);
        }
    }
};