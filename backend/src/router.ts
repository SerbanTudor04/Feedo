import express, { Request, Response, Router } from 'express';
import { generateRoomCode } from './utils.js';
import prisma from './prisma.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-this';


const api_router = express.Router();

api_router.post('/create', async (req:Request, res:Response) => {
    // /api/create
    try{
        let body = req.body;
        let nickname = body?.nickname;
        if (!nickname) {
            res.status(400).json({
                "detail":"Nickname is required.",
                "data":{}
            });
            return;
        }
        let name = body?.name;
        if (!name) {
            name = "Untitled Room";
        }
        
        let description = body?.description;
        if (!description || description.trim() === "") {
            description = "";
        }

        const newSession = await prisma.sessions.create({
            data: {
                nickname: nickname,
                kind: 'T', 
                created_at: new Date(), // 
                last_seen: new Date()   // 
            }
        });
        let roomCode = '';
        let isUnique = false;

        // Loop until we find a code that isn't currently active
        while (!isUnique) {
            // Generate a code (max 8 chars based on schema )
            roomCode = generateRoomCode(8); 

            // Check if this code exists in an ACTIVE room
            const existingActiveRoom = await prisma.rooms.findFirst({
                where: {
                    code: roomCode,
                }
            });

            if (!existingActiveRoom) {
                isUnique = true;
            }
        }

        const newRoom = await prisma.rooms.create({
            data: {
                code: roomCode,
                teacher_id: newSession.id,
                is_active: true,          
                start_time: new Date(),   
                no_participants: 0,
                name: name,
                description: description
            }
        });

        const token = jwt.sign(
            { session_id: newSession.id, nickname: newSession.nickname, role: 'teacher' ,
                 room_code: newRoom.code,
                room_id: newRoom.id
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            "detail": "Room created successfully.",
            "data": {
                "room_code": newRoom.code,
                "room_id": newRoom.id,
                "token": token,
                "nickname": newSession.nickname
            }
        });

    }catch(err){
        console.error("Error creating room:", err);
        res.status(500).json({
            "detail":"Internal server error.",
            "data":{}
        });
    }
   
});



api_router.post('/join',async (req:Request, res:Response) => {
  try {
        const { nickname, code } = req.body;

        if (!nickname || !code) {
            return res.status(400).json({
                detail: "Nickname and code are required.",
                data: {}
            });
        }

        const room = await prisma.rooms.findFirst({
            where: {
                code: code
            }
        });


        const now = new Date();
        const isRoomClosed = room?.end_time && new Date(room.end_time) < now;

        if (!room || !room.is_active || isRoomClosed) {
            return res.status(404).json({
                detail: "Room not found or has ended.",
                data: {}
            });
        }
        const newSession = await prisma.sessions.create({
            data: {
                nickname: nickname,
                kind: 'S', 
                created_at: now,
                updated_at: now,
                last_seen: now,
                // ip_addr: poți extrage IP-ul din req.ip dacă dorești să îl stochezi
            }
        });

        await prisma.room_members.create({
            data: {
                session_id: newSession.id,
                room_id: room.id,
                join_at: now
            }
        });


        const token = jwt.sign(
            { session_id: newSession.id, nickname: newSession.nickname, role: 'student' ,
                room_code: room.code,
                room_id: room.id

            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            detail: "Joined successfully.",
            data: {
                token: token,
                room_code: room.code
            }
        });

    } catch (error) {
        console.error("Error joining room:", error);
        res.status(500).json({
            detail: "Internal server error.",
            data: {}
        });
    }
});

const REACTION_KIND_REVERSE: Record<number, string> = {
    1: 'happy',
    2: 'confused',
    3: 'surprised',
    4: 'sad'
};

api_router.get('/report/:roomCode', async (req: Request, res: Response) => {
    try {
        // --- 1. SECURITY CHECK ---
        const authHeader = req.headers.authorization || req.headers['token']; 
        const token = typeof authHeader === 'string' 
            ? authHeader.replace('Bearer ', '') 
            : null;

        if (!token) {
            return res.status(401).json({ detail: "Authentication required" });
        }

        let user: any;
        try {
            user = jwt.verify(token, JWT_SECRET);
        } catch (e) {
            return res.status(401).json({ detail: "Invalid or expired token" });
        }

        if (user.role !== 'teacher') {
            return res.status(403).json({ detail: "Access denied. Teachers only." });
        }
        // -------------------------

        const { roomCode } = req.params;

        const room = await prisma.rooms.findFirst({
            where: { code: roomCode }
        });

        if (!room) return res.status(404).json({ detail: "Room not found" });

        // 1. Fetch Feedback
        const feedbacks = await prisma.room_feedback.findMany({
            where: { room_id: room.id },
            orderBy: { moment_of_feedback: 'asc' } // Sort by time offset
        });

        // 2. Group into Time Buckets (e.g., Minutes)
        // Chart expects: [{ time: '00:00', happy: 5, confused: 2 }]
        const chartMap = new Map<string, any>();

        feedbacks.forEach(f => {
            if (f.moment_of_feedback === null || f.kind === null) return;

            // Convert seconds (moment) to "MM:SS" format for the chart
            const minutes = Math.floor(f.moment_of_feedback / 60);
            const seconds = f.moment_of_feedback % 60;
            const timeLabel = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            // To make the chart less crowded, you can group by Minute only:
            // const timeLabel = `${minutes.toString().padStart(2, '0')}:00`; 

            if (!chartMap.has(timeLabel)) {
                chartMap.set(timeLabel, { 
                    time: timeLabel, 
                    happy: 0, confused: 0, surprised: 0, sad: 0 
                });
            }

            const bucket = chartMap.get(timeLabel);
            const reactionName = REACTION_KIND_REVERSE[f.kind]; // Map 1 -> 'happy'
            
            if (reactionName && bucket[reactionName] !== undefined) {
                bucket[reactionName]++;
            }
        });

        const chartData = Array.from(chartMap.values());

        // 3. Stats
        const totalParticipants = await prisma.room_members.count({
            where: { room_id: room.id }
        });

        res.status(200).json({
            detail: "Success",
            data: {
                roomCode: room.code,
                chartData: chartData,
                totalParticipants,
                durationMinutes: room.duration,
                startTime: room.start_time
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ detail: "Server error", data: {} });
    }
});


export default api_router;