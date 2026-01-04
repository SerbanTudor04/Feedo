import { useEffect, useState } from 'react';
import { useLocation,useNavigate } from 'react-router';
import { 
  Paper, Typography, Box, List, ListItem, ListItemText, 
  ListItemAvatar, Avatar, Grid, Divider,Button
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import CircleIcon from '@mui/icons-material/Circle';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import { connectSocket, disconnectSocket } from '../services/socket';
import ReactionStream from '../components/ReactionStream';

export default function TeacherDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { token, room_code } = location.state || {}; 
  
  const [participants, setParticipants] = useState([]);
  const [stats, setStats] = useState({ count: 0 });
  const [socketInstance, setSocketInstance] = useState(null);

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
        // 1. Notify Backend
        socketInstance.emit('stop_activity', { 
            activityType: 'lecture', 
            details: 'Teacher ended session' 
        });

        // 2. Redirect to Report Page immediately
        navigate('/report', { 
            state: { 
                roomCode: room_code,
                totalParticipants: participants.length
            } 
        });
    }
  };

  return (
    <Box sx={{ maxWidth: '1200px', mx: 'auto', p: 2 }}>
      
      {/* 1. Header Card (Blue Gradient) */}
      {/* Header Card Updated with Stop Button */}
      <Paper 
        elevation={6} 
        sx={{ 
          p: 3, mb: 4, 
          background: 'linear-gradient(90deg, #2196F3 0%, #00B0FF 100%)', 
          color: 'white', borderRadius: 3,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}
      >
        <Box>
            <Typography variant="h4" fontWeight="bold">Room: {room_code}</Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>Live Participants: {stats.count}</Typography>
        </Box>
        
        <Button 
            variant="contained" 
            color="error" 
            size="large"
            startIcon={<StopCircleIcon />}
            onClick={handleStopActivity}
            sx={{ 
                bgcolor: 'white', color: '#d32f2f', fontWeight: 'bold',
                '&:hover': { bgcolor: '#ffebee' } 
            }}
        >
            Stop Activity
        </Button>
      </Paper>

      {/* 2. Main Content Grid */}
      <Grid container spacing={3} sx={{ height: '70vh' }}>
        
        {/* Left Column: Class Roster */}
        <Grid item xs={12} md={4} sx={{ height: '100%' }}>
          <Paper elevation={3} sx={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', borderRadius: 3 }}>
            <Box sx={{ p: 2, borderBottom: '1px solid #eee' }}>
               <Typography variant="h6" align="center">Class Roster</Typography>
            </Box>
            
            <List sx={{ overflowY: 'auto', flexGrow: 1, px: 1 }}>
              {participants.map((p, index) => (
                <ListItem key={index} sx={{ borderBottom: '1px solid #f5f5f5' }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: p.status === 'active' ? '#4caf50' : '#bdbdbd' }}>
                      <PersonIcon />
                    </Avatar>
                  </ListItemAvatar>
                  
                  <ListItemText 
                    primary={<Typography fontWeight="500">{p.nickname}</Typography>} 
                    secondary={p.status === 'active' ? 'Online' : 'Left the room'} 
                  />
                  
                  {p.status === 'active' ? (
                     <CircleIcon sx={{ fontSize: 14, color: '#4caf50' }} />
                  ) : (
                     <CircleIcon sx={{ fontSize: 14, color: '#bdbdbd' }} />
                  )}
                </ListItem>
              ))}
              {participants.length === 0 && (
                <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                   <Typography>No students yet.</Typography>
                   <Typography variant="caption">Share the code to start.</Typography>
                </Box>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Right Column: Live Feedback Stream */}
        <Grid item xs={12} md={8} sx={{ height: '100%' }}>
           <Paper 
             elevation={3} 
             sx={{ 
               height: '100%', 
               position: 'relative', // Critical for containing emojis
               display: 'flex', 
               alignItems: 'center', 
               justifyContent: 'center', 
               flexDirection: 'column',
               borderRadius: 3,
               overflow: 'hidden',
               bgcolor: '#fafafa'
             }}
           >
              {/* The Stream Component is placed INSIDE this relative box */}
              {socketInstance && <ReactionStream socket={socketInstance} />}

              {/* Placeholder Text */}
              <Box sx={{ zIndex: 1, textAlign: 'center', opacity: 0.6 }}>
                <Typography variant="h4" color="text.secondary" gutterBottom>
                  Live Feedback Stream
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Reactions appear here automatically
                </Typography>
              </Box>
           </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}