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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { config } from '../config';
const API_BASE_URL = config.Main_Endpoint + '/api';
console.log("--------------------------------------------->API_BASE_URL",API_BASE_URL);

function TradeHistoryModal({ open, onClose, currency = 'USD', date = null }) {
  const { token } = useAuth();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getAuthHeaders = () => ({
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  useEffect(() => {
    if (open) {
      fetchTradeHistory();
    }
  }, [open, date]);

  const fetchTradeHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/account/trades${date ? `?date=${date}` : ''}`,
        getAuthHeaders()
      );
      // Handle both old format (with 'today' array) and new format
      const tradeData = response.data.today || response.data.trades || response.data || [];
      setTrades(Array.isArray(tradeData) ? tradeData : []);
    } catch (error) {
      console.error('Error fetching trade history:', error);
      setError('Failed to load trade history');
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
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getActionColor = (action) => {
    return action === 'BUY' ? '#4caf50' : '#f44336';
  };

  const calculateTotalValue = (quantity, price) => {
    return quantity * price;
  };

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
        Daily Trade History
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2, bgcolor: 'rgba(244, 67, 54, 0.1)', color: '#f44336' }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress sx={{ color: '#FFFFFF' }} />
          </Box>
        ) : trades.length === 0 ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              No trades found for today.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small" sx={{ '& .MuiTableCell-root': { color: 'rgba(255, 255, 255, 0.9)', borderColor: 'rgba(255, 255, 255, 0.08)' } }}>
              <TableHead>
                <TableRow sx={{ '& .MuiTableCell-head': { color: '#FFFFFF', fontWeight: 600, borderBottom: '1px solid rgba(255, 255, 255, 0.12)' } }}>
                  <TableCell><strong>Time</strong></TableCell>
                  <TableCell><strong>Symbol</strong></TableCell>
                  <TableCell align="right"><strong>Action</strong></TableCell>
                  <TableCell align="right"><strong>Quantity</strong></TableCell>
                  <TableCell align="right"><strong>Price</strong></TableCell>
                  <TableCell align="right"><strong>Total Value</strong></TableCell>
                  {trades[0]?.profit !== undefined && (
                    <TableCell align="right"><strong>P&L</strong></TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {trades.map((trade, index) => (
                  <TableRow 
                    key={index} 
                    hover
                    sx={{ 
                      '&:hover': { 
                        backgroundColor: 'rgba(255, 255, 255, 0.05)' 
                      } 
                    }}
                  >
                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                      {trade.time || trade.timestamp || formatDate(trade.date) || 'N/A'}
                    </TableCell>
                    <TableCell sx={{ color: '#FFFFFF', fontWeight: 600 }}>
                      {trade.symbol}
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={trade.action}
                        size="small"
                        sx={{
                          bgcolor: getActionColor(trade.action),
                          color: '#FFFFFF',
                          fontWeight: 600,
                          minWidth: 60,
                        }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                      {trade.quantity}
                    </TableCell>
                    <TableCell align="right" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                      {formatCurrency(trade.price)}
                    </TableCell>
                    <TableCell align="right" sx={{ color: '#FFFFFF', fontWeight: 600 }}>
                      {formatCurrency(calculateTotalValue(trade.quantity, trade.price))}
                    </TableCell>
                    {trade.profit !== undefined && (
                      <TableCell align="right">
                        <Chip
                          label={formatCurrency(trade.profit)}
                          color={trade.profit >= 0 ? 'success' : 'error'}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {trades.length > 0 && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(255, 255, 255, 0.05)', borderRadius: 1, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <Typography variant="body2" sx={{ color: '#FFFFFF', fontWeight: 600, mb: 1 }}>
              Summary:
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 0.5 }}>
              Total Trades: {trades.length}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 0.5 }}>
              Buy Orders: {trades.filter(t => t.action === 'BUY').length}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Sell Orders: {trades.filter(t => t.action === 'SELL').length}
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

export default TradeHistoryModal;

