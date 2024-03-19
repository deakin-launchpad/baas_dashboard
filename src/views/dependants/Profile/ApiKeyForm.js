import { useState } from 'react';
import { Box, Button, Typography, TextField } from '@mui/material';
import PropTypes from 'prop-types';

const ApiKeyForm = ({ onCreateApiKey }) => {
  const [newKeyName, setNewKeyName] = useState('');

  const handleCreateApiKey = () => {
    onCreateApiKey(newKeyName);
    setNewKeyName('');
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6">Create New API Key</Typography>
      <TextField
        label="Name"
        variant="outlined"
        fullWidth
        sx={{ mt: 2 }}
        value={newKeyName}
        onChange={(e) => setNewKeyName(e.target.value)}
      />
      <Button
        variant="contained"
        color="primary"
        onClick={handleCreateApiKey}
        sx={{ mt: 2 }}
      >
        Create
      </Button>
    </Box>
  );
};

ApiKeyForm.propTypes = {
  onCreateApiKey: PropTypes.func.isRequired,
};

export default ApiKeyForm;