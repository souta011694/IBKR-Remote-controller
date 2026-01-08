import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function BalanceChartModal({ open, onClose, currency = 'USD' }) {
  const { token } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState(30);

  const getAuthHeaders = () => ({
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  useEffect(() => {
    if (open) {
      fetchBalanceHistory();
    }
  }, [open, days]);

  const fetchBalanceHistory = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/account/balance-history?days=${days}`,
        getAuthHeaders()
      );
      setHistory(response.data.history || []);
    } catch (error) {
      console.error('Error fetching balance history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const chartData = history.map((entry) => ({
    date: formatDate(entry.timestamp),
    timestamp: entry.timestamp,
    balance: parseFloat(entry.totalBalance.toFixed(2)),
    netLiquidation: parseFloat(entry.netLiquidation.toFixed(2)),
    cashBalance: parseFloat(entry.cashBalance.toFixed(2)),
  }));

  // Calculate min and max for better Y-axis scaling
  const allValues = chartData.flatMap(d => [d.balance, d.netLiquidation, d.cashBalance]);
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const yAxisDomain = [
    Math.floor(minValue * 0.98),
    Math.ceil(maxValue * 1.02)
  ];

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: {
          background: '#121212',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }
      }}
    >
      <DialogTitle sx={{ fontWeight: 600, pb: 1, color: '#FFFFFF' }}>
        Balance History Chart
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            View your account balance changes over time
          </Typography>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Period</InputLabel>
            <Select
              value={days}
              label="Time Period"
              onChange={(e) => setDays(e.target.value)}
            >
              <MenuItem value={7}>Last 7 days</MenuItem>
              <MenuItem value={30}>Last 30 days</MenuItem>
              <MenuItem value={60}>Last 60 days</MenuItem>
              <MenuItem value={90}>Last 90 days</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        ) : chartData.length === 0 ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              No balance history available. Data will appear as your account balance is tracked.
            </Typography>
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(212, 175, 55, 0.2)" />
              <XAxis 
                dataKey="date" 
                stroke="rgba(255, 255, 255, 0.7)"
                style={{ fontSize: '12px' }}
                tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}
              />
              <YAxis 
                domain={yAxisDomain}
                stroke="rgba(255, 255, 255, 0.7)"
                style={{ fontSize: '12px' }}
                tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip
                formatter={(value) => formatCurrency(value)}
                labelStyle={{ color: '#FFFFFF' }}
                contentStyle={{
                  backgroundColor: '#1E1E1E',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '4px',
                  color: 'white',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="balance"
                stroke="#FFFFFF"
                strokeWidth={3}
                dot={{ r: 4, fill: '#FFFFFF' }}
                activeDot={{ r: 6 }}
                name="Total Balance"
              />
              <Line
                type="monotone"
                dataKey="netLiquidation"
                stroke="#FFD700"
                strokeWidth={2}
                dot={{ r: 3, fill: '#FFD700' }}
                name="Net Liquidation"
              />
              <Line
                type="monotone"
                dataKey="cashBalance"
                stroke="rgba(212, 175, 55, 0.6)"
                strokeWidth={2}
                dot={{ r: 3, fill: 'rgba(212, 175, 55, 0.6)' }}
                name="Cash Balance"
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        {chartData.length > 0 && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(212, 175, 55, 0.05)', borderRadius: 1, border: '1px solid rgba(212, 175, 55, 0.1)' }}>
            <Typography variant="body2" sx={{ color: '#FFFFFF', fontWeight: 600, mb: 1 }}>
              Summary:
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 0.5 }}>
              Starting Balance: {formatCurrency(chartData[0]?.balance || 0)}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 0.5 }}>
              Current Balance: {formatCurrency(chartData[chartData.length - 1]?.balance || 0)}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: (chartData[chartData.length - 1]?.balance || 0) >= (chartData[0]?.balance || 0) 
                  ? '#4caf50' 
                  : '#f44336',
                fontWeight: 600 
              }}
            >
              Change: {formatCurrency((chartData[chartData.length - 1]?.balance || 0) - (chartData[0]?.balance || 0))}
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ color: '#FFFFFF' }}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export default BalanceChartModal;

