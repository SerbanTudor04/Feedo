import { useEffect, useState } from 'react';
import { Box, keyframes } from '@mui/material';

const floatUp = keyframes`
  0% { transform: translateY(0) scale(1); opacity: 1; }
  100% { transform: translateY(-300px) scale(1.5); opacity: 0; }
`;

// NOW ACCEPTS SOCKET AS PROP
export default function ReactionStream({ socket }) {
  const [reactions, setReactions] = useState([]);

  useEffect(() => {
    if (!socket) return;

    const handleReaction = (data) => {
      // data: { sessionId, value } from feedback.ts
      const newReaction = {
        id: Date.now() + Math.random(),
        emoji: getEmoji(data.value),
        left: Math.random() * 80 + 10 + '%' 
      };

      setReactions((prev) => [...prev, newReaction]);

      setTimeout(() => {
        setReactions((prev) => prev.filter(r => r.id !== newReaction.id));
      }, 2000);
    };

    // Attach listener to the passed socket instance
    socket.on('receive_feedback', handleReaction);

    // Cleanup listener on unmount
    return () => {
      socket.off('receive_feedback', handleReaction);
    };
  }, [socket]);

  const getEmoji = (val) => {
    const map = { happy: '😊', confused: '😕', surprised: '😲', sad: '☹️' };
    return map[val] || val; 
  };

  return (
    <Box sx={{ 
      position: 'fixed', bottom: 0, left: 0, right: 0, 
      height: '100vh', pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' 
    }}>
      {reactions.map((r) => (
        <Box
          key={r.id}
          sx={{
            position: 'absolute',
            bottom: '10%',
            left: r.left,
            fontSize: '3rem',
            animation: `${floatUp} 2s ease-out forwards`
          }}
        >
          {r.emoji}
        </Box>
      ))}
    </Box>
  );
}