require('dotenv').config();
const express = require('express');
const cors = require('cors');
//const { getNonce, verifySignature } = require('./authController'); // Import the function
const authController = require('./authController');
const app = express();

app.use(cors());
app.use(express.json());

// Routes will go here
app.post('/api/auth/nonce', authController.getNonce);
app.post('/api/auth/verify', authController.verifySignature);

app.get('/api/protected', authController.verifyToken, (req, res) => {
  res.json({ 
    message: 'Secure data', 
    wallet: req.walletAddress 
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

