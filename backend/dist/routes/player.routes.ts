import express from 'express';
import { playerController } from '../controllers/player.controller';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only video files are allowed.') as any);
    }
  }
});

// CRUD routes
router.post('/', playerController.createPlayer);
router.get('/', playerController.getPlayers);
router.get('/:id', playerController.getPlayerById);
router.patch('/:id', playerController.updatePlayer);
router.delete('/:id', playerController.deletePlayer);

// File upload route
router.post('/:id/upload', upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  res.json({
    message: 'File uploaded successfully',
    filename: req.file.filename
  });
});

export default router; 