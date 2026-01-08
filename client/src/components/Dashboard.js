import React, { useState, useEffect } from 'react';
import {
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Chip,
} from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import RefreshIcon from '@mui/icons-material/Refresh';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import BalanceChartModal from './BalanceChartModal';
import TradingViewChart from './TradingViewChart';
import TradeHistoryModal from './TradeHistoryModal';
import OpenPositionsModal from './OpenPositionsModal';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function Dashboard() {
  const { token } = useAuth();
  const [accountData, setAccountData] = useState(null);
  const [positions, setPositions] = useState([]);
  const [accountLoading, setAccountLoading] = useState(true);
  const [chartModalOpen, setChartModalOpen] = useState(false);
  const [tradeHistoryModalOpen, setTradeHistoryModalOpen] = useState(false);
  const [openPositionsModalOpen, setOpenPositionsModalOpen] = useState(false);
  const [chartSymbol, setChartSymbol] = useState('AAPL');

  // Create axios instance with auth header
  const getAuthHeaders = () => ({
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  useEffect(() => {
    if (token) {
      // Only fetch on mount, not auto-refresh
      fetchAccountData();
    }
  }, [token]);

  const fetchAccountData = async () => {
    try {
      setAccountLoading(true);
      const [summaryRes, positionsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/account/summary`, getAuthHeaders()),
        axios.get(`${API_BASE_URL}/account/positions`, getAuthHeaders()),
      ]);
      setAccountData(summaryRes.data);
      setPositions(positionsRes.data.positions || []);
      setAccountLoading(false);
    } catch (error) {
      console.error('Error fetching account data:', error);
      setAccountLoading(false);
    }
  };


  const StatCard = ({ title, value, subtitle, icon, color, trend, onClick }) => (
    <Card 
      elevation={0} 
      onClick={onClick}
      sx={{ 
        height: '100%', 
        transition: 'all 0.3s ease',
        background: '#121212',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: 2,
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': { 
          transform: { xs: 'none', sm: 'translateY(-4px)' },
          borderColor: 'rgba(255, 255, 255, 0.3)',
          boxShadow: { xs: 'none', sm: '0 8px 16px rgba(0, 0, 0, 0.3)' },
        } 
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box flex={1}>
            <Typography 
              gutterBottom 
              variant="body2" 
              sx={{ 
                fontWeight: 500, 
                fontSize: { xs: '0.75rem', sm: '0.875rem' }, 
                color: 'rgba(255, 255, 255, 0.7)' 
              }}
            >
              {title}
            </Typography>
            <Typography 
              variant="h4" 
              component="div" 
              sx={{ 
                fontWeight: 700, 
                mb: 0.5, 
                color: '#FFFFFF',
                fontSize: { xs: '1.5rem', sm: '2.125rem' },
              }}
            >
              {value}
            </Typography>
            {subtitle && (
              <Box display="flex" alignItems="center" gap={0.5} mt={1.5}>
                {trend === 'up' && <TrendingUpIcon sx={{ fontSize: { xs: 14, sm: 16 }, color: '#4caf50' }} />}
                {trend === 'down' && <TrendingDownIcon sx={{ fontSize: { xs: 14, sm: 16 }, color: '#f44336' }} />}
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 500, 
                    color: trend === 'up' ? '#4caf50' : '#f44336',
                    fontSize: { xs: '0.7rem', sm: '0.875rem' },
                  }}
                >
                  {subtitle}
                </Typography>
              </Box>
            )}
          </Box>
          <Box sx={{ color: '#FFFFFF', opacity: 0.8, '& svg': { fontSize: { xs: 32, sm: 40 } } }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: accountData?.currency || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <Box>
      <Box 
        display="flex" 
        flexDirection={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between" 
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        mb={4}
        gap={2}
      >
        <Box>
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom 
            sx={{ 
              mb: 1, 
              fontWeight: 700,
                      color: '#FFFFFF',
              fontSize: { xs: '1.5rem', sm: '2.125rem' },
            }}
          >
            Account Status
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
            }}
          >
            Monitor your IBKR account balance, positions, and performance
          </Typography>
        </Box>
        <Tooltip title="Refresh Account Data">
          <IconButton 
            onClick={fetchAccountData} 
            disabled={accountLoading}
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.1)',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.2)',
              },
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

        {/* Account Summary Cards */}
        {accountLoading ? (
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress sx={{ color: 'white' }} />
          </Box>
        ) : accountData ? (
          <>
            <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Tooltip title="Click to view balance history chart">
                  <Box>
                    <StatCard
                      title="Total Balance"
                      value={formatCurrency(accountData.totalBalance)}
                      subtitle={accountData.dailyProfitPercent >= 0 
                        ? `+${accountData.dailyProfitPercent.toFixed(2)}% today`
                        : `${accountData.dailyProfitPercent.toFixed(2)}% today`}
                      icon={<AccountBalanceIcon sx={{ fontSize: 40 }} />}
                      color={accountData.dailyProfit >= 0 ? 'success.main' : 'error.main'}
                      trend={accountData.dailyProfit >= 0 ? 'up' : 'down'}
                      onClick={() => setChartModalOpen(true)}
                    />
                  </Box>
                </Tooltip>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Tooltip title="Click to view daily trade history">
                  <Box>
                    <StatCard
                      title="Daily Profit"
                      value={formatCurrency(accountData.dailyProfit)}
                      subtitle={accountData.dailyProfitPercent >= 0 
                        ? `+${accountData.dailyProfitPercent.toFixed(2)}%`
                        : `${accountData.dailyProfitPercent.toFixed(2)}%`}
                      icon={<TrendingUpIcon sx={{ fontSize: 40 }} />}
                      color={accountData.dailyProfit >= 0 ? 'success.main' : 'error.main'}
                      trend={accountData.dailyProfit >= 0 ? 'up' : 'down'}
                      onClick={() => setTradeHistoryModalOpen(true)}
                    />
                  </Box>
                </Tooltip>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Tooltip title="Click to view open positions details">
                  <Box>
                    <StatCard
                      title="Open Positions"
                      value={accountData.openPositionsCount}
                      subtitle={`${accountData.closedPositionsCount} closed`}
                      icon={<ShowChartIcon sx={{ fontSize: 40 }} />}
                      color="primary.main"
                      onClick={() => setOpenPositionsModalOpen(true)}
                    />
                  </Box>
                </Tooltip>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Buying Power"
                  value={formatCurrency(accountData.buyingPower)}
                  subtitle="Available for trading"
                  icon={<AttachMoneyIcon sx={{ fontSize: 40 }} />}
                  color="info.main"
                />
              </Grid>
            </Grid>

            {/* TradingView Chart */}
            <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 3 }}>
              <Grid item xs={12}>
                <TradingViewChart symbol={chartSymbol} height={600} key={chartSymbol} />
              </Grid>
            </Grid>

            <Grid container spacing={{ xs: 2, sm: 3 }}>
          {/* Account Performance Summary */}
          {accountData && (
            <Grid item xs={12} md={6}>
              <Card 
                elevation={0}
                sx={{ 
                  height: '100%',
                  background: '#121212',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 2,
                }}
              >
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Typography 
                    variant="h6" 
                    gutterBottom 
                    sx={{ 
                      fontWeight: 600, 
                      mb: 2, 
                      color: '#FFFFFF',
                      fontSize: { xs: '1rem', sm: '1.25rem' },
                    }}
                  >
                    Account Performance
                  </Typography>
                <Box sx={{ mt: 2 }}>
                  <Box display="flex" justifyContent="space-between" py={1.5} borderBottom="1px solid rgba(255, 255, 255, 0.08)">
                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Total Profit:</Typography>
                    <Typography fontWeight={600} sx={{ color: accountData.totalProfit >= 0 ? '#4caf50' : '#f44336' }}>
                      {formatCurrency(accountData.totalProfit)}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" py={1.5} borderBottom="1px solid rgba(255, 255, 255, 0.08)">
                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Total Profit %:</Typography>
                    <Typography fontWeight={600} sx={{ color: accountData.totalProfitPercent >= 0 ? '#4caf50' : '#f44336' }}>
                      {accountData.totalProfitPercent >= 0 ? '+' : ''}{accountData.totalProfitPercent.toFixed(2)}%
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" py={1.5} borderBottom="1px solid rgba(255, 255, 255, 0.08)">
                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Cash Balance:</Typography>
                    <Typography fontWeight={600} sx={{ color: '#FFFFFF' }}>
                      {formatCurrency(accountData.cashBalance)}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" py={1.5}>
                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Net Liquidation:</Typography>
                    <Typography fontWeight={600} sx={{ color: '#FFFFFF' }}>
                      {formatCurrency(accountData.netLiquidation)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

              {/* Trading Statistics */}
              {accountData && (
                <Grid item xs={12} md={6}>
                  <Card 
                    elevation={0}
                    sx={{ 
                      height: '100%',
                      background: '#121212',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: 2,
                    }}
                  >
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                      <Typography 
                        variant="h6" 
                        gutterBottom 
                        sx={{ 
                          fontWeight: 600, 
                          mb: 2, 
                          color: '#FFFFFF',
                          fontSize: { xs: '1rem', sm: '1.25rem' },
                        }}
                      >
                        Trading Statistics
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Box display="flex" justifyContent="space-between" py={1.5} borderBottom="1px solid rgba(255, 255, 255, 0.08)">
                          <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Open Positions:</Typography>
                          <Typography fontWeight={600} sx={{ color: '#FFFFFF' }}>
                            {accountData.openPositionsCount}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between" py={1.5} borderBottom="1px solid rgba(255, 255, 255, 0.08)">
                          <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Closed Today:</Typography>
                          <Typography fontWeight={600} sx={{ color: '#FFFFFF' }}>
                            {accountData.closedPositionsCount}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between" py={1.5} borderBottom="1px solid rgba(255, 255, 255, 0.08)">
                          <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Daily Change:</Typography>
                          <Typography fontWeight={600} sx={{ color: accountData.dailyProfit >= 0 ? '#4caf50' : '#f44336' }}>
                            {accountData.dailyProfitPercent >= 0 ? '+' : ''}{accountData.dailyProfitPercent.toFixed(2)}%
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between" py={1.5}>
                          <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Currency:</Typography>
                          <Typography fontWeight={600} sx={{ color: '#FFFFFF' }}>
                            {accountData.currency}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Open Positions Table */}
              {positions.length > 0 && (
                <Grid item xs={12}>
                  <Card 
                    elevation={0}
                    sx={{
                      background: '#121212',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: 2,
                    }}
                  >
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                      <Typography 
                        variant="h6" 
                        gutterBottom 
                        sx={{ 
                          fontWeight: 600, 
                          mb: 3, 
                          color: '#FFFFFF',
                          fontSize: { xs: '1rem', sm: '1.25rem' },
                        }}
                      >
                        Open Positions
                      </Typography>
                      <TableContainer sx={{ 
                        maxHeight: { xs: '400px', sm: 'none' },
                        overflowX: { xs: 'auto', sm: 'visible' },
                      }}>
                        <Table 
                          size="small" 
                          sx={{ 
                            '& .MuiTableCell-root': { 
                              color: 'rgba(255, 255, 255, 0.9)', 
                              borderColor: 'rgba(255, 255, 255, 0.08)',
                              fontSize: { xs: '0.75rem', sm: '0.875rem' },
                              padding: { xs: '8px 4px', sm: '16px' },
                            } 
                          }}
                        >
                          <TableHead>
                            <TableRow sx={{ '& .MuiTableCell-head': { color: '#FFFFFF', fontWeight: 600, borderBottom: '1px solid rgba(255, 255, 255, 0.12)' } }}>
                              <TableCell><strong>Symbol</strong></TableCell>
                              <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}><strong>Entry Time</strong></TableCell>
                              <TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' } }}><strong>Quantity</strong></TableCell>
                              <TableCell align="right" sx={{ display: { xs: 'none', lg: 'table-cell' } }}><strong>Avg Price</strong></TableCell>
                              <TableCell align="right"><strong>Current Price</strong></TableCell>
                              <TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' } }}><strong>Market Value</strong></TableCell>
                              <TableCell align="right"><strong>P&L</strong></TableCell>
                              <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}><strong>P&L %</strong></TableCell>
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
                                <Tooltip title="Click to view chart">
                                  <TableCell 
                                    component="th" 
                                    scope="row" 
                                    sx={{ 
                                      color: 'white', 
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      '&:hover': {
                                        color: '#9E9E9E',
                                      },
                                    }}
                                    onClick={() => setChartSymbol(position.symbol)}
                                  >
                                    {position.symbol}
                                  </TableCell>
                                </Tooltip>
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
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </>
        ) : null}

      <BalanceChartModal
        open={chartModalOpen}
        onClose={() => setChartModalOpen(false)}
        currency={accountData?.currency || 'USD'}
      />
      <TradeHistoryModal
        open={tradeHistoryModalOpen}
        onClose={() => setTradeHistoryModalOpen(false)}
        currency={accountData?.currency || 'USD'}
      />
      <OpenPositionsModal
        open={openPositionsModalOpen}
        onClose={() => setOpenPositionsModalOpen(false)}
        currency={accountData?.currency || 'USD'}
      />
    </Box>
  );
}

export default Dashboard;

