const { ethers } = require('ethers');
const jwt = require('jsonwebtoken');
const nonceStore = new Map();

// Generate nonce
exports.getNonce = (req, res) => {
  const { walletAddress } = req.body;
  
  if (!walletAddress || !ethers.isAddress(walletAddress)) {
    return res.status(400).json({ error: 'Invalid wallet address' });
  }

  const nonce = Math.floor(Math.random() * 1000000).toString();
  nonceStore.set(walletAddress.toLowerCase(), nonce);
  res.json({ nonce });
};

// Verify signature and issue JWT
exports.verifySignature = async (req, res) => {
  try {
    const { walletAddress, signature } = req.body;

    // Validation
    if (!walletAddress || !ethers.isAddress(walletAddress)) {
      return res.status(400).json({ error: "Invalid wallet address" });
    }
    if (!signature) {
      return res.status(400).json({ error: "Signature required" });
    }

    // Verify nonce
    const storedNonce = nonceStore.get(walletAddress.toLowerCase());
    if (!storedNonce) {
      return res.status(400).json({ error: "Nonce not found" });
    }

    // Verify signature
    const message = `Sign this message to authenticate. Nonce: ${storedNonce}`;
    const recoveredAddress = ethers.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    // Create JWT
    const token = jwt.sign(
      { walletAddress: walletAddress.toLowerCase() },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Cleanup
    nonceStore.delete(walletAddress.toLowerCase());

    res.json({ token });

  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// JWT Verification Middleware
exports.verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(403).json({ error: "Autherization token required" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: "Invalid token" });
    }
    req.walletAddress = decoded.walletAddress;
    next();
  });
};