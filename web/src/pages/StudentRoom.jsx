import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { 
  Paper, Typography, Box, Button, Fade, Chip, Container, Grid, 
  Dialog, DialogTitle, DialogContent, IconButton, Link 
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import GroupIcon from '@mui/icons-material/Group';
import DescriptionIcon from '@mui/icons-material/Description';
import CloseIcon from '@mui/icons-material/Close';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'; // Pentru butonul de intrebare
import { connectSocket, disconnectSocket, getSocket } from '../services/socket';

// Configurația Cardurilor conform imaginii tale
const reactionCards = [
  { 
    id: 'happy', 
    emoji: '🙂', 
    title: 'I understand', 
    subtitle: 'Everything is clear so far',
    color: '#10b981', // Green Text/Icon
    bgColor: '#d1fae5', // Green Circle BG
    hoverColor: '#ecfdf5' // Card Hover
  },
  { 
    id: 'sad', 
    emoji: '☹️', 
    title: 'I’m lost', 
    subtitle: 'Need help or clarification',
    color: '#ef4444', // Red
    bgColor: '#fee2e2', 
    hoverColor: '#fef2f2'
  },
  { 
    id: 'surprised', 
    emoji: '🤩', 
    title: 'Interesting!', 
    subtitle: 'Surprised by this concept',
    color: '#9333ea', // Purple
    bgColor: '#f3e8ff', 
    hoverColor: '#faf5ff'
  },
  { 
    id: 'confused', 
    emoji: '😐', 
    title: 'Unclear', 
    subtitle: 'Can you explain again?',
    color: '#eab308', // Yellow/Orange
    bgColor: '#fef9c3', 
    hoverColor: '#fefce8'
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
  const MAX_DESC_LENGTH = 100;

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
        // Important: Backend-ul trebuie să trimită name/description și aici
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
    // Feedback vizual simplu (vibratie sau animatie) ar putea fi adaugat aici
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
      fontFamily: "'Lexend', sans-serif", overflowY: 'auto'
    }}>
      
      {/* 1. NAVBAR */}
      <Box sx={{ 
        flexShrink: 0, bgcolor: 'white', borderBottom: '1px solid #e7edf3', 
        px: {xs: 2, md: 4}, height: 64, 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        position: 'sticky', top: 0, zIndex: 50
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ width: 28, height: 28, color: THEME_COLOR }}>
                <svg fill="currentColor" viewBox="0 0 48 48"><path d="M42.1739 20.1739L27.8261 5.82609C29.1366 7.13663 28.3989 10.1876 26.2002 13.7654C24.8538 15.9564 22.9595 18.3449 20.6522 20.6522C18.3449 22.9595 15.9564 24.8538 13.7654 26.2002C10.1876 28.3989 7.13663 29.1366 5.82609 27.8261L20.1739 42.1739C21.4845 43.4845 24.5355 42.7467 28.1133 40.548C30.3042 39.2016 32.6927 37.3073 35 35C37.3073 32.6927 39.2016 30.3042 40.548 28.1133C42.7467 24.5355 43.4845 21.4845 42.1739 20.1739Z" /></svg>
            </Box>
            
            {/* Info Activitate - Mobile (Doar Titlu) */}
            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                 <Typography variant="subtitle2" fontWeight={700} color="#0f172a" noWrap sx={{ maxWidth: 120 }}>
                    {activityName}
                 </Typography>
            </Box>

             {/* Info Activitate - Desktop */}
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

      {/* 2. MAIN CONTENT - GRID 2x2 */}
      <Container maxWidth="lg" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', py: 4 }}>
        
        {/* Titlu Central */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h3" fontWeight={800} color="#0d141b" sx={{ mb: 1, fontSize: { xs: '2rem', md: '3rem' } }}>
                How is the lecture going?
            </Typography>
            <Typography variant="body1" color="#64748b">
                Click a card below to send live feedback to your instructor.
                <br/>
                <Typography component="span" variant="caption" color="text.disabled">Your feedback is anonymous</Typography>
            </Typography>

            {/* View Activity Details Button (Mobile/Tablet primarily) */}
            <Button 
                startIcon={<DescriptionIcon />} 
                onClick={() => setOpenDescModal(true)}
                sx={{ mt: 2, textTransform: 'none', color: THEME_COLOR }}
            >
                View Activity Details
            </Button>
        </Box>

        {/* Grid-ul de Carduri */}
        <Grid container spacing={3} justifyContent="center">
            {reactionCards.map((card) => (
                <Grid item xs={12} sm={6} md={5} key={card.id}>
                    <Paper 
                        elevation={0}
                        onClick={() => sendReaction(card.id)}
                        sx={{ 
                            p: 4, 
                            height: '100%',
                            borderRadius: '24px',
                            cursor: 'pointer',
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            textAlign: 'center',
                            transition: 'all 0.2s ease',
                            border: '1px solid transparent',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                            '&:hover': { 
                                transform: 'translateY(-4px)',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                bgcolor: 'white', // Pastram alb pe hover pentru contrast
                                borderColor: card.color
                            },
                            '&:active': { transform: 'scale(0.98)' }
                        }}
                    >
                        {/* Cercul cu Emoji */}
                        <Box sx={{ 
                            width: 100, height: 100, borderRadius: '50%', 
                            bgcolor: card.bgColor, 
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '3.5rem', mb: 3
                        }}>
                            {card.emoji}
                        </Box>

                        <Typography variant="h5" fontWeight={800} color="#0f172a" gutterBottom>
                            {card.title}
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            {card.subtitle}
                        </Typography>
                    </Paper>
                </Grid>
            ))}
        </Grid>
      </Container>

      {/* Footer "Ask a Question" (Optional, ca in design) */}
      <Box sx={{ p: 3, textAlign: 'right' }}>
         <Button 
            variant="contained" 
            startIcon={<ChatBubbleOutlineIcon />}
            sx={{ 
                bgcolor: '#137fec', borderRadius: '30px', px: 3, py: 1.5, 
                fontWeight: 700, textTransform: 'none',
                boxShadow: '0 4px 10px rgba(19, 127, 236, 0.3)'
            }}
         >
            Ask a Question
         </Button>
      </Box>

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