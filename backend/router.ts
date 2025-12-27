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
                no_participants: 0
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
        res.status(500).json({
            "detail":"Internal server error.",
            "data":{}
        });
    }
   
});



api_router.post('/join',async (req:Request, res:Response) => {
  try {
        const { nickname, code } = req.body;

        // 1. Validare simplă a input-ului
        if (!nickname || !code) {
            return res.status(400).json({
                detail: "Nickname and code are required.",
                data: {}
            });
        }

        // 2. Căutăm camera în baza de date
        // Folosim findFirst pentru că în schema ta 'code' nu are constrângere de @unique, 
        // deși logic ar trebui să fie unic.
        const room = await prisma.rooms.findFirst({
            where: {
                code: code
            }
        });

        // 3. Verificăm validitatea camerei
        const now = new Date();
        const isRoomClosed = room?.end_time && new Date(room.end_time) < now;

        if (!room || !room.is_active || isRoomClosed) {
            return res.status(404).json({
                detail: "Room not found or has ended.",
                data: {}
            });
        }

        // 4. Creăm o sesiune pentru student
        // Presupunem că 'kind' = 'S' vine de la Student
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

        // 5. Adăugăm studentul ca membru în cameră
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

        // 6. Trimitem răspunsul cu succes
        // Frontend-ul are nevoie de session_id pentru a trimite feedback ulterior
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

export default api_router;