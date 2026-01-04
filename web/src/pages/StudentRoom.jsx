import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Grid, Paper, Typography, Box, Button, Fade } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import { connectSocket, disconnectSocket, getSocket } from '../services/socket';
import ReactionStream from '../components/ReactionStream';

const reactions = [
  { id: 'happy', emoji: '😊', label: 'Happy', color: '#E3F2FD', border: '#2196F3' },
  { id: 'surprised', emoji: '😲', label: 'Surprised', color: '#F3E5F5', border: '#9C27B0' },
  { id: 'confused', emoji: '😕', label: 'Confused', color: '#FFF3E0', border: '#FF9800' },
  { id: 'sad', emoji: '☹️', label: 'Sad', color: '#FFEBEE', border: '#F44336' },
];

export default function StudentRoom() {
  const location = useLocation();
  const navigate = useNavigate();
  const { token, nickname } = location.state || {};
  const [socketInstance, setSocketInstance] = useState(null);
  

  const [isEnded, setIsEnded] = useState(false);

  useEffect(() => {
    if (!token) return;

    const s = connectSocket(token);
    setSocketInstance(s);

    // 1. LISTEN FOR CLASS ENDED EVENT
    s.on('activity_ended', () => {
        console.log("Class ended by teacher");
        setIsEnded(true); // Trigger the UI change
        disconnectSocket(); // Clean up connection
    });

    // 2. Handle forced disconnection (optional fallback)
    s.on('disconnect', (reason) => {
        if (reason === "io server disconnect") {
            // The server explicitly kicked us (which happens in stop_activity)
            setIsEnded(true);
        }
    });

    return () => {
        s.off('activity_ended');
        disconnectSocket();
    };
  }, [token]);

  const sendReaction = (value) => {
    const socket = getSocket();
    if (socket && !isEnded) socket.emit('send_feedback', { value }); 
  };

  // 3. RENDER "CLASS OVER" SCREEN IF ENDED
  if (isEnded) {
    return (
        <Fade in={true}>
            <Box sx={{ 
                height: '100vh', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #ece9e6 0%, #ffffff 100%)',
                p: 3,
                textAlign: 'center'
            }}>
                <Typography variant="h1" sx={{ mb: 2 }}>🏁</Typography>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                    Activity Ended
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                    The teacher has closed this session. Thanks for participating!
                </Typography>
                <Button 
                    variant="contained" 
                    size="large" 
                    startIcon={<HomeIcon />}
                    onClick={() => navigate('/')}
                >
                    Back to Home
                </Button>
            </Box>
        </Fade>
    );
  }

  // STANDARD ACTIVE UI
  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {socketInstance && <ReactionStream socket={socketInstance} />}

      <Paper 
        elevation={4}
        square 
        sx={{ 
          p: 2, 
          background: 'linear-gradient(90deg, #2196F3 0%, #00B0FF 100%)', 
          color: 'white', 
          textAlign: 'center',
          zIndex: 20
        }}
      >
        <Typography variant="h6">Student Panel</Typography>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          Logged in as: <strong>{nickname}</strong>
        </Typography>
      </Paper>

      <Box sx={{ flexGrow: 1, p: 2, display: 'flex', alignItems: 'center', zIndex: 20 }}>
        <Grid container spacing={2} sx={{ height: '100%', maxHeight: 600, mx: 'auto' }}>
          {reactions.map((r) => (
            <Grid item xs={6} key={r.id} sx={{ height: '50%' }}>
              <Paper 
                elevation={3}
                onClick={() => sendReaction(r.id)}
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  bgcolor: r.color,
                  border: `2px solid ${r.border}`,
                  borderRadius: 4,
                  cursor: 'pointer',
                  transition: 'all 0.1s ease',
                  '&:active': { transform: 'scale(0.92)', boxShadow: 0 }
                }}
              >
                <Typography sx={{ fontSize: '4rem', mb: 1 }}>{r.emoji}</Typography>
                <Typography variant="h6" fontWeight="bold" color="text.secondary">
                  {r.label}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
}