import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { 
  Paper, Typography, Box, List, ListItem, ListItemText, 
  ListItemAvatar, Avatar, Chip, Grid, Divider 
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import CircleIcon from '@mui/icons-material/Circle';
import { connectSocket, disconnectSocket } from '../services/socket';
import ReactionStream from '../components/ReactionStream';

export default function TeacherDashboard() {
  const location = useLocation();
  const { token, room_code } = location.state || {}; // Get data passed from Create page
  
  const [participants, setParticipants] = useState([]);
  const [stats, setStats] = useState({ count: 0 });

  useEffect(() => {
    if (!token) return;

    // 1. Connect
    const socket = connectSocket(token);

    // 2. Listen for Initial Data (Full List)
    socket.on('teacher_dashboard_data', (data) => {
      // data.participants comes from your connection.ts
      setParticipants(data.participants.map(p => ({ ...p, status: 'active' })));
      setStats(prev => ({ ...prev, count: data.participants.length }));
    });

    // 3. Listen for Joins
    socket.on('participant_joined', (data) => {
      // data: { nickname, count }
      setParticipants(prev => [
        ...prev, 
        { nickname: data.nickname, status: 'active', joinAt: new Date() } // Add new person
      ]);
      setStats(prev => ({ ...prev, count: data.count }));
    });

    // 4. Listen for Leaves
    socket.on('participant_left', (data) => {
      // data: { nickname, sessionId, count }
      setParticipants(prev => prev.map(p => 
        p.sessionId === data.sessionId 
          ? { ...p, status: 'left' } // Mark as left (greyed out)
          : p
      ));
      setStats(prev => ({ ...prev, count: data.count }));
    });

    return () => disconnectSocket();
  }, [token]);

  return (
    <Box sx={{ p: 3 }}>
      {/* Floating Reactions Overlay */}
      <ReactionStream />

      {/* Header */}
      <Paper elevation={3} sx={{ p: 3, mb: 3, textAlign: 'center', background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)', color: 'white' }}>
        <Typography variant="h4" fontWeight="bold">Room Code: {room_code}</Typography>
        <Typography variant="subtitle1">Live Participants: {stats.count}</Typography>
      </Paper>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Left: Participant List */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2, height: '60vh', overflowY: 'auto' }}>
            <Typography variant="h6" gutterBottom>Class Roster</Typography>
            <Divider />
            <List>
              {participants.map((p, index) => (
                <ListItem key={index}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: p.status === 'active' ? 'green' : 'grey' }}>
                      <PersonIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText 
                    primary={p.nickname} 
                    secondary={p.status === 'active' ? 'Online' : 'Left the room'} 
                  />
                  {p.status === 'active' && 
                    <CircleIcon sx={{ fontSize: 12, color: 'lightgreen' }} />
                  }
                </ListItem>
              ))}
              {participants.length === 0 && <Typography sx={{p:2}} color="text.secondary">Waiting for students...</Typography>}
            </List>
          </Paper>
        </Grid>

        {/* Right: Activity Log / Stats Placeholder */}
        <Grid item xs={12} md={6}>
           <Paper elevation={2} sx={{ p: 2, height: '60vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column' }}>
              <Typography variant="h5" color="text.secondary">Live Feedback Stream</Typography>
              <Typography variant="body2">Reactions appear on screen automatically</Typography>
              {/* You could add a chart here later */}
           </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}