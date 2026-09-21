import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import apiRouter from './routes/api.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';

dotenv.config();

const app = express();

// Security and utility middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(requestLogger);
}

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Cloud-Based Hospital Management System (HMS) API',
    documentation: '/api/health',
    status: 'Running',
  });
});

// Mount main API
app.use('/api', apiRouter);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
