import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { 
  Paper, Typography, Box, List, ListItem, ListItemText, 
  ListItemAvatar, Avatar, Grid, Button, Container, Chip
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import GroupIcon from '@mui/icons-material/Group';
import { connectSocket, disconnectSocket } from '../services/socket';
import ReactionStream from '../components/ReactionStream';

export default function TeacherDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { token, room_code } = location.state || {}; 
  
  const [participants, setParticipants] = useState([]);
  const [stats, setStats] = useState({ count: 0 });
  const [socketInstance, setSocketInstance] = useState(null);

  // --- THEME CONSTANTS (Teacher Purple) ---
  const THEME_COLOR = '#9333ea';
  const THEME_BG_ACCENT = '#f3e8ff'; // Light purple for backgrounds

  useEffect(() => {
    if (!token) return;

    const socket = connectSocket(token);
    setSocketInstance(socket);

    socket.on('teacher_dashboard_data', (data) => {
      setParticipants(data.participants.map(p => ({ ...p, status: 'active' })));
      setStats(prev => ({ ...prev, count: data.participants.length }));
    });

    socket.on('participant_joined', (data) => {
      setParticipants(prev => {
        const exists = prev.find(p => p.nickname === data.nickname);
        if (exists) {
            return prev.map(p => p.nickname === data.nickname ? { ...p, status: 'active' } : p);
        } else {
            return [...prev, { nickname: data.nickname, status: 'active', joinAt: new Date() }];
        }
      });
      setStats(prev => ({ ...prev, count: data.count }));
    });

    socket.on('participant_left', (data) => {
      setParticipants(prev => prev.map(p => 
        p.nickname === data.nickname ? { ...p, status: 'left' } : p
      ));
      setStats(prev => ({ ...prev, count: data.count }));
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

  const copyCode = () => {
      navigator.clipboard.writeText(room_code);
  };

  return (
    <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        bgcolor: '#f6f7f8',
        backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        fontFamily: "'Lexend', sans-serif"
    }}>
      
      {/* Navbar */}
      <Box sx={{ 
        width: '100%', bgcolor: 'white', borderBottom: '1px solid #e7edf3', px: { xs: 3, md: 5 }, height: 64, 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* Logo */}
          <Box sx={{ width: 32, height: 32, color: THEME_COLOR }}>
             <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.499 5.221 69.78 69.78 0 00-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
             </svg>
          </Box>
          <Typography sx={{ fontSize: '1.125rem', fontWeight: 700, color: '#0d141b' }}>Feedo Teacher</Typography>
        </Box>
        <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: THEME_BG_ACCENT, border: '2px solid #fff' }} />
      </Box>

      <Container maxWidth="xl" sx={{ flexGrow: 1, py: 4 }}>
        
        {/* Header Info Card */}
        <Paper elevation={0} sx={{ 
            p: 3, mb: 3, borderRadius: '12px', bgcolor: 'white', border: '1px solid #e7edf3',
            boxShadow: '0 4px 6px rgba(0,0,0,0.02)', display: 'flex', flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between', alignItems: 'center', gap: 2, position: 'relative', overflow: 'hidden'
        }}>
            <Box sx={{ height: '100%', width: 4, bgcolor: THEME_COLOR, position: 'absolute', top: 0, left: 0 }} />

            <Box>
                <Typography variant="overline" color="text.secondary" fontWeight={600} letterSpacing={1}>Current Session</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                    <Typography variant="h4" fontWeight={700} color="#0d141b">
                        {room_code}
                    </Typography>
                    <Chip 
                        icon={<ContentCopyIcon sx={{ fontSize: 14 }} />} 
                        label="Copy" 
                        size="small" 
                        onClick={copyCode}
                        clickable
                        sx={{ bgcolor: '#f1f5f9', fontWeight: 600 }}
                    />
                </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Box sx={{ textAlign: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: THEME_COLOR }}>
                        <GroupIcon />
                        <Typography variant="h5" fontWeight={700}>{stats.count}</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">Live Students</Typography>
                </Box>

                <Button 
                    variant="contained" 
                    color="error"
                    startIcon={<StopCircleIcon />}
                    onClick={handleStopActivity}
                    sx={{ 
                        bgcolor: '#ef4444', 
                        fontWeight: 700, 
                        textTransform: 'none',
                        px: 3, py: 1.5,
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.4)',
                        '&:hover': { bgcolor: '#dc2626' }
                    }}
                >
                    Stop Activity
                </Button>
            </Box>
        </Paper>

        <Grid container spacing={3} sx={{ height: 'calc(100vh - 240px)', minHeight: 500 }}>
            
            {/* Left Column: Roster */}
            <Grid item xs={12} md={3} sx={{ height: '100%' }}>
                <Paper elevation={0} sx={{ 
                    height: '100%', display: 'flex', flexDirection: 'column', 
                    borderRadius: '12px', border: '1px solid #e7edf3', bgcolor: 'white', overflow: 'hidden'
                }}>
                    <Box sx={{ p: 2, borderBottom: '1px solid #f1f5f9', bgcolor: '#f8fafc' }}>
                        <Typography fontWeight={600} color="#334155">Participants</Typography>
                    </Box>
                    <List sx={{ overflowY: 'auto', flexGrow: 1, p: 0 }}>
                        {participants.map((p, index) => (
                            <ListItem key={index} sx={{ borderBottom: '1px solid #f8fafc' }}>
                                <ListItemAvatar>
                                    <Avatar sx={{ 
                                        bgcolor: p.status === 'active' ? '#dcfce7' : '#f1f5f9', 
                                        color: p.status === 'active' ? '#166534' : '#94a3b8',
                                        width: 36, height: 36
                                    }}>
                                        <PersonIcon fontSize="small" />
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText 
                                    primary={<Typography fontWeight="500" fontSize="0.95rem">{p.nickname}</Typography>} 
                                    secondary={
                                        <Typography variant="caption" color={p.status === 'active' ? 'success.main' : 'text.disabled'}>
                                            {p.status === 'active' ? 'Online' : 'Left'}
                                        </Typography>
                                    } 
                                />
                            </ListItem>
                        ))}
                        {participants.length === 0 && (
                            <Box sx={{ p: 4, textAlign: 'center', color: '#94a3b8' }}>
                                <Typography variant="body2">Waiting for students to join...</Typography>
                            </Box>
                        )}
                    </List>
                </Paper>
            </Grid>

            {/* Right Column: Stream */}
            <Grid item xs={12} md={9} sx={{ height: '100%' }}>
                <Paper elevation={0} sx={{ 
                    height: '100%', position: 'relative', 
                    borderRadius: '12px', border: '1px solid #e7edf3', bgcolor: 'white',
                    display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                    overflow: 'hidden'
                }}>
                    {/* Background Grid Pattern within the stream area */}
                    <Box sx={{ 
                        position: 'absolute', inset: 0, opacity: 0.4,
                        backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)', 
                        backgroundSize: '20px 20px' 
                    }} />

                    {socketInstance && <ReactionStream socket={socketInstance} />}

                    <Box sx={{ zIndex: 1, textAlign: 'center', pointerEvents: 'none' }}>
                        <Typography variant="h3" color="#e2e8f0" fontWeight={700} sx={{ opacity: 0.5 }}>
                            Live Feedback
                        </Typography>
                    </Box>
                </Paper>
            </Grid>
        </Grid>
      </Container>
    </Box>
  );
}