import { useState } from 'react';
import { 
  TextField, Button, Paper, Typography, Box, 
  Tabs, Tab, Fade, Alert 
} from '@mui/material';
import { useNavigate } from 'react-router';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import { createRoom, joinRoom } from '../services/api';

export default function Home() {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0); // 0 = Join, 1 = Create
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Unified Form State
  const [formData, setFormData] = useState({
    nickname: '',
    roomCode: ''
  });

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setError(''); // Clear errors when switching
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Backend expects: { nickname }
      const result = await createRoom(formData.nickname);
      
      if (result.data?.token) {
        navigate(`/room/${result.data.room_code}`, { 
          state: { 
            token: result.data.token,
            room_code: result.data.room_code,
            isTeacher: true
          } 
        });
      } else {
        setError('Failed to create room. Please try again.');
      }
    } catch (err) {
      setError('Server error. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Backend expects: { nickname, code }
      const result = await joinRoom(formData.nickname, formData.roomCode.toUpperCase());
      
      if (result.data?.token) {
        navigate(`/room/${result.data.room_code}`, { 
          state: { 
            token: result.data.token, 
            nickname: formData.nickname,
            isTeacher: false
          } 
        });
      } else {
        setError(result.detail || 'Could not find that room.');
      }
    } catch (err) {
      setError('Could not connect to server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '90vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' 
    }}>
      <Paper elevation={6} sx={{ width: 400, borderRadius: 3, overflow: 'hidden' }}>
        
        {/* Header Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            variant="fullWidth" 
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab icon={<PersonIcon />} iconPosition="start" label="Student Join" />
            <Tab icon={<SchoolIcon />} iconPosition="start" label="Teacher Create" />
          </Tabs>
        </Box>

        {/* Content Area */}
        <Box sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight="bold" align="center" gutterBottom>
            {tabValue === 0 ? 'Join Activity' : 'Start New Activity'}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
             {tabValue === 0 
               ? 'Enter the code provided by your teacher.' 
               : 'Create a room to gather feedback.'}
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {/* JOIN FORM */}
          {tabValue === 0 && (
            <Fade in={tabValue === 0}>
              <form onSubmit={handleJoin}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField 
                    label="Room Code" 
                    placeholder="e.g. A1B2"
                    fullWidth 
                    required
                    value={formData.roomCode}
                    onChange={(e) => setFormData({...formData, roomCode: e.target.value.toUpperCase()})}
                  />
                  <TextField 
                    label="Your Nickname" 
                    fullWidth 
                    required
                    value={formData.nickname}
                    onChange={(e) => setFormData({...formData, nickname: e.target.value})}
                  />
                  <Button 
                    variant="contained" 
                    size="large" 
                    type="submit" 
                    disabled={loading}
                    sx={{ mt: 1, height: 48 }}
                  >
                    {loading ? 'Joining...' : 'Enter Room'}
                  </Button>
                </Box>
              </form>
            </Fade>
          )}

          {/* CREATE FORM */}
          {tabValue === 1 && (
             <Fade in={tabValue === 1}>
              <form onSubmit={handleCreate}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField 
                    label="Professor Name / Nickname" 
                    placeholder="e.g. Dr. Smith"
                    fullWidth 
                    required
                    value={formData.nickname}
                    onChange={(e) => setFormData({...formData, nickname: e.target.value})}
                  />
                  <Button 
                    variant="contained" 
                    color="secondary"
                    size="large" 
                    type="submit"
                    disabled={loading}
                    sx={{ mt: 1, height: 48 }}
                  >
                    {loading ? 'Creating...' : 'Launch Activity'}
                  </Button>
                </Box>
              </form>
            </Fade>
          )}
        </Box>
      </Paper>
    </Box>
  );
}