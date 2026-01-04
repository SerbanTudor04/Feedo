import { useEffect, useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { 
  Paper, Typography, Box, Button, Container, Grid, CircularProgress, Alert 
} from '@mui/material';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import DownloadIcon from '@mui/icons-material/Download';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getReport } from '../services/api'; // Import the API call

export default function ActivityReport() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get initial state passed from the Dashboard (fallback for immediate render)
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

  // 1. Fetch Real Data on Mount
  useEffect(() => {
    if (!token || !roomCode) {
        navigate('/'); // Redirect if accessed directly without state
        return;
    }

    const fetchData = async () => {
        try {
            const result = await getReport(roomCode, token);
            
            if (result.data) {
                setChartData(result.data.chartData || []);
                setStats({
                    participants: result.data.totalParticipants || 0,
                    // If duration is passed from backend, use it, otherwise calc from dates
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

  // 2. Calculate "Most Frequent" and "Spike" Logic
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

        // Find biggest confusion spike
        if ((point.confused || 0) > maxConfused) {
            maxConfused = point.confused;
            spikeTime = point.time;
        }
    });

    // Find key with max value
    const topReaction = Object.keys(totals).reduce((a, b) => totals[a] > totals[b] ? a : b);
    
    const emojis = { happy: '😊', confused: '😕', surprised: '😲', sad: '☹️' };

    return {
        mostFrequent: topReaction.charAt(0).toUpperCase() + topReaction.slice(1),
        mostFrequentEmoji: emojis[topReaction],
        spikeTime: spikeTime
    };
  }, [chartData]);

  // 3. Helper for CSV Export
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

  // 4. Calculate Final Duration for Display
  const getDurationDisplay = () => {
    if (stats.startTime && stats.endTime) {
        const start = new Date(stats.startTime);
        const end = new Date(stats.endTime);
        const diffMins = Math.round((end - start) / 60000);
        return `${diffMins} Minutes`;
    }
    return "Unknown";
  };

  if (loading) {
      return (
          <Box sx={{ minHeight: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <CircularProgress />
          </Box>
      );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={() => navigate('/')}
            sx={{ mr: 2 }}
        >
            Home
        </Button>
        <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
            Activity Report
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
            Room: <strong>{roomCode}</strong> • Participants: {stats.participants}
            </Typography>
        </Box>
        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExport}>
            Export CSV
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Chart Section */}
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>Feedback Timeline</Typography>
        <Box sx={{ height: 400, width: '100%' }}>
            {chartData.length > 0 ? (
                <ResponsiveContainer>
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="time" />
                    <YAxis allowDecimals={false} />
                    <Tooltip 
                        contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                    />
                    <Legend />
                    <Line type="monotone" dataKey="happy" stroke="#2196F3" strokeWidth={3} dot={{r: 4}} name="Happy 😊" />
                    <Line type="monotone" dataKey="confused" stroke="#FF9800" strokeWidth={3} dot={{r: 4}} name="Confused 😕" />
                    <Line type="monotone" dataKey="surprised" stroke="#9C27B0" strokeWidth={3} dot={{r: 4}} name="Surprised 😲" />
                    <Line type="monotone" dataKey="sad" stroke="#F44336" strokeWidth={3} dot={{r: 4}} name="Sad ☹️" />
                </LineChart>
                </ResponsiveContainer>
            ) : (
                <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}>
                    <Typography>No feedback data recorded for this session.</Typography>
                </Box>
            )}
        </Box>
      </Paper>

      {/* Summary Stats (Dynamically Calculated) */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#e3f2fd' }}>
                <Typography variant="h3" color="primary">{analysis.mostFrequentEmoji}</Typography>
                <Typography variant="h6">Most Frequent</Typography>
                <Typography variant="body2">{analysis.mostFrequent}</Typography>
            </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#fff3e0' }}>
                <Typography variant="h3" color="warning.main">😕</Typography>
                <Typography variant="h6">Confusion Spike</Typography>
                <Typography variant="body2">{analysis.spikeTime !== 'N/A' ? `At ${analysis.spikeTime}` : 'None detected'}</Typography>
            </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#f5f5f5' }}>
                <Typography variant="h3">⏱️</Typography>
                <Typography variant="h6">Duration</Typography>
                <Typography variant="body2">{getDurationDisplay()}</Typography>
            </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}