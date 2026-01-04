import { useState } from 'react';
import { 
  TextField, 
  Button, 
  Paper, 
  Typography, 
  Box, 
  Alert, 
  Link, 
  Container 
} from '@mui/material';
import { useNavigate } from 'react-router';
import CoPresentIcon from '@mui/icons-material/CoPresent'; // Iconiță de profesor/prezentare
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { createRoom } from '../services/api';

export default function CreateActivity() {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Culori specifice pentru profesor (Mov - conform Home.jsx)
  const THEME_COLOR = '#9333ea'; 
  const THEME_HOVER = '#7e22ce';

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Backend-ul așteaptă doar nickname-ul pentru creare
      const result = await createRoom(nickname);
      
      if (result.data?.token) {
        navigate(`/room/${result.data.room_code}`, { 
          state: { 
            token: result.data.token,
            room_code: result.data.room_code,
            isTeacher: true // Setăm flag-ul de profesor
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
      
      {/* --- HEADER --- */}
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
          {/* Logo simplificat */}
          <Box sx={{ width: 32, height: 32, color: THEME_COLOR }}>
             <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.499 5.221 69.78 69.78 0 00-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
             </svg>
          </Box>
          <Typography sx={{ fontSize: '1.125rem', fontWeight: 700, color: '#0d141b' }}>Feedo</Typography>
        </Box>
        <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: '#f3e8ff', border: '2px solid #fff' }} />
      </Box>

      {/* --- MAIN CONTENT --- */}
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
          {/* Accent Border (Mov pentru Profesori) */}
          <Box sx={{ height: 6, width: '100%', bgcolor: THEME_COLOR, position: 'absolute', top: 0, left: 0 }} />
          
          <Box sx={{ p: { xs: 4, sm: 6 } }}>
            <Box sx={{ textAlign: 'center', mb: 5 }}>
              <Typography sx={{ fontSize: '32px', fontWeight: 700, color: '#0d141b', lineHeight: 1.2, mb: 1 }}>
                Start Activity
              </Typography>
              <Typography sx={{ color: '#4c739a', fontSize: '14px' }}>
                Create a new room to gather live feedback.
              </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>{error}</Alert>}

            <form onSubmit={handleCreate}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                
                {/* Field: Professor Nickname */}
                <Box>
                  <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '1rem', fontWeight: 500, color: '#0d141b', mb: 1 }}>
                    <CoPresentIcon sx={{ fontSize: '20px', color: THEME_COLOR }} /> Professor Name / Nickname
                  </Typography>
                  <TextField 
                    fullWidth 
                    placeholder="e.g. Dr. Smith"
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
                        '&:hover fieldset': { borderColor: THEME_COLOR },
                        '&.Mui-focused fieldset': { borderColor: THEME_COLOR },
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
                    bgcolor: THEME_COLOR, 
                    fontSize: '1rem', 
                    fontWeight: 700, 
                    textTransform: 'none',
                    borderRadius: '8px',
                    boxShadow: `0 4px 6px -1px ${THEME_COLOR}40`, // Shadow mov transparent
                    '&:hover': { bgcolor: THEME_HOVER }
                  }}
                >
                  {loading ? 'Creating Room...' : 'Launch Activity'}
                </Button>

               
              </Box>
            </form>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}