import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Paper, Typography, Box, Button, Fade, Container } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import { connectSocket, disconnectSocket, getSocket } from '../services/socket';
import ReactionStream from '../components/ReactionStream';

const reactions = [
  { id: 'happy', emoji: '😊', label: 'Happy', color: '#f0f9ff', activeColor: '#bae6fd' },
  { id: 'surprised', emoji: '😲', label: 'Surprised', color: '#f5f3ff', activeColor: '#ddd6fe' },
  { id: 'confused', emoji: '😕', label: 'Confused', color: '#fff7ed', activeColor: '#fed7aa' },
  { id: 'sad', emoji: '☹️', label: 'Sad', color: '#fef2f2', activeColor: '#fecaca' },
];

export default function StudentRoom() {
  const location = useLocation();
  const navigate = useNavigate();
  const { token, nickname } = location.state || {};
  const [socketInstance, setSocketInstance] = useState(null);
  const [isEnded, setIsEnded] = useState(false);

  // Theme Constant
  const THEME_COLOR = '#137fec';

  useEffect(() => {
    if (!token) return;

    const s = connectSocket(token);
    setSocketInstance(s);

    s.on('activity_ended', () => {
        setIsEnded(true);
        disconnectSocket();
    });

    s.on('disconnect', (reason) => {
        if (reason === "io server disconnect") setIsEnded(true);
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

  const handleLeave = () => {
    disconnectSocket();
    navigate('/');
  };

  // --- SCREEN: CLASS ENDED ---
  if (isEnded) {
    return (
        <Box sx={{ 
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            bgcolor: '#f6f7f8', p: 3, fontFamily: "'Lexend', sans-serif"
        }}>
            <Fade in={true}>
                <Paper elevation={0} sx={{ 
                    maxWidth: 480, width: '100%', textAlign: 'center', p: 5, borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '1px solid #e7edf3'
                }}>
                    <Typography sx={{ fontSize: '4rem', mb: 2 }}>🏁</Typography>
                    <Typography variant="h5" fontWeight={700} gutterBottom>Activity Ended</Typography>
                    <Button variant="contained" startIcon={<HomeIcon />} onClick={() => navigate('/')} fullWidth sx={{ mt: 3, bgcolor: '#0f172a' }}>
                        Back to Home
                    </Button>
                </Paper>
            </Fade>
        </Box>
    );
  }

  // --- SCREEN: ACTIVE CLASS ---
  return (
    <Box sx={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: '#f6f7f8',
      fontFamily: "'Lexend', sans-serif",
      overflow: 'hidden' // Prevent page scroll, handle inside components
    }}>
      
      {/* 1. NAVBAR */}
      <Box sx={{ 
        flexShrink: 0,
        bgcolor: 'white', borderBottom: '1px solid #e7edf3', 
        px: 2, height: 60, 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        zIndex: 50
      }}>
        {/* Brand */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 28, height: 28, color: THEME_COLOR }}>
                <svg fill="currentColor" viewBox="0 0 48 48"><path d="M42.1739 20.1739L27.8261 5.82609C29.1366 7.13663 28.3989 10.1876 26.2002 13.7654C24.8538 15.9564 22.9595 18.3449 20.6522 20.6522C18.3449 22.9595 15.9564 24.8538 13.7654 26.2002C10.1876 28.3989 7.13663 29.1366 5.82609 27.8261L20.1739 42.1739C21.4845 43.4845 24.5355 42.7467 28.1133 40.548C30.3042 39.2016 32.6927 37.3073 35 35C37.3073 32.6927 39.2016 30.3042 40.548 28.1133C42.7467 24.5355 43.4845 21.4845 42.1739 20.1739Z" /></svg>
            </Box>
            <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#0d141b', display: { xs: 'none', sm: 'block'} }}>Feedo</Typography>
        </Box>

        {/* User Info & Leave Button */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, overflow: 'hidden' }}>
            <Box sx={{ 
                display: 'flex', alignItems: 'center', gap: 1, 
                bgcolor: '#f1f5f9', px: 1.5, py: 0.5, borderRadius: '20px',
                maxWidth: '150px' // Restrict width so button isn't pushed out
            }}>
                <PersonIcon sx={{ color: '#64748b', fontSize: 18 }} />
                <Typography noWrap sx={{ fontWeight: 600, color: '#334155', fontSize: '0.85rem' }}>
                    {nickname}
                </Typography>
            </Box>
            
            <Button 
                onClick={handleLeave} 
                size="small"
                color="error" 
                sx={{ minWidth: 0, p: 1 }}
            >
                <LogoutIcon fontSize="small" />
            </Button>
        </Box>
      </Box>

      {/* 2. MAIN CONTENT (Reaction Stream) */}
      <Box sx={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        {socketInstance && <ReactionStream socket={socketInstance} />}
      </Box>

      {/* 3. FIXED BOTTOM BAR (Controls) */}
      <Paper 
        elevation={6}
        square
        sx={{ 
            height: 100, // Fixed height for the touch area
            display: 'flex',
            zIndex: 100,
            borderTop: '1px solid #e2e8f0',
            bgcolor: 'white'
        }}
      >
        {reactions.map((r) => (
          <Box 
            key={r.id}
            onClick={() => sendReaction(r.id)}
            sx={{ 
              flex: 1, // Equally splitter: Each item takes equal width
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              cursor: 'pointer',
              borderRight: '1px solid #f1f5f9',
              transition: 'background-color 0.1s',
              bgcolor: 'white',
              '&:last-child': { borderRight: 'none' },
              '&:active': { bgcolor: r.activeColor }
            }}
          >
            <Typography sx={{ fontSize: '2.5rem', lineHeight: 1, mb: 0.5 }}>
                {r.emoji}
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {r.label}
            </Typography>
          </Box>
        ))}
      </Paper>
    </Box>
  );
}