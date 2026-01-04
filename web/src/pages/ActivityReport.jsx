import { useEffect, useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { 
  Paper, Typography, Box, Button, Container, Grid, CircularProgress, Alert, IconButton, Tooltip as MuiTooltip
} from '@mui/material';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import DownloadIcon from '@mui/icons-material/Download';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import TimerIcon from '@mui/icons-material/Timer';
import { getReport } from '../services/api'; 

export default function ActivityReport() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Theme Constants matching CreateActivity
  const THEME_COLOR = '#9333ea'; 
  const THEME_HOVER = '#7e22ce';
  
  const { roomCode, token } = location.state || {};

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chartData, setChartData] = useState([]);
  const [stats, setStats] = useState({
    participants: 0,
    duration: 0,
    startTime: null,
    endTime: null
  });

  // --- 1. Fetch Logic (Unchanged) ---
  useEffect(() => {
    if (!token || !roomCode) {
        navigate('/'); 
        return;
    }

    const fetchData = async () => {
        try {
            const result = await getReport(roomCode, token);
            if (result.data) {
                setChartData(result.data.chartData || []);
                setStats({
                    participants: result.data.totalParticipants || 0,
                    duration: result.data.durationMinutes || 0, 
                    startTime: result.data.startTime,
                    endTime: result.data.endTime
                });
            } else {
                setError(result.detail || "Failed to load report data.");
            }
        } catch (err) {
            console.error(err);
            setError("Network error. Could not fetch report.");
        } finally {
            setLoading(false);
        }
    };

    fetchData();
  }, [roomCode, token, navigate]);

  // --- 2. Analysis Logic (Unchanged) ---
  const analysis = useMemo(() => {
    if (chartData.length === 0) return { mostFrequent: 'N/A', spikeTime: 'N/A', mostFrequentEmoji: '—' };

    let totals = { happy: 0, confused: 0, surprised: 0, sad: 0 };
    let maxConfused = 0;
    let spikeTime = 'N/A';

    chartData.forEach(point => {
        totals.happy += (point.happy || 0);
        totals.confused += (point.confused || 0);
        totals.surprised += (point.surprised || 0);
        totals.sad += (point.sad || 0);

        if ((point.confused || 0) > maxConfused) {
            maxConfused = point.confused;
            spikeTime = point.time;
        }
    });

    const topReaction = Object.keys(totals).reduce((a, b) => totals[a] > totals[b] ? a : b);
    const emojis = { happy: '😊', confused: '😕', surprised: '😲', sad: '☹️' };

    return {
        mostFrequent: topReaction.charAt(0).toUpperCase() + topReaction.slice(1),
        mostFrequentEmoji: emojis[topReaction],
        spikeTime: spikeTime
    };
  }, [chartData]);

  // --- 3. CSV Export Logic (Unchanged) ---
  const handleExport = () => {
    if (!chartData.length) return;
    const headers = "Time,Happy,Confused,Surprised,Sad\n";
    const rows = chartData.map(d => 
        `${d.time},${d.happy},${d.confused},${d.surprised},${d.sad}`
    ).join("\n");
    
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Report_${roomCode}.csv`;
    a.click();
  };

  const getDurationDisplay = () => {
    if (stats.startTime && stats.endTime) {
        const start = new Date(stats.startTime);
        const end = new Date(stats.endTime);
        const diffMins = Math.round((end - start) / 60000);
        return `${diffMins} Minutes`;
    }
    return "Unknown";
  };

  // --- Common Styles ---
  const cardStyle = {
    bgcolor: 'white', 
    borderRadius: '12px', 
    boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
    border: '1px solid #e7edf3',
    overflow: 'hidden',
    position: 'relative'
  };

  if (loading) {
      return (
          <Box sx={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: '#f6f7f8' }}>
              <CircularProgress sx={{ color: THEME_COLOR }} />
          </Box>
      );
  }

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

      {/* --- HEADER / NAVBAR (Matching CreateActivity) --- */}
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
          {/* Logo Icon (Purple) */}
          <Box sx={{ width: 32, height: 32, color: THEME_COLOR }}>
             <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.499 5.221 69.78 69.78 0 00-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
             </svg>
          </Box>
          <Typography sx={{ fontSize: '1.125rem', fontWeight: 700, color: '#0d141b' }}>Feedo</Typography>
        </Box>
        
        {/* User Avatar Placeholder */}
        <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: '#f3e8ff', border: '2px solid #fff' }} />
      </Box>

      {/* --- MAIN CONTENT --- */}
      <Container maxWidth="lg" sx={{ py: 4, flexGrow: 1 }}>
        
        {/* Navigation & Title Row */}
        <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { md: 'center' }, gap: 2 }}>
          <Button 
              startIcon={<ArrowBackIcon />} 
              onClick={() => navigate('/')}
              sx={{ color: '#64748b', textTransform: 'none', fontWeight: 600, alignSelf: 'flex-start' }}
          >
              Back home
          </Button>

          <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#0d141b', mb: 0.5 }}>
                Activity Report
              </Typography>
              <Typography variant="body1" sx={{ color: '#4c739a' }}>
                Room Code: <strong style={{ color: '#0d141b' }}>{roomCode}</strong> • Participants: <strong style={{ color: '#0d141b' }}>{stats.participants}</strong>
              </Typography>
          </Box>

          <Button 
            variant="contained" 
            startIcon={<DownloadIcon />} 
            onClick={handleExport}
            sx={{ 
                bgcolor: THEME_COLOR, 
                boxShadow: `0 4px 6px -1px ${THEME_COLOR}40`,
                '&:hover': { bgcolor: THEME_HOVER },
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: '8px',
                height: 48,
                px: 3
            }}
          >
              Export CSV
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>{error}</Alert>}

        {/* Top Stats Grid */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Stat 1: Most Frequent */}
            <Grid item xs={12} md={4}>
                <Paper elevation={0} sx={{ ...cardStyle, p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ 
                        width: 56, height: 56, borderRadius: '12px', bgcolor: '#f3e8ff', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: THEME_COLOR 
                    }}>
                        <EmojiEmotionsIcon fontSize="large" />
                    </Box>
                    <Box>
                        <Typography sx={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 500 }}>Most Frequent</Typography>
                        <Typography sx={{ color: '#0d141b', fontSize: '1.5rem', fontWeight: 700 }}>
                           {analysis.mostFrequentEmoji} {analysis.mostFrequent}
                        </Typography>
                    </Box>
                </Paper>
            </Grid>

            {/* Stat 2: Confusion Spike */}
            <Grid item xs={12} md={4}>
                <Paper elevation={0} sx={{ ...cardStyle, p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ 
                        width: 56, height: 56, borderRadius: '12px', bgcolor: '#fff7ed', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#ea580c' 
                    }}>
                        <WarningAmberIcon fontSize="large" />
                    </Box>
                    <Box>
                        <Typography sx={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 500 }}>Confusion Spike</Typography>
                        <Typography sx={{ color: '#0d141b', fontSize: '1.5rem', fontWeight: 700 }}>
                            {analysis.spikeTime !== 'N/A' ? analysis.spikeTime : 'None'}
                        </Typography>
                    </Box>
                </Paper>
            </Grid>

            {/* Stat 3: Duration */}
            <Grid item xs={12} md={4}>
                <Paper elevation={0} sx={{ ...cardStyle, p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ 
                        width: 56, height: 56, borderRadius: '12px', bgcolor: '#f1f5f9', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#475569' 
                    }}>
                        <TimerIcon fontSize="large" />
                    </Box>
                    <Box>
                        <Typography sx={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 500 }}>Duration</Typography>
                        <Typography sx={{ color: '#0d141b', fontSize: '1.5rem', fontWeight: 700 }}>
                            {getDurationDisplay()}
                        </Typography>
                    </Box>
                </Paper>
            </Grid>
        </Grid>

        {/* Main Chart Section */}
        <Paper elevation={0} sx={{ ...cardStyle, p: { xs: 2, md: 4 } }}>
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: '1.125rem', fontWeight: 700, color: '#0d141b' }}>
                    Feedback Timeline
                </Typography>
                {/* Optional legend helper */}
                <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#2196F3' }} />
                        <Typography sx={{ fontSize: '0.875rem', color: '#64748b' }}>Happy</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#FF9800' }} />
                        <Typography sx={{ fontSize: '0.875rem', color: '#64748b' }}>Confused</Typography>
                    </Box>
                </Box>
            </Box>
            
            <Box sx={{ height: 400, width: '100%' }}>
                {chartData.length > 0 ? (
                    <ResponsiveContainer>
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis 
                            dataKey="time" 
                            stroke="#64748b" 
                            tick={{ fill: '#64748b', fontSize: 12 }} 
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                        />
                        <YAxis 
                            allowDecimals={false} 
                            stroke="#64748b" 
                            tick={{ fill: '#64748b', fontSize: 12 }} 
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip 
                            contentStyle={{ 
                                borderRadius: '8px', 
                                border: 'none', 
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                padding: '12px'
                            }} 
                        />
                        <Legend />
                        <Line type="monotone" dataKey="happy" stroke="#2196F3" strokeWidth={3} dot={{r: 4, fill: '#2196F3'}} activeDot={{ r: 6 }} name="Happy 😊" />
                        <Line type="monotone" dataKey="confused" stroke="#FF9800" strokeWidth={3} dot={{r: 4, fill: '#FF9800'}} activeDot={{ r: 6 }} name="Confused 😕" />
                        <Line type="monotone" dataKey="surprised" stroke="#9C27B0" strokeWidth={3} dot={{r: 4, fill: '#9C27B0'}} activeDot={{ r: 6 }} name="Surprised 😲" />
                        <Line type="monotone" dataKey="sad" stroke="#F44336" strokeWidth={3} dot={{r: 4, fill: '#F44336'}} activeDot={{ r: 6 }} name="Sad ☹️" />
                    </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                        <Typography sx={{ mb: 1, fontSize: '1.125rem' }}>No data yet</Typography>
                        <Typography variant="body2">Feedback will appear here once the session starts.</Typography>
                    </Box>
                )}
            </Box>
        </Paper>

      </Container>
    </Box>
  );
}