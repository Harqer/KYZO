import express from 'express';

const router = express.Router();

// Get user profile
router.get('/profile', (req, res) => {
  res.json({
    success: true,
    data: { message: 'User profile endpoint' },
  });
});

export default router;
