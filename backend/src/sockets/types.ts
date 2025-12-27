import { Socket } from 'socket.io';

export interface TokenPayload {
    session_id: number;
    nickname: string;
    role: 'teacher' | 'student';
    room_code: string;
    room_id: number;
}

export interface AuthenticatedSocket extends Socket {
    data: {
        user?: TokenPayload;
    }
}