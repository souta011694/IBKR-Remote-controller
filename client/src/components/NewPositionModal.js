import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import axios from 'axios';

function NewPositionModal({ open, onClose, onSuccess, token, API_BASE_URL }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    symbol: '',
    stopLoss: '',
    tradeType: 'MKT', // Market order by default
    cancel: false,
    action: 'BUY', // Buy or Sell
    risk: '',
    profit: '',
    timeFrame: '1min',
    timeInForce: 'DAY',
    breakEven: false,
    replay: false,
    status: 'PENDING',
  });

  const handleChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.symbol) {
        setError('Symbol is required');
        setLoading(false);
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/bot/open-position`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Success
      if (onSuccess) {
        onSuccess(response.data);
      }
      handleClose();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'An error occurred while opening the position');
      console.error('Error opening position:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      symbol: '',
      stopLoss: '',
      tradeType: 'MKT',
      cancel: false,
      action: 'BUY',
      risk: '',
      profit: '',
      timeFrame: '1min',
      timeInForce: 'DAY',
      breakEven: false,
      replay: false,
      status: 'PENDING',
    });
    setError('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          background: '#121212',
          color: '#FFFFFF',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        },
      }}
    >
      <DialogTitle sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.12)', pb: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Open New Position
          </Typography>
          <Button
            onClick={handleClose}
            sx={{ minWidth: 'auto', color: 'rgba(255, 255, 255, 0.7)' }}
          >
            <CloseIcon />
          </Button>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Symbol */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Symbol"
                value={formData.symbol}
                onChange={handleChange('symbol')}
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#FFFFFF',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.23)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.4)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#FFFFFF',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#FFFFFF',
                  },
                }}
              />
            </Grid>

            {/* Buy/Sell */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Buy/Sell</InputLabel>
                <Select
                  value={formData.action}
                  onChange={handleChange('action')}
                  label="Buy/Sell"
                  sx={{
                    color: '#FFFFFF',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.23)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.4)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#FFFFFF',
                    },
                    '& .MuiSvgIcon-root': {
                      color: 'rgba(255, 255, 255, 0.7)',
                    },
                  }}
                >
                  <MenuItem value="BUY">Buy</MenuItem>
                  <MenuItem value="SELL">Sell</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Trade Type */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Trade Type</InputLabel>
                <Select
                  value={formData.tradeType}
                  onChange={handleChange('tradeType')}
                  label="Trade Type"
                  sx={{
                    color: '#FFFFFF',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.23)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.4)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#FFFFFF',
                    },
                    '& .MuiSvgIcon-root': {
                      color: 'rgba(255, 255, 255, 0.7)',
                    },
                  }}
                >
                  <MenuItem value="MKT">Market</MenuItem>
                  <MenuItem value="LMT">Limit</MenuItem>
                  <MenuItem value="STP">Stop</MenuItem>
                  <MenuItem value="STP_LMT">Stop Limit</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Time Frame */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Time Frame</InputLabel>
                <Select
                  value={formData.timeFrame}
                  onChange={handleChange('timeFrame')}
                  label="Time Frame"
                  sx={{
                    color: '#FFFFFF',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.23)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.4)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#FFFFFF',
                    },
                    '& .MuiSvgIcon-root': {
                      color: 'rgba(255, 255, 255, 0.7)',
                    },
                  }}
                >
                  <MenuItem value="1min">1 Minute</MenuItem>
                  <MenuItem value="5min">5 Minutes</MenuItem>
                  <MenuItem value="15min">15 Minutes</MenuItem>
                  <MenuItem value="30min">30 Minutes</MenuItem>
                  <MenuItem value="1hour">1 Hour</MenuItem>
                  <MenuItem value="4hour">4 Hours</MenuItem>
                  <MenuItem value="1day">1 Day</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Stop Loss */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Stop Loss"
                type="number"
                value={formData.stopLoss}
                onChange={handleChange('stopLoss')}
                inputProps={{ step: '0.01', min: '0' }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#FFFFFF',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.23)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.4)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#FFFFFF',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#FFFFFF',
                  },
                }}
              />
            </Grid>

            {/* Risk */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Risk (%)"
                type="number"
                value={formData.risk}
                onChange={handleChange('risk')}
                inputProps={{ step: '0.01', min: '0', max: '100' }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#FFFFFF',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.23)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.4)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#FFFFFF',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#FFFFFF',
                  },
                }}
              />
            </Grid>

            {/* Profit */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Profit Target"
                type="number"
                value={formData.profit}
                onChange={handleChange('profit')}
                inputProps={{ step: '0.01', min: '0' }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#FFFFFF',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.23)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.4)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#FFFFFF',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#FFFFFF',
                  },
                }}
              />
            </Grid>

            {/* Time In Force */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Time In Force</InputLabel>
                <Select
                  value={formData.timeInForce}
                  onChange={handleChange('timeInForce')}
                  label="Time In Force"
                  sx={{
                    color: '#FFFFFF',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.23)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.4)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#FFFFFF',
                    },
                    '& .MuiSvgIcon-root': {
                      color: 'rgba(255, 255, 255, 0.7)',
                    },
                  }}
                >
                  <MenuItem value="DAY">Day</MenuItem>
                  <MenuItem value="GTC">Good Till Cancel</MenuItem>
                  <MenuItem value="IOC">Immediate or Cancel</MenuItem>
                  <MenuItem value="FOK">Fill or Kill</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Status */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={handleChange('status')}
                  label="Status"
                  sx={{
                    color: '#FFFFFF',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.23)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.4)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#FFFFFF',
                    },
                    '& .MuiSvgIcon-root': {
                      color: 'rgba(255, 255, 255, 0.7)',
                    },
                  }}
                >
                  <MenuItem value="PENDING">Pending</MenuItem>
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="CANCELLED">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Switches */}
            <Grid item xs={12}>
              <Box display="flex" flexDirection="column" gap={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.cancel}
                      onChange={handleChange('cancel')}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#FFFFFF',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: 'rgba(255, 255, 255, 0.5)',
                        },
                      }}
                    />
                  }
                  label="Cancel"
                  sx={{ color: 'rgba(255, 255, 255, 0.9)' }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.breakEven}
                      onChange={handleChange('breakEven')}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#FFFFFF',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: 'rgba(255, 255, 255, 0.5)',
                        },
                      }}
                    />
                  }
                  label="Break Even"
                  sx={{ color: 'rgba(255, 255, 255, 0.9)' }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.replay}
                      onChange={handleChange('replay')}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#FFFFFF',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: 'rgba(255, 255, 255, 0.5)',
                        },
                      }}
                    />
                  }
                  label="Replay"
                  sx={{ color: 'rgba(255, 255, 255, 0.9)' }}
                />
              </Box>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ borderTop: '1px solid rgba(255, 255, 255, 0.12)', p: 2 }}>
          <Button
            onClick={handleClose}
            sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            disabled={loading}
            sx={{
              bgcolor: '#424242',
              color: '#FFFFFF',
              '&:hover': {
                bgcolor: '#616161',
              },
            }}
          >
            {loading ? 'Opening...' : 'Open Position'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default NewPositionModal;
