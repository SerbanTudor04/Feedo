import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { Grid, Paper, Typography, Box } from '@mui/material';
import { connectSocket, disconnectSocket, getSocket } from '../services/socket';
import ReactionStream from '../components/ReactionStream'; // They see reactions too!

const reactions = [
  { id: 'happy', emoji: '😊', label: 'Happy', color: '#e3f2fd' },
  { id: 'confused', emoji: '😕', label: 'Confused', color: '#fff3e0' },
  { id: 'surprised', emoji: '😲', label: 'Surprised', color: '#f3e5f5' },
  { id: 'sad', emoji: '☹️', label: 'Sad', color: '#ffebee' },
];

export default function StudentRoom() {
  const location = useLocation();
  const { token, nickname } = location.state || {};

  useEffect(() => {
    if (token) {
      connectSocket(token);
    }
    return () => disconnectSocket();
  }, [token]);

  const sendReaction = (value) => {
    const socket = getSocket();
    if (socket) {
        socket.emit('send_feedback', { value }); 
    }
  };

  return (
    <Box sx={{ height: '90vh', p: 2 }}>
      <ReactionStream /> {/* Show floating emojis to students too */}
      
      <Typography variant="h5" align="center" gutterBottom>
        Playing as: <strong>{nickname}</strong>
      </Typography>

      <Grid container spacing={2} sx={{ height: '80%' }}>
        {reactions.map((r) => (
          <Grid item xs={6} key={r.id}>
            <Paper 
              elevation={4}
              onClick={() => sendReaction(r.id)}
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'center', 
                alignItems: 'center',
                bgcolor: r.color,
                cursor: 'pointer',
                transition: '0.1s',
                '&:active': { transform: 'scale(0.95)' }
              }}
            >
              <Typography variant="h1">{r.emoji}</Typography>
              <Typography variant="h6">{r.label}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}