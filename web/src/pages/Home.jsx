import { useState } from 'react';
import { useNavigate } from 'react-router';
import { 
  Box, Typography, Button, Container, Grid, Paper, 
  AppBar, Toolbar, IconButton, Link 
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School'; // Pentru logo
import MenuBookIcon from '@mui/icons-material/MenuBook'; // Import contacts icon
import CoPresentIcon from '@mui/icons-material/CoPresent'; // Podium icon
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

export default function Home() {
  const navigate = useNavigate();

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      // --- AICI AM ADĂUGAT STYLE-URILE PENTRU FUNDAL ---
      bgcolor: '#f6f7f8',
      backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
      backgroundSize: '24px 24px',
      fontFamily: "'Lexend', sans-serif",
      // -----------------------------------------------
    }}>
      {/* --- HEADER --- */}
      <AppBar 
        position="sticky" 
        elevation={0} 
        sx={{ 
          bgcolor: 'rgba(255, 255, 255, 0.8)', 
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #e2e8f0',
          color: '#0f172a'
        }}
      >
        <Container maxWidth="lg">
          <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer'  }}>
              <SchoolIcon sx={{ color: '#137fec', fontSize: 32 }} />
              <Typography variant="h6" sx={{ fontWeight: 900, tracking: '-0.015em' }}>
                Feedo
              </Typography>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* --- MAIN CONTENT --- */}
      <Container component="main" maxWidth="lg" sx={{ flexGrow: 1, py: { xs: 8, md: 12 }, textAlign: 'center' }}>
        
        {/* Hero Section */}
        <Box sx={{ mb: 8, animation: 'fadeUp 0.8s ease-out' }}>
          <Typography 
            variant="h1" 
            sx={{ 
              fontSize: { xs: '2.5rem', md: '3.5rem' }, 
              fontWeight: 900, 
              color: '#0f172a', 
              mb: 2,
              letterSpacing: '-0.033em'
            }}
          >
            Empower your classroom
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              color: '#64748b', 
              fontWeight: 400, 
              maxWidth: '600px', 
              mx: 'auto',
              lineHeight: 1.6
            }}
          >
            Instant feedback loops for teachers and students. Choose your role below to get started immediately.
          </Typography>
        </Box>

        {/* Role Selection Cards */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' }, // Column on mobile, Row on desktop
          gap: 4, // Adds space between cards (32px)
          justifyContent: 'center',
          alignItems: 'stretch', // Ensures both cards are the same height
          width: '100%' 
        }}>
          
          {/* Student Card Wrapper */}
          <Box sx={{ flex: 1 }}> {/* flex: 1 makes them grow equally */}
            <RoleCard 
              title="I am a Student"
              description="Join a session to give feedback, participate in polls, and ask questions in real-time."
              icon={<MenuBookIcon sx={{ fontSize: 60 }} />}
              color="#137fec"
              bgColor="linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)"
              buttonText="Join Activity"
              primaryButton
              onClick={() => navigate('/join')}
            />
          </Box>

          {/* Teacher Card Wrapper */}
          <Box sx={{ flex: 1 }}>
            <RoleCard 
              title="I am a Teacher"
              description="Create sessions, manage your courses, view live analytics, and engage your audience."
              icon={<CoPresentIcon sx={{ fontSize: 60 }} />}
              color="#9333ea"
              bgColor="linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)"
              buttonText="Create Activity"
              onClick={() => navigate('/create')} 
            />
          </Box>

        </Box>
      </Container>

      {/* --- FOOTER --- */}
      <Box 
        component="footer" 
        sx={{ 
          py: 6, 
          borderTop: '1px solid #e2e8f0', 
          bgcolor: 'white',
          textAlign: 'center'
        }}
      >
        <Typography variant="body2" sx={{ color: '#94a3b8' }}>
          © 2026 Feedo. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
}

function RoleCard({ title, description, icon, color, bgColor, buttonText, primaryButton, onClick }) {
  return (
    <Paper 
      elevation={0}
      onClick={onClick}
      sx={{ 
        p: 4, 
        borderRadius: 5, 
        border: '1px solid #e2e8f0',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        textAlign: 'left',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: `0 20px 25px -5px ${color}20`,
          borderColor: color
        }
      }}
    >
      <Box sx={{ 
        width: '100%', 
        height: 180, 
        borderRadius: 3, 
        background: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        mb: 3,
        color: color,
        opacity: 0.8
      }}>
        {icon}
      </Box>

      <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: '#0f172a' }}>
        {title}
      </Typography>
      <Typography variant="body1" sx={{ color: '#64748b', mb: 4, flexGrow: 1 }}>
        {description}
      </Typography>

      <Button 
        fullWidth 
        variant={primaryButton ? "contained" : "outlined"}
        sx={{ 
          height: 52, 
          borderRadius: 3, 
          textTransform: 'none', 
          fontWeight: 700,
          fontSize: '1rem',
          bgcolor: primaryButton ? '#137fec' : 'transparent',
          borderColor: primaryButton ? 'transparent' : '#e2e8f0',
          color: primaryButton ? 'white' : '#0f172a',
          '&:hover': {
            bgcolor: primaryButton ? '#0e66c1' : 'rgba(19, 127, 236, 0.05)',
            borderColor: color
          }
        }}
      >
        {buttonText}
      </Button>
    </Paper>
  );
}