import React, { useState, useEffect } from 'react';
import {
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Alert,
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { config } from '../config';
const API_BASE_URL = config.Main_Endpoint + '/api';
console.log("--------------------------------------------->API_BASE_URL",API_BASE_URL);
function BotManagement() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [positions, setPositions] = useState([]);
  const [positionsLoading, setPositionsLoading] = useState(false);
  const [accountData, setAccountData] = useState(null);
  const [tradingHistory, setTradingHistory] = useState([]);
  const [formData, setFormData] = useState({
    symbol: '',
    stopLoss: 'EntryBar',
    tradeType: 'FB',
    action: 'BUY',
    risk: '',
    profit: '1:1',
    timeFrame: '1min',
    timeInForce: 'DAY',
    breakEven: false,
    replay: false,
    status: 'PENDING',
  });
  const [formError, setFormError] = useState('');
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [customStopLossValue, setCustomStopLossValue] = useState('');
  const [conditionalModalOpen, setConditionalModalOpen] = useState(false);
  const [limitOrderModalOpen, setLimitOrderModalOpen] = useState(false);
  const [limitPrice, setLimitPrice] = useState('');
  const [customTradeTypeModalOpen, setCustomTradeTypeModalOpen] = useState(false);
  const [entryPrice, setEntryPrice] = useState('');
  const [entryPoints, setEntryPoints] = useState('0');
  const [conditionalOrder, setConditionalOrder] = useState({
    order1Enabled: false,
    order1StopPrice: '',
    order1Condition: 'Above',
    order1Price: '',
    order2Enabled: false,
    order2StopPrice: '',
    order2Condition1: 'Above',
    order2Price1: '',
    order2Condition2: 'Above',
    order2Price2: '',
  });

  // Create axios instance with auth header
  const getAuthHeaders = () => ({
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // Helper function to get today's date string (YYYY-MM-DD)
  const getTodayDateString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Load trading history from localStorage on mount (only today's records)
  useEffect(() => {
    try {
      const today = getTodayDateString();
      const stored = localStorage.getItem(`tradingHistory_${today}`);
      if (stored) {
        const history = JSON.parse(stored);
        setTradingHistory(Array.isArray(history) ? history : []);
      } else {
        // Clear old history from previous days
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('tradingHistory_') && key !== `tradingHistory_${today}`) {
            localStorage.removeItem(key);
          }
        });
      }
    } catch (e) {
      console.error('Error loading trading history from localStorage:', e);
    }
  }, []);

  // Persist trading history to localStorage whenever it changes (only today's records)
  useEffect(() => {
    try {
      const today = getTodayDateString();
      if (tradingHistory.length > 0) {
        localStorage.setItem(`tradingHistory_${today}`, JSON.stringify(tradingHistory));
      } else {
        localStorage.removeItem(`tradingHistory_${today}`);
      }
    } catch (e) {
      console.error('Error saving trading history to localStorage:', e);
    }
  }, [tradingHistory]);

  useEffect(() => {
    if (token) {
      // Fetch positions once when Bot Management mounts or token changes
      fetchPositions();
    }
  }, [token]);

  // Show modal when Trade Type is "Custom" for entryPrice
  useEffect(() => {
    if (formData.tradeType === 'Custom' && !customTradeTypeModalOpen) {
      setCustomTradeTypeModalOpen(true);
    } else if (formData.tradeType !== 'Custom' && customTradeTypeModalOpen) {
      setCustomTradeTypeModalOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.tradeType]);

  // Show modal when Stop Loss is "Custom" for customStopLossValue
  useEffect(() => {
    if (formData.stopLoss === 'Custom' && !customModalOpen) {
      setCustomModalOpen(true);
    } else if (formData.stopLoss !== 'Custom' && customModalOpen) {
      setCustomModalOpen(false);
      setCustomStopLossValue('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.stopLoss]);

  // Show Conditional Order modal when Trade Type changes to "Conditional Order"
  useEffect(() => {
    if (formData.tradeType === 'Conditional Order' && !conditionalModalOpen) {
      setConditionalModalOpen(true);
    } else if (formData.tradeType !== 'Conditional Order' && conditionalModalOpen) {
      setConditionalModalOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.tradeType]);

  // Show Limit Order modal when Trade Type changes to "Limit Order"
  useEffect(() => {
    if (formData.tradeType === 'Limit Order' && !limitOrderModalOpen) {
      setLimitOrderModalOpen(true);
    } else if (formData.tradeType !== 'Limit Order' && limitOrderModalOpen) {
      setLimitOrderModalOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.tradeType]);

  // Helper function to format conditional order params
  // Format: order1Enabled,order1StopPrice,order1Condition,order1Price,order2Enabled,order2Condition1,order2Price1,order2Condition2,order2Price2
  const formatConditionalOrderParams = (order) => {
    const order1Enabled = order.order1Enabled ? '1' : '0';
    const order2Enabled = order.order2Enabled ? '1' : '0';
    return `${order1Enabled},${order.order1StopPrice || '0'},${order.order1Condition || 'Above'},${order.order1Price || '0'},${order2Enabled},${order.order2Condition1 || 'Above'},${order.order2Price1 || '0'},${order.order2Condition2 || 'Above'},${order.order2Price2 || '0'}`;
  };

  // Helper function to build API payload
  const buildApiPayload = () => {
    const basePayload = {
      symbol: formData.symbol,
      tradeType: formData.tradeType,
      buySell: formData.action, // Changed from action to buySell
      stopLoss: formData.stopLoss,
      takeProfit: formData.profit, // Changed from profit to takeProfit
      timeFrame: formData.timeFrame,
      timeInForce: formData.timeInForce,
      risk: formData.risk,
      breakEven: formData.breakEven,
      replay: formData.replay,
    };

    // Add customStopLossValue if stopLoss is "Custom"
    if (formData.stopLoss === 'Custom' && customStopLossValue) {
      basePayload.customStopLossValue = customStopLossValue;
    }

    // Add entryPrice for Custom trade type
    if (formData.tradeType === 'Custom' && entryPrice) {
      basePayload.entryPrice = entryPrice;
    }

    // Add entryPrice for Limit Order (from limitPrice)
    if (formData.tradeType === 'Limit Order' && limitPrice) {
      basePayload.entryPrice = limitPrice;
    }

    // Add conditionalOrderParams for Conditional Order
    if (formData.tradeType === 'Conditional Order') {
      basePayload.conditionalOrderParams = formatConditionalOrderParams(conditionalOrder);
    }

    // Add entryPoints for other trade types (RB, RBB, FB, PBe1, PBe2, LB, LB2, LB3)
    const otherTradeTypes = ['RB', 'RBB', 'FB', 'PBe1', 'PBe2', 'LB', 'LB2', 'LB3'];
    if (otherTradeTypes.includes(formData.tradeType)) {
      basePayload.entryPoints = entryPoints || '0';
    }

    return basePayload;
  };

  // Fetch positions
  const fetchPositions = async () => {
    try {
      setPositionsLoading(true);
      const [summaryRes, positionsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/account/summary`, getAuthHeaders()),
        axios.get(`${API_BASE_URL}/account/positions`, getAuthHeaders()),
      ]);
      setAccountData(summaryRes.data);
      setPositions(positionsRes.data.positions || []);
    } catch (error) {
      console.error('Error fetching positions:', error);
    } finally {
      setPositionsLoading(false);
    }
  };

  // Close all open positions
  const handleCloseAllPositions = async () => {
    if (!window.confirm('Are you sure you want to close all open positions? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    setStatusMessage('');

    try {
      const response = await axios.post(
        `${API_BASE_URL}/bot/close-all-positions`,
        {},
        getAuthHeaders()
      );

      setStatusMessage('✅ All positions closed successfully!');
      setTimeout(() => setStatusMessage(''), 5000);

      // Refresh positions
      fetchPositions();
    } catch (error) {
      setStatusMessage('❌ Error: ' + (error.response?.data?.error || error.message));
      console.error('Error closing positions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle form field changes
  const handleFormChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setFormError('');
  };

  // Handle position form submission
  const handleOpenPosition = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFormError('');

    try {
      // Validate required fields
      if (!formData.symbol) {
        setFormError('Symbol is required');
        setLoading(false);
        return;
      }

      // Validate limit price for Limit Order
      if (formData.tradeType === 'Limit Order' && !limitPrice) {
        setFormError('Limit Price is required for Limit Order');
        setLoading(false);
        setLimitOrderModalOpen(true);
        return;
      }

      // Validate entry price for Custom trade type
      if (formData.tradeType === 'Custom' && !entryPrice) {
        setFormError('Entry Price is required for Custom trade type');
        setLoading(false);
        setCustomTradeTypeModalOpen(true);
        return;
      }

      // Create new order entry with unique ID and timestamp
      const payload = buildApiPayload();
      const newOrder = {
        id: Date.now(), // Unique ID for each order
        timestamp: new Date().toISOString(),
        ...payload,
        status: formData.status,
        // Store raw values for display
        customStopLossValue:
          formData.stopLoss === 'Custom' ? customStopLossValue || null : null,
        conditionalOrder:
          formData.tradeType === 'Conditional Order' ? conditionalOrder : null,
        limitPrice:
          formData.tradeType === 'Limit Order' ? limitPrice || null : null,
        entryPrice:
          formData.tradeType === 'Custom' ? entryPrice || null :
          formData.tradeType === 'Limit Order' ? limitPrice || null : null,
      };

      // If status is PENDING, do NOT send to bot yet – just store locally
      if (formData.status === 'PENDING') {
        // Add to trading history array
        setTradingHistory((prev) => [...prev, newOrder]);
      } else {
        // For ACTIVE / CANCELLED, send immediately to bot
        const submitData = buildApiPayload();

        await axios.post(
          `${API_BASE_URL}/bot/open-position`,
          submitData,
          getAuthHeaders()
        );

        setStatusMessage('✅ Position sent to bot successfully!');
        setTimeout(() => setStatusMessage(''), 5000);

        // Add to trading history array
        setTradingHistory((prev) => [...prev, newOrder]);
      }

      // Reset form
      setFormData({
        symbol: '',
        stopLoss: 'EntryBar',
        tradeType: 'FB',
        action: 'BUY',
        risk: '',
        profit: '1:1',
        timeFrame: '1min',
        timeInForce: 'DAY',
        breakEven: false,
        replay: false,
        status: 'PENDING',
      });
      setCustomStopLossValue('');
      setLimitPrice('');
      setEntryPrice('');
      setEntryPoints('0');

      // Refresh positions from backend
      fetchPositions();
    } catch (err) {
      setFormError(err.response?.data?.error || err.message || 'An error occurred while opening the position');
      console.error('Error opening position:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to safely format percentage
  const formatPercent = (value) => {
    if (value == null || isNaN(value)) return '0.00';
    return value.toFixed(2);
  };

  // Format currency
  const formatCurrency = (value) => {
    if (value == null || isNaN(value)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: accountData?.currency || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // When user changes status in the pending row, only send to bot when not PENDING
  const handlePendingStatusChange = async (orderId, newStatus) => {
    // Find the order in trading history
    const orderIndex = tradingHistory.findIndex(order => order.id === orderId);
    if (orderIndex === -1) return;

    const order = tradingHistory[orderIndex];

    // Update UI immediately
    const updated = { ...order, status: newStatus };
    setTradingHistory((prev) => {
      const newHistory = [...prev];
      newHistory[orderIndex] = updated;
      return newHistory;
    });

    // If still pending, do not send anything to bot
    if (newStatus === 'PENDING') return;

    try {
      setLoading(true);

      // Reconstruct payload from stored order
      const submitData = {
        symbol: updated.symbol,
        tradeType: updated.tradeType,
        buySell: updated.buySell || updated.action || 'BUY', // Support both old and new format
        stopLoss: updated.stopLoss,
        takeProfit: updated.takeProfit || updated.profit || '1:1', // Support both old and new format
        timeFrame: updated.timeFrame,
        timeInForce: updated.timeInForce,
        risk: updated.risk || '',
        breakEven: updated.breakEven || false,
      };

      // Add customStopLossValue if stopLoss is "Custom"
      if (updated.stopLoss === 'Custom' && updated.customStopLossValue) {
        submitData.customStopLossValue = updated.customStopLossValue;
      }

      // Add entryPrice for Custom trade type
      if (updated.tradeType === 'Custom' && updated.entryPrice) {
        submitData.entryPrice = updated.entryPrice;
      }

      // Add entryPrice for Limit Order
      if (updated.tradeType === 'Limit Order' && updated.entryPrice) {
        submitData.entryPrice = updated.entryPrice;
      } else if (updated.tradeType === 'Limit Order' && updated.limitPrice) {
        submitData.entryPrice = updated.limitPrice;
      }

      // Add conditionalOrderParams for Conditional Order
      if (updated.tradeType === 'Conditional Order' && updated.conditionalOrder) {
        submitData.conditionalOrderParams = formatConditionalOrderParams(updated.conditionalOrder);
      }

      // Add entryPoints for other trade types
      const otherTradeTypes = ['RB', 'RBB', 'FB', 'PBe1', 'PBe2', 'LB', 'LB2', 'LB3'];
      if (otherTradeTypes.includes(updated.tradeType)) {
        submitData.entryPoints = updated.entryPoints || '0';
      }

      await axios.post(
        `${API_BASE_URL}/bot/open-position`,
        submitData,
        getAuthHeaders()
      );

      setStatusMessage('✅ Position status sent to bot successfully!');
      setTimeout(() => setStatusMessage(''), 5000);

      // Refresh positions from backend
      fetchPositions();
    } catch (error) {
      setStatusMessage(
        '❌ Error: ' + (error.response?.data?.error || error.message)
      );
      console.error('Error sending position to bot:', error);
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
        {/* Open New Position Form */}
        <Grid item xs={12}>
          <Card elevation={0} sx={{ background: '#121212', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#FFFFFF', mb: 3 }}>
                Open New Position
              </Typography>
              
              {formError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {formError}
                </Alert>
              )}

              <form onSubmit={handleOpenPosition}>
                <Grid container spacing={3}>
                  {/* Symbol */}
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      label="Symbol"
                      value={formData.symbol}
                      onChange={handleFormChange('symbol')}
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
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth>
                      <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Buy/Sell</InputLabel>
                      <Select
                        value={formData.action}
                        onChange={handleFormChange('action')}
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
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth>
                      <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Trade Type</InputLabel>
                      <Select
                        value={formData.tradeType}
                        onChange={handleFormChange('tradeType')}
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
                        <MenuItem value="Custom">Custom</MenuItem>
                        <MenuItem value="Limit Order">Limit Order</MenuItem>
                        <MenuItem value="Conditional Order">Conditional Order</MenuItem>
                        <MenuItem value="FB">FB</MenuItem>
                        <MenuItem value="RB">RB</MenuItem>
                        <MenuItem value="RBB">RBB</MenuItem>
                        <MenuItem value="PBe1">PBe1</MenuItem>
                        <MenuItem value="PBe2">PBe2</MenuItem>
                        <MenuItem value="LB">LB</MenuItem>
                        <MenuItem value="LB2">LB2</MenuItem>
                        <MenuItem value="LB3">LB3</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Stop Loss */}
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth>
                      <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Stop Loss</InputLabel>
                      <Select
                        value={formData.stopLoss}
                        onChange={handleFormChange('stopLoss')}
                        label="Stop Loss"
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
                        <MenuItem value="EntryBar">EntryBar</MenuItem>
                        <MenuItem value="Custom">Custom</MenuItem>
                        <MenuItem value="BarByBar">BarByBar</MenuItem>
                        <MenuItem value="HOD">HOD</MenuItem>
                        <MenuItem value="LOD">LOD</MenuItem>
                        <MenuItem value="10% ATR">10% ATR</MenuItem>
                        <MenuItem value="20% ATR">20% ATR</MenuItem>
                        <MenuItem value="25% ATR">25% ATR</MenuItem>
                        <MenuItem value="33% ATR">33% ATR</MenuItem>
                        <MenuItem value="50% ATR">50% ATR</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Time Frame */}
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth>
                      <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Time Frame</InputLabel>
                      <Select
                        value={formData.timeFrame}
                        onChange={handleFormChange('timeFrame')}
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

                  {/* Risk */}
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      label="Risk (%)"
                      type="number"
                      value={formData.risk}
                      onChange={handleFormChange('risk')}
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

                  {/* Profit Target (Take Profit) */}
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth>
                      <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Take Profit</InputLabel>
                      <Select
                        value={formData.profit}
                        onChange={handleFormChange('profit')}
                        label="Take Profit"
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
                        <MenuItem value="1:1">1:1</MenuItem>
                        <MenuItem value="1.5:1">1.5:1</MenuItem>
                        <MenuItem value="2:1">2:1</MenuItem>
                        <MenuItem value="2.5:1">2.5:1</MenuItem>
                        <MenuItem value="3:1">3:1</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Time In Force */}
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth>
                      <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Time In Force</InputLabel>
                      <Select
                        value={formData.timeInForce}
                        onChange={handleFormChange('timeInForce')}
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
                        <MenuItem value="DAY">DAY</MenuItem>
                        <MenuItem value="OTH">OTH</MenuItem>
                        <MenuItem value="GTC">GTC</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Entry Points (for RB, RBB, FB, PBe1, PBe2, LB, LB2, LB3) */}
                  {['RB', 'RBB', 'FB', 'PBe1', 'PBe2', 'LB', 'LB2', 'LB3'].includes(formData.tradeType) && (
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        fullWidth
                        label="Entry Points"
                        type="number"
                        value={entryPoints}
                        onChange={(e) => setEntryPoints(e.target.value)}
                        inputProps={{ step: '1', min: '0' }}
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
                  )}

                  {/* Status and Action Buttons */}
                  <Grid item xs={12} sm={6} md={9}>
                    <Box display="flex" gap={2} alignItems="flex-end" flexWrap="wrap">
                      <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Status</InputLabel>
                        <Select
                          value={formData.status}
                          onChange={handleFormChange('status')}
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
                      <Button
                        variant={formData.breakEven ? 'contained' : 'outlined'}
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, breakEven: !prev.breakEven }));
                        }}
                        sx={{
                          ...(formData.breakEven
                            ? {
                                bgcolor: '#424242',
                                color: '#FFFFFF',
                                '&:hover': { bgcolor: '#616161' },
                              }
                            : {
                                borderColor: 'rgba(255, 255, 255, 0.3)',
                                color: '#FFFFFF',
                                '&:hover': {
                                  borderColor: '#FFFFFF',
                                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                                },
                              }),
                        }}
                      >
                        Break Even
                      </Button>
                      <Button
                        variant={formData.replay ? 'contained' : 'outlined'}
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, replay: !prev.replay }));
                        }}
                        sx={{
                          ...(formData.replay
                            ? {
                                bgcolor: '#424242',
                                color: '#FFFFFF',
                                '&:hover': { bgcolor: '#616161' },
                              }
                            : {
                                borderColor: 'rgba(255, 255, 255, 0.3)',
                                color: '#FFFFFF',
                                '&:hover': {
                                  borderColor: '#FFFFFF',
                                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                                },
                              }),
                        }}
                      >
                        Replay
                      </Button>
                    </Box>
                  </Grid>

                  {/* Submit Button */}
                  <Grid item xs={12}>
                    <Box display="flex" gap={2} justifyContent="flex-end">
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
                      <Button
                        variant="outlined"
                        startIcon={<CloseIcon />}
                        onClick={handleCloseAllPositions}
                        disabled={loading || positions.length === 0}
                        sx={{
                          borderColor: '#f44336',
                          color: '#f44336',
                          '&:hover': {
                            borderColor: '#f44336',
                            bgcolor: 'rgba(244, 67, 54, 0.1)',
                          },
                        }}
                      >
                        Close All Positions
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={fetchPositions}
                        disabled={loading || positionsLoading}
                        sx={{
                          borderColor: 'rgba(255, 255, 255, 0.3)',
                          color: '#FFFFFF',
                          '&:hover': {
                            borderColor: '#FFFFFF',
                            bgcolor: 'rgba(255, 255, 255, 0.1)',
                          },
                        }}
                      >
                        Refresh
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* Open Positions Display */}
        {positions.length > 0 && (
          <Grid item xs={12}>
            <Card elevation={0} sx={{ background: '#121212', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: 2 }}>
              <CardContent>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    mb: 2,
                    color: '#FFFFFF',
                    fontSize: { xs: '1rem', sm: '1.25rem' },
                  }}
                >
                  Open Positions ({positions.length})
                </Typography>
                <TableContainer
                  sx={{
                    maxHeight: { xs: '300px', sm: '400px' },
                    overflowX: 'auto',
                    background: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: 1,
                  }}
                >
                  <Table
                    size="small"
                    sx={{
                      '& .MuiTableCell-root': {
                        color: 'rgba(255, 255, 255, 0.9)',
                        borderColor: 'rgba(255, 255, 255, 0.08)',
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        padding: { xs: '8px 4px', sm: '12px' },
                      },
                    }}
                  >
                    <TableHead>
                      <TableRow
                        sx={{
                          '& .MuiTableCell-head': {
                            color: '#FFFFFF',
                            fontWeight: 600,
                            borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
                          },
                        }}
                      >
                        <TableCell>Symbol</TableCell>
                        <TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                          Quantity
                        </TableCell>
                        <TableCell align="right" sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                          Avg Price
                        </TableCell>
                        <TableCell align="right">Current Price</TableCell>
                        <TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                          Market Value
                        </TableCell>
                        <TableCell align="right">P&L</TableCell>
                        <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                          P&L %
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {positions.map((position, index) => (
                        <TableRow
                          key={index}
                          hover
                          sx={{
                            '&:hover': {
                              backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            },
                          }}
                        >
                          <TableCell
                            component="th"
                            scope="row"
                            sx={{
                              color: 'white',
                              fontWeight: 600,
                            }}
                          >
                            {position.symbol}
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              color: 'rgba(255, 255, 255, 0.9)',
                              display: { xs: 'none', md: 'table-cell' },
                            }}
                          >
                            {position.quantity}
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              color: 'rgba(255, 255, 255, 0.9)',
                              display: { xs: 'none', lg: 'table-cell' },
                            }}
                          >
                            {formatCurrency(position.avgPrice)}
                          </TableCell>
                          <TableCell align="right" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                            {formatCurrency(position.currentPrice)}
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              color: '#FFFFFF',
                              fontWeight: 600,
                              display: { xs: 'none', md: 'table-cell' },
                            }}
                          >
                            {formatCurrency(position.marketValue)}
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={formatCurrency(position.unrealizedPnl)}
                              color={position.unrealizedPnl >= 0 ? 'success' : 'error'}
                              size="small"
                              sx={{ fontWeight: 600 }}
                            />
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{ display: { xs: 'none', sm: 'table-cell' } }}
                          >
                            <Chip
                              label={`${position.unrealizedPnlPercent >= 0 ? '+' : ''}${formatPercent(position.unrealizedPnlPercent)}%`}
                              color={position.unrealizedPnlPercent >= 0 ? 'success' : 'error'}
                              size="small"
                              sx={{ fontWeight: 600 }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        )}
        {/* Trading History - Always show if there are any orders */}
        {tradingHistory.length > 0 && (
          <Grid item xs={12}>
            <Card
              elevation={0}
              sx={{
                background: '#121212',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 2,
              }}
            >
              <CardContent>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    mb: 2,
                    color: '#FFFFFF',
                    fontSize: { xs: '1rem', sm: '1.25rem' },
                  }}
                >
                  Position Status ({tradingHistory.length})
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow
                        sx={{
                          '& .MuiTableCell-head': {
                            color: '#FFFFFF',
                            fontWeight: 600,
                            borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
                          },
                        }}
                      >
                        <TableCell>Time</TableCell>
                        <TableCell>Symbol</TableCell>
                        <TableCell>Trade Type</TableCell>
                        <TableCell>Stop Loss</TableCell>
                        <TableCell>Take Profit</TableCell>
                        <TableCell>Time Frame</TableCell>
                        <TableCell>Time In Force</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {[...tradingHistory].sort((a, b) => b.id - a.id).map((order) => {
                        const orderTime = new Date(order.timestamp);
                        const timeString = orderTime.toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        });
                        return (
                          <TableRow key={order.id}>
                            <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                              {timeString}
                            </TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 600 }}>
                              {order.symbol}
                            </TableCell>
                            <TableCell sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                              {order.tradeType}
                            </TableCell>
                            <TableCell sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                              {order.stopLoss}
                            </TableCell>
                            <TableCell sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                              {order.takeProfit}
                            </TableCell>
                            <TableCell sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                              {order.timeFrame}
                            </TableCell>
                            <TableCell sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                              {order.timeInForce}
                            </TableCell>
                            <TableCell sx={{ minWidth: 140 }}>
                              <Button
                                variant={
                                  order.status === 'PENDING'
                                    ? 'outlined'
                                    : 'contained'
                                }
                                color={
                                  order.status === 'PENDING'
                                    ? 'info'
                                    : order.status === 'ACTIVE'
                                    ? 'success'
                                    : 'error'
                                }
                                disabled={order.status === 'CANCELLED' || loading}
                                onClick={() => {
                                  let nextStatus = 'PENDING';
                                  if (order.status === 'PENDING') {
                                    nextStatus = 'ACTIVE';
                                  } else if (order.status === 'ACTIVE') {
                                    nextStatus = 'CANCELLED';
                                  } else {
                                    nextStatus = 'CANCELLED';
                                  }
                                  handlePendingStatusChange(order.id, nextStatus);
                                }}
                                sx={{
                                  fontWeight: 600,
                                  px: 2.5,
                                  textTransform: 'none',
                                }}
                              >
                                {order.status === 'PENDING'
                                  ? 'Pending'
                                  : order.status === 'ACTIVE'
                                  ? 'Active'
                                  : 'Cancelled'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        )}
        {positions.length === 0 && !positionsLoading && tradingHistory.length === 0 && (
          <Grid item xs={12}>
            <Card
                elevation={0}
                sx={{
                  background: '#121212',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 2,
                }}
              >
                <CardContent>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.5)',
                      textAlign: 'center',
                      py: 2,
                    }}
                  >
                    No open positions
                  </Typography>
                </CardContent>
              </Card>
          </Grid>
        )}
      </Grid>

      {/* Conditional Order Modal */}
      <Dialog
        open={conditionalModalOpen}
        onClose={() => setConditionalModalOpen(false)}
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
            <Typography variant="h6" sx={{ fontWeight: 600, flex: 1, textAlign: 'center' }}>
              Conditional Order
            </Typography>
            <Button
              onClick={() => setConditionalModalOpen(false)}
              sx={{ minWidth: 'auto', color: 'rgba(255, 255, 255, 0.7)', ml: 'auto' }}
            >
              <CloseIcon />
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={4}>
            {/* Conditional Order 1 */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Conditional Order 1
              </Typography>
              <Box sx={{ mb: 1.5 }}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>Conditional Order:</Typography>
                  <Button
                    variant={conditionalOrder.order1Enabled ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() =>
                      setConditionalOrder((prev) => ({
                        ...prev,
                        order1Enabled: !prev.order1Enabled,
                      }))
                    }
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                    }}
                  >
                    {conditionalOrder.order1Enabled ? 'On' : 'Off'}
                  </Button>
                </Box>
              </Box>
              <Box sx={{ mb: 1.5 }}>
                <Typography sx={{ mb: 0.5 }}>Input Stop Order Price:</Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  value={conditionalOrder.order1StopPrice}
                  onChange={(e) =>
                    setConditionalOrder((prev) => ({
                      ...prev,
                      order1StopPrice: e.target.value,
                    }))
                  }
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
                  }}
                />
              </Box>
              <Box sx={{ mb: 1.5 }}>
                <Typography sx={{ mb: 0.5 }}>Input Condition:</Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={conditionalOrder.order1Condition}
                    onChange={(e) =>
                      setConditionalOrder((prev) => ({
                        ...prev,
                        order1Condition: e.target.value,
                      }))
                    }
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
                    }}
                  >
                    <MenuItem value="Above">Above</MenuItem>
                    <MenuItem value="Below">Below</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box>
                <Typography sx={{ mb: 0.5 }}>Input Price:</Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  value={conditionalOrder.order1Price}
                  onChange={(e) =>
                    setConditionalOrder((prev) => ({
                      ...prev,
                      order1Price: e.target.value,
                    }))
                  }
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
                  }}
                />
              </Box>
            </Grid>

            {/* Conditional Order 2 */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Conditional Order 2
              </Typography>
              <Box sx={{ mb: 1.5 }}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>Conditional Order:</Typography>
                  <Button
                    variant={conditionalOrder.order2Enabled ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() =>
                      setConditionalOrder((prev) => ({
                        ...prev,
                        order2Enabled: !prev.order2Enabled,
                      }))
                    }
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                    }}
                  >
                    {conditionalOrder.order2Enabled ? 'On' : 'Off'}
                  </Button>
                </Box>
              </Box>
              <Box sx={{ mb: 1.5 }}>
                <Typography sx={{ mb: 0.5 }}>Input Stop Order Price:</Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  value={conditionalOrder.order2StopPrice}
                  onChange={(e) =>
                    setConditionalOrder((prev) => ({
                      ...prev,
                      order2StopPrice: e.target.value,
                    }))
                  }
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
                  }}
                />
              </Box>
              <Box sx={{ mb: 1.5 }}>
                <Typography sx={{ mb: 0.5 }}>Input Condition 1:</Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={conditionalOrder.order2Condition1}
                    onChange={(e) =>
                      setConditionalOrder((prev) => ({
                        ...prev,
                        order2Condition1: e.target.value,
                      }))
                    }
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
                    }}
                  >
                    <MenuItem value="Above">Above</MenuItem>
                    <MenuItem value="Below">Below</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ mb: 1.5 }}>
                <Typography sx={{ mb: 0.5 }}>Input Price:</Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  value={conditionalOrder.order2Price1}
                  onChange={(e) =>
                    setConditionalOrder((prev) => ({
                      ...prev,
                      order2Price1: e.target.value,
                    }))
                  }
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
                  }}
                />
              </Box>
              <Box sx={{ mb: 1.5 }}>
                <Typography sx={{ mb: 0.5 }}>Input Condition 2:</Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={conditionalOrder.order2Condition2}
                    onChange={(e) =>
                      setConditionalOrder((prev) => ({
                        ...prev,
                        order2Condition2: e.target.value,
                      }))
                    }
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
                    }}
                  >
                    <MenuItem value="Above">Above</MenuItem>
                    <MenuItem value="Below">Below</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box>
                <Typography sx={{ mb: 0.5 }}>Input Price:</Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  value={conditionalOrder.order2Price2}
                  onChange={(e) =>
                    setConditionalOrder((prev) => ({
                      ...prev,
                      order2Price2: e.target.value,
                    }))
                  }
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
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(255, 255, 255, 0.12)', p: 2 }}>
          <Button
            onClick={() => setConditionalModalOpen(false)}
            sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => setConditionalModalOpen(false)}
            variant="contained"
            sx={{
              bgcolor: '#424242',
              color: '#FFFFFF',
              '&:hover': {
                bgcolor: '#616161',
              },
            }}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>

      {/* Limit Order Modal */}
      <Dialog
        open={limitOrderModalOpen}
        onClose={() => setLimitOrderModalOpen(false)}
        maxWidth="sm"
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
              Limit Order
            </Typography>
            <Button
              onClick={() => setLimitOrderModalOpen(false)}
              sx={{ minWidth: 'auto', color: 'rgba(255, 255, 255, 0.7)' }}
            >
              <CloseIcon />
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body2" sx={{ mb: 2, color: 'rgba(255, 255, 255, 0.7)' }}>
            Please enter the limit price for your order:
          </Typography>
          <TextField
            fullWidth
            label="Limit Price"
            type="number"
            value={limitPrice}
            onChange={(e) => setLimitPrice(e.target.value)}
            inputProps={{ step: '0.01', min: '0' }}
            autoFocus
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
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(255, 255, 255, 0.12)', p: 2 }}>
          <Button
            onClick={() => setLimitOrderModalOpen(false)}
            sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (limitPrice) {
                setLimitOrderModalOpen(false);
              }
            }}
            variant="contained"
            disabled={!limitPrice}
            sx={{
              bgcolor: '#424242',
              color: '#FFFFFF',
              '&:hover': {
                bgcolor: '#616161',
              },
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Custom Trade Type Modal (for entryPrice) */}
      <Dialog
        open={customTradeTypeModalOpen}
        onClose={() => setCustomTradeTypeModalOpen(false)}
        maxWidth="sm"
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
              Custom Trade Type
            </Typography>
            <Button
              onClick={() => setCustomTradeTypeModalOpen(false)}
              sx={{ minWidth: 'auto', color: 'rgba(255, 255, 255, 0.7)' }}
            >
              <CloseIcon />
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body2" sx={{ mb: 2, color: 'rgba(255, 255, 255, 0.7)' }}>
            Please enter the entry price for your custom order:
          </Typography>
          <TextField
            fullWidth
            label="Entry Price"
            type="number"
            value={entryPrice}
            onChange={(e) => setEntryPrice(e.target.value)}
            inputProps={{ step: '0.01', min: '0' }}
            autoFocus
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
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(255, 255, 255, 0.12)', p: 2 }}>
          <Button
            onClick={() => setCustomTradeTypeModalOpen(false)}
            sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (entryPrice) {
                setCustomTradeTypeModalOpen(false);
              }
            }}
            variant="contained"
            disabled={!entryPrice}
            sx={{
              bgcolor: '#424242',
              color: '#FFFFFF',
              '&:hover': {
                bgcolor: '#616161',
              },
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Custom Stop Loss Modal */}
      <Dialog
        open={customModalOpen}
        onClose={() => {
          // If user closes without entering value, reset stopLoss
          if (!customStopLossValue) {
            setFormData((prev) => ({ ...prev, stopLoss: 'EntryBar' }));
          }
          setCustomModalOpen(false);
        }}
        maxWidth="sm"
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
              Custom Stop Loss Value
            </Typography>
            <Button
              onClick={() => {
                if (!customStopLossValue) {
                  setFormData((prev) => ({ ...prev, stopLoss: 'EntryBar' }));
                }
                setCustomModalOpen(false);
              }}
              sx={{ minWidth: 'auto', color: 'rgba(255, 255, 255, 0.7)' }}
            >
              <CloseIcon />
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body2" sx={{ mb: 2, color: 'rgba(255, 255, 255, 0.7)' }}>
            Please enter a custom stop loss value:
          </Typography>
          <TextField
            fullWidth
            label="Custom Stop Loss"
            type="number"
            value={customStopLossValue}
            onChange={(e) => setCustomStopLossValue(e.target.value)}
            inputProps={{ step: '0.01', min: '0' }}
            autoFocus
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
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(255, 255, 255, 0.12)', p: 2 }}>
          <Button
            onClick={() => {
              if (!customStopLossValue) {
                setFormData((prev) => ({ ...prev, stopLoss: 'EntryBar' }));
              }
              setCustomModalOpen(false);
            }}
            sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (customStopLossValue) {
                // Value is stored in customStopLossValue state and will be included in form submission
                setCustomModalOpen(false);
              }
            }}
            variant="contained"
            disabled={!customStopLossValue}
            sx={{
              bgcolor: '#424242',
              color: '#FFFFFF',
              '&:hover': {
                bgcolor: '#616161',
              },
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default BotManagement;

