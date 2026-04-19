import express from 'express';

const router = express.Router();

// Get collections
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: { message: 'Collections endpoint' },
  });
});

export default router;
