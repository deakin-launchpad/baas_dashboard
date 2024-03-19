import { Box, Button, Typography, Modal, Backdrop, Fade } from '@mui/material';
import PropTypes from 'prop-types';

const ApiKeyDetailsModal = ({ open, onClose, apiKeyData }) => {

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);

  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{
        timeout: 500,
      }}
    >
      <Fade in={open}>
        <Box
          sx={{
            backgroundColor: '#fff',
            boxShadow: 24,
            p: 4,
            maxWidth: 400,
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <Typography variant="h6" gutterBottom>
            API Key Details
          </Typography>
          <Typography variant="body1" gutterBottom>
            <b>Name:</b> {apiKeyData?.serviceName}
          </Typography>
          <Typography variant="body1" sx={{ overflowWrap: 'break-word' }} gutterBottom>
            <b>API Key:</b> {apiKeyData?.apiKey}
            <Button
              variant="outlined"
              size="small"
              onClick={() => handleCopyToClipboard(apiKeyData?.apiKey)}
              sx={{ ml: 1 }}
            >
              Copy
            </Button>
          </Typography>
          <Typography variant="body1" sx={{ overflowWrap: 'break-word' }} gutterBottom>
            <b>Secret Key:</b> {apiKeyData?.secretKey}
            <Button
              variant="outlined"
              size="small"
              onClick={() => handleCopyToClipboard(apiKeyData?.secretKey)}
              sx={{ ml: 1 }}
            >
              Copy
            </Button>
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Please store the Secret Key securely. It is only shown once!!!
          </Typography>
        </Box>
      </Fade>
    </Modal>
  );
};

ApiKeyDetailsModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  apiKeyData: PropTypes.shape({
    serviceName: PropTypes.string.isRequired,
    apiKey: PropTypes.string.isRequired,
    secretKey: PropTypes.string.isRequired,
  }),
};

export default ApiKeyDetailsModal;
