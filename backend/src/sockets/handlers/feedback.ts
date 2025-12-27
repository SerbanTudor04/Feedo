import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../types.js';

export const registerFeedbackHandlers = (io: Server, socket: AuthenticatedSocket) => {
    const user = socket.data.user;
    if (!user) return;

    socket.on('send_feedback', ({ value }) => {
        console.log(`Feedback from ${user.nickname}: ${value}`);
        
        // Broadcast to the room using data from the token (Secure)
        io.to(user.room_code).emit('receive_feedback', { 
            sessionId: user.session_id, 
            value: value 
        });
    });
};