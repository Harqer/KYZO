import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { StorageService } from '../config/storage';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

/**
 * Upload a single image
 * POST /api/upload
 */
router.post('/', requireAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    // Generate unique file key
    const fileKey = StorageService.generateFileKey(
      userId,
      req.file.originalname,
      'images'
    );

    // Upload to Cloudflare R2
    const uploadResult = await StorageService.uploadFile(
      fileKey,
      req.file.buffer,
      req.file.mimetype,
      {
        userId,
        originalName: req.file.originalname,
        uploadTime: new Date().toISOString(),
      }
    );

    res.json({
      success: true,
      data: {
        url: uploadResult.url,
        key: uploadResult.key,
        size: uploadResult.size,
        contentType: uploadResult.contentType,
        publicUrl: StorageService.getPublicUrl(uploadResult.key),
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload file',
    });
  }
});

/**
 * Generate a presigned upload URL
 * POST /api/upload/presigned
 */
router.post('/presigned', requireAuth, async (req, res) => {
  try {
    const { fileName, contentType, folder = 'images' } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    if (!fileName || !contentType) {
      return res.status(400).json({
        success: false,
        error: 'fileName and contentType are required',
      });
    }

    const fileKey = StorageService.generateFileKey(userId, fileName, folder);
    const uploadUrl = await StorageService.getUploadUrl(fileKey, contentType);

    res.json({
      success: true,
      data: {
        uploadUrl,
        fileKey,
        publicUrl: StorageService.getPublicUrl(fileKey),
      },
    });
  } catch (error) {
    console.error('Presigned URL error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate upload URL',
    });
  }
});

/**
 * Generate a presigned download URL
 * GET /api/upload/:key/download
 */
router.get('/:key/download', requireAuth, async (req, res) => {
  try {
    const { key } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    // Verify the file belongs to the user (key should contain userId)
    if (!key.includes(userId)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    const downloadUrl = await StorageService.getDownloadUrl(key);

    res.json({
      success: true,
      data: {
        downloadUrl,
      },
    });
  } catch (error) {
    console.error('Download URL error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate download URL',
    });
  }
});

/**
 * Delete a file
 * DELETE /api/upload/:key
 */
router.delete('/:key', requireAuth, async (req, res) => {
  try {
    const { key } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    // Verify the file belongs to the user
    if (!key.includes(userId)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    await StorageService.deleteFile(key);

    res.json({
      success: true,
      data: {
        message: 'File deleted successfully',
      },
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete file',
    });
  }
});

export default router;
