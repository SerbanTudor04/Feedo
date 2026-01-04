import { useEffect, useState } from 'react';
import { Box, keyframes } from '@mui/material';
import { getSocket } from '../services/socket';

// Animation: Float up and fade out
const floatUp = keyframes`
  0% { transform: translateY(0) scale(1); opacity: 1; }
  100% { transform: translateY(-300px) scale(1.5); opacity: 0; }
`;

export default function ReactionStream() {
  const [reactions, setReactions] = useState([]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleReaction = (data) => {
      // Create a unique ID for animation key
      const newReaction = {
        id: Date.now() + Math.random(),
        emoji: getEmoji(data.value),
        left: Math.random() * 80 + 10 + '%' // Random horizontal position (10% to 90%)
      };

      setReactions((prev) => [...prev, newReaction]);

      // Remove it from DOM after animation (2 seconds)
      setTimeout(() => {
        setReactions((prev) => prev.filter(r => r.id !== newReaction.id));
      }, 2000);
    };

    socket.on('receive_feedback', handleReaction);
    return () => socket.off('receive_feedback', handleReaction);
  }, []);

  // Helper to map values back to emojis if needed
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