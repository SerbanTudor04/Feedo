import { useEffect } from 'react';
import { useParams, useLocation } from 'react-router';
import { Grid, Paper, Typography } from '@mui/material';

// Emoticons map
const reactions = [
  { id: 'happy', emoji: '😊', label: 'Happy', color: '#e3f2fd' },
  { id: 'confused', emoji: '😕', label: 'Confused', color: '#fff3e0' },
  { id: 'surprised', emoji: '😲', label: 'Surprised', color: '#f3e5f5' },
  { id: 'sad', emoji: '☹️', label: 'Sad', color: '#ffebee' },
];

export default function FeedbackRoom() {
  const { roomCode } = useParams();
  const location = useLocation();
  const nickname = location.state?.nickname || 'Anonymous';

  useEffect(() => {
    console.log(`Connecting to WebSocket for Room: ${roomCode} as ${nickname}...`);
    // const socket = new WebSocket(`ws://your-api.com/ws/${roomCode}`);
    
    // Cleanup on unmount
    return () => {
      console.log("Disconnecting socket...");
      // socket.close();
    };
  }, [roomCode, nickname]);

  const sendReaction = (type) => {
    console.log(`Sending ${type} reaction`);
    // socket.send(JSON.stringify({ type, timestamp: Date.now() }));
  };

  return (
    <Grid container spacing={2} sx={{ height: '80vh' }}>
      {reactions.map((reaction) => (
        <Grid item xs={6} key={reaction.id} sx={{ height: '50%' }}>
          <Paper 
            elevation={4}
            sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center', 
              alignItems: 'center',
              cursor: 'pointer',
              backgroundColor: reaction.color,
              transition: 'transform 0.1s',
              '&:active': { transform: 'scale(0.95)' }
            }}
            onClick={() => sendReaction(reaction.id)}
          >
            <Typography variant="h1">{reaction.emoji}</Typography>
            <Typography variant="h6">{reaction.label}</Typography>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}