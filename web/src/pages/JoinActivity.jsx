import { useState } from 'react';
import { 
  TextField, 
  Button, 
  Paper, 
  Typography, 
  Box, 
  Alert, 
  InputAdornment, 
  Link, 
  Container 
} from '@mui/material';
import { useNavigate } from 'react-router';
import KeyIcon from '@mui/icons-material/VpnKey';
import BadgeIcon from '@mui/icons-material/Badge';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
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
      const result = await joinRoom(nickname, roomCode.toUpperCase());
      if (result.data?.token) {
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
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: '#f6f7f8',
      backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
      backgroundSize: '24px 24px',
      fontFamily: "'Lexend', sans-serif"
    }}>
      
      {/* Header / Navbar Simulat */}
      <Box sx={{ 
        width: '100%', 
        bgcolor: 'white', 
        borderBottom: '1px solid #e7edf3', 
        px: { xs: 3, md: 10 }, 
        height: 64, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 32, height: 32, color: '#137fec' }}>
            <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M42.1739 20.1739L27.8261 5.82609C29.1366 7.13663 28.3989 10.1876 26.2002 13.7654C24.8538 15.9564 22.9595 18.3449 20.6522 20.6522C18.3449 22.9595 15.9564 24.8538 13.7654 26.2002C10.1876 28.3989 7.13663 29.1366 5.82609 27.8261L20.1739 42.1739C21.4845 43.4845 24.5355 42.7467 28.1133 40.548C30.3042 39.2016 32.6927 37.3073 35 35C37.3073 32.6927 39.2016 30.3042 40.548 28.1133C42.7467 24.5355 43.4845 21.4845 42.1739 20.1739Z" fill="currentColor" />
            </svg>
          </Box>
          <Typography sx={{ fontSize: '1.125rem', fontWeight: 700, color: '#0d141b' }}>Feedo</Typography>
        </Box>
        <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: '#e2e8f0', border: '2px solid #f1f5f9' }} />
      </Box>

      {/* Main Content */}
      <Container maxWidth="sm" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
        <Paper 
          elevation={0} 
          sx={{ 
            width: '100%', 
            maxWidth: 520, 
            bgcolor: 'white', 
            borderRadius: '12px', 
            position: 'relative', 
            overflow: 'hidden',
            boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
            border: '1px solid #e7edf3'
          }}
        >
          {/* Accent-ul albastru de sus */}
          <Box sx={{ height: 6, width: '100%', bgcolor: '#137fec', position: 'absolute', top: 0, left: 0 }} />
          
          <Box sx={{ p: { xs: 4, sm: 6 } }}>
            <Box sx={{ textAlign: 'center', mb: 5 }}>
              <Typography sx={{ fontSize: '32px', fontWeight: 700, color: '#0d141b', lineHeight: 1.2, mb: 1 }}>
                Join Activity
              </Typography>
              <Typography sx={{ color: '#4c739a', fontSize: '14px' }}>
                Enter the code provided by your instructor.
              </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>{error}</Alert>}

            <form onSubmit={handleJoin}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                
                {/* Field: Access Code */}
                <Box>
                  <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '1rem', fontWeight: 500, color: '#0d141b', mb: 1 }}>
                    <KeyIcon sx={{ fontSize: '20px', color: '#137fec' }} /> Access Code
                  </Typography>
                  <TextField 
                    fullWidth 
                    placeholder="e.g. 123 456"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    variant="outlined"
                    required
                    inputProps={{ 
                      style: { 
                        fontSize: '1.125rem', 
                        letterSpacing: '0.1em', 
                        fontWeight: 600,
                        padding: '15px'
                      } 
                    }}
                    sx={{ 
                      '& .MuiOutlinedInput-root': { 
                        bgcolor: '#f8fafc',
                        borderRadius: '8px',
                        '& fieldset': { borderColor: '#cfdbe7' },
                        '&:hover fieldset': { borderColor: '#137fec' },
                      } 
                    }}
                  />
                </Box>

                {/* Field: Nickname */}
                <Box>
                  <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '1rem', fontWeight: 500, color: '#0d141b', mb: 1 }}>
                    <BadgeIcon sx={{ fontSize: '20px', color: '#137fec' }} /> Your Nickname
                  </Typography>
                  <TextField 
                    fullWidth 
                    placeholder="How should we call you?"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    variant="outlined"
                    required
                    inputProps={{ style: { padding: '15px' } }}
                    sx={{ 
                      '& .MuiOutlinedInput-root': { 
                        bgcolor: '#f8fafc',
                        borderRadius: '8px',
                        '& fieldset': { borderColor: '#cfdbe7' },
                        '&:hover fieldset': { borderColor: '#137fec' },
                      } 
                    }}
                  />
                </Box>

                <Button 
                  type="submit"
                  variant="contained" 
                  disabled={loading}
                  fullWidth
                  endIcon={!loading && <ArrowForwardIcon />}
                  sx={{ 
                    height: 56, 
                    bgcolor: '#137fec', 
                    fontSize: '1rem', 
                    fontWeight: 700, 
                    textTransform: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(19, 127, 236, 0.2)',
                    '&:hover': { bgcolor: '#1170d2' }
                  }}
                >
                  {loading ? 'Connecting...' : 'Enter Class'}
                </Button>
              </Box>
            </form>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}