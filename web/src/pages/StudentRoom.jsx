import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { 
  Paper, Typography, Box, Button, Fade, Chip, Container, Grid, 
  Dialog, DialogTitle, DialogContent, IconButton 
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import GroupIcon from '@mui/icons-material/Group';
import DescriptionIcon from '@mui/icons-material/Description';
import CloseIcon from '@mui/icons-material/Close';
import { connectSocket, disconnectSocket, getSocket } from '../services/socket';
import ReactionStream from '../components/ReactionStream';

// Configurația Cardurilor
const reactionCards = [
  { 
    id: 'happy', 
    emoji: '🙂', 
    title: 'I understand', 
    subtitle: 'Everything is clear',
    color: '#10b981', 
    bgColor: '#d1fae5', 
  },
  { 
    id: 'sad', 
    emoji: '☹️', 
    title: 'I’m lost', 
    subtitle: 'Need help',
    color: '#ef4444', 
    bgColor: '#fee2e2', 
  },
  { 
    id: 'surprised', 
    emoji: '🤩', 
    title: 'Interesting!', 
    subtitle: 'Surprised',
    color: '#9333ea', 
    bgColor: '#f3e8ff', 
  },
  { 
    id: 'confused', 
    emoji: '😐', 
    title: 'Unclear', 
    subtitle: 'Explain again?',
    color: '#eab308', 
    bgColor: '#fef9c3', 
  },
];

export default function StudentRoom() {
  const location = useLocation();
  const navigate = useNavigate();
  const { token, nickname } = location.state || {};
  const [socketInstance, setSocketInstance] = useState(null);
  const [isEnded, setIsEnded] = useState(false);
  
  // State-uri
  const [participantCount, setParticipantCount] = useState(1);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState("00:00:00");
  
  // Titlu si Descriere Activitate
  const [activityName, setActivityName] = useState("Untitled Activity");
  const [activityDesc, setActivityDesc] = useState("");
  const [openDescModal, setOpenDescModal] = useState(false);

  const THEME_COLOR = '#137fec';

  // --- TIMER LOGIC ---
  useEffect(() => {
    if (!startTime) return;
    const interval = setInterval(() => {
        const now = new Date();
        const start = new Date(startTime);
        const diff = now - start;
        if (diff < 0) { setElapsedTime("00:00:00"); return; }
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setElapsedTime(`${hours > 0 ? hours.toString().padStart(2, '0') + ':' : ''}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  // --- SOCKET LOGIC ---
  useEffect(() => {
    if (!token) return;

    const s = connectSocket(token);
    setSocketInstance(s);

    s.on('room_state', (data) => {
        if(data.startTime) setStartTime(data.startTime);
        if(data.participantCount) setParticipantCount(data.participantCount);
        if(data.name) setActivityName(data.name); 
        if(data.description) setActivityDesc(data.description);
    });

    s.on('participant_joined', (data) => {
        if(data.count) setParticipantCount(data.count);
    });

    s.on('participant_left', (data) => {
        if(data.count) setParticipantCount(data.count);
    });

    s.on('activity_ended', () => {
        setIsEnded(true);
        disconnectSocket();
    });

    s.on('disconnect', (reason) => {
        if (reason === "io server disconnect") setIsEnded(true);
    });

    return () => {
        s.off('activity_ended');
        s.off('room_state');
        s.off('participant_joined');
        s.off('participant_left');
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

  // --- SCREEN: ACTIVITY ENDED ---
  if (isEnded) {
    return (
        <Box sx={{ 
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            bgcolor: '#f6f7f8', 
            backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', 
            backgroundSize: '24px 24px',
            p: 3, fontFamily: "'Lexend', sans-serif"
        }}>
            <Fade in={true}>
                <Paper elevation={0} sx={{ 
                    maxWidth: 480, width: '100%', textAlign: 'center', p: 5, borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '1px solid #e7edf3'
                }}>
                    <Typography sx={{ fontSize: '4rem', mb: 2 }}>🏁</Typography>
                    <Typography variant="h5" fontWeight={700} gutterBottom>Activity Ended</Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        The session has ended. Thanks for participating!
                    </Typography>
                    <Button variant="contained" startIcon={<HomeIcon />} onClick={() => navigate('/')} fullWidth sx={{ mt: 1, bgcolor: '#0f172a', py: 1.5 }}>
                        Back to Home
                    </Button>
                </Paper>
            </Fade>
        </Box>
    );
  }

  // --- SCREEN: ACTIVE ROOM ---
  return (
    <Box sx={{ 
      height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f6f7f8',
      backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '24px 24px',
      fontFamily: "'Lexend', sans-serif", overflow: 'hidden', position: 'relative'
    }}>
      
      {/* 1. REACTION STREAM (Background Overlay) */}
      {socketInstance && (
        <Box sx={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
            <ReactionStream socket={socketInstance} />
        </Box>
      )}

      {/* 2. NAVBAR */}
      <Box sx={{ 
        flexShrink: 0, bgcolor: 'white', borderBottom: '1px solid #e7edf3', 
        px: {xs: 2, md: 4}, height: 64, 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        position: 'sticky', top: 0, zIndex: 50
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ width: 28, height: 28, color: THEME_COLOR }}>
               <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.499 5.221 69.78 69.78 0 00-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
             </svg>
            </Box>
            
            {/* Mobile Title */}
            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                 <Typography variant="subtitle2" fontWeight={700} color="#0f172a" noWrap sx={{ maxWidth: 120 }}>
                    {activityName}
                 </Typography>
            </Box>

            {/* Desktop Title */}
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <Typography variant="subtitle1" fontWeight={700} color="#0f172a">
                    {activityName}
                </Typography>
                {activityDesc && (
                    <Typography variant="caption" color="text.secondary">
                        {activityDesc.length > 50 ? activityDesc.slice(0, 50) + '...' : activityDesc}
                    </Typography>
                )}
            </Box>

            <Chip icon={<AccessTimeIcon sx={{ fontSize: '1rem !important' }} />} label={elapsedTime} size="small" sx={{ bgcolor: '#f1f5f9', fontWeight: 600, color: '#475569', ml: 1 }} />
            <Chip icon={<GroupIcon sx={{ fontSize: '1rem !important' }} />} label={participantCount} size="small" sx={{ bgcolor: '#f0f9ff', color: '#0369a1', fontWeight: 600, display: {xs: 'none', sm: 'flex'} }} />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#f1f5f9', px: 1.5, py: 0.5, borderRadius: '20px', maxWidth: '150px' }}>
                <PersonIcon sx={{ color: '#64748b', fontSize: 18 }} />
                <Typography noWrap sx={{ fontWeight: 600, color: '#334155', fontSize: '0.85rem' }}>{nickname}</Typography>
            </Box>
            <Button onClick={handleLeave} size="small" color="error" sx={{ minWidth: 0, p: 1 }}>
                <LogoutIcon fontSize="small" />
            </Button>
        </Box>
      </Box>

      {/* 3. MAIN CONTENT */}
      <Container maxWidth="lg" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', py: 2, zIndex: 1, overflowY: 'auto', mb: { xs: 10, md: 0 } }}>
        
        <Box sx={{ textAlign: 'center', mb: { xs: 0, md: 6 }, mt: { xs: -4, md: 0 } }}>
            <Typography variant="h3" fontWeight={800} color="#0d141b" sx={{ mb: 1, fontSize: { xs: '1.8rem', md: '3rem' } }}>
                How is the lecture going?
            </Typography>
            <Typography variant="body1" color="#64748b" sx={{ fontSize: { xs: '0.9rem', md: '1rem' }, display: { xs: 'none', md: 'block' } }}>
                Tap a card below to send live feedback.
            </Typography>
            <Typography variant="body1" color="#64748b" sx={{ fontSize: { xs: '0.9rem', md: '1rem' }, display: { xs: 'block', md: 'none' } }}>
                Tap a button below to react.
            </Typography>

            <Button 
                startIcon={<DescriptionIcon />} 
                onClick={() => setOpenDescModal(true)}
                sx={{ mt: 2, textTransform: 'none', color: THEME_COLOR, fontSize: '0.9rem', bgcolor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(4px)', px: 2, py: 0.5, borderRadius: 2 }}
            >
                View Activity Details
            </Button>
        </Box>

        {/* --- DESKTOP GRID (Hidden on Mobile) --- */}
        <Grid container spacing={2} justifyContent="center" sx={{ display: { xs: 'none', md: 'flex' } }}>
            {reactionCards.map((card) => (
                <Grid item sm={6} md={5} key={card.id}>
                    <Paper 
                        elevation={0}
                        onClick={() => sendReaction(card.id)}
                        sx={{ 
                            p: 4, height: '100%', borderRadius: '24px',
                            cursor: 'pointer', display: 'flex', flexDirection: 'column', 
                            alignItems: 'center', textAlign: 'center',
                            transition: 'all 0.2s ease', border: '1px solid transparent',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                            '&:hover': { 
                                transform: 'translateY(-4px)', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                bgcolor: 'white', borderColor: card.color
                            },
                            '&:active': { transform: 'scale(0.95)' }
                        }}
                    >
                        <Box sx={{ 
                            width: 100, height: 100, borderRadius: '50%', 
                            bgcolor: card.bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '3.5rem', mb: 3
                        }}>
                            {card.emoji}
                        </Box>
                        <Typography variant="h5" fontWeight={800} color="#0f172a" gutterBottom>{card.title}</Typography>
                        <Typography variant="body1" color="text.secondary">{card.subtitle}</Typography>
                    </Paper>
                </Grid>
            ))}
        </Grid>
      </Container>

      {/* --- MOBILE BOTTOM BAR (Visible only on Mobile) --- */}
      <Paper 
        elevation={6}
        sx={{ 
            position: 'fixed', bottom: 0, left: 0, right: 0, 
            display: { xs: 'flex', md: 'none' }, 
            justifyContent: 'space-evenly', alignItems: 'center',
            p: 2, pb: 4, // Extra bottom padding for iOS Home Indicator
            borderTopLeftRadius: 24, borderTopRightRadius: 24,
            bgcolor: 'white', zIndex: 100,
            boxShadow: '0 -4px 20px rgba(0,0,0,0.08)'
        }}
      >
         {reactionCards.map((card) => (
            <Box 
                key={card.id} 
                onClick={() => sendReaction(card.id)}
                sx={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5,
                    cursor: 'pointer', transition: 'transform 0.1s',
                    '&:active': { transform: 'scale(0.8)' }
                }}
            >
                <Box sx={{ 
                    width: 56, height: 56, borderRadius: '50%', 
                    bgcolor: card.bgColor, 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.8rem',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                }}>
                    {card.emoji}
                </Box>
                <Typography variant="caption" fontWeight={600} color="#64748b" sx={{ fontSize: '0.7rem' }}>
                    {card.title}
                </Typography>
            </Box>
         ))}
      </Paper>

      {/* --- MODAL DESCRIERE --- */}
      <Dialog open={openDescModal} onClose={() => setOpenDescModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={700}>Activity Details</Typography>
            <IconButton onClick={() => setOpenDescModal(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
            <Typography variant="h5" color={THEME_COLOR} fontWeight={700} gutterBottom>
                {activityName}
            </Typography>
            <Typography variant="body1" color="#475569" sx={{ whiteSpace: 'pre-wrap' }}>
                {activityDesc || "No description provided."}
            </Typography>
        </DialogContent>
      </Dialog>

    </Box>
  );
}