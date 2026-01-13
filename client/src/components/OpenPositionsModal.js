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
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { config } from '../config';
const API_BASE_URL = config.Main_Endpoint + '/api';
console.log("--------------------------------------------->API_BASE_URL",API_BASE_URL);

function OpenPositionsModal({ open, onClose, currency = 'USD' }) {
  const { token } = useAuth();
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);

  const getAuthHeaders = () => ({
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  useEffect(() => {
    if (open) {
      fetchOpenPositions();
    }
  }, [open]);

  const fetchOpenPositions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/account/positions`,
        getAuthHeaders()
      );
      const positionsData = response.data.positions || response.data || [];
      setPositions(Array.isArray(positionsData) ? positionsData : []);

      // Calculate summary
      if (positionsData.length > 0) {
        const totalMarketValue = positionsData.reduce((sum, pos) => sum + (pos.marketValue || 0), 0);
        const totalUnrealizedPnl = positionsData.reduce((sum, pos) => sum + (pos.unrealizedPnl || 0), 0);
        const totalUnrealizedPnlPercent = totalMarketValue > 0 
          ? (totalUnrealizedPnl / (totalMarketValue - totalUnrealizedPnl)) * 100 
          : 0;
        
        setSummary({
          totalPositions: positionsData.length,
          totalMarketValue,
          totalUnrealizedPnl,
          totalUnrealizedPnlPercent,
        });
      }
    } catch (error) {
      console.error('Error fetching open positions:', error);
      setError('Failed to load open positions');
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
        Current Open Positions
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
        ) : positions.length === 0 ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              No open positions at this time.
            </Typography>
          </Box>
        ) : (
          <>
            {/* Summary Cards */}
            {summary && (
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card elevation={0} sx={{ background: '#000000', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: 2 }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 0.5 }}>
                        Total Positions
                      </Typography>
                      <Typography variant="h5" sx={{ color: '#FFFFFF', fontWeight: 600 }}>
                        {summary.totalPositions}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card elevation={0} sx={{ background: '#000000', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: 2 }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 0.5 }}>
                        Total Market Value
                      </Typography>
                      <Typography variant="h5" sx={{ color: '#FFFFFF', fontWeight: 600 }}>
                        {formatCurrency(summary.totalMarketValue)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card elevation={0} sx={{ background: '#000000', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: 2 }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 0.5 }}>
                        Total Unrealized P&L
                      </Typography>
                      <Typography 
                        variant="h5" 
                        sx={{ 
                          color: summary.totalUnrealizedPnl >= 0 ? '#4caf50' : '#f44336', 
                          fontWeight: 600 
                        }}
                      >
                        {formatCurrency(summary.totalUnrealizedPnl)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card elevation={0} sx={{ background: '#000000', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: 2 }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 0.5 }}>
                        Total P&L %
                      </Typography>
                      <Typography 
                        variant="h5" 
                        sx={{ 
                          color: summary.totalUnrealizedPnlPercent >= 0 ? '#4caf50' : '#f44336', 
                          fontWeight: 600 
                        }}
                      >
                        {summary.totalUnrealizedPnlPercent >= 0 ? '+' : ''}{summary.totalUnrealizedPnlPercent.toFixed(2)}%
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}

            {/* Positions Table */}
            <TableContainer sx={{ 
              maxHeight: { xs: '400px', sm: '600px' },
              overflowX: 'auto',
            }}>
              <Table size="small" sx={{ '& .MuiTableCell-root': { color: 'rgba(255, 255, 255, 0.9)', borderColor: 'rgba(255, 255, 255, 0.08)' } }}>
                <TableHead>
                  <TableRow sx={{ '& .MuiTableCell-head': { color: '#FFFFFF', fontWeight: 600, borderBottom: '1px solid rgba(255, 255, 255, 0.12)' } }}>
                    <TableCell><strong>Symbol</strong></TableCell>
                    <TableCell><strong>Entry Time</strong></TableCell>
                    <TableCell align="right"><strong>Quantity</strong></TableCell>
                    <TableCell align="right"><strong>Avg Price</strong></TableCell>
                    <TableCell align="right"><strong>Current Price</strong></TableCell>
                    <TableCell align="right"><strong>Market Value</strong></TableCell>
                    <TableCell align="right"><strong>Unrealized P&L</strong></TableCell>
                    <TableCell align="right"><strong>P&L %</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {positions.map((position, index) => (
                    <TableRow 
                      key={index} 
                      hover
                      sx={{ 
                        '&:hover': { 
                          backgroundColor: 'rgba(255, 255, 255, 0.05)' 
                        } 
                      }}
                    >
                      <TableCell component="th" scope="row" sx={{ color: '#FFFFFF', fontWeight: 600 }}>
                        {position.symbol}
                      </TableCell>
                      <TableCell sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                        {position.entryTime 
                          ? new Date(position.entryTime).toLocaleString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric',
                              hour: '2-digit', 
                              minute: '2-digit',
                              hour12: true 
                            })
                          : 'N/A'}
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                        {position.quantity}
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                        {formatCurrency(position.avgPrice)}
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                        {formatCurrency(position.currentPrice)}
                      </TableCell>
                      <TableCell align="right" sx={{ color: '#FFFFFF', fontWeight: 600 }}>
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
                      <TableCell align="right">
                        <Chip
                          label={`${position.unrealizedPnlPercent >= 0 ? '+' : ''}${position.unrealizedPnlPercent.toFixed(2)}%`}
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
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ color: '#FFFFFF' }}>Close</Button>
        <Button 
          onClick={fetchOpenPositions} 
          sx={{ 
            color: '#FFFFFF',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          Refresh
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default OpenPositionsModal;

