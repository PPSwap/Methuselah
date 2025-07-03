// Viktor gjorgjevski 7/3/2025 added the functionality to add file
import { Router } from 'express';
import multer from 'multer';
import UserFile from '../models/UserFile.js';
import auth from '../middleware/auth.js';
import { extractTextFromFile } from '../utils/extractTextFromFile.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// FILE UPLOAD (already as before)
router.post('/uploadFile', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
    const userId = req.user.id;
    const { originalname, mimetype, buffer, size } = req.file;

    // Extract text AFTER receiving the file!
    const extractedText = await extractTextFromFile(buffer, mimetype, originalname);

    // Save to MongoDB via Mongoose
    const fileDoc = new UserFile({
      user: userId,
      fileName: req.file.filename || originalname,
      originalName: originalname,
      fileType: mimetype,
      fileSize: size,
      uploadedAt: new Date(),
      fileContent: buffer,
      extractedText,
    });

    await fileDoc.save();
    res.json({ fileId: fileDoc._id, fileName: originalname, fileType: mimetype });
  } catch (err) {
    console.error('File upload error', err);
    res.status(500).json({ error: 'File upload failed' });
  }
});

// NEW: GET all files uploaded by the current user
router.get('/my-files', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const files = await UserFile.find({ user: userId })
      .sort({ uploadedAt: -1 })
      .select('_id fileName originalName fileType uploadedAt');
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get files' });
  }
});

export default router;
