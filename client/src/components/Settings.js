import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
  TextField,
  Button,
  Divider,
  Alert,
  Card,
  CardContent,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';

function Settings() {
  const [settings, setSettings] = useState({
    botPath: '',
    pythonPath: 'python',
    updateInterval: 5,
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (field) => (event) => {
    setSettings({
      ...settings,
      [field]: event.target.value,
    });
  };

  const handleSave = () => {
    // TODO: Implement settings save
    setMessage({
      type: 'success',
      text: 'Settings saved successfully!',
    });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 1, fontWeight: 600, color: '#FFFFFF' }}>
        Settings
      </Typography>
      <Typography variant="body2" sx={{ mb: 4, color: 'rgba(255, 255, 255, 0.7)' }}>
        Configure your bot settings
      </Typography>

      {message.text && (
        <Alert severity={message.type} sx={{ mb: 3 }}>
          {message.text}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card elevation={0} sx={{ background: '#121212', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3, color: '#FFFFFF' }}>
                Bot Configuration
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Python Bot Path"
                    value={settings.botPath}
                    onChange={handleChange('botPath')}
                    placeholder="C:\path\to\your\bot.py"
                    helperText="Full path to your Python bot script"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Python Executable"
                    value={settings.pythonPath}
                    onChange={handleChange('pythonPath')}
                    placeholder="python or python3"
                    helperText="Python command to run your bot"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Status Update Interval (seconds)"
                    value={settings.updateInterval}
                    onChange={handleChange('updateInterval')}
                    inputProps={{ min: 1, max: 60 }}
                    helperText="How often to check bot status"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    sx={{ 
                      px: 4,
                      bgcolor: '#424242',
                      color: '#FFFFFF',
                      '&:hover': {
                        bgcolor: '#616161',
                      },
                    }}
                  >
                    Save Settings
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ background: '#121212', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#FFFFFF' }}>
                Information
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }} paragraph>
                  Configure the path to your Python bot script and the Python executable to use.
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }} paragraph>
                  The bot can be started and stopped from the Dashboard.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Settings;

