import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import collectionRoutes from './routes/collection';
import uploadRoutes from './routes/upload';
import aiRoutes from './routes/ai';
import clerkAuthRoutes from './routes/clerkAuth';
import jwtTestRoutes from './routes/jwtTest';
import fashionAIRoutes from './routes/fashionAI';
import apifyFashionAIRoutes from './routes/apifyFashionAI';

// Import services
import { RedisService } from './config/redis';
import { PineconeService } from './config/pinecone';
import { testConnection } from './config/database';

// Create Express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/clerk', clerkAuthRoutes);
app.use('/api/jwt-test', jwtTestRoutes);
app.use('/api/fashion-ai', fashionAIRoutes);
app.use('/api/apify-fashion', apifyFashionAIRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      message: 'Route not found',
    },
  });
});

const PORT = process.env.PORT || 5000;

// Initialize services before starting the server
async function initializeServices() {
  try {
    console.log('Initializing services...');
    
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error('Database connection failed');
    }
    console.log('Database connected successfully');
    
    // Initialize Redis
    await RedisService.connect();
    console.log('Redis connected successfully');
    
    // Initialize Pinecone
    await PineconeService.initializeIndex();
    console.log('Pinecone initialized successfully');
    
    console.log('All services initialized successfully');
  } catch (error) {
    console.error('Failed to initialize services:', error);
    process.exit(1);
  }
}

// Start the server
initializeServices().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
});

export default app;
