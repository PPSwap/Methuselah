// Import required libraries
const { ethers } = require('ethers'); // For wallet address validation
const jwt = require('jsonwebtoken');  // For creating JWT tokens later

// Temporary storage for nonces (in real apps, use a database)
const nonceStore = new Map();

// Function to generate a random nonce
function generateNonce(walletAddress) {
  const nonce = Math.floor(Math.random() * 1000000).toString();
  nonceStore.set(walletAddress.toLowerCase(), nonce); // Store it
  return nonce;
}

// Endpoint A: Get a nonce for a wallet
exports.getNonce = (req, res) => {
  const { walletAddress } = req.body; // Get address from request body

  // Check if address is valid
  if (!walletAddress || !ethers.utils.isAddress(walletAddress)) {
    return res.status(400).json({ error: 'Invalid wallet address' });
  }

  // Generate and return the nonce
  const nonce = generateNonce(walletAddress);
  res.json({ nonce });
  
};
// Verification
exports.verifySignature = async (req, res) => {
    try {
      // 1. Get request data
      const { walletAddress, signature } = req.body;
  
      // 2. Validate input
      if (!walletAddress || !ethers.utils.isAddress(walletAddress)) {
        return res.status(400).json({ error: "Invalid wallet address" });
      }
      if (!signature) {
        return res.status(400).json({ error: "Signature is required" });
      }
  
      // 3. Verify signature
      const storedNonce = nonceStore.get(walletAddress.toLowerCase());
      if (!storedNonce) {
        return res.status(400).json({ error: "Nonce not found. Request one first." });
      }
  
      const message = `Sign this message to authenticate. Nonce: ${storedNonce}`;
      const recoveredAddress = ethers.utils.verifyMessage(message, signature);
  
      if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        return res.status(401).json({ error: "Signature verification failed" });
      }
  
      // 4. Create JWT
      const token = jwt.sign(
        { walletAddress: walletAddress.toLowerCase() },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
  
      // 5. Clean up
      nonceStore.delete(walletAddress.toLowerCase());
  
      return res.json({ token });
  
    } catch (error) {
      console.error("Verification error:", error);
      return res.status(500).json({ error: "Signature verification failed" });
    }
  };