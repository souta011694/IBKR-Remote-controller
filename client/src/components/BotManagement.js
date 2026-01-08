import React, { useState, useEffect } from 'react';
import {
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Chip,
  Alert,
  Button,
  CircularProgress,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import RefreshIcon from '@mui/icons-material/Refresh';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function BotManagement() {
  const { token } = useAuth();
  const [botStatus, setBotStatus] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [lastUpdate, setLastUpdate] = useState(null);

  // Create axios instance with auth header
  const getAuthHeaders = () => ({
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  useEffect(() => {
    if (token) {
      // Check bot status on mount
      checkBotStatus();
      // Poll status every 5 seconds
      const interval = setInterval(checkBotStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const checkBotStatus = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/bot/status`, getAuthHeaders());
      setBotStatus(response.data.isRunning);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error checking bot status:', error);
      if (error.response?.status === 401) {
        // Token expired, will be handled by AuthContext
      }
    }
  };

  const handleToggleBot = async () => {
    setLoading(true);
    setStatusMessage('');
    
    try {
      const endpoint = botStatus ? '/bot/stop' : '/bot/start';
      const response = await axios.post(
        `${API_BASE_URL}${endpoint}`,
        {},
        getAuthHeaders()
      );
      
      setBotStatus(response.data.isRunning);
      setStatusMessage(
        response.data.isRunning 
          ? '✅ Bot started successfully!' 
          : '⏸️ Bot stopped successfully!'
      );
      setLastUpdate(new Date());
      
      // Clear message after 3 seconds
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (error) {
      setStatusMessage('❌ Error: ' + (error.response?.data?.error || error.message));
      console.error('Error toggling bot:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 1, fontWeight: 600, color: '#FFFFFF' }}>
        Bot Management
      </Typography>
      <Typography variant="body2" sx={{ mb: 4, color: 'rgba(255, 255, 255, 0.7)' }}>
        Control and monitor your trading bot
      </Typography>

      {statusMessage && (
        <Alert 
          severity={statusMessage.includes('✅') ? 'success' : statusMessage.includes('❌') ? 'error' : 'info'}
          sx={{ mb: 3 }}
        >
          {statusMessage}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Main Bot Control Card */}
        <Grid item xs={12}>
          <Card 
            elevation={0} 
            sx={{ 
              background: botStatus 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 2,
              color: 'white',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: -50,
                right: -50,
                width: 200,
                height: 200,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
              }}
            />
            <CardContent sx={{ p: 4, position: 'relative' }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={3}>
                <Box>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <PowerSettingsNewIcon sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
                        Trading Bot
                      </Typography>
                      <Chip
                        icon={botStatus ? <CheckCircleIcon /> : <ErrorIcon />}
                        label={botStatus ? 'RUNNING' : 'STOPPED'}
                        sx={{
                          mt: 1,
                          bgcolor: botStatus ? 'rgba(76, 175, 80, 0.9)' : 'rgba(244, 67, 54, 0.9)',
                          color: 'white',
                          fontWeight: 'bold',
                        }}
                      />
                    </Box>
                  </Box>
                  {lastUpdate && (
                    <Typography variant="body2" sx={{ opacity: 0.9, mt: 1 }}>
                      Last updated: {lastUpdate.toLocaleTimeString()}
                    </Typography>
                  )}
                </Box>

                <Box display="flex" alignItems="center" gap={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={botStatus}
                        onChange={handleToggleBot}
                        disabled={loading}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: 'white',
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: 'rgba(255, 255, 255, 0.5)',
                          },
                          '& .MuiSwitch-track': {
                            backgroundColor: 'rgba(255, 255, 255, 0.3)',
                          },
                        }}
                      />
                    }
                    label={
                      <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
                        {botStatus ? 'ON' : 'OFF'}
                      </Typography>
                    }
                    labelPlacement="start"
                  />
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleToggleBot}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : (botStatus ? <StopIcon /> : <PlayArrowIcon />)}
                    sx={{
                      bgcolor: '#424242',
                      color: '#FFFFFF',
                      '&:hover': {
                        bgcolor: '#616161',
                      },
                      px: 4,
                      py: 1.5,
                      fontWeight: 600,
                    }}
                  >
                    {loading ? 'Processing...' : (botStatus ? 'Stop Bot' : 'Start Bot')}
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Status Information Cards */}
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ height: '100%', background: '#121212', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#FFFFFF' }}>
                Bot Information
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box display="flex" justifyContent="space-between" py={1.5} borderBottom="1px solid rgba(255, 255, 255, 0.08)">
                  <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Status:</Typography>
                  <Chip
                    label={botStatus ? 'Active' : 'Inactive'}
                    color={botStatus ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
                <Box display="flex" justifyContent="space-between" py={1.5} borderBottom="1px solid rgba(255, 255, 255, 0.08)">
                  <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Uptime:</Typography>
                  <Typography fontWeight={500} sx={{ color: '#FFFFFF' }}>
                    {botStatus ? 'Running...' : 'Stopped'}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" py={1.5}>
                  <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Connection:</Typography>
                  <Chip
                    label="Ready"
                    color="success"
                    size="small"
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ height: '100%', background: '#121212', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#FFFFFF' }}>
                Quick Actions
              </Typography>
              <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant={botStatus ? 'outlined' : 'contained'}
                  fullWidth
                  startIcon={botStatus ? <StopIcon /> : <PlayArrowIcon />}
                  onClick={handleToggleBot}
                  disabled={loading}
                  sx={{
                    ...(botStatus ? {
                      borderColor: '#f44336',
                      color: '#f44336',
                      '&:hover': { borderColor: '#f44336', bgcolor: 'rgba(244, 67, 54, 0.1)' }
                    } : {
                      bgcolor: '#424242',
                      color: '#FFFFFF',
                      '&:hover': { bgcolor: '#616161' }
                    })
                  }}
                  size="large"
                >
                  {botStatus ? 'Stop Bot' : 'Start Bot'}
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<RefreshIcon />}
                  onClick={checkBotStatus}
                  disabled={loading}
                  sx={{
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    color: '#FFFFFF',
                    '&:hover': { borderColor: '#FFFFFF', bgcolor: 'rgba(255, 255, 255, 0.1)' }
                  }}
                  size="large"
                >
                  Refresh Status
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default BotManagement;

