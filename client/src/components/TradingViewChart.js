import React, { useEffect, useRef } from 'react';
import { Box, Card, CardContent, Typography, useTheme, useMediaQuery } from '@mui/material';

// TradingView Advanced Chart Widget Component
function TradingViewChart({ symbol = 'AAPL', height = 600 }) {
  const containerRef = useRef(null);
  const widgetRef = useRef(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  // Responsive height
  const responsiveHeight = isMobile ? 400 : isTablet ? 500 : height;

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous content
    containerRef.current.innerHTML = '';

    // Generate unique container ID
    const containerId = `tradingview-${Date.now()}`;
    containerRef.current.id = containerId;

    // Load TradingView script if not already loaded
    const loadScript = () => {
      if (window.TradingView) {
        createWidget();
      } else {
        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/tv.js';
        script.async = true;
        script.onload = () => {
          if (window.TradingView) {
            createWidget();
          }
        };
        document.head.appendChild(script);
      }
    };

    const createWidget = () => {
      if (widgetRef.current) {
        widgetRef.current.remove();
      }

      widgetRef.current = new window.TradingView.widget({
        autosize: true,
        symbol: symbol,
        interval: 'D',
        timezone: 'Etc/UTC',
        theme: 'dark',
        style: '1',
        locale: 'en',
        toolbar_bg: '#1E1E1E',
        enable_publishing: false,
        allow_symbol_change: true,
        container_id: containerId,
        studies: [
          'Volume@tv-basicstudies',
          'RSI@tv-basicstudies',
          'MACD@tv-basicstudies',
        ],
        height: responsiveHeight,
        width: '100%',
        hide_side_toolbar: isMobile,
        save_image: false,
        details: true,
        hotlist: true,
        calendar: true,
        studies_overrides: {
          'volume.volume.color.0': '#f44336',
          'volume.volume.color.1': '#4caf50',
        },
      });
    };

    loadScript();

    return () => {
      // Cleanup
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      if (widgetRef.current) {
        widgetRef.current = null;
      }
    };
  }, [symbol, responsiveHeight]);

  return (
    <Card
      elevation={0}
      sx={{
        background: '#121212',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: 2,
        height: '100%',
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 600, 
            color: '#FFFFFF',
            fontSize: { xs: '1rem', sm: '1.25rem' },
            mb: 2,
          }}
        >
          TradingView Chart
        </Typography>
        <Box
          ref={containerRef}
          sx={{
            width: '100%',
            height: { xs: `${responsiveHeight}px`, sm: `${responsiveHeight}px` },
            minHeight: { xs: '400px', sm: '500px' },
            borderRadius: 1,
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        />
      </CardContent>
    </Card>
  );
}

export default TradingViewChart;

