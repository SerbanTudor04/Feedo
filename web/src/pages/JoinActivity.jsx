import { useState } from 'react';
import { TextField, Button, Paper, Typography, Box, Alert, Fade } from '@mui/material';
import { useNavigate } from 'react-router';
import { joinRoom } from '../services/api';

export default function JoinActivity() {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
        // 1. Call your Backend API
        const result = await joinRoom(nickname, roomCode.toUpperCase());
        
        if (result.data?.token) {
            // 2. Success: Navigate to the Dispatcher
            // We explicitly set isTeacher: false so the Dispatcher knows to load the Student View
            navigate(`/room/${result.data.room_code}`, { 
                state: { 
                   token: result.data.token,
                   nickname: nickname,
                   isTeacher: false 
                } 
            });
        } else {
            setError(result.detail || "Could not find that room.");
        }
    } catch(err) {
        setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '80vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
    }}>
      <Paper elevation={4} sx={{ p: 4, width: '100%', maxWidth: 400, textAlign: 'center', borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold" color="primary">
          Join Activity
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Enter the code provided by your teacher
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleJoin}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField 
              label="Room Code" 
              variant="outlined"
              value={roomCode} 
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="e.g. MATH101"
              required
              fullWidth
              InputProps={{ style: { fontSize: 20, letterSpacing: 2, textTransform: 'uppercase' } }}
            />
            
            <TextField 
              label="Your Nickname" 
              variant="outlined"
              value={nickname} 
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g. John Doe"
              required
              fullWidth
            />
            
            <Button 
              variant="contained" 
              size="large" 
              type="submit" 
              disabled={loading}
              sx={{ py: 1.5, fontSize: '1.1rem', mt: 1 }}
            >
              {loading ? 'Connecting...' : 'Enter Room'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}