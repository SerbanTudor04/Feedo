import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { 
  Paper, Typography, Box, Button, Container, Chip, Avatar, 
  List, ListItem, ListItemAvatar, ListItemText, Fade, 
  Dialog, DialogTitle, DialogContent, IconButton, Link 
} from '@mui/material';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import GroupIcon from '@mui/icons-material/Group';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import HistoryIcon from '@mui/icons-material/History';
import DescriptionIcon from '@mui/icons-material/Description';
import CloseIcon from '@mui/icons-material/Close'; 
import { connectSocket, disconnectSocket } from '../services/socket';
import ReactionStream from '../components/ReactionStream';

// UPDATED: Standardized emojis to match Student Room
const REACTION_MAP = {
  'happy': { emoji: '🙂', label: 'I understand' },
  'surprised': { emoji: '🤩', label: 'Interesting!' },
  'confused': { emoji: '😐', label: 'Unclear' },
  'sad': { emoji: '☹️', label: 'I’m lost' }
};

export default function TeacherDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { token, room_code } = location.state || {}; 
  
  const [participants, setParticipants] = useState([]);
  const participantsRef = useRef([]); 
  
  const [stats, setStats] = useState({ count: 0 });
  const [socketInstance, setSocketInstance] = useState(null);
  
  const [activityName, setActivityName] = useState("Untitled Activity");
  const [activityDesc, setActivityDesc] = useState("");
  const [openDescModal, setOpenDescModal] = useState(false);

  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState("00:00:00");
  const [feedbackLog, setFeedbackLog] = useState([]);

  const THEME_COLOR = '#9333ea';
  const THEME_BG_ACCENT = '#f3e8ff';
  const MAX_DESC_LENGTH = 150; 

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
        const hDisplay = hours > 0 ? hours.toString().padStart(2, '0') + ':' : '';
        const mDisplay = minutes.toString().padStart(2, '0');
        const sDisplay = seconds.toString().padStart(2, '0');
        setElapsedTime(`${hDisplay}${mDisplay}:${sDisplay}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  // --- SOCKET LOGIC ---
  useEffect(() => {
    if (!token) return;

    const socket = connectSocket(token);
    setSocketInstance(socket);

    socket.on('room_state', (data) => {
        if(data.startTime) setStartTime(data.startTime);
        if(data.participantCount) setStats(prev => ({ ...prev, count: data.participantCount }));
        if(data.name) setActivityName(data.name);
    });

    socket.on('teacher_dashboard_data', (data) => {
      if (data.roomName) setActivityName(data.roomName);
      if (data.roomDescription) setActivityDesc(data.roomDescription);
      
      const pList = data.participants.map(p => ({ 
          ...p, 
          status: p.leavedAt ? 'left' : 'active' 
      }));
      
      setParticipants(pList);
      participantsRef.current = pList;
      
      const activeCount = pList.filter(p => p.status === 'active').length;
      setStats(prev => ({ ...prev, count: activeCount }));
    });

    socket.on('participant_joined', (data) => {
      setParticipants(prev => {
        const exists = prev.find(p => p.nickname === data.nickname);
        let newList;
        if (exists) {
            newList = prev.map(p => p.nickname === data.nickname ? { ...p, status: 'active' } : p);
        } else {
            newList = [...prev, { nickname: data.nickname, status: 'active', joinAt: new Date(), sessionId: data.sessionId }];
        }
        participantsRef.current = newList;
        return newList;
      });
      setStats(prev => ({ ...prev, count: data.count }));
    });

    socket.on('participant_left', (data) => {
      setParticipants(prev => {
        const newList = prev.map(p => p.nickname === data.nickname ? { ...p, status: 'left' } : p);
        participantsRef.current = newList;
        return newList;
      });
      setStats(prev => ({ ...prev, count: data.count }));
    });

    socket.on('receive_feedback', (data) => {
        const { value } = data;
        const reactionInfo = REACTION_MAP[value] || { emoji: '❓', label: value };
        
        const newLogEntry = {
            id: Date.now() + Math.random(),
            nickname: "A student", 
            emoji: reactionInfo.emoji,
            label: reactionInfo.label,
            timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };

        setFeedbackLog(prev => [newLogEntry, ...prev]);
    });

    return () => {
      disconnectSocket();
      setSocketInstance(null);
    };
  }, [token]);

  const handleStopActivity = () => {
    if (!socketInstance) return;
    if (window.confirm("Are you sure you want to stop this activity? All students will be disconnected.")) {
        socketInstance.emit('stop_activity', { activityType: 'lecture', details: 'Teacher ended session' });
        navigate('/report', { 
            state: { roomCode: room_code, totalParticipants: participants.length, token: token } 
        });
    }
  };

  const copyCode = () => { navigator.clipboard.writeText(room_code); };

  return (
    <Box sx={{ 
        minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f6f7f8',
        backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '24px 24px',
        fontFamily: "'Lexend', sans-serif"
    }}>
      
      {/* Navbar */}
      <Box sx={{ 
        width: '100%', bgcolor: 'white', borderBottom: '1px solid #e7edf3', px: { xs: 3, md: 5 }, height: 64, 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 32, height: 32, color: THEME_COLOR }}>
             <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.499 5.221 69.78 69.78 0 00-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
             </svg>
          </Box>
          <Typography sx={{ fontSize: '1.125rem', fontWeight: 700, color: '#0d141b' }}>Feedo Teacher</Typography>
        </Box>
        
        {/* Right Side: End Class Button & Profile */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button 
                variant="contained" 
                color="error" 
                size="small"
                startIcon={<StopCircleIcon />} 
                onClick={handleStopActivity}
                sx={{ 
                    bgcolor: '#ef4444', 
                    fontWeight: 700, 
                    textTransform: 'none', 
                    borderRadius: '8px',
                    boxShadow: 'none',
                    '&:hover': { bgcolor: '#dc2626', boxShadow: 'none' }
                }}
            >
                End Class
            </Button>
            <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: THEME_BG_ACCENT, border: '2px solid #fff' }} />
        </Box>
      </Box>

      <Container maxWidth="xl" sx={{ flexGrow: 1, py: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
        
        {/* --- SECTION: Titlu Activitate și Descriere --- */}
        <Box sx={{ mb: 1 }}>
            <Typography variant="h4" fontWeight={800} color="#0d141b" sx={{ mb: 1 }}>
                {activityName}
            </Typography>
            
            {activityDesc && (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, color: '#64748b', maxWidth: '800px' }}>
                    <DescriptionIcon sx={{ fontSize: 20, mt: 0.3, flexShrink: 0 }} />
                    <Typography variant="body1" lineHeight={1.6}>
                        {activityDesc.length > MAX_DESC_LENGTH ? (
                            <>
                                {activityDesc.slice(0, MAX_DESC_LENGTH)}...
                                <Box component="span" sx={{ ml: 1 }}>
                                    <Link 
                                        component="button" 
                                        onClick={() => setOpenDescModal(true)}
                                        sx={{ 
                                            fontWeight: 600, 
                                            color: THEME_COLOR, 
                                            textDecoration: 'none', 
                                            cursor: 'pointer',
                                            '&:hover': { textDecoration: 'underline' }
                                        }}
                                    >
                                        View More
                                    </Link>
                                </Box>
                            </>
                        ) : (
                            activityDesc
                        )}
                    </Typography>
                </Box>
            )}
        </Box>
        
        {/* Header Info Card */}
        <Paper elevation={0} sx={{ 
            p: 3, borderRadius: '12px', bgcolor: 'white', border: '1px solid #e7edf3',
            boxShadow: '0 4px 6px rgba(0,0,0,0.02)', display: 'flex', flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between', alignItems: 'center', gap: 2, position: 'relative', overflow: 'hidden'
        }}>
            <Box sx={{ height: '100%', width: 4, bgcolor: THEME_COLOR, position: 'absolute', top: 0, left: 0 }} />

            <Box>
                <Typography variant="overline" color="text.secondary" fontWeight={600} letterSpacing={1}>Session Code</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                    <Typography variant="h4" fontWeight={700} color="#0d141b">
                        {room_code}
                    </Typography>
                    <Chip icon={<ContentCopyIcon sx={{ fontSize: 14 }} />} label="Copy" size="small" onClick={copyCode} clickable sx={{ bgcolor: '#f1f5f9', fontWeight: 600 }} />
                </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Box sx={{ textAlign: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, color: THEME_COLOR }}>
                        <AccessTimeIcon />
                        <Typography variant="h5" fontWeight={700} sx={{ minWidth: '80px' }}>{elapsedTime}</Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>ELAPSED TIME</Typography>
                </Box>
                <Box sx={{ width: '1px', height: '40px', bgcolor: '#e2e8f0' }} />
                <Box sx={{ textAlign: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, color: THEME_COLOR }}>
                        <GroupIcon />
                        <Typography variant="h5" fontWeight={700}>{stats.count}</Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>STUDENTS</Typography>
                </Box>
            </Box>
        </Paper>

        {/* Horizontal Roster Bar */}
        <Paper elevation={0} sx={{ 
            p: 2, borderRadius: '12px', border: '1px solid #e7edf3', bgcolor: 'white',
            display: 'flex', alignItems: 'center', gap: 2, overflow: 'hidden'
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 2, borderRight: '1px solid #f1f5f9', minWidth: 'fit-content' }}>
                <GroupIcon sx={{ color: '#94a3b8' }} />
                <Typography fontWeight={600} color="#334155">Roster ({participants.length})</Typography>
            </Box>
            <Box sx={{ 
                display: 'flex', gap: 1, overflowX: 'auto', pb: 0.5,
                '&::-webkit-scrollbar': { height: 6 }, '&::-webkit-scrollbar-thumb': { bgcolor: '#e2e8f0', borderRadius: 4 }
            }}>
                {participants.map((p, index) => (
                    <Chip
                        key={index}
                        avatar={
                            <Avatar sx={{ 
                                bgcolor: p.status === 'active' ? '#dcfce7' : '#f1f5f9', 
                                color: p.status === 'active' ? '#166534' : '#94a3b8' 
                            }}>
                                {p.nickname.charAt(0).toUpperCase()}
                            </Avatar>
                        }
                        label={p.nickname}
                        variant={p.status === 'active' ? "filled" : "outlined"}
                        sx={{ 
                            bgcolor: p.status === 'active' ? '#fff' : '#f8fafc',
                            border: p.status === 'active' ? '1px solid #bbf7d0' : '1px dashed #cbd5e1',
                            color: p.status === 'active' ? '#14532d' : '#94a3b8',
                            fontWeight: 600
                        }}
                    />
                ))}
                {participants.length === 0 && <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>Waiting for students to join...</Typography>}
            </Box>
        </Paper>

        {/* Live Feedback Log */}
        <Paper elevation={0} sx={{ 
            flexGrow: 1, minHeight: 400, borderRadius: '12px', border: '1px solid #e7edf3', bgcolor: 'white',
            position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column'
        }}>
            <Box sx={{ p: 2, borderBottom: '1px solid #f1f5f9', bgcolor: '#f8fafc', zIndex: 10, display: 'flex', alignItems: 'center', gap: 1 }}>
                <HistoryIcon sx={{ color: '#64748b' }} />
                <Typography fontWeight={600} color="#334155">Live Activity Log</Typography>
            </Box>
            <Box sx={{ position: 'absolute', inset: 0, opacity: 0.15, pointerEvents: 'none', zIndex: 0 }}>
                {socketInstance && <ReactionStream socket={socketInstance} />}
            </Box>
            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 0, zIndex: 1, position: 'relative' }}>
                <List>
                    {feedbackLog.length === 0 ? (
                        <Box sx={{ textAlign: 'center', mt: 8, opacity: 0.5 }}>
                            <Typography variant="h3">😴</Typography>
                            <Typography variant="body1" mt={1}>No reactions yet.</Typography>
                        </Box>
                    ) : (
                        feedbackLog.map((log) => (
                            <Fade in={true} key={log.id}>
                                <ListItem sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <ListItemAvatar>
                                        <Avatar sx={{ bgcolor: 'transparent', fontSize: '1.5rem' }}>{log.emoji}</Avatar>
                                    </ListItemAvatar>
                                    <ListItemText 
                                        primary={<Typography variant="body1" color="#0f172a"><strong>Someone</strong> reacted: <strong>{log.label}</strong></Typography>}
                                        secondary={log.timestamp}
                                    />
                                </ListItem>
                            </Fade>
                        ))
                    )}
                </List>
            </Box>
        </Paper>
      </Container>

      {/* --- MODAL PENTRU DESCRIERE --- */}
      <Dialog 
        open={openDescModal} 
        onClose={() => setOpenDescModal(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
            sx: { borderRadius: '16px', p: 1 }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
            <Typography variant="h5" fontWeight={800} color="#0d141b">
                Activity Details
            </Typography>
            <IconButton onClick={() => setOpenDescModal(false)}>
                <CloseIcon />
            </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ borderTop: '1px solid #f1f5f9', borderBottom: 'none' }}>
            <Typography variant="h6" color={THEME_COLOR} fontWeight={700} gutterBottom>
                {activityName}
            </Typography>
            <Typography variant="body1" lineHeight={1.8} color="#475569" sx={{ whiteSpace: 'pre-wrap' }}>
                {activityDesc}
            </Typography>
        </DialogContent>
      </Dialog>

    </Box>
  );
}