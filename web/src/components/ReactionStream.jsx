import { useEffect, useState } from 'react';
import { Box, keyframes } from '@mui/material';

const floatUp = keyframes`
  0% { transform: translateY(0) scale(1); opacity: 1; }
  100% { transform: translateY(-400px) scale(1.5); opacity: 0; }
`;

export default function ReactionStream({ socket }) {
  const [reactions, setReactions] = useState([]);

  useEffect(() => {
    if (!socket) return;

    const handleReaction = (data) => {
      const newReaction = {
        id: Date.now() + Math.random(),
        emoji: getEmoji(data.value),
        left: Math.random() * 80 + 10 + '%' // Random horizontal 10-90%
      };

      setReactions((prev) => [...prev, newReaction]);

      // Cleanup DOM element after animation
      setTimeout(() => {
        setReactions((prev) => prev.filter(r => r.id !== newReaction.id));
      }, 2000);
    };

    socket.on('receive_feedback', handleReaction);
    return () => socket.off('receive_feedback', handleReaction);
  }, [socket]);

  const getEmoji = (val) => {
    // UPDATED: Now matches the StudentRoom buttons exactly
    const map = { 
        happy: '🙂',      // Changed from 😊
        confused: '😐',   // Changed from 😕
        surprised: '🤩',  // Changed from 😲
        sad: '☹️'         // Same
    };
    return map[val] || val; 
  };

  return (
    <Box sx={{ 
      position: 'absolute', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0,
      pointerEvents: 'none', 
      overflow: 'hidden',
      zIndex: 10
    }}>
      {reactions.map((r) => (
        <Box
          key={r.id}
          sx={{
            position: 'absolute',
            bottom: '0%', 
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